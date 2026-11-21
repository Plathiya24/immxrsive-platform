const { randomUUID } = require('node:crypto');
const express = require('express');
const { website, fetchWebsite, companyCandidate } = require('./company-import');
const seed = require('./fixtures/collaboration_seed.json');

function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}

function field(body, key, maximum, required = false) {
  const value = body[key] ?? '';
  if (typeof value !== 'string' || value.length > maximum || (required && !value.trim())) {
    fail('Check the ' + key.replaceAll('_', ' ') + ' field.');
  }
  return value.trim();
}

function site(value) {
  if (!value) return '';
  try { return website(value).href; }
  catch { fail('Enter a full public website URL.'); }
}

function select(body, key, choices) {
  const value = field(body, key, 50, true);
  if (!choices.includes(value)) fail('Choose a valid ' + key + '.');
  return value;
}

function references(body, key, records) {
  const ids = body[key] ?? [];
  if (!Array.isArray(ids) || ids.length > 50 || ids.some(id => !records.some(record => record.id === id))) {
    fail('Choose public entries from the ' + key.replace('_ids', '') + ' list.');
  }
  return [...new Set(ids)];
}

async function mountIndustry(app, store, auth, shared, catalogue, options = {}) {
  const staffIds = new Set(String(options.staffGithubIds ?? process.env.STAFF_GITHUB_IDS ?? '')
    .split(',').map(id => id.trim()).filter(id => /^\d+$/.test(id)));
  const staff = (req, res, next) => staffIds.has(req.user?.github_id)
    ? next() : res.status(403).json({ error: 'This workflow is available to authorized staff only.' });
  const wrap = fn => async (req, res, next) => {
    try { await fn(req, res); }
    catch (error) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      next(error);
    }
  };
  const read = kind => store.list(kind);
  const insert = async (kind, value) => (await store.query(
    'INSERT INTO records (kind,id,payload) VALUES ($1,$2,$3) ON CONFLICT (kind,id) DO NOTHING RETURNING id',
    [kind, value.id, JSON.stringify(value)])).length;
  const get = async (kind, id) => (await read(kind)).find(record => record.id === id);
  const replace = async (kind, old, updated) => {
    const rows = await store.query(
      'UPDATE records SET payload=$1 WHERE kind=$2 AND id=$3 AND payload=$4 RETURNING id',
      [JSON.stringify(updated), kind, old.id, JSON.stringify(old)]);
    if (!rows.length) fail('Someone updated this record. Reload before trying again.', 409);
    return updated;
  };
  const requireRecord = async (kind, id) => {
    const record = await get(kind, id);
    if (!record) fail('Record unavailable.', 404);
    return record;
  };

  const companies = () => read('r4_companies');
  const collaborations = () => read('r4_collaborations');
  const requests = () => read('r4_requests');

  function partnerCard(company) {
    const { id, name, website, description, sector, location } = company;
    return { id, name, website, description, sector, location };
  }

  async function partnerDetail(id) {
    const company = await get('r4_companies', id);
    if (!company?.published) return null;
    const [rows, projects, students, reviewed] = await Promise.all([
      collaborations(), catalogue.projects(), catalogue.students(), requests()
    ]);
    const projectLinks = ids => ids.flatMap(id => projects
      .filter(project => project.id === id).map(({ id, title }) => ({ id, title })));
    const studentLinks = ids => ids.flatMap(id => students
      .filter(student => student.id === id).map(({ id, name }) => ({ id, name })));
    return {
      ...partnerCard(company),
      projects: projectLinks(reviewed.filter(request => request.type === 'partner' &&
        request.status === 'approved' && request.company_id === company.id).map(request => request.project_id)),
      collaborations: rows.filter(row => row.company_id === id && row.visibility !== 'private').map(row => {
        const publicFields = { id: row.id, year: row.year, status: row.status, visibility: row.visibility };
        if (row.visibility === 'limited') return {
          ...publicFields, title: row.public_summary ? 'Anonymized collaboration' : 'Limited collaboration',
          description: row.public_summary
        };
        return {
          ...publicFields, title: row.title, description: row.description, outcome: row.outcome,
          projects: projectLinks(row.project_ids), students: studentLinks(row.student_ids)
        };
      }).sort((a, b) => b.year.localeCompare(a.year))
    };
  }

  app.get('/api/partners', wrap(async (_req, res) => res.json((await companies())
    .filter(company => company.published).map(partnerCard))));
  app.get('/api/partners/:id', wrap(async (req, res) => {
    const partner = await partnerDetail(req.params.id);
    if (!partner) fail('Partner not found.', 404);
    res.json(partner);
  }));

  const admin = express.Router();
  admin.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  admin.use(auth.login, staff, (req, res, next) => req.method === 'GET' ? next() : auth.csrf(req, res, next));
  admin.get('/queue', wrap(async (_req, res) => {
    const [partnerRecords, collaborationRecords, reviewRequests, projects, students] = await Promise.all([
      companies(), collaborations(), requests(), catalogue.projects(), catalogue.students()
    ]);
    const requestDetails = await Promise.all(reviewRequests.map(async request => {
      const project = await shared.get(request.project_id);
      return { ...request, project: project ? await shared.view(project, '') : null };
    }));
    res.json({
      companies: partnerRecords, collaborations: collaborationRecords, requests: requestDetails,
      projects: projects.map(({ id, title }) => ({ id, title })),
      students: students.map(({ id, name }) => ({ id, name }))
    });
  }));

  admin.post('/companies/import', wrap(async (req, res) => {
    let candidate, source;
    try {
      source = website(req.body.url);
      const response = await (options.companyFetch || fetchWebsite)(source);
      candidate = companyCandidate(response.html, response.finalUrl);
    } catch {
      fail('Could not import this website. You can keep your current draft and enter the details manually.', 422);
    }
    const draft = {
      ...candidate, id: randomUUID(), published: false,
      provenance: { url: source.href, imported_at: new Date().toISOString(), imported_fields: Object.keys(candidate) }
    };
    await insert('r4_companies', draft);
    res.status(201).json(draft);
  }));

  async function saveCompany(req, res) {
    const old = req.params.id ? await requireRecord('r4_companies', req.params.id) : null;
    const url = site(field(req.body, 'website', 1500));
    const company = {
      id: old?.id || randomUUID(), name: field(req.body, 'name', 200, true),
      website: url, domain: url ? new URL(url).hostname : '',
      description: field(req.body, 'description', 3000), sector: field(req.body, 'sector', 250),
      location: field(req.body, 'location', 250), published: old?.published || false,
      provenance: old?.provenance || null
    };
    if (old) await replace('r4_companies', old, company);
    else await insert('r4_companies', company);
    res.status(old ? 200 : 201).json(company);
  }
  admin.post('/companies', wrap(saveCompany));
  admin.put('/companies/:id', wrap(saveCompany));
  admin.post('/companies/:id/publish', wrap(async (req, res) => {
    const company = await requireRecord('r4_companies', req.params.id);
    if (!company.description) fail('Add a description before publishing.');
    res.json(await replace('r4_companies', company, { ...company, published: true }));
  }));

  async function saveCollaboration(req, res) {
    const company = await requireRecord('r4_companies', req.params.company);
    const old = req.params.id ? await requireRecord('r4_collaborations', req.params.id) : null;
    if (old && old.company_id !== company.id) fail('Collaboration unavailable for this partner.', 404);
    const [projects, students] = await Promise.all([catalogue.projects(), catalogue.students()]);
    const value = {
      id: old?.id || randomUUID(), company_id: company.id,
      title: field(req.body, 'title', 200, true), year: field(req.body, 'year', 80, true),
      description: field(req.body, 'description', 3000, true), outcome: field(req.body, 'outcome', 1500),
      status: select(req.body, 'status', ['current', 'past']),
      visibility: select(req.body, 'visibility', ['public', 'limited', 'private']),
      public_summary: field(req.body, 'public_summary', 1500),
      project_ids: references(req.body, 'project_ids', projects),
      student_ids: references(req.body, 'student_ids', students)
    };
    if (old) await replace('r4_collaborations', old, value);
    else await insert('r4_collaborations', value);
    res.status(old ? 200 : 201).json(value);
  }
  admin.post('/companies/:company/collaborations', wrap(saveCollaboration));
  admin.put('/companies/:company/collaborations/:id', wrap(saveCollaboration));
  admin.post('/companies/:company/load-fixture-collaborations', wrap(async (req, res) => {
    const company = await requireRecord('r4_companies', req.params.company);
    const matched = seed.filter(row => row.company === company.name);
    if (!matched.length) fail('This partner has no matching course fixture collaborations.');
    let added = 0;
    for (const row of matched) {
      added += await insert('r4_collaborations', {
        id: row.id, company_id: company.id, title: row.title, year: String(row.year),
        status: row.status, visibility: row.visibility, project_ids: row.project_id ? [row.project_id] : [],
        student_ids: [], outcome: '', public_summary: '', description: 'Course fixture collaboration.'
      });
    }
    res.json({ added });
  }));

  admin.post('/requests/:id/review', wrap(async (req, res) => {
    const request = await requireRecord('r4_requests', req.params.id);
    if (request.status !== 'pending') fail('This request has already been reviewed.', 409);
    const status = select(req.body, 'decision', ['approved', 'rejected']);
    let companyId = request.company_id;
    if (request.type === 'partner' && status === 'approved') {
      companyId ||= field(req.body, 'company_id', 100, true);
      if (!(await get('r4_companies', companyId))?.published) fail('Publish the company before approving its relationship.');
    }
    const updated = {
      ...request, status, company_id: companyId, reviewer_note: field(req.body, 'reviewer_note', 1500),
      reviewed_at: new Date().toISOString()
    };
    res.json(await replace('r4_requests', request, updated));
  }));
  app.use('/api/staff', admin);

  async function maintainedProject(req) {
    const project = await shared.get(req.params.id);
    if (!project) fail('Project not found.', 404);
    if (project.maintainer_id !== req.user.id) fail('Only the current project maintainer can submit and see requests.', 403);
    return project;
  }

  app.get('/api/work/:id/industry', auth.login, auth.verified, wrap(async (req, res) => {
    const project = await maintainedProject(req);
    res.json((await requests()).filter(request => request.project_id === project.id));
  }));
  app.post('/api/work/:id/industry', auth.login, auth.verified, auth.csrf, wrap(async (req, res) => {
    const project = await maintainedProject(req);
    const type = select(req.body, 'type', ['verification', 'partner']);
    const companyId = type === 'partner' ? field(req.body, 'company_id', 100) : '';
    const suggested = type === 'partner' && !companyId ? field(req.body, 'suggested_company', 200, true) : '';
    if (companyId && !(await get('r4_companies', companyId))?.published) fail('Choose a published company or suggest a new one.');
    const request = {
      id: JSON.stringify([project.id, type, companyId || suggested.toLowerCase()]), type,
      project_id: project.id, company_id: companyId, suggested_company: suggested,
      note: field(req.body, 'note', 3000, true), status: 'pending',
      requested_at: new Date().toISOString(), requester_id: req.user.id
    };
    const old = await get('r4_requests', request.id);
    if (old?.status === 'rejected') await replace('r4_requests', old, request);
    else if (old || !(await insert('r4_requests', request))) fail('A pending or approved request already exists.', 409);
    res.status(201).json(request);
  }));

  return {
    async projectStatus(id) {
      const approved = (await requests()).filter(request => request.project_id === id && request.status === 'approved');
      const partnerIds = new Set(approved.filter(request => request.type === 'partner').map(request => request.company_id));
      return {
        institution_verified: approved.some(request => request.type === 'verification'),
        partners: (await companies()).filter(company => company.published && partnerIds.has(company.id)).map(partnerCard)
      };
    },
    async inquirySource(type, id) {
      if (type === 'partner') {
        const company = await get('r4_companies', id);
        if (company?.published) return { id, name: company.name, path: '/partners/' + id };
      }
      if (type === 'collaboration') {
        const row = await get('r4_collaborations', id);
        if (!row || row.visibility === 'private') return null;
        const partner = await partnerDetail(row.company_id);
        const publicRow = partner?.collaborations.find(item => item.id === id);
        if (publicRow) return { id, name: publicRow.title, path: '/partners/' + partner.id + '#collaboration-' + id };
      }
      return null;
    }
  };
}

module.exports = { mountIndustry };
