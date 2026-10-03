const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { openStore } = require('./store');
const { createApp } = require('./server');
test('Release 1 API, persistence, filtering, routes and inquiry contract', async t => {
 const dir = fs.mkdtempSync(path.join(os.tmpdir(),'immxrsive-'));
 process.env.SQLITE_PATH = path.join(dir,'test.sqlite');
 delete process.env.DATABASE_URL;
 const store = await openStore(), app = await createApp(store), server = app.listen(0,'127.0.0.1');
 await new Promise(r => server.once('listening',r));
 const base='http://127.0.0.1:'+server.address().port;
 const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/students.json'),'utf8'));
 const published=fixtures.filter(s => s.profile_status==='published');
 const get=async route => { const r=await fetch(base+route); return {status:r.status,data:await r.json()}; };
 const ids=ss => ss.map(s => s.id).sort();
 try {
 await t.test('directory includes exactly published students, sorted deterministically',async () => {
  const a=await get('/api/students'),b=await get('/api/students'); assert.equal(a.status,200); assert.deepEqual(ids(a.data),ids(published)); assert.deepEqual(a.data,b.data); assert.ok(a.data.every(s=>Number.isInteger(s.project_count)));
 });
 await t.test('case-insensitive substring search across name, headline and skills',async () => {
  for(const text of ['AVERY','developer','unity','sQL']) { const r=await get('/api/students?text='+encodeURIComponent(text)); assert.deepEqual(ids(r.data),ids(published.filter(s=>[s.name,s.headline,...s.skills].some(v=>v.toLowerCase().includes(text.toLowerCase()))))); }
 });
 await t.test('all skill pairs follow structured AND semantics',async () => {
  const skills=(await get('/api/skills')).data;
  for(const skill of skills) {
   const r=await get('/api/students?skill='+encodeURIComponent(skill)+'&skill=Unity');
   assert.deepEqual(ids(r.data),ids(published.filter(s=>s.skills.includes(skill)&&s.skills.includes('Unity'))));
  }
  const r=await get('/api/students?skill=Blender'); assert.ok(!r.data.some(s=>s.id==='S01'));
 });
 await t.test('availability and status use OR internally and AND across categories',async () => {
  for(const availability of [['internship'],['full-time'],['contract'],['internship','contract']]) for(const status of [['current'],['alumni'],['current','alumni']]) {
   const q=new URLSearchParams(); availability.forEach(v=>q.append('availability',v));status.forEach(v=>q.append('status',v));q.append('skill','Unity');
   assert.deepEqual(ids((await get('/api/students?'+q)).data),ids(published.filter(s=>availability.some(v=>s.availability.includes(v))&&status.includes(s.status)&&s.skills.includes('Unity'))));
  }
 });
 await t.test('hidden and invalid profiles cannot be opened via API',async () => {
  for(const s of fixtures.filter(s=>s.profile_status!=='published')) assert.equal((await get('/api/students/'+s.id)).status,404);
  assert.equal((await get('/api/students/unknown')).status,404);assert.equal((await get('/api/projects/unknown')).status,404);
 });
 await t.test('shared projects retain canonical IDs and contributor roles',async () => {
  const a=(await get('/api/students/S01')).data,b=(await get('/api/students/S02')).data,p=(await get('/api/projects/P01')).data;
  assert.ok(a.projects.some(v=>v.id===p.id)); assert.ok(b.projects.some(v=>v.id===p.id)); assert.equal(p.contributors.find(v=>v.student_id==='S02').role,'3D Artist');
 });
 await t.test('optional broken evidence is isolated',async () => {
  assert.equal((await get('/api/projects/P07')).data.links.demo,'https://example.invalid/demo');
  assert.equal((await get('/api/students/S01')).status,200);assert.equal((await get('/api/students')).status,200);
 });
 await t.test('direct page URLs return the app and API 404 stays JSON',async () => {
  for(const route of ['/talent','/students/S01','/projects/P01','/inquiry?source_type=project&source_id=P01']) {const r=await fetch(base+route);assert.equal(r.status,200);assert.match(await r.text(),/id="main"/);}
  assert.equal((await get('/api/unknown')).status,404);
 });
 await t.test('student and project inquiries derive authoritative context and persist',async () => {
  for(const source_type of ['student','project']) {
   const source_id=source_type==='student'?'S01':'P01';
   const r=await fetch(base+'/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source_type,source_id,source_name:'FORGED',source_url:'FORGED',company_name:'Test company',contact_name:'Tester',contact_email:'qa@example.com',description:'Synthetic test inquiry'})});
   assert.equal(r.status,201);const d=await r.json();assert.equal(d.source_id,source_id);assert.notEqual(d.source_name,'FORGED');assert.ok(d.source_url.endsWith('/'+source_id));
  }
  const r=await fetch(base+'/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source_type:'student',source_id:'S01'})});assert.equal(r.status,400);
  assert.equal((await store.query('SELECT payload FROM inquiries')).length,2);
 });
 await store.close();
 const reopened=await openStore();
 await t.test('records and inquiries survive database restart',async()=>{assert.equal((await reopened.list('students')).length,fixtures.length);assert.equal((await reopened.query('SELECT payload FROM inquiries')).length,2);});
 await reopened.close();
 } finally {await new Promise(r=>server.close(r)); fs.rmSync(dir,{recursive:true,force:true});}
});
