const main = document.querySelector('main');
const esc = v => String(v ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tags = vs => vs.map(v => '<span class="tag">' + esc(v) + '</span>').join('');
const label = v => ({'full-time':'Full-time',internship:'Internship',contract:'Contract',current:'Current student',alumni:'Alumni'}[v] || v);
async function api(url,options) { const r = await fetch(url,options); const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Unable to load this page.'); return d; }
function links(ls) { return Object.entries(ls || {}).filter(([k,v]) => /^https?:\/\//i.test(v)).map(([k,v]) => '<p><a target="_blank" rel="noopener noreferrer" href="' + esc(v) + '">' + esc(label(k)) + ' ↗</a></p>').join(''); }
function inquiry(type,id) { return '/inquiry?source_type=' + type + '&source_id=' + encodeURIComponent(id); }
function projectCard(p) { return '<article class="card"><span class="eyebrow">' + esc(p.domain) + '</span><h2><a href="/projects/' + esc(p.id) + '">' + esc(p.title) + '</a></h2><p>' + esc(p.description) + '</p>' + tags(p.technologies) + '</article>'; }
function notFound(message) { main.innerHTML = '<div class="panel"><h1>' + esc(message) + '</h1><p>Try another profile or return to the directory.</p><a href="/talent">Discover talent</a></div>'; }
async function directory() {
 const skills = await api('/api/skills'), params = new URLSearchParams(location.search);
 const checks = (key,values) => values.map(v => '<label class="check"><input type="checkbox" name="' + key + '" value="' + esc(v) + '"' + (params.getAll(key).includes(v) ? ' checked' : '') + '><span>' + esc(label(v)) + '</span></label>').join('');
 main.innerHTML = '<div class="intro"><span class="eyebrow">DISCOVER THE PEOPLE BEHIND THE WORK</span><h1>Find your next collaborator.</h1><p class="muted">Explore student and alumni talent. Find the skills you need, inspect their work, and start a conversation.</p></div><div class="layout"><form id="filters" class="filters"><label class="field">Search talent<input type="text" name="text" value="' + esc(params.get('text') || '') + '" placeholder="Name, headline or skill"></label><fieldset><legend>Availability</legend>' + checks('availability',['internship','full-time','contract']) + '</fieldset><fieldset><legend>Student status</legend>' + checks('status',['current','alumni']) + '</fieldset><fieldset class="skills"><legend>Skills · match all selected</legend>' + checks('skill',skills) + '</fieldset><button type="submit">Find talent</button> <button type="button" class="secondary" id="clear">Clear all</button></form><section aria-label="Talent results"><div id="count" role="status" aria-live="polite"></div><div id="active" class="active"></div><div id="results" class="grid"></div></section></div>';
 const form = document.querySelector('#filters'); let sequence = 0;
 async function update() {
  const ticket = ++sequence, query = new URLSearchParams(new FormData(form));
  if (!query.get('text')) query.delete('text');
  history.replaceState(null,'','/talent' + (query.size ? '?' + query : ''));
  const active = document.querySelector('#active'); active.innerHTML = '';
  for (const [key,value] of query) {
   const button = document.createElement('button'); button.type='button'; button.textContent=label(value)+' ×'; button.setAttribute('aria-label','Remove '+label(value));
   button.onclick = () => { if (key === 'text') form.elements.text.value=''; else [...form.querySelectorAll('input[type=checkbox]')].find(i => i.name===key && i.value===value).checked=false; update(); }; active.append(button);
  }
  try {
   const ss = await api('/api/students?' + query); if (ticket !== sequence) return;
   document.querySelector('#count').textContent = ss.length + ' people · Skills reflect each person’s expertise';
   document.querySelector('#results').innerHTML = ss.length ? ss.map(s => '<article class="card"><span class="eyebrow">' + esc(label(s.status)) + '</span><h2><a href="/students/' + esc(s.id) + '">' + esc(s.name) + '</a></h2><p>' + esc(s.headline) + '</p><div>' + tags(s.skills) + '</div><p class="muted">' + esc(s.availability.map(label).join(' · ')) + '</p><p>' + s.project_count + ' project' + (s.project_count === 1 ? '' : 's') + ' with evidence</p><a href="/students/' + esc(s.id) + '">View profile →</a></article>').join('') : '<div class="panel"><h2>No matching talent</h2><p>Try fewer skills or clear your filters.</p></div>';
  } catch(e) { if(ticket===sequence) { document.querySelector('#results').innerHTML='<p class="error">' + esc(e.message) + ' Use Find talent to retry.</p>'; document.querySelector('#count').textContent='Results unavailable'; } }
 }
 form.onsubmit = e => { e.preventDefault(); update(); }; form.onchange = e => { if(e.target.type==='checkbox') update(); };
 document.querySelector('#clear').onclick = () => { form.reset(); form.elements.text.value=''; form.querySelectorAll('input[type=checkbox]').forEach(i => i.checked=false); update(); };
 await update();
}
async function student(id) {
 const s = await api('/api/students/' + encodeURIComponent(id)); document.title=s.name+' · ImmXrsive';
 main.innerHTML='<div class="detail"><a class="back" href="/talent">← Talent directory</a><span class="eyebrow"> ' + esc(label(s.status)) + '</span><h1>' + esc(s.name) + '</h1><p>' + esc(s.headline) + '</p><p class="muted">' + esc(s.program) + ' · ' + esc(s.availability.map(label).join(' · ')) + '</p><a class="button" href="' + inquiry('student',s.id) + '">Interested in working with this student</a><section class="panel"><h2>Professional skills</h2>' + tags(s.skills) + '<h3>Professional links</h3>' + links(s.links) + '</section><h2>Project evidence</h2><div class="grid">' + s.projects.map(projectCard).join('') + '</div></div>';
}
async function project(id) {
 const p = await api('/api/projects/' + encodeURIComponent(id)); document.title=p.title+' · ImmXrsive';
 main.innerHTML='<div class="detail"><a class="back" href="/talent">← Talent directory</a><p class="eyebrow">' + esc(p.domain) + '</p><h1>' + esc(p.title) + '</h1><p>' + esc(p.description) + '</p><a class="button" href="' + inquiry('project',p.id) + '">Discuss this project</a><section class="panel"><h2>Contributors & roles</h2>' + p.contributors.map(c => '<p><a href="/students/' + esc(c.student_id) + '">' + esc(c.name) + '</a> · ' + esc(c.role) + '</p>').join('') + '</section><section class="panel"><h2>Project technologies</h2>' + tags(p.technologies) + '<p class="muted">Technologies describe the project. Individual expertise is shown on each contributor’s profile.</p></section><section class="panel"><h2>Public evidence</h2>' + links(p.links) + '<p class="muted">External evidence opens in a new tab. If a link is unavailable, you can still explore this project and its contributors here.</p></section></div>';
}
async function intake() {
 const q = new URLSearchParams(location.search), type=q.get('source_type'), id=q.get('source_id');
 if (!['student','project'].includes(type) || !id) return notFound('Choose a student or project first');
 const s = await api('/api/' + (type==='student' ? 'students' : 'projects') + '/' + encodeURIComponent(id));
 const name=s.name || s.title, url=location.origin + '/' + (type==='student' ? 'students' : 'projects') + '/' + encodeURIComponent(id);
 main.innerHTML='<div class="detail"><a class="back" href="' + esc(url) + '">← Back to ' + esc(name) + '</a><h1>Let’s connect.</h1><p class="notice">Simulated company intake. Your inquiry is saved for this demonstration; no email is sent.</p><section class="panel context"><h2>Inquiry about ' + esc(name) + '</h2><p>Source: ' + esc(type) + ' · ' + esc(id) + '</p><a href="' + esc(url) + '">' + esc(url) + '</a></section><form id="inquiry" class="panel">' + ['company_name','contact_name','contact_email','description'].map(k => '<label class="field">' + ({company_name:'Company name',contact_name:'Contact name',contact_email:'Contact email',description:'Inquiry description'}[k]) + (k==='description' ? '<textarea name="'+k+'" required maxlength="4000"></textarea>' : '<input name="'+k+'" type="'+(k==='contact_email'?'email':'text')+'" required maxlength="4000" autocomplete="'+({company_name:'organization',contact_name:'name',contact_email:'email'}[k])+'">') + '</label>').join('') + '<button>Submit simulated inquiry</button><p id="message" role="status" aria-live="polite"></p></form></div>';
 document.querySelector('#inquiry').onsubmit = async e => {
  e.preventDefault(); const button=e.target.querySelector('button'); button.disabled=true;
  try { const data=Object.fromEntries(new FormData(e.target)); const result=await api('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,source_type:type,source_id:id,source_name:name,source_url:url})}); document.querySelector('#message').textContent=result.message+' Reference: '+result.id; e.target.reset(); }
  catch(error) { document.querySelector('#message').textContent=error.message; }
  finally { button.disabled=false; }
 };
}
(async () => { try { const route=location.pathname.split('/').filter(Boolean); if (!route.length || (route.length===1 && route[0]==='talent')) await directory(); else if(route.length===2 && route[0]==='students') await student(route[1]); else if(route.length===2 && route[0]==='projects') await project(route[1]); else if(route.length===1 && route[0]==='inquiry') await intake(); else notFound('Page not found'); } catch(e) { notFound(e.message); } })();
