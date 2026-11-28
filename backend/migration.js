require('dotenv').config();
const fs = require('node:fs');
const { openStore } = require('./store');

async function importExport(store, source) {
  const rows = [];
  const report = { counts: {}, duplicateStudents: [], brokenReferences: [], unclaimed: [], created: 0, skipped: 0, conflicts: [] };
  const groups = {};
  for (const group of ['students', 'projects', 'companies', 'collaborations']) {
    const items = source[group] ?? [];
    if (!Array.isArray(items)) throw Error('Expected list: ' + group);
    groups[group] = new Map();
    for (const item of items) {
      const id = item.legacy_id ?? item.id;
      if (typeof id !== 'string' || !id || groups[group].has(id)) throw Error('Missing or repeated ID in ' + group);
      groups[group].set(id, item);
    }
    report.counts[group] = items.length;
  }
  function add(kind, id, fields) {
    rows.push([kind, 'import-' + id, JSON.stringify({id: 'import-' + id, ...fields})]);
  }
  function reference(group, id, parent) {
    if (groups[group].has(id)) return 'import-' + id;
    report.brokenReferences.push({parent, group, id});
    return null;
  }
  const emails = new Map();
  for (const [id, s] of groups.students) {
    const email = s.email?.trim().toLowerCase();
    if (email && emails.has(email)) report.duplicateStudents.push({id, candidate: emails.get(email)});
    else {
      if (email) emails.set(email, id);
      if (s.claimed === false) report.unclaimed.push(id);
    }
    const availability = Array.isArray(s.availability) ? s.availability : [s.availability].filter(Boolean);
    const recent = Date.parse(s.availability_confirmed) >= Date.now() - 365 * 86400000;
    add('students', id, {name:s.name, headline:'', status:s.status, profile_status:s.publication, availability:recent ? availability : [], skills:s.skills || [], links:{}, project_ids:[]});
    if (s.legacy_id) add('legacy_student_sources', id, {email:email || null, source_claimed:s.claimed, availability_confirmed:s.availability_confirmed});
  }
  for (const [id, p] of groups.projects) {
    const contributors = [];
    for (const c of p.contributors || []) {
      const student_id = reference('students', c.student_legacy_id ?? c.student_id, id);
      if (student_id) contributors.push({student_id, role:c.role});
    }
    add('projects', id, {title:p.title, description:'', technologies:p.technologies || [], contributors, links:p.repository ? {repository:p.repository} : {}});
  }
  for (const [id, c] of groups.companies) add('r4_companies', id, {name:c.name, website:'', description:'', sector:'', location:'', source_domain:c.domain, published:true});
  for (const [id, c] of groups.collaborations) {
    const company_id = reference('companies', c.company_legacy_id, id);
    const project_ids = (c.project_legacy_ids || []).map(key => reference('projects', key, id)).filter(Boolean);
    if (company_id) add('r4_collaborations', id, {title:c.title, company_id, project_ids, student_ids:[], year:'', status:c.status, visibility:['public','limited'].includes(c.visibility) ? c.visibility : 'private', description:'', outcome:'', public_summary:''});
  }
  if (!rows.length) return report;
  const placeholders = rows.map((_, n) => '(' + [1,2,3].map(i => '$' + (n*3+i)).join(',') + ')');
  const inserted = await store.query('INSERT INTO records(kind,id,payload) VALUES ' + placeholders.join(',') + ' ON CONFLICT(kind,id) DO NOTHING RETURNING kind,id', rows.flat());
  report.created = inserted.length;
  const keys = new Set(inserted.map(r => r.kind + '/' + r.id));
  for (const kind of new Set(rows.map(r => r[0]))) {
    const saved = new Map((await store.list(kind)).map(r => [r.id, JSON.stringify(r)]));
    for (const [type, id, payload] of rows) {
      if (type !== kind || keys.has(kind + '/' + id)) continue;
      if (saved.get(id) === payload) report.skipped++;
      else report.conflicts.push({kind,id});
    }
  }
  return report;
}

if (require.main === module) (async () => {
  const source = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const store = await openStore();
  try { console.log(JSON.stringify(await importExport(store, source), null, 2)); }
  finally { await store.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = {importExport};
