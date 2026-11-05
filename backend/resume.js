const { PDFParse } = require('pdf-parse');
function extractCandidates(text,standardSkills) {
 const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!/^-- \d+ of \d+ --$/.test(s));
 const literal=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const skills=standardSkills.filter(skill=>new RegExp('(?<![\\p{L}\\p{N}])'+literal(skill)+'(?![\\p{L}\\p{N}])','iu').test(text));
 const headings=/^(education(?: and qualifications)?|(?:technical |professional |core )?skills|(?:relevant |professional |work |employment )?experience|employment(?: history)?|(?:selected |academic |personal )?projects|links|contact(?: information)?|(?:professional )?summary|about|interests?|certifications?|awards|publications|volunteer(?:ing)?|languages|references|note from resume author)(?:\s*:|$)/i;
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
 const skillHeading=/^(?:(?:technical|professional|core) )?skills$/i;
 const skillLine=[];let inSkills=false;for(const line of lines){const h=line.match(headings);if(h){inSkills=skillHeading.test(h[1]);if(inSkills&&line.includes(':'))skillLine.push(line.slice(line.indexOf(':')+1));}else if(inSkills)skillLine.push(line);}
 const unknown=skillLine.join(',').split(/[,|;]/).map(s=>s.trim()).filter(s=>s&&!standardSkills.some(k=>k.toLowerCase()===s.toLowerCase()));
 return {skills,education:section(/^education/i),experience:section(/experience$|^employment/i),links,unmatched_skills:[...new Set(unknown)].slice(0,30),notice:'Suggestions only. Check the extracted text, edit or reject each field, then explicitly apply your selections. The original PDF is discarded after extraction.'};
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
