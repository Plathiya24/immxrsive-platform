const main = document.querySelector('main');
const publicRoute = location.pathname.replace(/\/$/, '') || '/';
const currentSection = publicRoute.startsWith('/students/') ? '/talent'
 : publicRoute.startsWith('/projects/') ? '/projects' : publicRoute;
document.querySelector('.site-header a[href="' + (['/', '/talent', '/projects'].includes(currentSection) ? currentSection : '#') + '"]')
 ?.setAttribute('aria-current', currentSection === publicRoute ? 'page' : 'location');
const esc = v => String(v ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tags = vs => vs.map(v => '<span class="tag">' + esc(v) + '</span>').join('');
const label = v => ({'full-time':'Full-time',internship:'Internship',contract:'Contract',current:'Current student',alumni:'Alumni'}[v] || v);
async function api(url,options) {
 const response = await fetch(url, options ?? { signal: AbortSignal.timeout?.(75000) });
 if (!response.ok) {
  const data = await response.json().catch(() => ({}));
  throw Object.assign(new Error(data.error || 'Unable to load this page.'), { field: data.field, status: response.status });
 }
 return response.json();
}
function links(ls) { return Object.entries(ls || {}).filter(([k,v]) => /^https?:\/\//i.test(v)).map(([k,v]) => '<p><a target="_blank" rel="noopener noreferrer" href="' + esc(v) + '">' + esc(label(k)) + ' ↗</a></p>').join(''); }
function inquiry(type,id) { return '/inquiry?source_type=' + type + '&source_id=' + encodeURIComponent(id); }
function projectCard(project, studentId) {
 const contribution = project.contributors?.find(person => person.student_id === studentId);
 return '<article class="card portfolio-project"><span class="eyebrow">' + esc(project.domain) +
  '</span><h3><a href="/projects/' + encodeURIComponent(project.id) + '">' + esc(project.title) +
  '</a></h3>' + (contribution?.role ? '<p class="portfolio-role"><strong>Role:</strong> ' + esc(contribution.role) + '</p>' : '') +
  '<p>' + esc(project.description) + '</p>' + tags(project.technologies) + '</article>';
}

function profileProjects(student) {
 return '<section class="portfolio-evidence"><h2>Project evidence</h2>' +
  (student.projects.length
   ? '<div class="grid">' + student.projects.map(project => projectCard(project, student.id)).join('') + '</div>'
   : '<p class="muted">No project evidence added yet.</p>') + '</section>';
}
function contributorCredits(contributors) {
 const credits = contributors.map(person =>
  '<li class="contributor-credit"><a href="/students/' + encodeURIComponent(person.student_id) + '">' +
  esc(person.name) + '</a><span class="contributor-role"> · ' + esc(person.role) + '</span>' +
  (person.statement ? '<p class="project-contribution">' + esc(person.statement) + '</p>' : '') + '</li>').join('');
 return credits ? '<ul class="contributor-credits">' + credits + '</ul>' : '<p>No public contributors are listed.</p>';
}

function exhibitionCard(project, heading = 'h3') {
 return '<article class="card exhibition-card"><p class="eyebrow">' + esc(project.domain) +
  '</p><' + heading + '><a href="/projects/' + encodeURIComponent(project.id) + '">' +
  esc(project.title) + '</a></' + heading + '><p>' + esc(project.description) + '</p>' +
  (project.evidence ? '<p class="exhibition-evidence">' + esc(project.evidence) + '</p>' : '') + '</article>';
}

async function exhibition() {
 let featured;
 try {
  featured = await api('/api/projects/P01');
 } catch (error) {
  if (error.status !== 404) throw error;
  location.replace('/talent');
  return;
 }
 if (featured.id !== 'P01' || featured.playable_url !== '/demos/p01-safety-demo.html') {
  location.replace('/talent');
  return;
 }
 document.title = 'ImmXrsive · Student project gallery';
 document.body.classList.add('exhibition-page');
 main.innerHTML = `
  <section class="exhibition-hero" aria-labelledby="featured-title">
   <div class="exhibition-intro">
    <p class="eyebrow">${esc(featured.domain)}</p>
    <h1 id="featured-title">${esc(featured.title)}</h1>
    <p>${esc(featured.description)}</p>
   </div>
   <figure class="exhibition-scene">
    <div class="preview-art"><img src="/demos/p01-walkway-wireframe.svg" width="636" height="395"
     alt="Wireframe view of a warehouse walkway between storage racks, with a crimson spill across the marked pedestrian lane."></div>
    <figcaption>Browser sample · Industrial onboarding</figcaption>
   </figure>
   <div class="exhibition-actions">
    <a class="button primary-button" href="${esc(featured.playable_url)}">Try the scenario</a>
    <a class="secondary-link" href="/talent">Find talent</a>
   </div>
   <section class="exhibition-team" aria-labelledby="trainer-team">
    <h2 id="trainer-team">Meet the team behind the trainer</h2>
    ${contributorCredits(featured.contributors)}
    <a class="secondary-link" href="/projects/${encodeURIComponent(featured.id)}">See project details and inquiry</a>
   </section>
  </section>
  <div id="more-exhibits"></div>`;
 watchPreview(main.querySelector('.exhibition-scene'), 'The warehouse preview is unavailable.',
  '/demos/p01-safety-fallback.html', 'Read the scenario summary');
 await moreExhibits(featured, document.getElementById('more-exhibits'));
}

async function moreExhibits(featured, listing) {
 const finishLoading = showLoadingStatus(listing, 'Loading more projects…');
 const projects = await api('/api/projects').catch(() => null);
 finishLoading();
 if (!projects) {
  listing.innerHTML = '<p role="alert">More student projects couldn’t load.</p><div class="recovery-actions">' +
   '<button type="button" class="secondary">Retry</button><a class="secondary-link" href="/projects">Browse all projects</a></div>';
  listing.querySelector('button').addEventListener('click', () => {
   listing.tabIndex = -1;
   listing.focus();
   moreExhibits(featured, listing);
  }, { once: true });
  return;
 }
 const seen = new Set([featured.title.trim().toLowerCase()]);
 const exhibits = projects.filter(project => {
  const title = project.title.trim().toLowerCase();
  if (!project.evidence || !title || project.id === featured.id || seen.has(title)) return false;
  seen.add(title);
  return true;
 }).slice(0, 3);
 listing.innerHTML = exhibits.length
  ? '<section class="exhibition-more"><h2>More student projects</h2>' +
    '<div class="exhibition-grid">' + exhibits.map(project => exhibitionCard(project)).join('') + '</div>' +
    '<a class="secondary-link" href="/projects">Browse all projects</a></section>'
  : '';
}

async function projectDirectory() {
 document.title = 'Published projects · ImmXrsive';
 main.innerHTML = '<section class="page-intro"><h1>Published projects</h1><p class="muted">Explore student work and the evidence behind it.</p></section>' +
  '<div id="project-listing" role="region" aria-label="Published projects"></div>';
 const listing = document.getElementById('project-listing');
 async function load() {
  const finishLoading = showLoadingStatus(listing, 'Loading projects…');
  try {
   const projects = await api('/api/projects');
   listing.innerHTML = projects.length
    ? '<div class="exhibition-grid">' + projects.map(project => exhibitionCard(project, 'h2')).join('') + '</div>'
    : '<p>No projects have been published yet. <a href="/talent">Find talent</a></p>';
  } catch {
   listing.innerHTML = '<p role="alert">Published projects couldn’t load.</p><button class="secondary" type="button">Retry</button>';
   listing.querySelector('button').addEventListener('click', () => {
    main.focus();
    load();
   }, { once: true });
  } finally {
   finishLoading();
  }
 }
 await load();
}
function talentCard(s) {
 const profile = '/students/' + encodeURIComponent(s.id);
 const availability = { internship:'internships', 'full-time':'full-time work', contract:'contract work' };
 const credit = s.project_credit;
 return '<article class="card talent-card"><h2><a href="' + profile + '">' + esc(s.name) + '</a></h2>' +
  (s.headline ? '<p>' + esc(s.headline) + '</p>' : '') +
  (credit ? '<p class="talent-credit"><a href="/projects/' + encodeURIComponent(credit.id) + '">' + esc(credit.title) +
    '</a> · ' + esc(credit.role) + '</p>' : '<p class="muted">No published project credit yet.</p>') +
  '<p class="muted">' + (s.availability.length ? 'Open to ' + esc(s.availability.map(value => availability[value] || value).join(' · ')) : 'Availability not listed') +
  '</p><div>' + tags(s.skills.slice(0,3)) + '</div></article>';
}
function recoverPublicPage(title, text, retry) {
 const source = publicRoute === '/inquiry' ? new URLSearchParams(location.search).get('source_type') : null;
 let recovery = { href: '/talent', label: 'Find talent' };
 if (publicRoute.startsWith('/projects/') || source === 'project') {
  recovery = { href: '/projects', label: 'Browse published projects' };
 } else if (source === 'partner' || source === 'collaboration') {
  recovery = { href: '/partners', label: 'Browse industry partners' };
 }
 showPageRecovery(main, { title, text, ...recovery, retry });
}
async function directory() {
 const skills = await api('/api/skills'), params = new URLSearchParams(location.search);
 const checks = (key,values) => values.map(v => '<label class="check"><input type="checkbox" name="' + key + '" value="' + esc(v) + '"' + (params.getAll(key).includes(v) ? ' checked' : '') + '><span>' + esc(label(v)) + '</span></label>').join('');
 main.innerHTML = `
  <section class="talent-hero" aria-labelledby="talent-title">
   <div class="talent-hero-copy">
    <p class="eyebrow">ALGOMA UNIVERSITY · TALENT & INDUSTRY</p>
    <h1 id="talent-title">Find your next <span>collaborator.</span></h1>
    <p>Discover students and alumni, see what they built, and start a conversation.</p>
    <a class="button hero-search" href="#talent-search">Find talent <span aria-hidden="true">↓</span></a>
   </div>
   <div class="talent-hero-art" aria-hidden="true"></div>
  </section>
  <div class="layout talent-directory">
   <form id="filters" class="filters">
    <label class="field">Search talent<input id="talent-search" type="text" name="text" value="${esc(params.get('text') || '')}" placeholder="Name, headline or skill"></label>
    <div class="directory-actions"><button type="submit">Search</button><button type="button" class="secondary" id="clear">Clear all</button></div>
    <fieldset class="directory-availability"><legend>Availability</legend>${checks('availability',['internship','full-time','contract'])}</fieldset>
    <details class="directory-options">
     <summary><span class="nav-full">More filters</span><span class="nav-short">Filters</span> <span id="filter-total"></span></summary>
     <fieldset><legend>Student status</legend>${checks('status',['current','alumni'])}</fieldset>
     <fieldset class="skills"><legend>Skills · match all selected</legend>${checks('skill',skills)}</fieldset>
     <button class="secondary" type="button" id="close-filters">Close filters</button>
    </details>
   </form>
   <section aria-label="Talent results">
    <div id="count" role="status" aria-live="polite"></div>
    <div id="active" class="active"></div>
    <div id="results" class="directory-results"></div>
    <button id="load-more" class="secondary directory-more" type="button" hidden>Load more</button>
    <div class="panel search-recovery" id="search-recovery" hidden>
     <p id="page-error" class="error" role="alert"></p>
     <button type="button" class="secondary" id="retry-search">Retry search</button>
    </div>
   </section>
  </div>`;
 const form = document.querySelector('#filters');
 const savedDirectory = history.state?.talentDirectory;
 const searchInput = form.elements.text;
 const filterOptions = form.querySelector('.directory-options');
 const filterTotal = form.querySelector('#filter-total');
 filterOptions.open = savedDirectory?.filtersOpen === true;
 function closeFilters() {
  filterOptions.open = false;
  filterOptions.querySelector('summary').focus();
 }
 form.querySelector('#close-filters').onclick = closeFilters;
 filterOptions.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !filterOptions.open) return;
  event.preventDefault();
  closeFilters();
 });
 const hero = document.querySelector('.talent-hero-copy');
 try {
  const revealKey = 'immxrsive:talent-hero-seen';
  if (!sessionStorage.getItem(revealKey)) {
   sessionStorage.setItem(revealKey, '1');
   hero.classList.add('talent-hero-reveal');
  }
 } catch {
  // Storage can be unavailable. The hero is visible in its resting state.
 }
 const results = document.querySelector('#results');
 const count = document.querySelector('#count');
 const more = document.querySelector('#load-more');
 const recovery = document.querySelector('#search-recovery');
 const retry = document.querySelector('#retry-search');
 const pageError = document.querySelector('#page-error');
 let sequence = 0;
 let appliedFilters;
 let nextPage = null;
 let failedPage = null;
 let shown = 0;
 let loadedPage = 0;
 let cancelSlowLoad;

 function rememberDirectory() {
  const focusedLink = document.activeElement.closest?.('#results a[href]');
  history.replaceState({ ...history.state, talentDirectory: {
   page: loadedPage, filtersOpen: filterOptions.open, scroll: window.scrollY,
   focus: focusedLink?.getAttribute('href') || null
  } }, '');
 }
 window.addEventListener('pagehide', rememberDirectory);
 results.addEventListener('click', event => {
  if (event.target.closest('a[href]')) rememberDirectory();
 });

 async function loadPage(filters, page, ticket, restoring = false) {
  const query = new URLSearchParams(filters);
  query.set('page', page);
  const firstPage = page === 1;
  const retrying = document.activeElement === retry;
  cancelSlowLoad?.();
  count.textContent = firstPage ? 'Loading talent…' : 'Loading more talent…';
  const finishLoading = showSlowLoad(count, 'Still loading talent. Your filters are saved.');
  cancelSlowLoad = finishLoading;
  more.disabled = true;
  recovery.hidden = true;
  try {
   const response = await api('/api/students?' + query);
   if (ticket !== sequence) return;
   const cards = response.students.map(talentCard).join('');
   const batch = '<div class="grid talent-batch' + (firstPage || restoring ? '' : ' talent-batch-reveal') + '">' + cards + '</div>';
   if (firstPage) {
    results.innerHTML = cards ? batch : '<div class="panel"><h2>No matching talent</h2><p>Try fewer skills or clear your filters.</p><button class="secondary" type="button">Clear filters</button></div>';
    if (!cards) results.querySelector('button').onclick = clearFilters;
   } else if (cards) {
    results.insertAdjacentHTML('beforeend', batch);
   }
   shown += response.students.length;
   loadedPage = page;
   count.textContent = 'Showing ' + shown + ' of ' + response.total + ' people';
   nextPage = response.next_page;
   if (!firstPage && !restoring) {
    const firstNewProfile = cards ? results.lastElementChild.querySelector('h2 a') : null;
    (firstNewProfile || count).focus();
   } else if (retrying) {
    count.focus();
   }
   more.hidden = !nextPage;
   if (!restoring) rememberDirectory();
   return true;
  } catch (error) {
   if (ticket !== sequence) return;
   count.textContent = firstPage ? 'Results unavailable' : 'Showing ' + shown + ' people';
   failedPage = page;
   pageError.textContent = firstPage ? 'Talent results couldn’t load. Your search and filters are still selected.'
    : 'The next results couldn’t load. The profiles already shown are still available.';
   retry.textContent = firstPage ? 'Retry search' : 'Retry loading more';
   recovery.hidden = false;
   if (retrying) retry.focus();
  } finally {
   finishLoading();
   if (ticket === sequence) more.disabled = false;
  }
 }

 async function update(restore) {
  const ticket = ++sequence, query = new URLSearchParams(new FormData(form));
  if (!query.get('text')) query.delete('text');
  history.replaceState({ ...history.state, talentDirectory: null }, '', '/talent' + (query.size ? '?' + query : ''));
  appliedFilters = query;
  const selected = [...query.keys()].filter(key => key !== 'text').length;
  filterTotal.textContent = selected ? '(' + selected + ' selected)' : '';
  more.hidden = true;
  nextPage = null;
  shown = 0;
  loadedPage = 0;
  results.replaceChildren();
  const active = document.querySelector('#active'); active.innerHTML = '';
  for (const [key,value] of query) {
   const button = document.createElement('button'); button.type='button'; button.className='filter-chip is-selected';
   button.innerHTML='<span aria-hidden="true">✓</span> '+esc(label(value))+' <span aria-hidden="true">×</span>';
   button.setAttribute('aria-label','Remove '+label(value));
   button.onclick = () => {
    if (key === 'text') searchInput.value='';
    else [...form.querySelectorAll('input[type=checkbox]')].find(input => input.name===key && input.value===value).checked=false;
    update();
    (active.querySelector('button') || searchInput).focus();
   };
   active.append(button);
  }
  const first = await loadPage(query, 1, ticket, Boolean(restore));
  if (!restore || !first || ticket !== sequence) return;
  const lastPage = Math.max(1, Number(restore.page) || 1);
  while (ticket === sequence && nextPage && nextPage <= lastPage) {
   if (!await loadPage(query, nextPage, ticket, true)) break;
  }
  if (ticket !== sequence) return;
  const previousLink = [...results.querySelectorAll('a')].find(link => link.getAttribute('href') === restore.focus);
  previousLink?.focus({ preventScroll: true });
  if (Number.isFinite(restore.scroll)) window.scrollTo(0, restore.scroll);
  rememberDirectory();
 }
 function clearFilters() {
  searchInput.value = '';
  form.querySelectorAll('input[type=checkbox]').forEach(input => input.checked = false);
  update();
  searchInput.focus();
 }
 count.tabIndex = -1;
 retry.onclick = () => loadPage(appliedFilters, failedPage, sequence);
 more.onclick = () => { if (nextPage && !more.disabled) loadPage(appliedFilters, nextPage, sequence); };
 form.onsubmit = e => { e.preventDefault(); update(); }; form.onchange = e => { if(e.target.type==='checkbox') update(); };
 document.querySelector('#clear').onclick = clearFilters;
 await update(savedDirectory);
}
async function student(id) {
 const s = await api('/api/students/' + encodeURIComponent(id));
 document.title = s.name + ' · ImmXrsive';
 const meta = [s.program, s.location, ...s.availability.map(label)].filter(Boolean);
 const themeClass = s.theme ? ' public-profile theme-' + esc(s.theme) : '';
 const action = '<a class="button" href="' + inquiry('student', s.id) + '">Interested in working with this student</a>';
 const intro = '<section class="page-intro"><p class="eyebrow">' + esc(label(s.status)) + '</p><h1>' + esc(s.name) +
  '</h1><p class="profile-headline">' + esc(s.headline) + '</p>' +
  (meta.length ? '<p class="muted">' + esc(meta.join(' · ')) + '</p>' : '') + action + '</section>';
 const publicLinks = links(s.links);
 const linkSection = publicLinks ? '<section class="panel"><h2>Professional links</h2>' + publicLinks + '</section>' : '';
 const copy = { about: s.biography, education: s.education, experience: s.experience };
 const sections = s.theme ? (s.section_order || []).map(key => {
  if (key === 'links') return linkSection;
  if (!copy[key]) return '';
  return '<section class="panel"><h2>' + esc(key[0].toUpperCase() + key.slice(1)) +
   '</h2><p class="source-text">' + esc(copy[key]) + '</p></section>';
 }).join('') : linkSection;
 main.innerHTML = '<div class="detail' + themeClass + '"><a class="back" href="/talent">← Talent directory</a>' +
  intro + profileProjects(s) + '<section class="panel"><h2>Professional skills</h2>' +
  (s.skills.length ? tags(s.skills) : '<p class="muted">No public skills listed yet.</p>') + '</section>' + sections + '</div>';
}

