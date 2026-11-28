require('dotenv').config();
const express = require('express');
const path = require('node:path');
const { existsSync } = require('node:fs');
const { randomUUID } = require('node:crypto');
const { openStore } = require('./store');
const { mountSelfService } = require('./self-service');
const { publicProfile } = require('./profile');
const { mountProjects } = require('./projects');
const { mountIndustry } = require('./industry');
const DIRECTORY_PAGE_SIZE = 20;
function legacyProjectEvidence(project) {
 if (project.id !== 'P01' || project.links?.demo !== 'https://example.com/p01-demo') return project;
 const links = { ...project.links };
 delete links.demo;
 return {
  ...project,
  links,
  playable_url: '/demos/p01-safety-demo.html',
  fallback_url: '/demos/p01-safety-fallback.html'
 };
}
function publicEvidence(project) {
 function usable(value) {
  if (typeof value !== 'string') return false;
  if (value.startsWith('/demos/')) return true;
  try {
   const url = new URL(value);
   return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password &&
    !/(^|\.)example\.(com|org|net|invalid|test)$/.test(url.hostname) &&
    !(url.hostname === 'github.com' && url.pathname.startsWith('/example-org/'));
  } catch {
   return false;
  }
 }
 const evidence = [];
 const seen = new Set();
 function add(kind, url) {
  if (!usable(url) || seen.has(url)) return;
  seen.add(url);
  evidence.push({ kind, url });
 }
 add('playable', project.playable_url);
 add('video', project.video_url);
 add('screenshot', project.fallback_image);
 add('fallback', project.fallback_url);
 for (const repository of project.repositories || []) add('repository', repository);
 for (const [label, url] of Object.entries(project.links || {})) {
  const name = label.toLowerCase();
  const kind = /repository|^source\b|github/.test(name) ? 'repository'
   : /video/.test(name) ? 'video'
   : /screenshot/.test(name) ? 'screenshot'
   : /demo/.test(name) ? 'demo' : 'reference';
  add(kind, url);
 }
 return evidence;
}
const evidenceLabels = {
 playable:'Playable', video:'Video', screenshot:'Screenshots', fallback:'Fallback evidence',
 repository:'Repository', demo:'Demo link', reference:'Evidence links'
};
async function createApp(store, options = {}) {
 const app = express();
 app.disable('x-powered-by');
 app.use(express.json({ limit: '64kb' }));
 app.use((req,res,next) => { res.set('X-Content-Type-Options','nosniff'); res.set('Referrer-Policy','strict-origin-when-cross-origin'); res.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"); next(); });
 const auth = await mountSelfService(app,store,options);
 const shared = await mountProjects(app,store,auth,options);
 const published = async () => (await store.list('students')).filter(s => s.profile_status === 'published').map(publicProfile);
 const projects = async (publicStudents) => {
  const ss = publicStudents ?? await published();
  const legacy = (await store.list('projects')).filter(p => p.published !== false).map(legacyProjectEvidence).map(p => ({...p,contributors:p.contributors.filter(c=>ss.some(s=>s.id===c.student_id)).map(c=>({...c,name:ss.find(s=>s.id===c.student_id).name}))}));
  return [...legacy,...await shared.publicProjects()];
 };
 const industry = await mountIndustry(app, store, auth, shared, { projects, students: published }, options);
 const studentView = (s, ps) => ({ ...s, project_ids: ps.filter(p => p.contributors.some(c => c.student_id === s.id && c.featured !== false)).map(p => p.id), project_count: ps.filter(p => p.contributors.some(c => c.student_id === s.id && c.featured !== false)).length });
 app.get('/health', async (req,res) => { await store.query('SELECT 1'); res.json({ status:'ok',service:'immxrsive-r4',database:'connected',version:process.env.RENDER_GIT_COMMIT || process.env.RELEASE_COMMIT || 'local' }); });
 app.get('/api/skills', async (req,res) => res.json(await store.list('skills')));
 app.get('/api/students', async (req,res) => {
  const page = req.query.page === undefined ? null : Number(req.query.page);
  if (page !== null && (typeof req.query.page !== 'string' || !/^[1-9]\d*$/.test(req.query.page) || !Number.isSafeInteger(page))) {
   return res.status(400).json({error:'Choose a valid page number.'});
  }
  const values = key => [req.query[key] || []].flat().filter(v => typeof v === 'string' && v.length);
  const text = String(req.query.text || '').toLowerCase(), skills = values('skill'), availability = values('availability'), status = values('status');
  const students = await published();
  const matches = students.filter(s =>
   (!text || [s.name,s.headline,...s.skills].some(v => v.toLowerCase().includes(text))) &&
   skills.every(v => s.skills.includes(v)) &&
   (!availability.length || availability.some(v => s.availability.includes(v))) &&
   (!status.length || status.includes(s.status))
  );
  if (page === null) {
   const ps = await projects(students);
   return res.json(matches.map(s => studentView(s,ps)));
  }
  const offset = (page - 1) * DIRECTORY_PAGE_SIZE;
  const results = matches.slice(offset, offset + DIRECTORY_PAGE_SIZE);
  const ps = results.length ? await projects(students) : [];
  const byStudent = new Map(results.map(student => [student.id, { count: 0, credit: null }]));
  for (const project of ps) {
   const counted = new Set();
   for (const person of project.contributors) {
    const summary = byStudent.get(person.student_id);
    if (!summary || person.featured === false || counted.has(person.student_id)) continue;
    counted.add(person.student_id);
    summary.count++;
    if (!summary.credit && person.role) summary.credit = { id: project.id, title: project.title, role: person.role };
   }
  }
  res.json({
   students: results.map(({ id, name, headline, skills, availability, status }) => ({
    id, name, headline, skills, availability, status,
    project_count: byStudent.get(id).count,
    project_credit: byStudent.get(id).credit
   })),
   total: matches.length,
   next_page: offset + results.length < matches.length ? page + 1 : null
  });
 });
 app.get('/api/students/:id', async (req,res) => {
  const s = (await published()).find(s => s.id === req.params.id);
  if (!s) return res.status(404).json({error:'Student not found'});
  const ps = await projects();
  res.json({...studentView(s,ps),projects:ps.filter(p => p.contributors.some(c => c.student_id === s.id && c.featured !== false))});
 });
 app.get('/api/projects', async (_req, res) => {
  res.json((await projects()).map(project => {
   const { id, title, description, domain, technologies } = project;
   return { id, title, description, domain, technologies, evidence: evidenceLabels[publicEvidence(project)[0]?.kind] || '' };
  }));
 });
 app.get('/api/projects/:id', async (req,res) => {
  const p = (await projects()).find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({error:'Project not found'});
  const ss = await published();
  res.json({...p,...await industry.projectStatus(p.id),public_evidence:publicEvidence(p),contributors:p.contributors.filter(c => ss.some(s => s.id === c.student_id)).map(c => ({...c,name:ss.find(s => s.id === c.student_id).name}))});
 });
 async function inquirySource(type, id) {
  const row = type === 'student' ? (await published()).find(s => s.id === id) : type === 'project' ? (await projects()).find(p => p.id === id) : null;
  if (row) return { id: row.id, name: row.name || row.title, path: (type === 'student' ? '/students/' : '/projects/') + encodeURIComponent(row.id) };
  return industry.inquirySource(type, id);
 }
 app.get('/api/inquiry-context', async (req, res) => {
  const source = await inquirySource(req.query.source_type, req.query.source_id);
  if (!source) return res.status(404).json({error:'Inquiry source not found.'});
  res.json(source);
 });
 app.post('/api/inquiries', async (req,res) => {
  const b = req.body || {};
  const source = await inquirySource(b.source_type, b.source_id);
  if (!source) return res.status(400).json({error:'Choose a valid student, project, partner, or collaboration.'});
  const fields = {
   company_name: 'a company name', contact_name: 'a contact name', contact_email: 'a contact email address',
   description: 'an inquiry message'
  };
  for (const [key, label] of Object.entries(fields)) {
   if (typeof b[key] !== 'string' || !b[key].trim()) return res.status(400).json({error:'Enter ' + label + '.', field:key});
   if (b[key].length > 4000) return res.status(400).json({error:'Use 4000 characters or fewer for the ' + label.replace(/^an? /, '') + '.', field:key});
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.contact_email.trim())) {
   return res.status(400).json({error:'Enter a valid email address.',field:'contact_email'});
  }
  const origin = process.env.PUBLIC_ORIGIN || req.protocol + '://' + req.get('host'), id = randomUUID();
  const data = {id,source_type:b.source_type,source_id:source.id,source_name:source.name || source.title,source_url:origin + source.path};
  for (const key of Object.keys(fields)) data[key] = b[key].trim();
  await store.query('INSERT INTO inquiries (id,payload,created_at) VALUES ($1,$2,$3)', [id,JSON.stringify(data),new Date().toISOString()]);
  res.status(201).json({id,message:'Simulated inquiry saved. No email has been sent.',source_type:data.source_type,source_id:data.source_id,source_name:data.source_name,source_url:data.source_url});
 });
 app.use('/api',(req,res) => res.status(404).json({error:'Endpoint not found'}));
 app.get('/demos/working_demo.html',(req,res)=>{res.set('Content-Security-Policy',"default-src 'none'; script-src 'sha256-GF6VgUgnDup4061I2zIcOH9SjC3Q0Lc0+e/rbWFwA2g='; style-src 'sha256-q2PDlbSsnFa4xp1uzpfOpE8q2Z61v5Vyi2mk/eN3cnE='; frame-ancestors 'none'; base-uri 'none'");res.sendFile(path.join(__dirname,'../frontend/demos/working_demo.html'));});
 app.use(express.static(path.join(__dirname,'../frontend')));
 const ecosystem = path.join(__dirname, '../ecosystem');
 const ecosystemPage = path.join(ecosystem, 'out/ecosystem.html');
 if (existsSync(ecosystemPage)) {
  app.use('/_next', express.static(path.join(ecosystem, 'out/_next'), { immutable: true, maxAge: '1y' }));
  app.use('/_ecosystem', express.static(path.join(ecosystem, 'generated')));
  app.get(['/ecosystem', '/ecosystem/records/:id'], (req, res, next) => {
   const { id } = req.params;
   if (id && !/^[a-z0-9-]+$/.test(id)) return next();
   const page = id ? path.join(ecosystem, 'out/ecosystem/records', id + '.html') : ecosystemPage;
   if (!existsSync(page)) return next();
   const policy = res.get('Content-Security-Policy');
   res.set('Content-Security-Policy', policy.replace("script-src 'self'", "script-src 'self' 'wasm-unsafe-eval'"));
   res.sendFile(page);
  });
 } else {
  app.get(['/_ecosystem/bootstrap.js', '/_ecosystem/palette.css'], (req, res) => {
   res.set('Cache-Control', 'no-store');
   res.type(req.path.endsWith('.js') ? 'js' : 'css').end();
  });
 }
 app.get(['/partners', '/partners/:id', '/staff'], (req,res) => res.sendFile(path.join(__dirname,'../frontend/industry.html')));
 app.get(['/my-projects'],(req,res) => res.sendFile(path.join(__dirname,'../frontend/projects.html')));
 app.get(['/studio','/preview'],(req,res) => res.sendFile(path.join(__dirname,'../frontend/studio.html')));
 app.get(['/','/talent','/students/:id','/projects','/projects/:id','/inquiry'],(req,res) => res.sendFile(path.join(__dirname,'../frontend/index.html')));
 app.use((req,res) => res.status(404).send('Page not found. Return to /talent.'));
 app.use((error,req,res,next) => { console.error(error.message); res.status(error.status || 503).json({error:'Unable to complete this request. Please try again.'}); });
 return app;
}
if (require.main === module) openStore().then(async store => { const app = await createApp(store); app.listen(process.env.PORT || 3001,() => console.log('ImmXrsive ready')); }).catch(e => { console.error(e); process.exitCode=1; });
module.exports = { createApp };
