const session=require('express-session');
const crypto=require('node:crypto');
const multer=require('multer');
const mailDelivery=require('./mail');
const {newProfile,validateProfile,publicProfile}=require('./profile');
const {parseResume}=require('./resume');
const digest=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
async function mountSelfService(app,store,options={}) {
 const origin=process.env.PUBLIC_ORIGIN||'http://localhost:3001';
 const secure=origin.startsWith('https://');
 if(secure&&!process.env.SESSION_SECRET)throw new Error('SESSION_SECRET is required for HTTPS deployment.');
 app.set('trust proxy',1);
 await store.query('CREATE TABLE IF NOT EXISTS r2_users (id TEXT PRIMARY KEY, github_id TEXT UNIQUE NOT NULL, github_login TEXT NOT NULL, display_name TEXT NOT NULL, verified_email TEXT UNIQUE)');
 await store.query('CREATE TABLE IF NOT EXISTS r2_sessions (id TEXT PRIMARY KEY, payload TEXT NOT NULL, expires_at TEXT NOT NULL)');
 await store.query('CREATE TABLE IF NOT EXISTS r2_challenges (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, email TEXT NOT NULL, code_hash TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, used_at TEXT)');
 class PersistentSessions extends session.Store {
  get(sid,cb){store.query('SELECT payload FROM r2_sessions WHERE id=$1 AND expires_at>$2',[digest(sid),new Date().toISOString()]).then(rows=>cb(null,rows[0]?JSON.parse(rows[0].payload):null),cb);}
  set(sid,value,cb){store.query('INSERT INTO r2_sessions (id,payload,expires_at) VALUES ($1,$2,$3) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,expires_at=excluded.expires_at',[digest(sid),JSON.stringify(value),new Date(value.cookie.expires||Date.now()+86400000).toISOString()]).then(()=>cb?.(),cb);}
  destroy(sid,cb){store.query('DELETE FROM r2_sessions WHERE id=$1',[digest(sid)]).then(()=>cb?.(),cb);}
 }
 app.use(session({name:'immx.sid',secret:process.env.SESSION_SECRET||crypto.randomBytes(32).toString('hex'),store:new PersistentSessions(),resave:false,saveUninitialized:false,cookie:{httpOnly:true,secure,sameSite:'lax',maxAge:86400000}}));
 app.use(async(req,res,next)=>{try {if(req.session.userId)req.user=(await store.query('SELECT * FROM r2_users WHERE id=$1',[req.session.userId]))[0];next();}catch(e){next(e);}});
 app.use(['/api/me','/api/profile','/api/verification','/api/resume'],(req,res,next)=>{res.set('Cache-Control','no-store');next();});
 const login=(req,res,next)=>req.user?next():res.status(401).json({error:'Sign in with GitHub first.'});
 const verified=(req,res,next)=>req.user?.verified_email?next():res.status(403).json({error:'Verify your Algoma student email before maintaining a profile.'});
 const csrf=(req,res,next)=>{
  if(req.get('origin')&&req.get('origin')!==origin)return res.status(403).json({error:'Request origin is not permitted.'});
  if(!req.session.csrf||req.get('X-CSRF-Token')!==req.session.csrf)return res.status(403).json({error:'Your session changed. Reload the page and try again.'});next();
 };
 const findProfile=async userId=>(await store.list('students')).find(p=>p.owner_id===userId);
 const saveProfile=async p=>store.query('INSERT INTO records (kind,id,payload) VALUES ($1,$2,$3) ON CONFLICT(kind,id) DO UPDATE SET payload=excluded.payload',['students',p.id,JSON.stringify(p)]);
 const checkOwner=async(req,res,next)=>{
  const profile=await findProfile(req.user.id);
  if(!profile)return res.status(404).json({error:'Create your private draft first.'});
  const requested=req.params.id||req.body?.profile_id;
  if((requested&&requested!==profile.id)||(req.body?.owner_id&&req.body.owner_id!==req.user.id)||(req.body?.user_id&&req.body.user_id!==req.user.id))return res.status(403).json({error:'You can only change your own profile.'});
  req.profile=profile;next();
 };
 app.get('/api/me',async(req,res)=>{const pending=req.user&&!req.user.verified_email?(await store.query('SELECT id FROM r2_challenges WHERE user_id=$1 AND used_at IS NULL AND expires_at>$2 AND attempts<5 ORDER BY created_at DESC LIMIT 1',[req.user.id,new Date().toISOString()]))[0]:null;req.session.csrf ||= crypto.randomBytes(24).toString('hex');res.json({pending_challenge_id:pending?.id||null,user:req.user?{id:req.user.id,name:req.user.display_name,github_login:req.user.github_login,verified:!!req.user.verified_email}:null,csrf:req.session.csrf,github_configured:!!(process.env.GITHUB_CLIENT_ID&&process.env.GITHUB_CLIENT_SECRET),verification_delivery_configured:mailDelivery.configured(),approved_domains:(process.env.APPROVED_EMAIL_DOMAINS||'algomau.ca').split(',').map(s=>s.trim().toLowerCase()),verification_expiry_minutes:Math.min(30,Math.max(1,Number(process.env.VERIFICATION_TTL_MINUTES)||15)),resume_policy:'Original PDFs are held in memory during extraction and discarded; there is no resume download endpoint.'});});
 app.get('/auth/github',(req,res)=>{
  if(!process.env.GITHUB_CLIENT_ID||!process.env.GITHUB_CLIENT_SECRET)return res.status(503).send('GitHub sign-in is not configured. Please contact the team.');
  req.session.oauth={state:crypto.randomBytes(24).toString('hex'),verifier:crypto.randomBytes(32).toString('base64url'),expires:Date.now()+600000};
  const query=new URLSearchParams({client_id:process.env.GITHUB_CLIENT_ID,redirect_uri:origin+'/auth/github/callback',scope:'read:user',state:req.session.oauth.state,code_challenge:crypto.createHash('sha256').update(req.session.oauth.verifier).digest('base64url'),code_challenge_method:'S256'});
  req.session.save(error=>error?res.status(503).send('Unable to start sign-in.'):res.redirect('https://github.com/login/oauth/authorize?'+query));
 });
 const establishSession=async(req,user)=>new Promise((resolve,reject)=>req.session.regenerate(error=>{if(error)return reject(error);req.session.userId=user.id;req.session.csrf=crypto.randomBytes(24).toString('hex');req.session.save(error=>error?reject(error):resolve());}));
 app.get('/auth/github/callback',async(req,res)=>{
  const state=req.session.oauth;delete req.session.oauth;
  if(!state||state.expires<Date.now()||typeof req.query.state!=='string'||digest(req.query.state)!==digest(state.state)||typeof req.query.code!=='string')return res.status(400).send('Sign-in could not be verified. Return to /studio and try again.');
  try {
   const tokenResponse=await (options.githubFetch||fetch)('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:process.env.GITHUB_CLIENT_ID,client_secret:process.env.GITHUB_CLIENT_SECRET,code:req.query.code,redirect_uri:origin+'/auth/github/callback',code_verifier:state.verifier}),signal:AbortSignal.timeout(15000)});
   const token=await tokenResponse.json();if(!tokenResponse.ok||!token.access_token)throw new Error('Sign-in was declined.');
   const response=await (options.githubFetch||fetch)('https://api.github.com/user',{headers:{Authorization:'Bearer '+token.access_token,Accept:'application/vnd.github+json','User-Agent':'immxrsive-platform'},signal:AbortSignal.timeout(15000)});
   const account=await response.json();if(!response.ok||!Number.isSafeInteger(account.id)||!account.login)throw new Error('GitHub account could not be read.');
   await store.query('INSERT INTO r2_users (id,github_id,github_login,display_name) VALUES ($1,$2,$3,$4) ON CONFLICT(github_id) DO UPDATE SET github_login=excluded.github_login,display_name=excluded.display_name',[crypto.randomUUID(),String(account.id),account.login,account.name||account.login]);
   const user=(await store.query('SELECT * FROM r2_users WHERE github_id=$1',[String(account.id)]))[0];await establishSession(req,user);res.redirect('/studio');
  }catch {res.status(502).send('GitHub sign-in could not complete. Return to /studio and try again.');}
 });
 // Dependency injection is available only to an in-process automated test; no test-login HTTP route exists.
 if(options.testLogin)app.post('/__test/session',async(req,res)=>{await establishSession(req,await options.testLogin(req.body));res.json({ok:true});});
 app.post('/api/logout',login,csrf,(req,res)=>req.session.destroy(()=>{res.clearCookie('immx.sid',{secure,httpOnly:true,sameSite:'lax'});res.json({ok:true});}));
 app.post('/api/verification/request',login,csrf,async(req,res)=>{
  if(req.user.verified_email)return res.status(409).json({error:'Your affiliation is already verified.'});
  const email=typeof req.body.email==='string'?req.body.email.trim().toLowerCase():'';
  const domains=(process.env.APPROVED_EMAIL_DOMAINS||'algomau.ca').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  if(email.length>254||!/^[^\s@]+@[^\s@]+$/.test(email)||!domains.includes(email.slice(email.lastIndexOf('@')+1)))return res.status(400).json({error:'Use your student email at '+domains.join(' or ')+'.'});
  if((await store.query('SELECT id FROM r2_users WHERE verified_email=$1',[email])).length)return res.status(409).json({error:'That email is already verified for another account.'});
  const since=new Date(Date.now()-600000).toISOString();
  const recent=await store.query('SELECT id FROM r2_challenges WHERE created_at>$1 AND (user_id=$2 OR email=$3)',[since,req.user.id,email]);
  if(recent.length>=3)return res.status(429).json({error:'Too many verification requests. Wait 10 minutes before trying again.'});
  if(!mailDelivery.configured()&&!options.sendMail)return res.status(503).json({error:'Email delivery is not configured. Your profile has not been verified. Please contact the team.'});
  const ttl=Math.min(30,Math.max(1,Number(process.env.VERIFICATION_TTL_MINUTES)||15));
  const id=crypto.randomUUID(),code=String(crypto.randomInt(100000,1000000)),now=new Date().toISOString();
  await store.query('UPDATE r2_challenges SET used_at=$1 WHERE user_id=$2 AND used_at IS NULL',[now,req.user.id]);
  await store.query('INSERT INTO r2_challenges (id,user_id,email,code_hash,expires_at,created_at,attempts) VALUES ($1,$2,$3,$4,$5,$6,$7)',[id,req.user.id,email,digest(id+':'+code),new Date(Date.now()+ttl*60000).toISOString(),now,0]);
  try {
   const mail={from:process.env.SMTP_FROM,to:email,subject:'Verify your ImmXrsive student affiliation',text:'Your ImmXrsive verification code is '+code+'. It expires in '+ttl+' minutes and can be used once. Enter it only in the session where you requested verification. If you did not request this, ignore this message.'};
   if(options.sendMail)await options.sendMail(mail);else await mailDelivery.sendVerification(mail);
   res.json({challenge_id:id,message:'Verification email sent. Enter the six-digit code within '+ttl+' minutes. Requesting a new code invalidates the previous one.'});
  }catch {await store.query('UPDATE r2_challenges SET used_at=$1 WHERE id=$2',[new Date().toISOString(),id]);res.status(502).json({error:'We could not deliver the email. Please check the address and try later; affiliation has not been granted.'});}
 });
 app.post('/api/verification/confirm',login,csrf,async(req,res)=>{
  const id=String(req.body.challenge_id||''),code=String(req.body.code||'');
  const challenge=(await store.query('SELECT * FROM r2_challenges WHERE id=$1 AND user_id=$2',[id,req.user.id]))[0];
  if(!challenge||challenge.used_at||challenge.expires_at<=new Date().toISOString())return res.status(400).json({error:'Code is invalid, expired, or already used. Request a new verification email.'});
  if(challenge.attempts>=5)return res.status(429).json({error:'Too many incorrect attempts. Request a new code, or wait if the request limit was reached.'});
  await store.query('UPDATE r2_challenges SET attempts=attempts+1 WHERE id=$1',[id]);
  if(digest(id+':'+code)!==challenge.code_hash)return res.status(400).json({error:'Incorrect code. Check the email; at most five attempts are allowed per code.'});
  const consumed=await store.query('UPDATE r2_challenges SET used_at=$1 WHERE id=$2 AND used_at IS NULL AND expires_at>$3 AND attempts<=5 RETURNING id',[new Date().toISOString(),id,new Date().toISOString()]);
  if(!consumed.length)return res.status(400).json({error:'This code is no longer valid. Request a new email.'});
  try {await store.query('UPDATE r2_users SET verified_email=$1 WHERE id=$2',[challenge.email,req.user.id]);}catch {return res.status(409).json({error:'This email is already linked to another verified account.'});}
  res.json({verified:true,message:'Algoma affiliation verified. You can now create a private profile.'});
 });
 app.get('/api/profile',login,verified,async(req,res)=>res.json({profile:await findProfile(req.user.id)||null}));
 app.post('/api/profile',login,verified,csrf,async(req,res)=>{
  if(req.body.owner_id||req.body.user_id||req.body.profile_id)return res.status(403).json({error:'Create a profile for the signed-in account only.'});
  let p=await findProfile(req.user.id);if(!p){p=newProfile(req.user);await saveProfile(p);}res.status(201).json({profile:p});
 });
 const update=async(req,res)=>{try {const p=validateProfile(req.body,req.profile,await store.list('skills'));await saveProfile(p);res.json({profile:p,message:'Profile saved.'});}catch(e){res.status(400).json({error:e.message});}};
 app.put(['/api/profile','/api/profile/:id'],login,verified,csrf,checkOwner,update);
 app.get('/api/profile/preview',login,verified,async(req,res)=>{const p=await findProfile(req.user.id);if(!p)return res.status(404).json({error:'Create a draft first.'});res.json({profile:publicProfile(p),private_fields:Object.entries(p.visibility).filter(([k,v])=>!v).map(([k])=>k),resume_policy:'Original PDFs are discarded after extraction.'});});
 const publication=publish=>async(req,res)=>{if(publish&&(!req.profile.headline||!req.profile.skills.length))return res.status(400).json({error:'Add a headline and at least one standardized skill before publishing.'});const p={...req.profile,profile_status:publish?'published':'draft'};await saveProfile(p);res.json({profile:p,message:publish?'Published. Your profile is now in the public directory.':'Unpublished. Your maintained profile is still saved privately.'});};
 app.post(['/api/profile/publish','/api/profile/:id/publish'],login,verified,csrf,checkOwner,publication(true));
 app.post(['/api/profile/unpublish','/api/profile/:id/unpublish'],login,verified,csrf,checkOwner,publication(false));
 const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1,fields:0}}).single('resume');
 app.post('/api/resume/import',login,verified,csrf,(req,res)=>upload(req,res,async error=>{
  if(error)return res.status(400).json({error:'Upload one PDF of at most 5 MB. Existing profile work is unchanged.'});
  if(!req.file)return res.status(400).json({error:'Choose a PDF to import.'});
  try {res.json(await parseResume(req.file.buffer,await store.list('skills')));}catch {res.status(422).json({error:'We could not extract useful text from this PDF. Try a text-based PDF, or keep editing manually. Existing profile work is unchanged.'});}
  finally {if(req.file?.buffer)req.file.buffer.fill(0);}
 }));
 return {findProfile,saveProfile};
}
module.exports={mountSelfService};