const projectActionLabels = {
 playable: 'Try browser sample', video: 'Watch demo', screenshot: 'View screenshots',
 fallback: 'Read scenario summary', repository: 'Open repository', demo: 'Open demo link', reference: 'Open evidence'
};

function projectEvidence(project) {
 const evidence = project.public_evidence || [];
 if (!evidence.length) {
  return '<section class="panel evidence-text"><h2>Project evidence</h2><p class="muted">No public media or source links are available.</p></section>';
 }
 const sample = project.id === 'P01' && project.playable_url === '/demos/p01-safety-demo.html';
 const preview = sample
  ? '<figure class="project-preview"><div class="preview-art"><img class="demo-preview" src="/demos/p01-walkway.svg" width="640" height="332" decoding="async" alt="Overhead warehouse illustration showing a spill crossing the marked pedestrian lane."></div><figcaption>Browser sample · Industrial onboarding</figcaption></figure>'
  : '';
 const onlyRepositories = evidence.every(item => item.kind === 'repository');
 const actions = evidence.map((item, index) => {
  const label = item.kind === 'fallback' && !sample ? 'Open fallback evidence' : projectActionLabels[item.kind];
  const style = index === 0 ? 'button primary-button' + (item.kind === 'playable' ? ' demo-play' : '') : 'secondary-link';
  return '<a class="' + style + '" target="_blank" rel="noopener noreferrer" href="' + esc(item.url) + '">' +
   esc(label) + ' <span class="demo-arrow" aria-hidden="true">↗</span></a>';
 }).join('');
 return '<section class="panel ' + (sample ? 'experience' : 'evidence-text') + '"><div class="demo-panel' + (preview ? ' has-preview' : '') + '">' +
  '<div class="demo-copy"><h2>' + (sample ? 'Try the experience' : onlyRepositories ? 'Project source' : 'Project evidence') + '</h2>' +
  '<p>' + (sample ? 'Try the browser exercise or read the written scenario. Both open in a new tab.'
   : onlyRepositories ? 'Explore the project source and documentation. Links open in a new tab.'
   : 'Evidence links open in a new tab.') + '</p><div class="demo-actions">' + actions + '</div></div>' + preview + '</div></section>';
}

