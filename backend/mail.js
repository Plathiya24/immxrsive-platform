const nodemailer=require('nodemailer');
function configured(){return !!((process.env.BREVO_API_KEY&&process.env.MAIL_FROM)||(process.env.RESEND_API_KEY&&process.env.MAIL_FROM)||process.env.SMTP_HOST);}
async function sendVerification(mail){
 if(process.env.BREVO_API_KEY){
  const response=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':process.env.BREVO_API_KEY,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({sender:{name:'ImmXrsive Team 03',email:process.env.MAIL_FROM},to:[{email:mail.to}],subject:mail.subject,textContent:mail.text}),signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error('Email delivery failed.');return;
 }
 if(process.env.RESEND_API_KEY){
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.MAIL_FROM,to:[mail.to],subject:mail.subject,text:mail.text}),signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error('Email delivery failed.');return;
 }
 await nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT)||587,secure:process.env.SMTP_SECURE==='true',auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}:undefined,connectionTimeout:15000,socketTimeout:20000}).sendMail(mail);
}
module.exports={configured,sendVerification};
