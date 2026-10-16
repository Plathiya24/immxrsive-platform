const { randomUUID } = require('node:crypto');
const availabilityValues = ['internship','full-time','contract'];
const themes = ['ocean','forest','sunset'];
const sections = ['about','education','experience','links'];
function publicProfile(s) {
 if (!s.owner_id) return s;
 const result = {};
 for (const k of ['id','name','headline','biography','program','status','skills','education','experience','location','theme','section_order','profile_status']) result[k] = s[k];
 result.availability = s.visibility.availability ? s.availability : [];
 result.links = s.visibility.links ? s.links : {};
 return result;
}
function newProfile(user) {
 return {id:'R2-'+user.id,owner_id:user.id,name:user.display_name,headline:'',biography:'',program:'',status:'current',availability:[],skills:[],links:{github:'https://github.com/'+encodeURIComponent(user.github_login)},education:'',experience:'',location:'',profile_status:'draft',theme:'ocean',section_order:[...sections],visibility:{availability:true,links:false}};
}
function validateProfile(body,existing,skills) {
 const result={...existing};
 const fields={name:120,headline:200,biography:6000,program:200,education:8000,experience:10000,location:200};
 for (const [key,max] of Object.entries(fields)) if (Object.hasOwn(body,key)) {
  if(typeof body[key]!=='string'||body[key].length>max) throw new Error(key+' must be text of at most '+max+' characters.');
  result[key]=body[key].trim();
 }
 if (!result.name) throw new Error('Name is required.');
 for (const [key,allowed] of [['skills',skills],['availability',availabilityValues]]) if(Object.hasOwn(body,key)) {
  if(!Array.isArray(body[key])||body[key].some(v=>!allowed.includes(v))) throw new Error('Choose '+key+' from the available choices.');
  result[key]=[...new Set(body[key])];
 }
 if(Object.hasOwn(body,'links')) {
  if(!body.links||typeof body.links!=='object'||Array.isArray(body.links)) throw new Error('Professional links must be valid web addresses.');
  const links={};
  for(const [k,v] of Object.entries(body.links)) {
   if(!['github','linkedin','portfolio'].includes(k)||typeof v!=='string'||v.length>1000) throw new Error('Use the provided professional link fields.');
   if(!v.trim()) continue;
   let url;try {url=new URL(v.trim());}catch {throw new Error(k+': enter a full https:// or http:// address.');}
   if(!['https:','http:'].includes(url.protocol)||url.username||url.password) throw new Error(k+': use a public web address without credentials.');
   links[k]=url.href;
  }
  result.links=links;
 }
 if(Object.hasOwn(body,'visibility')) {
  if(!body.visibility||typeof body.visibility.availability!=='boolean'||typeof body.visibility.links!=='boolean') throw new Error('Choose the visibility of availability and professional links.');
  result.visibility={availability:body.visibility.availability,links:body.visibility.links};
 }
 if(Object.hasOwn(body,'theme')) {if(!themes.includes(body.theme))throw new Error('Choose an available theme.');result.theme=body.theme;}
 if(Object.hasOwn(body,'section_order')) {
  if(!Array.isArray(body.section_order)||body.section_order.length!==sections.length||new Set(body.section_order).size!==sections.length||body.section_order.some(v=>!sections.includes(v)))throw new Error('Each portfolio section must occur exactly once.');
  result.section_order=body.section_order;
 }
 return result;
}
module.exports={publicProfile,newProfile,validateProfile,themes,sections};
