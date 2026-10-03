require('dotenv').config();
const express = require('express');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { openStore } = require('./store');
async function createApp(store) {
 const app = express();
 app.disable('x-powered-by');
 app.use(express.json({ limit: '16kb' }));
 const published = async () => (await store.list('students')).filter(s => s.profile_status === 'published');
 const projects = () => store.list('projects');
 const studentView = (s, ps) => ({ ...s, project_ids: ps.filter(p => p.contributors.some(c => c.student_id === s.id)).map(p => p.id), project_count: ps.filter(p => p.contributors.some(c => c.student_id === s.id)).length });
 app.get('/health', async (req,res) => { await store.query('SELECT 1'); res.json({ status:'ok',service:'immxrsive-r1',database:'connected' }); });
 app.get('/api/skills', async (req,res) => res.json(await store.list('skills')));
 app.get('/api/students', async (req,res) => {
  const values = key => [req.query[key] || []].flat().filter(v => typeof v === 'string' && v.length);
  const text = String(req.query.text || '').toLowerCase(), skills = values('skill'), availability = values('availability'), status = values('status');
  const ps = await projects();
  res.json((await published()).filter(s =>
   (!text || [s.name,s.headline,...s.skills].some(v => v.toLowerCase().includes(text))) &&
   skills.every(v => s.skills.includes(v)) &&
   (!availability.length || availability.some(v => s.availability.includes(v))) &&
   (!status.length || status.includes(s.status))
  ).map(s => studentView(s,ps)));
 });
 app.get('/api/students/:id', async (req,res) => {
  const s = (await published()).find(s => s.id === req.params.id);
  if (!s) return res.status(404).json({error:'Student not found'});
  const ps = await projects();
  res.json({...studentView(s,ps),projects:ps.filter(p => p.contributors.some(c => c.student_id === s.id))});
 });
 app.get('/api/projects/:id', async (req,res) => {
  const p = (await projects()).find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({error:'Project not found'});
  const ss = await published();
  res.json({...p,contributors:p.contributors.filter(c => ss.some(s => s.id === c.student_id)).map(c => ({...c,name:ss.find(s => s.id === c.student_id).name}))});
 });
 app.post('/api/inquiries', async (req,res) => {
  const b = req.body || {};
  const source = b.source_type === 'student' ? (await published()).find(s => s.id === b.source_id) : b.source_type === 'project' ? (await projects()).find(p => p.id === b.source_id) : null;
  if (!source) return res.status(400).json({error:'Choose a valid student or project.'});
  for (const key of ['company_name','contact_name','contact_email','description']) if (typeof b[key] !== 'string' || !b[key].trim() || b[key].length > 4000) return res.status(400).json({error:'Complete all fields (maximum 4000 characters each).'});
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.contact_email)) return res.status(400).json({error:'Enter a valid email address.'});
  const origin = process.env.PUBLIC_ORIGIN || req.protocol + '://' + req.get('host'), id = randomUUID();
  const data = {id,source_type:b.source_type,source_id:source.id,source_name:source.name || source.title,source_url:origin + '/' + (b.source_type === 'student' ? 'students' : 'projects') + '/' + source.id};
  for (const key of ['company_name','contact_name','contact_email','description']) data[key] = b[key].trim();
  await store.query('INSERT INTO inquiries (id,payload,created_at) VALUES ($1,$2,$3)', [id,JSON.stringify(data),new Date().toISOString()]);
  res.status(201).json({id,message:'Simulated inquiry saved. No email has been sent.',source_type:data.source_type,source_id:data.source_id,source_name:data.source_name,source_url:data.source_url});
 });
 app.use('/api',(req,res) => res.status(404).json({error:'Endpoint not found'}));
 app.use(express.static(path.join(__dirname,'../frontend')));
 app.get(['/','/talent','/students/:id','/projects/:id','/inquiry'],(req,res) => res.sendFile(path.join(__dirname,'../frontend/index.html')));
 app.use((req,res) => res.status(404).send('Page not found. Return to /talent.'));
 app.use((error,req,res,next) => { console.error(error.message); res.status(error.status || 503).json({error:'Unable to complete this request. Please try again.'}); });
 return app;
}
if (require.main === module) openStore().then(async store => { const app = await createApp(store); app.listen(process.env.PORT || 3001,() => console.log('ImmXrsive ready')); }).catch(e => { console.error(e); process.exitCode=1; });
module.exports = { createApp };
