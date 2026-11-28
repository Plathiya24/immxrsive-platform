const main = document.querySelector('main');
main.className = 'detail industry';
const industrySection = location.pathname === '/staff' ? '/staff' : '/partners';
document.querySelector('.site-header nav a[href="' + industrySection + '"]').setAttribute(
  'aria-current', location.pathname === industrySection ? 'page' : 'location');
let csrf;
const esc = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const encoded = encodeURIComponent;
const link = (url, label) => '<a href="' + esc(url) + '">' + esc(label) + '</a>';
const partnerUrl = id => '/partners/' + encoded(id);
const inquiryUrl = (type, id) => '/inquiry?' + new URLSearchParams({ source_type: type, source_id: id });
const linked = (rows, prefix) => (rows || []).map(row => link(prefix + encoded(row.id), row.title || row.name)).join(' · ');

async function api(url, method = 'GET', data) {
  const response = await fetch(url, {
    method,
    signal: method === 'GET' ? AbortSignal.timeout?.(75000) : undefined,
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '' },
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw Object.assign(new Error(result.error || 'Unable to load this page.'), { status: response.status });
  }
  return response.json();
}

async function showPublic(id) {
  if (!id) {
    const partners = await api('/api/partners');
    main.innerHTML = '<section class="page-intro"><p class="eyebrow">INDUSTRY & RESEARCH</p><h1>Industry partners</h1><p>Explore companies working with ImmXrsive and the projects that came out of those collaborations.</p></section>' +
      '<div class="industry-cards">' + (partners.length ? partners.map(partner => '<article class="panel"><h2>' +
        link(partnerUrl(partner.id), partner.name) + '</h2><p>' + esc(partner.description) + '</p></article>').join('')
        : '<p>No industry partners have been published yet.</p>') + '</div>';
    return;
  }
  const partner = await api('/api/partners/' + encoded(id));
  document.title = partner.name + ' · ImmXrsive';
  const history = [
    { status: 'current', label: 'Current collaborations' },
    { status: 'past', label: 'Past collaborations' }
  ].map(section => ({
    ...section, rows: partner.collaborations.filter(row => row.status === section.status)
  }));
  const historyLinks = history.filter(section => section.rows.length).map(section =>
    link('#collaborations-' + section.status, section.label + ' (' + section.rows.length + ')')).join('');
  main.innerHTML = '<div class="back">' + link('/partners', '← Industry partners') + '</div><section class="page-intro"><p class="eyebrow">INDUSTRY PARTNER</p><h1>' + esc(partner.name) + '</h1><p>' + esc(partner.description) + '</p>' +
    '<p class="muted">' + esc([partner.sector, partner.location].filter(Boolean).join(' · ')) + '</p><p class="industry-links">' +
    (partner.website ? link(partner.website, 'Company website') : '') +
    link(inquiryUrl('partner', partner.id), 'Start a collaboration inquiry') + '</p></section>' +
    (historyLinks ? '<nav class="collaboration-index" aria-label="Collaboration history">' + historyLinks + '</nav>' : '') +
    history.map(({ status, label, rows }) => {
      return '<section aria-labelledby="collaborations-' + status + '"><h2 tabindex="-1" id="collaborations-' + status + '">' + label + '</h2>' +
        (rows.length ? rows.map(row => '<article class="panel collaboration-card" tabindex="-1" id="collaboration-' + esc(row.id) + '">' +
          '<p class="eyebrow">' + esc([status === 'current' ? 'Current' : 'Past', row.year].filter(Boolean).join(' · ')) + '</p><h3>' +
          esc(row.title) + '</h3>' + (row.description ? '<p>' + esc(row.description) + '</p>' : '') +
          (row.outcome ? '<p><strong>Outcome</strong> ' + esc(row.outcome) + '</p>' : '') +
          (row.projects?.length ? '<p><strong>Related projects:</strong> ' + linked(row.projects, '/projects/') + '</p>' : '') +
          (row.students?.length ? '<p><strong>Public participants:</strong> ' + linked(row.students, '/students/') + '</p>' : '') +
          '<a class="secondary-link" href="' + esc(inquiryUrl('collaboration', row.id)) + '">Ask about this collaboration</a></article>').join('') :
          '<p>No ' + status + ' collaborations are listed.</p>') + '</section>';
    }).join('') +
    (partner.projects.length ? '<section class="panel"><h2>Verified project relationships</h2><p>' + linked(partner.projects, '/projects/') + '</p></section>' : '');
  if (location.hash) {
    let anchor = location.hash.slice(1);
    try { anchor = decodeURIComponent(anchor); } catch { /* Keep the original anchor if it has invalid encoding. */ }
    document.getElementById(anchor)?.focus();
  }
}