function projectCollaborations(project) {
 const partners = (project.partners || []).map(partner =>
  '<li><a href="/partners/' + encodeURIComponent(partner.id) + '">' + esc(partner.name) + '</a></li>').join('');
 const history = (project.collaborations || []).map(row =>
  '<li><a href="/partners/' + encodeURIComponent(row.partner.id) + '#collaboration-' + encodeURIComponent(row.id) + '">' + esc(row.title) +
  '</a><span class="muted">' + esc([row.partner.name, row.year, row.status === 'current' ? 'Current' : 'Past'].filter(Boolean).join(' · ')) + '</span></li>').join('');
 if (!partners && !history) return '';
 return '<section class="panel"><h2>Industry collaboration</h2>' +
  (history ? '<ul class="project-collaboration-list">' + history + '</ul>' : '') +
  (partners ? '<h3>Verified industry partners</h3><ul>' + partners + '</ul>' : '') + '</section>';
}

async function project(id) {
 const p = await api('/api/projects/' + encodeURIComponent(id));
 document.title = p.title + ' · ImmXrsive';
 main.innerHTML = '<div class="detail gallery-project"><a class="back secondary-link" href="/projects">← Published projects</a>' +
  '<section class="page-intro"><p class="eyebrow">' + esc(p.domain) + '</p><h1' + (p.id === 'P01' ? ' class="featured-headline"' : '') + '>' +
  esc(p.title) + '</h1><p>' + esc(p.description) + '</p>' +
  (p.institution_verified ? '<p class="notice">Officially verified by ImmXrsive</p>' : '') + '</section>' +
  projectEvidence(p) +
  '<section class="panel"><h2 id="contributors" tabindex="-1">Contributors & roles</h2>' + contributorCredits(p.contributors) + '</section>' +
  '<section class="panel"><h2>Project technologies</h2>' +
  (p.technologies.length ? tags(p.technologies) : '<p class="muted">No technologies listed.</p>') + '</section>' +
  projectCollaborations(p) +
  '<section class="panel project-contact"><div><h2>Discuss this project</h2><p>Your inquiry will reference <strong>' + esc(p.title) +
  '</strong>. The submission is simulated and sends no email.</p></div><a class="button primary-button" href="' + inquiry('project', p.id) +
  '">Discuss this project</a></section></div>';
 if (location.hash === '#contributors') document.getElementById('contributors').focus();
}
async function intake() {
 const query = new URLSearchParams(location.search);
 const type = query.get('source_type'), id = query.get('source_id');
 if (!['student','project','partner','collaboration'].includes(type) || !id) {
  return recoverPublicPage('Choose an inquiry source first', 'Open an inquiry from a published profile, project, or partner.');
 }
 const context = await api('/api/inquiry-context?' + new URLSearchParams({ source_type: type, source_id: id }));
 const regarding = [context.name, context.partner?.name].filter(Boolean).join(' · ');
 const originLink = '<a class="secondary-link" href="' + esc(context.path) + '">Back to ' + esc(context.name) + '</a>';
 document.title = 'Inquiry about ' + context.name + ' · ImmXrsive';
 main.innerHTML = '<div class="detail">' + originLink +
  '<section class="page-intro"><h1>Start an inquiry</h1><p class="inquiry-regarding"><strong>Regarding:</strong> ' +
  esc(regarding) + '</p></section><p class="notice">Simulated inquiry. Your submission is saved for this demonstration and sends no email.</p>' +
  '<form id="inquiry" class="panel">' +
  '<label class="field">Company name<input name="company_name" type="text" autocomplete="organization" required maxlength="4000"></label>' +
  '<label class="field">Contact name<input name="contact_name" type="text" autocomplete="name" required maxlength="4000"></label>' +
  '<label class="field">Contact email<input name="contact_email" type="email" autocomplete="email" required maxlength="4000"></label>' +
  '<label class="field">Inquiry message<textarea name="description" required maxlength="4000"></textarea></label>' +
  '<p class="error" id="inquiry-error" role="alert"></p><button type="submit">Submit simulated inquiry</button></form>' +
  '<section class="panel inquiry-success" id="inquiry-success" hidden>' +
  '<h2 tabindex="-1">Inquiry saved</h2><p id="inquiry-reference"></p>' + originLink + '</section></div>';
 const form = document.getElementById('inquiry');
 const button = form.querySelector('button');
 const errorMessage = document.getElementById('inquiry-error');
 const success = document.getElementById('inquiry-success');
 form.addEventListener('input', event => {
  if (event.target.getAttribute('aria-invalid') !== 'true') return;
  event.target.removeAttribute('aria-invalid');
  event.target.removeAttribute('aria-describedby');
  errorMessage.textContent = '';
 });
 form.onsubmit = async event => {
  event.preventDefault();
  if (button.disabled) return;
  button.disabled = true;
  errorMessage.textContent = '';
  for (const field of form.querySelectorAll('[aria-invalid]')) {
   field.removeAttribute('aria-invalid');
   field.removeAttribute('aria-describedby');
  }
  try {
   const fields = Object.fromEntries(new FormData(form));
   const result = await api('/api/inquiries', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...fields, source_type: type, source_id: context.id })
   });
   document.getElementById('inquiry-reference').textContent = 'No email was sent. Reference: ' + result.id;
   form.hidden = true;
   success.hidden = false;
   success.querySelector('h2').focus();
  } catch (error) {
   const field = error.field ? form.elements.namedItem(error.field) : null;
   if (field) field.closest('label').after(errorMessage);
   else button.before(errorMessage);
   errorMessage.textContent = error.message;
   if (field) {
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', 'inquiry-error');
    field.focus();
   }
  } finally {
   button.disabled = false;
  }
 };
}
(async () => {
 const finishLoading = showLoadingStatus(main, 'Loading…');
 try {
  const route = publicRoute.split('/').filter(Boolean);
  if (!route.length) await exhibition();
  else if (publicRoute === '/talent') await directory();
  else if (publicRoute === '/projects') await projectDirectory();
  else if (route.length === 2 && route[0] === 'students') await student(route[1]);
  else if (route.length === 2 && route[0] === 'projects') await project(route[1]);
  else if (publicRoute === '/inquiry') await intake();
  else recoverPublicPage('Page unavailable', 'The page address may have changed.');
  const preview = main.querySelector('.gallery-project .project-preview');
  if (preview) {
   watchPreview(preview, 'The warehouse preview is unavailable.',
    '/demos/p01-safety-fallback.html', 'Read the scenario summary');
  }
 } catch (error) {
  if (error.status === 404) recoverPublicPage('Record unavailable', 'This record may have moved or may no longer be public.');
  else recoverPublicPage('This page couldn’t load', 'The service may be temporarily unavailable.', () => location.reload());
 } finally {
  finishLoading();
 }
})();
