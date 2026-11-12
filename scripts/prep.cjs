const a=process.argv[2];if(!['admin','student'].includes(a))throw Error('app?');
require('fs').writeFileSync('capacitor.config.json',JSON.stringify({appId:'bd.pro.sabujcomputers.'+(a==='admin'?'admin':'hub'),appName:a==='admin'?'SCTC Resources Hub Admin':'SCTC Resources Hub',webDir:'dist',
plugins:{FirebaseMessaging:{presentationOptions:['badge','sound','alert']},FirebaseAuthentication:{skipNativeAuth:true,providers:['google.com']}}},null,2));