const staffApi = (path, method, data) => api('/api/staff' + path, method, data);
const input = (label, key, value = '', { area = false, required = false, type = 'text' } = {}) =>
  '<label>' + esc(label) + (area ? '<textarea name="' + key + '"' + (required ? ' required' : '') + '>' +
    esc(value) + '</textarea>' : '<input name="' + key + '" type="' + type + '" value="' + esc(value) + '"' +
    (required ? ' required' : '') + '>') + '</label>';
const select = (label, key, choices, current) => '<label>' + esc(label) + '<select name="' + key + '">' +
  choices.map(([value, name]) => '<option value="' + esc(value) + '"' + (value === current ? ' selected' : '') +
    '>' + esc(name) + '</option>').join('') + '</select></label>';
const checkboxList = (label, key, rows, checked) => '<fieldset><legend>' + label + '</legend><div class="choice-list">' +
  rows.map(row => '<label><input type="checkbox" name="' + key + '" value="' + esc(row.id) + '"' +
    (checked.includes(row.id) ? ' checked' : '') + '>' + esc(row.title || row.name) + '</label>').join('') +
  (rows.length ? '' : '<p>No public records available.</p>') + '</div></fieldset>';

function companyFields(company = {}) {
  return input('Company name', 'name', company.name, { required: true }) +
    input('Website', 'website', company.website, { type: 'url' }) +
    input('Short description', 'description', company.description, { area: true }) +
    input('Sector or keywords', 'sector', company.sector) + input('Location', 'location', company.location);
}

function collaborationForm(queue, companyId, row = {}) {
  return '<form class="industry-form" data-action="collaboration" data-company="' + esc(companyId) + '" data-id="' + esc(row.id) + '">' +
    input('Collaboration title', 'title', row.title, { required: true }) +
    input('Year or year range (for example, 2025 or 2024–2026)', 'year', row.year, { required: true }) +
    input('Short description', 'description', row.description, { area: true, required: true }) +
    input('Outcome or highlight', 'outcome', row.outcome, { area: true }) +
    select('Status', 'status', [['current', 'Current'], ['past', 'Past']], row.status) +
    select('Visibility', 'visibility', [['private', 'Private'], ['limited', 'Limited / anonymized'], ['public', 'Public']], row.visibility || 'private') +
    input('Anonymized public summary (for limited records)', 'public_summary', row.public_summary, { area: true }) +
    checkboxList('Related public projects', 'project_ids', queue.projects, row.project_ids || []) +
    checkboxList('Public student participants', 'student_ids', queue.students, row.student_ids || []) +
    '<button>' + (row.id ? 'Save collaboration' : 'Add collaboration') + '</button></form>';
}

