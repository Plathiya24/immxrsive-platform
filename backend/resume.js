const { PDFParse } = require('pdf-parse');
function extractCandidates(text,standardSkills) {
 const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!/^-- \d+ of \d+ --$/.test(s));
 const literal=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const skills=standardSkills.filter(skill=>new RegExp('(?<![\\p{L}\\p{N}])'+literal(skill)+'(?![\\p{L}\\p{N}])','iu').test(text));
 const headings=/^(education|skills|experience|work experience|employment|projects|links|contact|summary|about|interests?|note from resume author)(?:\s*:|$)/i;
 function section(name) {
  const out=[];let active=false;
  for(const line of lines) {
   const m=line.match(headings);
   if(m) {active=name.test(m[1]);if(active&&line.includes(':'))out.push(line.slice(line.indexOf(':')+1).trim());continue;}
   if(active)out.push(line);
  }
  return out.join('\n').slice(0,8000);
 }
 const links=[...new Set((text.match(/(?:https?:\/\/)?(?:www\.)?(?:github\.com|linkedin\.com|[a-z0-9.-]+\.(?:com|org|dev|io))\/[^\s|<>]+/gi)||[]).map(v=>v.replace(/[.,;)]+$/,'')).map(v=>/^https?:\/\//i.test(v)?v:'https://'+v))];
 const skillLine=lines.filter(l=>/^skills\s*:/i.test(l)).map(l=>l.slice(l.indexOf(':')+1));
 let inSkills=false;for(const line of lines){if(/^skills$/i.test(line)){inSkills=true;continue;}if(headings.test(line))inSkills=false;else if(inSkills)skillLine.push(line);}
 const unknown=skillLine.join(',').split(/[,|;]/).map(s=>s.trim()).filter(s=>s&&!standardSkills.some(k=>k.toLowerCase()===s.toLowerCase()));
 return {skills,education:section(/^education$/i),experience:section(/^(experience|work experience|employment)$/i),links,unmatched_skills:[...new Set(unknown)].slice(0,30),notice:'Suggestions only. Check the extracted text, edit or reject each field, then explicitly apply your selections. The original PDF is discarded after extraction.'};
}
async function parseResume(buffer,skills) {
 if(buffer.subarray(0,5).toString()!=='%PDF-')throw new Error('Choose a valid PDF file.');
 const parser=new PDFParse({data:new Uint8Array(buffer)});
 try {
  const result=await parser.getText();
  if(result.total>20)throw new Error('Use a resume of 20 pages or fewer.');
  const text=result.text.slice(0,100000),candidates=extractCandidates(text,skills);
  return {...candidates,text_excerpt:text.slice(0,15000),useful:!!(candidates.skills.length||candidates.education||candidates.experience||candidates.links.length)};
 } finally {await parser.destroy();}
}
module.exports={extractCandidates,parseResume};
