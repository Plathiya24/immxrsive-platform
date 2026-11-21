const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { openStore } = require('./store');
const { createApp } = require('./server');

test('R4 staff workflows, approvals, import fixtures and public collaboration privacy', async t => {
  process.env.SQLITE_PATH = ':memory:';
  delete process.env.DATABASE_URL;
  delete process.env.PUBLIC_ORIGIN;
  const store = await openStore();
  const app = await createApp(store, {
    staffGithubIds: '111',
    testLogin: async body => (await store.query('SELECT * FROM r2_users WHERE id=$1', [body.id]))[0],
    companyFetch: async source => ({
      html: await readFile(path.join(__dirname, '../frontend/import-fixtures', path.basename(source.pathname)), 'utf8'),
      finalUrl: source.href
    })
  });
  await store.query('INSERT INTO r2_users (id,github_id,github_login,display_name,verified_email) VALUES ($1,$2,$3,$4,$5)',
    ['staff', '111', 'staff-user', 'Tester Staff', null]);
  for (const [id, githubId] of [['maintainer', '222'], ['other', '333']]) {
    await store.query('INSERT INTO r2_users (id,github_id,github_login,display_name,verified_email) VALUES ($1,$2,$3,$4,$5)',
      [id, githubId, id, id, id + '@algomau.ca']);
  }
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await store.close(); });
  const base = 'http://127.0.0.1:' + server.address().port;

  function client() {
    let cookie = '', csrf = '';
    return {
      async call(url, method = 'GET', payload) {
        const response = await fetch(base + url, {
          method, headers: { Cookie: cookie, 'X-CSRF-Token': csrf, 'Content-Type': 'application/json' },
          body: payload ? JSON.stringify(payload) : undefined
        });
        if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
        const data = response.headers.get('content-type')?.includes('application/json')
          ? await response.json() : await response.text();
        if (data.csrf) csrf = data.csrf;
        return { status: response.status, data };
      },
      async login(id) {
        assert.equal((await this.call('/__test/session', 'POST', { id })).status, 200);
        await this.call('/api/me');
      }
    };
  }

  const staff = client(), student = client(), outsider = client(), publicUser = client();
  await staff.login('staff');
  await student.login('maintainer');
  await outsider.login('other');
  assert.equal((await student.call('/api/profile', 'POST', {})).status, 201);
  const testProject = await student.call('/api/work', 'POST', { title: 'R4 sample work', description: 'Safety simulation', domain: 'XR', published: true });
  assert.equal(testProject.status, 201);
  const projectId = testProject.data.id;
  const projectPath = '/api/projects/' + projectId;
  const requestPath = '/api/work/' + projectId + '/industry';
  const companyPath = '/api/staff/companies';
  let partner;
  let partnerPath;

  await t.test('only staff can view the queue or create drafts', async () => {
    assert.equal((await staff.call('/api/staff/queue')).status, 200);
    assert.equal((await student.call('/api/staff/queue')).status, 403);
    assert.equal((await publicUser.call(companyPath, 'POST', { name: 'Unauthorized' })).status, 401);
    assert.equal((await outsider.call(requestPath, 'POST', { type: 'verification', note: 'Unauthorized' })).status, 403);
  });
  await t.test('each website becomes a distinct draft with source evidence; failed import preserves drafts', async () => {
    const fixtures = {
      normal: 'North Shore Simulations', sparse: 'Algoma Field Systems',
      prompt_injection: 'Superior Immersive Labs', same_name_other_domain: 'North Shore Simulation Studio'
    };
    for (const [filename, expected] of Object.entries(fixtures)) {
      const url = 'https://fixtures.example.test/company_' + filename + '.html';
      const response = await staff.call(companyPath + '/import', 'POST', { url });
      assert.equal(response.status, 201);
      assert.equal(response.data.name, expected);
      assert.equal(response.data.provenance.url, url);
      assert.equal(response.data.published, false);
      assert.equal((await publicUser.call('/api/partners/' + response.data.id)).status, 404);
      if (filename === 'normal') {
        partner = response.data;
        partnerPath = '/api/partners/' + partner.id;
        assert.equal(partner.location, 'Sault Ste. Marie, Ontario');
        for (const keyword of ['simulation', 'XR', 'training']) assert.match(partner.sector, new RegExp(keyword));
      }
      if (filename === 'sparse') assert.equal(response.data.description, '');
    }
    assert.equal((await staff.call(companyPath + '/import', 'POST', { url: 'https://fixtures.example.test/missing.html' })).status, 422);
    assert.equal((await staff.call('/api/staff/queue')).data.companies.length, 4);
    assert.equal((await staff.call(companyPath + '/' + partner.id + '/publish', 'POST', {})).status, 200);
    assert.equal((await publicUser.call(partnerPath)).status, 200);
  });
  await t.test('verification and partner relationship stay pending until staff approval', async () => {
    const verification = await student.call(requestPath, 'POST', { type: 'verification', note: 'Working evidence at public project page.' });
    const association = await student.call(requestPath, 'POST', { type: 'partner', company_id: partner.id, note: 'Provided a project brief.' });
    assert.equal(verification.status, 201);
    assert.equal(association.status, 201);
    assert.equal((await publicUser.call(projectPath)).data.institution_verified, false);
    assert.deepEqual((await publicUser.call(projectPath)).data.partners, []);
    for (const request of [verification, association]) {
      const review = '/api/staff/requests/' + encodeURIComponent(request.data.id) + '/review';
      assert.equal((await student.call(review, 'POST', { decision: 'approved' })).status, 403);
      assert.equal((await staff.call(review, 'POST', { decision: 'approved' })).status, 200);
    }
    const published = (await publicUser.call(projectPath)).data;
    assert.equal(published.institution_verified, true);
    assert.equal(published.partners[0].id, partner.id);
    assert.equal((await publicUser.call(partnerPath)).data.projects[0].id, projectId);
  });
  await t.test('public history, private and limited projection, and contextual inquiries', async () => {
    const edit = companyPath + '/' + partner.id;
    const fixtures = await staff.call(edit + '/load-fixture-collaborations', 'POST', {});
    assert.equal(fixtures.data.added, 2);
    assert.equal((await staff.call(edit + '/load-fixture-collaborations', 'POST', {})).data.added, 0);
    const row = {
      title: 'Secret title', year: '2026', description: 'Secret description',
      outcome: 'Secret outcome', status: 'current', project_ids: [projectId], student_ids: ['S01'],
      public_summary: 'A training collaboration.'
    };
    const hidden = await staff.call(edit + '/collaborations', 'POST', { ...row, visibility: 'private' });
    const limited = await staff.call(edit + '/collaborations', 'POST', { ...row, visibility: 'limited' });
    assert.equal(hidden.status, 201);
    assert.equal(limited.status, 201);
    const publicPartner = (await publicUser.call(partnerPath)).data;
    assert.equal(publicPartner.collaborations.length, 3);
    assert.ok(publicPartner.collaborations.some(item => item.status === 'past'));
    assert.ok(!JSON.stringify(publicPartner).includes(hidden.data.id));
    assert.ok(!JSON.stringify(publicPartner).includes('Secret'));
    assert.deepEqual(publicPartner.collaborations.find(item => item.id === limited.data.id), {
      id: limited.data.id, year: '2026', status: 'current', visibility: 'limited',
      title: 'Anonymized collaboration', description: 'A training collaboration.'
    });
    const context = '/api/inquiry-context?source_type=collaboration&source_id=';
    assert.equal((await publicUser.call(context + hidden.data.id)).status, 404);
    assert.equal((await publicUser.call(context + limited.data.id)).data.name, 'Anonymized collaboration');
    const inquiry = { company_name: 'Test Company', contact_name: 'Test Reviewer', contact_email: 'reviewer@example.test',
      description: 'Synthetic QA inquiry', source_type: 'collaboration' };
    assert.equal((await publicUser.call('/api/inquiries', 'POST', { ...inquiry, source_id: hidden.data.id })).status, 400);
    const saved = await publicUser.call('/api/inquiries', 'POST', { ...inquiry, source_id: 'COL01' });
    assert.equal(saved.status, 201);
    assert.equal(saved.data.source_url, base + '/partners/' + partner.id + '#collaboration-COL01');
  });
});