function companyPanel(queue, company) {
  const id = company.id;
  const edits = queue.collaborations.filter(row => row.company_id === id);
  const importFields = company.provenance?.imported_values
    ? Object.keys(company.provenance.imported_values).join(', ') || 'not recorded'
    : (company.provenance?.imported_fields || []).join(', ') || 'not recorded';
  const editHistory = company.provenance?.imported_values
    ? (company.provenance.edited_fields || []).join(', ') || 'none'
    : company.provenance?.imported_fields
      ? 'not tracked for this earlier import'
      : 'not recorded';
  return '<article class="panel" id="company-' + esc(id) + '"><h3>' + esc(company.name) + '</h3><p>' +
    (company.published ? link(partnerUrl(id), 'View public partner page') : 'Draft awaiting publication') + '</p>' +
    (company.provenance ? '<p>Import source: ' + link(company.provenance.url, company.provenance.url) + ' · Imported on ' +
      esc(new Date(company.provenance.imported_at).toLocaleString()) + '.</p><p>Imported fields: ' +
      esc(importFields) +
      '. Staff-edited fields: ' + esc(editHistory) + '.</p>' : '') +
    '<form class="industry-form" data-action="company" data-id="' + esc(id) + '">' + companyFields(company) +
    '<button>Save company details</button>' + (!company.published ?
      '<button type="submit" name="publish" value="1">Save and publish partner</button>' : '') + '</form>' +
    '<details><summary>Add collaboration</summary>' + collaborationForm(queue, id) + '</details>' +
    edits.map(row => '<details><summary>' + esc(row.title + ' · ' + row.year + ' · ' + row.visibility) +
      '</summary>' + collaborationForm(queue, id, row) + '</details>').join('') +
    (['North Shore Simulations', 'Superior Immersive Labs'].includes(company.name) ?
      '<form data-action="fixtures" data-company="' + esc(id) + '"><button>Load course collaboration fixtures</button></form>' : '') + '</article>';
}

function requestPanel(queue, request) {
  const project = request.project;
  const partner = queue.companies.find(company => company.id === request.company_id);
  return '<article class="panel"><h3>' + esc(project?.title || 'Unavailable project') + '</h3>' +
    (project?.published ? '<p>' + link('/projects/' + encoded(project.id), 'Open public project') + '</p>' : '') +
    (project ? '<p>' + esc(project.description) + '</p><p>Maintainer ' + esc(project.maintainer_name) + '</p><p>Contributors ' +
      esc(project.members.filter(member => member.state === 'accepted').map(member => member.name + ' (' + member.role + ')').join(', ')) + '</p>' : '') +
    (request.type === 'partner' ? '<p>Company requested <strong>' + esc(partner?.name || request.suggested_company) + '</strong></p>' : '') +
    '<p><strong>Supporting note</strong> ' + esc(request.note) + '</p>' +
    '<form class="industry-form" data-action="review" data-id="' + esc(request.id) + '">' +
    (request.type === 'partner' && !request.company_id ? select('Published company to associate', 'company_id',
      [['', 'Choose a published company'], ...queue.companies.filter(company => company.published).map(company => [company.id, company.name])], '') : '') +
    input('Note for the project maintainer', 'reviewer_note', '', { area: true }) +
    '<button name="decision" value="approved">Approve request</button><button name="decision" value="rejected">Reject request</button></form></article>';
}

async function showStaff(notice = '', companyAnchor = '') {
  const account = await api('/api/me');
  if (!account.user) {
    main.innerHTML = '<h1>Staff work queue</h1><p>Sign in with the GitHub account approved for staff access.</p>' +
      '<a class="button" href="/auth/github?next=staff">Sign in with GitHub</a>';
    return;
  }
  csrf = account.csrf;
  const queue = await staffApi('/queue');
  const pending = queue.requests.filter(request => request.status === 'pending');
  const drafts = queue.companies.filter(company => !company.published);
  main.innerHTML = '<h1>Staff work queue</h1><div class="industry-links">' +
    link('#verification', 'Verify projects') + link('#association', 'Review partner requests') +
    link('#drafts', 'Review drafts') + link('#manage', 'Add a partner') + '</div>' +
    '<p id="staff-notice" class="notice" role="status" aria-live="polite" tabindex="-1">' + esc(notice) + '</p>' +
    [['verification', 'Project verification requests', 'verification'], ['association', 'Industry partner requests', 'partner']]
      .map(([id, title, type]) => '<section id="' + id + '"><h2>' + title + '</h2>' +
        (pending.some(request => request.type === type) ? pending.filter(request => request.type === type)
          .map(request => requestPanel(queue, request)).join('') : '<p>No pending requests.</p>') + '</section>').join('') +
    '<section id="drafts"><h2>Company drafts needing review</h2>' +
    (drafts.length ? drafts.map(company => companyPanel(queue, company)).join('') : '<p>No company drafts awaiting review.</p>') + '</section>' +
    '<section id="manage" class="panel"><h2>Add a partner</h2><form class="industry-form" data-action="import">' +
    input('Public company website to import', 'url', '', { required: true, type: 'url' }) +
    '<button>Import for review</button></form><details><summary>Enter company details manually</summary>' +
    '<form class="industry-form" data-action="company">' + companyFields() + '<button>Save company draft</button></form></details></section>' +
    '<section><h2>Published partners</h2>' + queue.companies.filter(company => company.published).map(company => companyPanel(queue, company)).join('') + '</section>';
  for (const form of main.querySelectorAll('form[data-action]')) form.addEventListener('submit', handleStaffForm);
  if (companyAnchor) document.getElementById('company-' + companyAnchor)?.scrollIntoView();
  else if (notice) document.querySelector('#staff-notice').focus();
}

async function handleStaffForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = event.submitter;
  const { action, id, company } = form.dataset;
  const data = new FormData(form, button);
  const values = Object.fromEntries(data);
  button.disabled = true;
  let message, anchor;
  try {
    if (action === 'import') {
      const result = await staffApi('/companies/import', 'POST', values);
      anchor = result.id;
      message = 'Company draft imported. Review its details before publishing.';
    } else if (action === 'company') {
      const result = await staffApi('/companies' + (id ? '/' + encoded(id) : ''), id ? 'PUT' : 'POST', values);
      anchor = result.id;
      if (values.publish) await staffApi('/companies/' + encoded(result.id) + '/publish', 'POST', {});
      message = values.publish ? 'Partner published.' : 'Company details saved.';
    } else if (action === 'collaboration') {
      await staffApi('/companies/' + encoded(company) + '/collaborations' + (id ? '/' + encoded(id) : ''),
        id ? 'PUT' : 'POST', { ...values, project_ids: data.getAll('project_ids'), student_ids: data.getAll('student_ids') });
      anchor = company;
      message = 'Collaboration saved.';
    } else if (action === 'fixtures') {
      const result = await staffApi('/companies/' + encoded(company) + '/load-fixture-collaborations', 'POST', {});
      anchor = company;
      message = result.added ? 'Course collaboration fixtures loaded.' : 'Course collaborations already loaded.';
    } else {
      await staffApi('/requests/' + encoded(id) + '/review', 'POST', values);
      message = 'Request ' + values.decision + '.';
    }
    await showStaff(message, anchor);
  } catch (error) {
    let status = form.querySelector('[role="alert"]');
    if (!status) {
      status = document.createElement('p');
      status.setAttribute('role', 'alert');
      status.className = 'error';
      form.append(status);
    }
    status.textContent = error.message;
  } finally { button.disabled = false; }
}

(async () => {
  const staff = location.pathname === '/staff';
  const finishLoading = staff ? () => {} : showLoadingStatus(main, 'Loading industry partners…');
  try {
    if (staff) await showStaff();
    else await showPublic(decodeURIComponent(location.pathname.split('/')[2] || ''));
  } catch (error) {
    if (staff) {
      main.innerHTML = '<h1>' + (error.status === 403 ? 'Staff access required' : 'Page unavailable') + '</h1><p>' +
        esc(error.message) + '</p>' + link('/partners', 'Browse industry partners');
    } else {
      const unavailable = error.status === 404;
      showPageRecovery(main, {
        title: unavailable ? 'Partner unavailable' : 'This page couldn’t load',
        text: unavailable ? 'This partner may have moved or may no longer be public.' : 'The service may be temporarily unavailable.',
        href: '/partners', label: 'Browse industry partners', retry: unavailable ? null : () => location.reload()
      });
    }
  } finally {
    finishLoading();
  }
})();
