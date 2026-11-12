import {initializeApp} from 'firebase/app';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,signOut,GoogleAuthProvider,signInWithPopup,signInWithCredential} from 'firebase/auth';
import {initializeFirestore,persistentLocalCache,collection,doc,setDoc,getDoc,getDocs,addDoc,updateDoc,deleteDoc,deleteField,onSnapshot,query,where,serverTimestamp,Timestamp,getCountFromServer} from 'firebase/firestore';
import {Capacitor} from '@capacitor/core';
import {App as CapApp} from '@capacitor/app';
import {FirebaseMessaging} from '@capacitor-firebase/messaging';
import {FirebaseAuthentication} from '@capacitor-firebase/authentication';
import '@fontsource/inter/latin-400.css';import '@fontsource/inter/latin-600.css';import '@fontsource/inter/latin-700.css';
import '@fontsource/hind-siliguri/bengali-400.css';import '@fontsource/hind-siliguri/bengali-600.css';import '@fontsource/hind-siliguri/bengali-700.css';
import './style.css';

const fb=initializeApp({apiKey:"AIzaSyC04mr-q_WDGmaoiM-Pab2tWYDkxAFiby4",authDomain:"notification-1e6e5.firebaseapp.com",projectId:"notification-1e6e5",storageBucket:"notification-1e6e5.firebasestorage.app",messagingSenderId:"871534419453",appId:"1:871534419453:web:aaf8e899eb4877b9dbcd94"});
const auth=getAuth(fb),db=initializeFirestore(fb,{localCache:persistentLocalCache()});
const native=Capacitor.isNativePlatform(),ADMIN=import.meta.env.VITE_APP==='admin';
const BUILD=+import.meta.env.VITE_BUILD||0,REPO=import.meta.env.VITE_REPO||'';
const NAME=ADMIN?'SCTC Admin':'SCTC Resources Hub';
const HOME=ADMIN?'send':'home';

/* ---------- storage helpers, theme ---------- */
const jget=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||d)}catch{return JSON.parse(d)}};
const jset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
let theme=jget('theme','"light"');if(!['light','dark','auto'].includes(theme))theme='light';
const mq=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):null;
const applyTheme=()=>document.documentElement.toggleAttribute('data-dark',theme==='dark'||(theme==='auto'&&!!mq&&mq.matches));
applyTheme();if(mq&&mq.addEventListener)mq.addEventListener('change',applyTheme);
let lang=jget('lang','"bn"');if(lang!=='en')lang='bn';

/* ---------- translations [English, Bangla] ---------- */
const D={
tag:['Learn · Connect · Stay Updated','শিখুন · যুক্ত থাকুন · আপডেট পান'],foot:['Sabuj Computer Training Center · Tomaltola, Natore','সবুজ কম্পিউটার ট্রেনিং সেন্টার · তমালতলা, নাটোর'],
signIn:['Sign in','সাইন ইন'],signUp:['Sign up','সাইন আপ'],createAcc:['Create account','অ্যাকাউন্ট খুলুন'],adminIn:['Admin sign in','অ্যাডমিন সাইন ইন'],
email:['Email','ইমেইল'],password:['Password','পাসওয়ার্ড'],fullName:['Full name','পুরো নাম'],forgot:['Forgot password?','পাসওয়ার্ড ভুলে গেছেন?'],
google:['Continue with Google','Google দিয়ে চালিয়ে যান'],or:['or','অথবা'],chooseRole:['I am a','আমি একজন'],
student:['Student','শিক্ষার্থী'],customer:['Customer','গ্রাহক'],studentHint:['Enrolled in a course','কোর্সে ভর্তি আছি'],customerHint:['Services & updates','সেবা ও আপডেট চাই'],
enterEmail:['Enter your email first','আগে ইমেইল লিখুন'],resetSent:['Password reset link sent','পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে'],notAdmin:['This account is not an admin','এই অ্যাকাউন্টটি অ্যাডমিন নয়'],
offline:['Connect to the internet once to sign in.','সাইন ইন করতে একবার ইন্টারনেট চালু করুন।'],offBanner:['You are offline. Showing saved data.','আপনি অফলাইনে আছেন। সংরক্ষিত তথ্য দেখাচ্ছে।'],
home:['Home','হোম'],jobs:['Jobs','চাকরি'],profile:['Profile','প্রোফাইল'],send:['Send','পাঠান'],posts:['Posts','পোস্ট'],fees:['Fees','ফি'],users:['Users','ইউজার'],settings:['Settings','সেটিংস'],
hi:['Hello','হ্যালো'],unread:['unread','নতুন'],dueTitle:['Fee due','বকেয়া ফি'],dueHint:['Please pay as soon as possible','অনুগ্রহ করে দ্রুত পরিশোধ করুন'],
search:['Search…','খুঁজুন…'],all:['All','সব'],saved:['Saved','সংরক্ষিত'],bm:['Save','সংরক্ষণ'],share:['Share','শেয়ার'],copied:['Copied','কপি হয়েছে'],
noPosts:['No announcements yet','এখনো কোনো ঘোষণা নেই'],noJobs:['No job circulars right now','এখন কোনো চাকরির বিজ্ঞপ্তি নেই'],back:['Back','পিছনে'],isNew:['NEW','নতুন'],expired:['Expired','মেয়াদ শেষ'],
deadline:['Deadline','শেষ তারিখ'],
myProfile:['My profile','আমার প্রোফাইল'],completeProfile:['Complete your profile','প্রোফাইল সম্পূর্ণ করুন'],name:['Name','নাম'],mobile:['Mobile number','মোবাইল নম্বর'],village:['Village','গ্রাম'],address:['Address / Village (optional)','ঠিকানা / গ্রাম (ঐচ্ছিক)'],
photo:['Photo','ছবি'],photoHint:['Add a clear photo so we can recognise you','সহজে চেনার জন্য একটি পরিষ্কার ছবি দিন'],batch:['Batch / Course','ব্যাচ / কোর্স'],
studentNote:['Use the same mobile number and name you gave at admission, plus your village name. Tell sir whenever anything needs to change.','ভর্তির সময় যে মোবাইল নম্বর ও নাম দিয়েছিলেন সেটিই দিন, সাথে গ্রামের নাম। কিছু পরিবর্তন করতে হলে স্যারকে জানান।'],
customerNote:['Add your mobile number so we can reach you about our services and offers.','আমাদের সেবা ও অফার সম্পর্কে জানাতে আপনার মোবাইল নম্বর দিন।'],
saveForm:['Save','সেভ করুন'],signOut:['Sign out','সাইন আউট'],callUs:['Call us','কল করুন'],whatsapp:['WhatsApp','হোয়াটসঅ্যাপ'],savedOk:['Saved ✓','সেভ হয়েছে ✓'],version:['Version','ভার্সন'],
upd:['New version available. Tap to download','নতুন ভার্সন এসেছে। ডাউনলোড করতে ট্যাপ করুন'],
appearance:['Appearance','চেহারা'],theme:['Theme','থিম'],themeLight:['Light','লাইট'],themeDark:['Dark','ডার্ক'],themeAuto:['System','সিস্টেম'],language:['Language','ভাষা'],
newAnn:['New announcement','নতুন ঘোষণা'],editAnn:['Edit announcement','ঘোষণা এডিট'],sendTo:['Send to','কাকে পাঠাবেন'],type:['Type','ধরন'],
allStudents:['All students','সকল শিক্ষার্থী'],allCustomers:['All customers','সকল গ্রাহক'],everyone:['Everyone','সবাই'],batchOpt:['A batch / course…','নির্দিষ্ট ব্যাচ / কোর্স…'],peopleOpt:['Specific people…','নির্দিষ্ট ব্যক্তি…'],ppl:['people','জন'],
noBatch:['No batches yet (set one in Users tab)','কোনো ব্যাচ নেই (Users ট্যাবে সেট করুন)'],noUsers:['No users yet','এখনো কোনো ইউজার নেই'],
title:['Title','শিরোনাম'],message:['Message','বার্তা'],msgPh:['Links typed here become tappable','এখানে লেখা লিংক ক্লিকযোগ্য হবে'],
cover:['Cover image (shows big in the notification and the app)','কভার ছবি (নোটিফিকেশন ও অ্যাপে বড় করে দেখাবে)'],links:['Links (optional)','লিংক (ঐচ্ছিক)'],btnName:['Button name','বাটনের নাম'],addLink:['+ Add another link','+ আরেকটি লিংক'],
attach:['Attach PDF or images (up to 5, max 10 MB each)','PDF বা ছবি যুক্ত করুন (৫টি পর্যন্ত, প্রতিটি সর্বোচ্চ ১০ MB)'],schedule:['Schedule (optional, empty = send now)','শিডিউল (ঐচ্ছিক, খালি = এখনই)'],
pin:['Pin to top','উপরে পিন করুন'],pushOpt:['Send phone notification (works when the app is closed)','ফোনে নোটিফিকেশন পাঠান (অ্যাপ বন্ধ থাকলেও আসবে)'],
sendBtn:['Send','পাঠান'],saveChanges:['Save changes','পরিবর্তন সেভ করুন'],cancelEdit:['Cancel edit','এডিট বাতিল'],working:['Working…','অপেক্ষা করুন…'],
holFrom:['From date','শুরুর তারিখ'],holTo:['to (optional)','শেষ (ঐচ্ছিক)'],orgLbl:['Organization / company','প্রতিষ্ঠান / কোম্পানি'],dl:['Deadline / valid until','শেষ তারিখ / মেয়াদ'],
remind:['Auto-remind one day before (9:00 AM)','একদিন আগে সকাল ৯টায় অটো রিমাইন্ডার'],reminder:['Reminder','রিমাইন্ডার'],tomorrow:['Starts / ends tomorrow.','আগামীকাল।'],
errCloud:['Cloudinary is not set up (Settings)','Cloudinary সেটআপ করা নেই (সেটিংস)'],errWorker:['Worker URL missing (Settings)','Worker URL নেই (সেটিংস)'],errMax5:['Max 5 attachments','সর্বোচ্চ ৫টি ফাইল'],errBig:['is over 10 MB','১০ MB এর বেশি'],
errFuture:['Schedule time must be in the future','শিডিউলের সময় ভবিষ্যতের হতে হবে'],errSel:['Select at least one person','অন্তত একজন বাছাই করুন'],errMax40:['Select max 40 people','সর্বোচ্চ ৪০ জন বাছাই করুন'],errBatch:['Choose a batch','একটি ব্যাচ বাছাই করুন'],
sentOk:['Sent ✓','পাঠানো হয়েছে ✓'],schedOk:['Scheduled ✓','শিডিউল হয়েছে ✓'],remSet:[' + reminder set',' + রিমাইন্ডার সেট'],remLate:[' (reminder time already passed)',' (রিমাইন্ডারের সময় পার হয়ে গেছে)'],
edit:['Edit','এডিট'],resend:['Resend','আবার পাঠান'],pinBtn:['Pin','পিন'],unpin:['Unpin','আনপিন'],del:['Delete','মুছুন'],delConfirm:['Delete this announcement?','এই ঘোষণা মুছে ফেলবেন?'],
feeTitle:['Fee due reminder','বকেয়া ফি রিমাইন্ডার'],feeHint:["Set each student's due in the Users tab. {name} and {due} are filled in automatically. Max 40 at a time.",'Users ট্যাবে প্রতিটি শিক্ষার্থীর বকেয়া সেট করুন। {name} ও {due} নিজে থেকেই বসে যাবে। একসাথে সর্বোচ্চ ৪০ জন।'],
feeMsg:['Dear {name}, your course fee ৳{due} is due. Please pay as soon as possible.','প্রিয় {name}, আপনার কোর্স ফি ৳{due} বাকি আছে। অনুগ্রহ করে দ্রুত পরিশোধ করুন।'],
noDue:['No student has fee due','কারো বকেয়া নেই'],sendFee:['Send reminder to selected','নির্বাচিতদের রিমাইন্ডার পাঠান'],remSent:['Reminders sent','রিমাইন্ডার পাঠানো হয়েছে'],selStu:['Select at least one student','অন্তত একজন শিক্ষার্থী বাছাই করুন'],
stu:['students','শিক্ষার্থী'],cus:['customers','গ্রাহক'],totalDue:['total due','মোট বকেয়া'],searchUsers:['Search name, mobile, village…','নাম, মোবাইল, গ্রাম খুঁজুন…'],feeDue:['Fee due (৳)','বকেয়া ফি (৳)'],batchPh:['e.g. Morning Batch','যেমন: সকাল ব্যাচ'],
resetPw:['Reset password','পাসওয়ার্ড রিসেট'],delAcc:['Delete account','অ্যাকাউন্ট মুছুন'],resetTo:['Reset link sent to ','রিসেট লিংক পাঠানো হয়েছে: '],delAccConfirm:['Delete {n} completely? Login account, profile and messages will be removed.','{n} কে সম্পূর্ণ মুছে ফেলবেন? লগইন, প্রোফাইল ও মেসেজ সব মুছে যাবে।'],deleted:['Deleted ✓','মুছে গেছে ✓'],updated:['Updated ✓','আপডেট হয়েছে ✓'],
cloudName:['Cloudinary cloud name','Cloudinary ক্লাউড নেম'],preset:['Cloudinary unsigned upload preset','Cloudinary আনসাইনড প্রিসেট'],workerUrl:['Cloudflare Worker URL','Cloudflare Worker URL'],phone:['Institute phone / WhatsApp (with country code, e.g. 8801XXXXXXXXX)','প্রতিষ্ঠানের ফোন / হোয়াটসঅ্যাপ (দেশের কোডসহ, যেমন 8801XXXXXXXXX)'],
typesTitle:['Post types','পোস্টের ধরন'],typesHint:['These appear when sending and filtering. Set emoji, English/Bangla name, colour and kind.','পাঠানো ও ফিল্টারে এগুলো দেখাবে। ইমোজি, ইংরেজি/বাংলা নাম, রং ও ধরন ঠিক করুন।'],
addType:['+ Add type','+ নতুন ধরন'],resetTypes:['Reset to default types','ডিফল্ট ধরনে ফিরুন'],kPlain:['Normal','সাধারণ'],kDates:['Date range','তারিখ (শুরু-শেষ)'],kDeadline:['Deadline','শেষ তারিখ'],typeNeed:['Keep at least one type','অন্তত একটি ধরন রাখুন'],resetConfirm:['Reset all types to default?','সব ধরন ডিফল্টে ফিরিয়ে নেবেন?']
};
const T=k=>D[k]?D[k][lang==='bn'?1:0]:k;

/* ---------- post types (editable in Settings) ---------- */
const BASE=[
 {id:'notice',e:'📢',en:'Notice',bn:'নোটিশ',c:'#0b6b2b',k:'plain'},{id:'important',e:'🚨',en:'Important',bn:'জরুরি',c:'#b42318',k:'plain'},
 {id:'exam',e:'📝',en:'Exam',bn:'পরীক্ষা',c:'#1d4ed8',k:'plain'},{id:'fee',e:'💳',en:'Fee',bn:'ফি',c:'#92400e',k:'plain'},
 {id:'holiday',e:'🏖️',en:'Holiday',bn:'ছুটি',c:'#0e7490',k:'dates'},{id:'event',e:'🎉',en:'Event',bn:'অনুষ্ঠান',c:'#c2410c',k:'plain'},
 {id:'job',e:'💼',en:'Job circular',bn:'চাকরির বিজ্ঞপ্তি',c:'#6d28d9',k:'deadline'},{id:'offer',e:'🎁',en:'Offer',bn:'অফার',c:'#be185d',k:'deadline'},
 {id:'result',e:'🏆',en:'Result',bn:'ফলাফল',c:'#a16207',k:'plain'},{id:'class',e:'🏫',en:'Class update',bn:'ক্লাস আপডেট',c:'#0f766e',k:'plain'}];
const S={tab:HOME,ann:[],inbox:[],users:[],cfg:{},me:null,edit:null,open:null,f:'',un:[],roleSel:'student',complete:false,ready:{},rc:{},sy:0};
const hexOk=c=>/^#[0-9a-f]{6}$/i.test(c||'')?c:'#0b6b2b';
const getTypes=()=>Array.isArray(S.cfg.types)&&S.cfg.types.length?S.cfg.types:BASE;
const tyOf=id=>getTypes().find(x=>x.id===id)||BASE.find(x=>x.id===id)||{id,e:'📌',en:String(id),bn:String(id),c:'#0b6b2b',k:'plain'};
const tl=t=>lang==='bn'?(t.bn||t.en):(t.en||t.bn);
const tlab=id=>{const t=tyOf(id);return `${t.e} ${tl(t)}`};
const app=document.getElementById('app');
let mode='in';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=s=>esc(s).replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');
const lc=()=>lang==='bn'?'bn-BD':'en-GB';
const fmt=d=>d?.toDate?d.toDate().toLocaleString(lc(),{dateStyle:'medium',timeStyle:'short'}):'';
const fday=s=>{if(!s)return'';const d=new Date(s+'T00:00:00');return isNaN(d)?esc(s):d.toLocaleDateString(lc(),{dateStyle:'medium'})};
const toLoc=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,16);
const err=x=>String(x.code||x.message||'Error').replace('auth/','').replace(/-/g,' ');
const toast=m=>{const e=document.createElement('div');e.className='toast';e.textContent=m;document.body.append(e);setTimeout(()=>e.remove(),3500)};
const clr=()=>{S.un.forEach(f=>f());S.un=[]};
const secs=a=>a.createdAt?.seconds??Date.now()/1000;
const sorted=L=>[...L].sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||secs(b)-secs(a));
let raf=0;
const soft=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;if(!['send','me','set','fees'].includes(S.tab)&&!S.complete)render()})};
const seen=()=>jget('seen','[]'),mark=id=>{const s=seen();if(!s.includes(id))jset('seen',[...s,id].slice(-400))};
const saved=()=>jget('saved','[]');
const all=()=>ADMIN?S.ann:[...S.ann,...S.inbox];
const slug=s=>'b_'+encodeURIComponent(String(s).trim().toLowerCase()).replace(/[!*'()]/g,'');
const cld=(u,w,h)=>u&&u.includes('/image/upload/')?u.replace('/image/upload/',`/image/upload/c_fill,w_${w},h_${h},q_auto,f_auto/`):u;
const nimg=u=>u&&u.includes('/image/upload/')?u.replace('/image/upload/','/image/upload/c_fill,w_1000,h_500,q_auto,f_jpg/'):u;
const incomplete=m=>!m.mobile||(m.role==='student'&&!m.village);
const batches=()=>[...new Set(S.users.filter(u=>u.role==='student'&&u.batch).map(u=>u.batch.trim()))];

/* ---------- icons ---------- */
const IC={home:'<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',jobs:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>',
user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',send:'<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
card:'<rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>',users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
set:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',search:'<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
bm:'<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>',
back:'<path d="M19 12H5M12 19l-7-7 7-7"/>',mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>',lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
chat:'<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/>',
pin:'<path d="M12 17v5M9 3h6l-1 7 3 3v2H7v-2l3-3z"/>',clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
eye:'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',link:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
clip:'<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
sun:'<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>'};
const ic=(n,s=22)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
const GOOGLE='<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

/* ---------- services ---------- */
async function up(file){
  if(!S.cfg.cloud||!S.cfg.preset)throw Error(T('errCloud'));
  const f=new FormData();f.append('file',file);f.append('upload_preset',S.cfg.preset);
  const r=await fetch(`https://api.cloudinary.com/v1_1/${S.cfg.cloud}/auto/upload`,{method:'POST',body:f});
  const j=await r.json();if(!j.secure_url)throw Error(j.error?.message||'Upload failed');return j.secure_url;
}
async function post(body){
  if(!S.cfg.workerUrl)throw Error(T('errWorker'));
  const r=await fetch(S.cfg.workerUrl,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+await auth.currentUser.getIdToken()},body:JSON.stringify(body)});
  if(!r.ok)throw Error('Server: '+await r.text());
}
const item=(a,id)=>({topics:a.audience,title:a.title,body:(a.body||'').slice(0,240),image:nimg(a.cover||''),sub:a.sub||tlab(a.type),id});
const notify=(a,id)=>post({items:[item(a,id)]});
const topicsOf=m=>['all',m.role,'u_'+auth.currentUser.uid,...(m.role==='student'&&m.batch?[slug(m.batch)]:[])];
async function reg(m){
  if(!native)return;
  try{
    if((await FirebaseMessaging.requestPermissions()).receive!=='granted')return;
    const old=jget('bt','""'),now=m.role==='student'&&m.batch?slug(m.batch):'';
    for(const t of topicsOf(m))await FirebaseMessaging.subscribeToTopic({topic:t});
    await FirebaseMessaging.unsubscribeFromTopic({topic:m.role==='student'?'public':'student'});
    if(old&&old!==now)await FirebaseMessaging.unsubscribeFromTopic({topic:old});
    jset('bt',now);
  }catch(e){console.warn(e)}
}
function openPost(id){
  S.sy=scrollY;S.open=id;
  if(!ADMIN&&S.user&&!seen().includes(id)&&S.ann.some(x=>x.id===id))setDoc(doc(db,'announcements',id,'reads',S.user.uid),{at:serverTimestamp()}).catch(()=>{});
  mark(id);
}
function goBack(){S.open=null;render();scrollTo(0,S.sy||0)}
if(native){
  if(!ADMIN){
    FirebaseMessaging.addListener('notificationActionPerformed',e=>{const id=e.notification?.data?.id;if(id){S.tab='home';openPost(id);if(S.me&&!S.complete)render()}});
    FirebaseMessaging.addListener('notificationReceived',e=>toast(e.notification?.data?.title||e.notification?.title||'🔔'));
  }
  CapApp.addListener('backButton',()=>{
    if(!S.user||(!ADMIN&&!S.me)||S.complete)return CapApp.exitApp();
    if(S.open)return goBack();
    if(S.edit){S.edit=null;return render()}
    if(S.tab!==HOME){S.tab=HOME;S.f='';return render()}
    CapApp.exitApp();
  });
}
async function chk(){
  if(!REPO||!BUILD||!native)return;
  try{const r=await (await fetch(`https://api.github.com/repos/${REPO}/releases/tags/${ADMIN?'admin':'student'}`)).json();
    const n=+String(r.name).replace(/\D/g,'');const u=r.assets?.[0]?.browser_download_url;
    if(n>BUILD&&u){const e=document.getElementById('upd');if(e)e.innerHTML=`<a class="upd" href="${esc(u)}" target="_blank" rel="noopener">⬆ ${T('upd')}</a>`}}catch{}
}
const netUI=()=>{const e=document.getElementById('net');if(e)e.hidden=navigator.onLine};
addEventListener('online',netUI);addEventListener('offline',netUI);

/* ---------- auth screens ---------- */
const langBtn=cls=>`<button class="lang ${cls||''}" data-act="lang">${lang==='bn'?'EN':'বাং'}</button>`;
function authV(){
  const u=mode==='up';
  app.innerHTML=`<div class="auth">${langBtn('abs')}
  <div class="a-top"><img class="a-logo" src="logo.png" alt=""><h1>${NAME}</h1><p>${T('tag')}</p></div>
  <div class="a-card">
   ${ADMIN?`<h2 class="a-h">${T('adminIn')}</h2>`:`<div class="seg"><button data-act="mode" data-m="in" class="${u?'':'on'}">${T('signIn')}</button><button data-act="mode" data-m="up" class="${u?'on':''}">${T('signUp')}</button></div>`}
   <form id="auth">
    ${u?`<div class="fld">${ic('user',18)}<input name="n" placeholder="${T('fullName')}" required autocomplete="name"></div>
    <div class="rolebox"><span>${T('chooseRole')}</span><div class="roles">
     <button type="button" data-act="role" data-r="student" class="${S.roleSel==='student'?'on':''}"><i>🎓</i><b>${T('student')}</b><small>${T('studentHint')}</small></button>
     <button type="button" data-act="role" data-r="public" class="${S.roleSel==='public'?'on':''}"><i>🛍️</i><b>${T('customer')}</b><small>${T('customerHint')}</small></button></div></div>`:''}
    <div class="fld">${ic('mail',18)}<input name="e" type="email" placeholder="${T('email')}" required autocomplete="email" inputmode="email"></div>
    <div class="fld">${ic('lock',18)}<input name="p" type="password" placeholder="${T('password')}" minlength="6" required autocomplete="${u?'new-password':'current-password'}"><button type="button" class="eye" data-act="eye">${ic('eye',18)}</button></div>
    ${u?'':`<button type="button" class="lnk r" data-act="fg">${T('forgot')}</button>`}
    <button class="btn">${u?T('createAcc'):T('signIn')}</button>
   </form>
   <div class="or"><span>${T('or')}</span></div>
   <button class="gbtn" data-act="gg">${GOOGLE}<span>${T('google')}</span></button>
  </div><p class="a-foot">${T('foot')}</p></div>`;
}
const avatar=(m,sz)=>m.photo?`<img class="av ${sz||''}" src="${esc(cld(m.photo,240,240))}" alt="">`:`<div class="av ph ${sz||''}">${esc((m.name||'?').trim().charAt(0).toUpperCase())}</div>`;
const profF=(m,create)=>{
  const stu=create?true:m.role==='student';
  return `<form id="prof" class="pf">${avatar(m)}<h2>${create?T('completeProfile'):T('myProfile')}</h2>
  ${create?'':`<div class="rolepill">${stu?'🎓 '+T('student'):'🛍️ '+T('customer')}${m.batch?' · '+esc(m.batch):''}</div>`}
  <label>${T('name')}</label><input name="n" required value="${esc(m.name)}" autocomplete="name">
  <label>${T('mobile')}</label><input name="m" type="tel" inputmode="tel" required value="${esc(m.mobile)}" autocomplete="tel">
  ${create?`<label>${T('chooseRole')}</label><select name="r"><option value="student">${T('student')}</option><option value="public">${T('customer')}</option></select>`:''}
  <label class="vl">${stu?T('village'):T('address')}</label><input name="v" ${stu?'required':''} value="${esc(m.village)}">
  <label>${T('photo')}</label><input name="ph" type="file" accept="image/*"><small class="hint">${T('photoHint')}</small>
  <p class="note n-stu" ${stu?'':'hidden'}>ℹ️ ${T('studentNote')}</p><p class="note n-cus" ${stu?'hidden':''}>ℹ️ ${T('customerNote')}</p>
  <button class="btn">${T('saveForm')}</button></form>`;
};
const contact=()=>S.cfg.phone?`<div class="two"><a class="btn ghost" href="tel:${esc(S.cfg.phone)}">${ic('phone',18)} ${T('callUs')}</a><a class="btn ghost" href="https://wa.me/${esc(String(S.cfg.phone).replace(/\D/g,''))}" target="_blank" rel="noopener">${ic('chat',18)} ${T('whatsapp')}</a></div>`:'';
const outBtn=()=>`<button class="btn out" data-act="logout">${ic('out',18)} ${T('signOut')}</button>`;
const themeBox=()=>`<div class="sec"><h3 class="sh">${ic('sun',20)} ${T('appearance')}</h3><label>${T('theme')}</label>
  <div class="seg3">${[['light','themeLight'],['dark','themeDark'],['auto','themeAuto']].map(([v,k])=>`<button data-act="theme" data-v="${v}" class="${theme===v?'on':''}">${T(k)}</button>`).join('')}</div>
  <label>${T('language')}</label><div class="seg3 two">${[['bn','বাংলা'],['en','English']].map(([v,n])=>`<button data-act="setlang" data-v="${v}" class="${lang===v?'on':''}">${n}</button>`).join('')}</div></div>`;
const verLine=()=>`<p class="ver">${NAME} · ${T('version')} ${BUILD||'dev'}</p>`;
function profileV(){ // first-time Google user: no profile yet
  getDoc(doc(db,'settings','main')).then(s=>{S.cfg=s.data()||{}}).catch(()=>{});
  app.innerHTML=`<div class="auth plain">${langBtn('abs')}<div class="a-card flat">${profF({name:S.user.displayName||''},true)}${outBtn()}</div></div>`;
}
function completeV(){
  app.innerHTML=`<div class="auth plain">${langBtn('abs')}<div class="a-card flat">${profF(S.me,false).replace(T('myProfile'),T('completeProfile'))}${outBtn()}</div></div>`;
}

/* ---------- main views ---------- */
const chip=a=>{const t=tyOf(a.type);return `<span class="chip" style="--c:${hexOk(t.c)}">${t.e} ${esc(tl(t))}</span>`};
const isExp=a=>a.deadline&&new Date(a.deadline+'T23:59:59')<new Date();
const rcBadge=a=>ADMIN&&a.status!=='scheduled'?`<span class="rc" data-rc="${a.id}">${ic('eye',13)} <b>${S.rc[a.id]??'–'}</b></span>`:'';
const badges=a=>`${a.status==='scheduled'?`<span class="chip sch">${ic('clock',12)} ${fmt(a.sendAt)}</span>`:''}${!ADMIN&&!seen().includes(a.id)?`<span class="chip nw">${T('isNew')}</span>`:''}${isExp(a)?`<span class="chip ex">${T('expired')}</span>`:''}${a.pinned?`<span class="pinb">${ic('pin',14)}</span>`:''}`;
const meta=a=>[a.org?`${ic('jobs',14)} ${esc(a.org)}`:'',a.deadline?`${ic('cal',14)} ${T('deadline')}: ${fday(a.deadline)}`:'',a.from?`${ic('cal',14)} ${fday(a.from)}${a.to?' → '+fday(a.to):''}`:''].filter(Boolean).map(x=>`<span>${x}</span>`).join('');
const audLbl=a=>{const x=a.audience?.[0]||'';return x==='student'?T('allStudents'):x==='public'?T('allCustomers'):x==='all'?T('everyone'):x.startsWith('b_')?'🎓 '+esc(a.batchName||'Batch'):`${a.audience?.length||0} ${T('ppl')}`};
const card=a=>`<article class="card ${ADMIN?'':'tap'}" data-id="${a.id}" data-open="1" data-item>
  ${a.cover?`<div class="cv"><img src="${esc(cld(a.cover,900,450))}" loading="lazy" decoding="async" alt=""></div>`:''}
  <div class="cb"><div class="r1">${chip(a)}${badges(a)}</div><h3>${esc(a.title)}</h3><p class="ex">${esc((a.body||'').slice(0,150))}</p>
  ${meta(a)?`<div class="meta">${meta(a)}</div>`:''}
  <div class="foot"><small>${fmt(a.createdAt)}${ADMIN?' · '+audLbl(a):''}</small>${ADMIN?rcBadge(a):`<button class="ib ${saved().includes(a.id)?'on':''}" data-act="save" aria-label="${T('bm')}">${ic('bm',18)}</button>`}</div>
  ${ADMIN?`<div class="row"><button data-act="edit">${T('edit')}</button><button data-act="resend">${T('resend')}</button><button data-act="pin">${a.pinned?T('unpin'):T('pinBtn')}</button><button data-act="del" class="dng">${T('del')}</button></div>`:''}</div></article>`;
const detailV=a=>`<button class="back" data-act="back">${ic('back',18)} ${T('back')}</button><article class="card det">
  ${a.cover?`<div class="cv big"><img src="${esc(cld(a.cover,1000,560))}" decoding="async" alt=""></div>`:''}
  <div class="cb"><div class="r1">${chip(a)}${badges(a)}</div><h2>${esc(a.title)}</h2>${meta(a)?`<div class="meta">${meta(a)}</div>`:''}
  <p class="body">${link(a.body)}</p>
  ${(a.links||[]).map(l=>`<a class="btn" href="${esc(l.u)}" target="_blank" rel="noopener">${ic('link',18)} ${esc(l.t)}</a>`).join('')}
  ${(a.files||[]).map(x=>`<a class="fl" href="${esc(x.u)}" target="_blank" rel="noopener">${ic('clip',18)} ${esc(x.n)}</a>`).join('')}
  <div class="foot"><small>${fmt(a.createdAt)}</small><span><button class="ib ${saved().includes(a.id)?'on':''}" data-id="${a.id}" data-act="save">${ic('bm',18)}</button><button class="ib" data-id="${a.id}" data-act="share">${ic('share',18)}</button></span></div></div></article>`;
const unread=()=>all().filter(a=>a.status!=='scheduled'&&!seen().includes(a.id)).length;
const hero=()=>{const n=unread(),due=S.me.role==='student'&&S.me.due>0;
  return `<section class="hero">${avatar(S.me,'sm')}<div class="hn"><small>${T('hi')} 👋</small><h2>${esc(S.me.name)}</h2></div><div class="stat"><b>${n}</b><small>${T('unread')}</small></div></section>
  ${due?`<div class="due"><div><b>${T('dueTitle')}: ৳${esc(S.me.due)}</b><small>${T('dueHint')}</small></div>${S.cfg.phone?`<a class="mini" href="tel:${esc(S.cfg.phone)}">${ic('phone',18)}</a>`:''}</div>`:''}`};
const searchBox=(id,ph)=>`<div class="sb">${ic('search',18)}<input class="q" data-q="${id}" placeholder="${ph||T('search')}"></div>`;
const skel=()=>Array(3).fill('<div class="card sk"><div class="cv"></div><div class="cb"><i></i><i class="w"></i><i class="s"></i></div></div>').join('');
function feedV(jobsOnly){
  const a=S.open&&all().find(x=>x.id===S.open);if(a&&!ADMIN)return detailV(a);
  let l=sorted(all()).filter(x=>ADMIN||x.status!=='scheduled');
  if(jobsOnly)l=l.filter(x=>x.type==='job');else if(S.f==='__saved')l=l.filter(x=>saved().includes(x.id));else if(S.f)l=l.filter(x=>x.type===S.f);
  const chips=jobsOnly?'':`<div class="chips">${[['',T('all')],...(ADMIN?[]:[['__saved','★ '+T('saved')]]),...getTypes().map(t=>[t.id,`${t.e} ${tl(t)}`])].map(([k,n])=>`<button data-act="flt" data-k="${esc(k)}" class="${S.f===k?'on':''}">${esc(n)}</button>`).join('')}</div>`;
  const body=!S.ready.ann?skel():l.length?l.map(card).join(''):`<div class="empty">${ic(jobsOnly?'jobs':'bell',40)}<p>${jobsOnly?T('noJobs'):T('noPosts')}</p></div>`;
  return `${ADMIN||jobsOnly?'':hero()}${searchBox('feed')}${chips}<div id="feed">${body}</div>`;
}
const linkRow=(l={})=>`<div class="two lk"><input placeholder="${T('btnName')}" value="${esc(l.t)}"><input placeholder="https://…" value="${esc(l.u)}"></div>`;
const composeV=()=>{
  const a=S.edit||{},canSch=!S.edit||a.status==='scheduled',nt=!S.edit||a.status==='scheduled',bl=batches();
  const tys=getTypes().some(t=>t.id===a.type)||!a.type?getTypes():[...getTypes(),tyOf(a.type)];
  return `<form id="send" class="sec"><h3 class="sh">${ic('send',20)} ${S.edit?T('editAnn'):T('newAnn')}</h3>
  <div class="two"><div><label>${T('sendTo')}</label><select name="aud"><option value="student">${T('allStudents')}</option><option value="public">${T('allCustomers')}</option><option value="all">${T('everyone')}</option><option value="batch">${T('batchOpt')}</option><option value="users">${T('peopleOpt')}</option></select></div>
  <div><label>${T('type')}</label><select name="typ">${tys.map(t=>`<option value="${esc(t.id)}">${t.e} ${esc(tl(t))}</option>`).join('')}</select></div></div>
  <div id="bx" hidden><select name="bsel">${bl.length?bl.map(b=>`<option ${a.batchName===b?'selected':''}>${esc(b)}</option>`).join(''):`<option value="">${T('noBatch')}</option>`}</select></div>
  <div id="ul" class="ul" hidden>${S.users.map(u=>`<label class="ck"><input type="checkbox" class="uc" value="${esc(u.id)}" ${a.audience?.includes('u_'+u.id)?'checked':''}> ${esc(u.name)} · ${esc(u.village)} (${u.role==='student'?T('student'):T('customer')})</label>`).join('')||T('noUsers')}</div>
  <div id="hol" hidden><div class="two"><div><label>${T('holFrom')}</label><input type="date" name="hf" value="${esc(a.from)}"></div><div><label>${T('holTo')}</label><input type="date" name="ht" value="${esc(a.to)}"></div></div></div>
  <div id="jb" hidden><label>${T('orgLbl')}</label><input name="og" value="${esc(a.org)}"><label>${T('dl')}</label><input type="date" name="dl" value="${esc(a.deadline)}"></div>
  ${S.edit?'':`<label class="ck" id="rmb" hidden><input type="checkbox" name="rm" checked> ${T('remind')}</label>`}
  <label>${T('title')}</label><input name="ttl" required maxlength="100" value="${esc(a.title)}">
  <label>${T('message')}</label><textarea name="msg" rows="6" placeholder="${T('msgPh')}">${esc(a.body)}</textarea>
  <label>${T('cover')}</label><input name="cvr" type="file" accept="image/*">
  <label>${ic('link',14)} ${T('links')}</label><div id="lks">${(a.links?.length?a.links:[{}]).map(linkRow).join('')}</div><button type="button" class="btn ghost sm" data-act="addlink">${T('addLink')}</button>
  <label>${T('attach')}</label><input name="att" type="file" multiple accept="application/pdf,image/*">
  ${canSch?`<label>${ic('clock',14)} ${T('schedule')}</label><input type="datetime-local" name="sch" value="${a.sendAt?.toDate?toLoc(a.sendAt.toDate()):''}">`:''}
  <label class="ck"><input type="checkbox" name="pn" ${a.pinned?'checked':''}> ${T('pin')}</label>
  <label class="ck"><input type="checkbox" name="nt" ${nt?'checked':''}> ${T('pushOpt')}</label>
  <button class="btn send">${S.edit?T('saveChanges'):T('sendBtn')}</button>${S.edit?`<button type="button" class="btn ghost" data-act="cancel">${T('cancelEdit')}</button>`:''}</form>`;
};
const feeV=()=>{
  const l=S.users.filter(u=>u.role==='student'&&u.due>0);
  return `<form id="fee" class="sec"><h3 class="sh">${ic('card',20)} ${T('feeTitle')}</h3><small class="hint">${T('feeHint')}</small>
  <label>${T('message')}</label><textarea name="msg" rows="4">${esc(T('feeMsg'))}</textarea>
  ${searchBox('fl')}<div class="ul tall" id="fl">${l.map(u=>`<label class="ck" data-item><input type="checkbox" class="fc" value="${esc(u.id)}" checked> ${esc(u.name)} · ${esc(u.village)} · ৳${esc(u.due)}</label>`).join('')||T('noDue')}</div>
  <button class="btn send">${T('sendFee')}</button></form>`;
};
const usersV=()=>{
  const st=S.users.filter(u=>u.role==='student').length,due=S.users.reduce((s,u)=>s+(+u.due||0),0);
  return `<div class="stats"><div><b>${st}</b><small>${T('stu')}</small></div><div><b>${S.users.length-st}</b><small>${T('cus')}</small></div><div><b>৳${due}</b><small>${T('totalDue')}</small></div></div>
  ${searchBox('ulist',T('searchUsers'))}
  <div id="ulist">${S.users.map(u=>`<div class="card cb ucard" data-uid="${esc(u.id)}" data-item><div class="uh">${avatar(u,'xs')}<div><b>${esc(u.name)}</b><small>${esc(u.email)}</small></div></div>
  <div class="meta"><span>${ic('phone',14)} ${esc(u.mobile)||'—'}</span><span>${ic('home',14)} ${esc(u.village)||'—'}</span></div>
  <select data-role="1"><option value="student" ${u.role==='student'?'selected':''}>${T('student')}</option><option value="public" ${u.role==='public'?'selected':''}>${T('customer')}</option></select>
  ${u.role==='student'?`<div class="two"><div><label>${T('batch')}</label><input data-batch value="${esc(u.batch)}" placeholder="${T('batchPh')}"></div><div><label>${T('feeDue')}</label><input type="number" min="0" data-due value="${+u.due||0}"></div></div><button class="btn ghost sm" data-act="usave">${T('saveForm')}</button>`:''}
  <div class="row"><button data-act="reset">${T('resetPw')}</button><button data-act="rmuser" class="dng">${T('delAcc')}</button></div></div>`).join('')||`<div class="empty">${ic('users',40)}<p>${T('noUsers')}</p></div>`}</div>`;
};
const typeRow=t=>`<div class="trow" data-tid="${esc(t.id)}"><input class="te" maxlength="4" value="${esc(t.e)}" aria-label="emoji"><input class="ten" placeholder="English" value="${esc(t.en)}"><input class="tbn" placeholder="বাংলা" value="${esc(t.bn)}">
  <input class="tc" type="color" value="${hexOk(t.c)}" aria-label="colour"><select class="tk">${[['plain','kPlain'],['dates','kDates'],['deadline','kDeadline']].map(([v,k])=>`<option value="${v}" ${(t.k||'plain')===v?'selected':''}>${T(k)}</option>`).join('')}</select><button type="button" class="ib dngb" data-act="rmtype" aria-label="remove">✕</button></div>`;
const setV=()=>themeBox()+`<form id="set" class="sec"><h3 class="sh">${ic('set',20)} ${T('settings')}</h3><label>${T('cloudName')}</label><input name="c" value="${esc(S.cfg.cloud)}"><label>${T('preset')}</label><input name="p" value="${esc(S.cfg.preset)}">
  <label>${T('workerUrl')}</label><input name="w" type="url" placeholder="https://sctc-push.xxx.workers.dev" value="${esc(S.cfg.workerUrl)}">
  <label>${T('phone')}</label><input name="tel" type="tel" value="${esc(S.cfg.phone)}"><button class="btn">${T('saveForm')}</button></form>
  <form id="types" class="sec"><h3 class="sh">${ic('list',20)} ${T('typesTitle')}</h3><small class="hint">${T('typesHint')}</small><div id="trows">${getTypes().map(typeRow).join('')}</div>
  <button type="button" class="btn ghost sm" data-act="addtype">${T('addType')}</button><button class="btn">${T('saveForm')}</button><button type="button" class="btn ghost sm" data-act="resettypes">${T('resetTypes')}</button></form>${outBtn()}${verLine()}`;
const meV=()=>profF(S.me,false)+contact()+themeBox()+outBtn()+verLine();

function render(){
  if(!S.user)return;
  if(!ADMIN&&!S.me)return;
  if(!ADMIN&&S.complete)return completeV();
  const tabs=ADMIN?[['send','send',T('send')],['posts','list',T('posts')],['fees','card',T('fees')],['users','users',T('users')],['set','set',T('settings')]]:[['home','home',T('home')],['jobs','jobs',T('jobs')],['me','user',T('profile')]];
  const body={send:composeV,posts:()=>feedV(false),fees:feeV,users:usersV,set:setV,home:()=>feedV(false),jobs:()=>feedV(true),me:meV}[S.tab]();
  const n=ADMIN?0:unread();
  app.innerHTML=`<header><img src="logo.png" alt=""><div class="ht"><b>${NAME}</b></div>${langBtn()}</header><div id="net" ${navigator.onLine?'hidden':''}>${T('offBanner')}</div><div id="upd"></div><main>${body}</main>
  <nav>${tabs.map(([k,i,l])=>`<button data-tab="${k}" class="${S.tab===k?'on':''}"><span class="ni">${ic(i,22)}${k==='home'&&n?`<em>${n>99?'99+':n}</em>`:''}</span>${l}</button>`).join('')}</nav>`;
  const f=document.getElementById('send');
  if(f){const a=S.edit;if(a){f.typ.value=a.type;const x=a.audience?.[0]||'student';f.aud.value=x.startsWith('u_')?'users':x.startsWith('b_')?'batch':x}viewSel(f)}
  if(ADMIN&&S.tab==='posts')loadCounts();
}
function viewSel(f){
  document.getElementById('ul').hidden=f.aud.value!=='users';document.getElementById('bx').hidden=f.aud.value!=='batch';
  const k=tyOf(f.typ.value).k||'plain';document.getElementById('hol').hidden=k!=='dates';document.getElementById('jb').hidden=k!=='deadline';
  const r=document.getElementById('rmb');if(r)r.hidden=k==='plain';
}
function loadCounts(){
  for(const a of sorted(S.ann).slice(0,30)){
    if(a.status==='scheduled'||S.rc[a.id]!==undefined)continue;
    S.rc[a.id]=null;
    getCountFromServer(collection(db,'announcements',a.id,'reads')).then(r=>{const c=r.data().count;S.rc[a.id]=c;const e=document.querySelector(`[data-rc="${a.id}"] b`);if(e)e.textContent=c}).catch(()=>{delete S.rc[a.id]});
  }
}

/* ---------- actions ---------- */
function audOf(f){
  const v=f.aud.value;
  if(v==='batch'){const b=f.bsel.value;if(!b)throw Error(T('errBatch'));return {audience:[slug(b)],batchName:b}}
  if(v!=='users')return {audience:[v]};
  const l=[...f.querySelectorAll('.uc:checked')].map(c=>'u_'+c.value);if(!l.length)throw Error(T('errSel'));if(l.length>40)throw Error(T('errMax40'));return {audience:l};
}
async function doSend(f){
  const b=f.querySelector('.send');b.disabled=true;b.textContent=T('working');
  try{
    const old=S.edit||{},cv=f.cvr.files[0],fl=[...f.att.files];
    if(fl.length>5)throw Error(T('errMax5'));const big=fl.find(x=>x.size>1e7);if(big)throw Error(big.name+' '+T('errBig'));
    const sch=f.sch?.value?new Date(f.sch.value):null;if(sch&&sch<=new Date())throw Error(T('errFuture'));
    const ty=f.typ.value,k=tyOf(ty).k||'plain',hol=k==='dates',jb=k==='deadline';
    const a={title:f.ttl.value.trim(),body:f.msg.value.trim(),type:ty,sub:tlab(ty),...audOf(f),pinned:f.pn.checked,push:f.nt.checked,
      cover:cv?await up(cv):old.cover||'',from:hol?f.hf.value:'',to:hol?f.ht.value:'',org:jb?f.og.value.trim():'',deadline:jb?f.dl.value:'',status:sch?'scheduled':'sent',
      links:[...f.querySelectorAll('.lk')].map(r=>({t:r.children[0].value.trim(),u:r.children[1].value.trim()})).filter(l=>l.t&&/^https?:\/\//i.test(l.u)),
      files:[...(old.files||[]),...await Promise.all(fl.map(async x=>({n:x.name,u:await up(x)})))].slice(0,5)};
    if(a.batchName===undefined&&old.batchName)a.batchName=deleteField();
    if(sch)a.sendAt=Timestamp.fromDate(sch);else if(old.sendAt)a.sendAt=deleteField();
    let id=old.id;
    if(id){if(old.status==='scheduled'&&!sch)a.createdAt=serverTimestamp();await updateDoc(doc(db,'announcements',id),a)}
    else id=(await addDoc(collection(db,'announcements'),{...a,createdAt:serverTimestamp()})).id;
    let m=sch?T('schedOk'):f.nt.checked?T('sentOk'):T('savedOk');
    if(!sch&&f.nt.checked)await notify(a,id);
    const ref=hol?f.hf.value:jb?f.dl.value:'';
    if(!old.id&&ref&&f.rm?.checked){
      const r=new Date(ref+'T09:00:00');r.setDate(r.getDate()-1);
      if(r>new Date()){await addDoc(collection(db,'announcements'),{...a,title:T('reminder')+': '+a.title,body:(T('tomorrow')+' '+a.body).trim(),pinned:false,push:true,status:'scheduled',sendAt:Timestamp.fromDate(r),createdAt:serverTimestamp()});m+=T('remSet')}
      else m+=T('remLate');
    }
    toast(m);S.edit=null;S.tab='posts';S.rc={};render();
  }catch(x){toast(err(x));b.disabled=false;b.textContent=T('sendBtn')}
}
async function doFee(f){
  const b=f.querySelector('.send');b.disabled=true;
  try{
    const ids=[...f.querySelectorAll('.fc:checked')].map(c=>c.value);
    if(!ids.length)throw Error(T('selStu'));if(ids.length>40)throw Error(T('errMax40'));
    const items=[];
    await Promise.all(ids.map(async id=>{
      const u=S.users.find(x=>x.id===id);
      const a={title:T('feeTitle'),body:f.msg.value.replace(/\{name\}/g,u.name).replace(/\{due\}/g,u.due),type:'fee',sub:tlab('fee'),audience:['u_'+id],pinned:false,status:'sent',push:true,cover:'',links:[],files:[],createdAt:serverTimestamp()};
      const r=await addDoc(collection(db,'users',id,'inbox'),a);items.push(item(a,r.id));
    }));
    await post({items});toast(T('remSent')+' ('+ids.length+')');
  }catch(x){toast(err(x))}
  b.disabled=false;
}
async function doProf(f){
  try{
    let photo=S.me?.photo||'';if(f.ph.files[0])photo=await up(f.ph.files[0]);
    const d={name:f.n.value.trim(),mobile:f.m.value.trim(),village:f.v.value.trim(),photo};
    if(!S.me){d.role=f.r.value;d.email=S.user.email||'';d.createdAt=serverTimestamp()}
    await setDoc(doc(db,'users',S.user.uid),d,{merge:true});toast(T('savedOk'));
    if(!S.me){enter(S.user)}else{S.me={...S.me,...d};S.complete=incomplete(S.me);render()}
  }catch(x){toast(err(x))}
}
async function doAuth(f){
  try{
    if(mode==='up'){S.signup={n:f.n.value.trim(),r:S.roleSel};await createUserWithEmailAndPassword(auth,f.e.value.trim(),f.p.value)}
    else await signInWithEmailAndPassword(auth,f.e.value.trim(),f.p.value);
  }catch(x){S.signup=null;toast(err(x))}
}
async function saveCfg(patch){await setDoc(doc(db,'settings','main'),patch,{merge:true});S.cfg={...S.cfg,...patch}}
async function doTypes(f){
  try{
    const types=[...f.querySelectorAll('.trow')].map(r=>({id:r.dataset.tid,e:r.querySelector('.te').value.trim()||'📌',en:r.querySelector('.ten').value.trim(),bn:r.querySelector('.tbn').value.trim(),c:hexOk(r.querySelector('.tc').value),k:r.querySelector('.tk').value})).filter(t=>t.en||t.bn);
    if(!types.length)throw Error(T('typeNeed'));
    await saveCfg({types});toast(T('savedOk'));render();
  }catch(x){toast(err(x))}
}
function rerender(){if(!S.user)authV();else if(!S.me&&!ADMIN)profileV();else render()}
const ACT={
  lang(){lang=lang==='bn'?'en':'bn';jset('lang',lang);rerender()},
  setlang(_,el){lang=el.dataset.v;jset('lang',lang);rerender()},
  theme(_,el){theme=el.dataset.v;jset('theme',theme);applyTheme();render()},
  mode(_,el){mode=el.dataset.m;authV()},
  role(_,el){S.roleSel=el.dataset.r;const f=document.getElementById('auth'),v=[f.n.value,f.e.value];authV();const g=document.getElementById('auth');g.n.value=v[0];g.e.value=v[1]},
  eye(_,el){const i=el.parentNode.querySelector('input');i.type=i.type==='password'?'text':'password'},
  async fg(){const e=document.querySelector('[name=e]')?.value.trim();if(!e)return toast(T('enterEmail'));try{await sendPasswordResetEmail(auth,e);toast(T('resetSent'))}catch(x){toast(err(x))}},
  async gg(){
    try{
      if(native){const r=await FirebaseAuthentication.signInWithGoogle({skipNativeAuth:true});await signInWithCredential(auth,GoogleAuthProvider.credential(r.credential?.idToken))}
      else await signInWithPopup(auth,new GoogleAuthProvider());
    }catch(x){toast(err(x))}
  },
  async logout(){
    if(native&&!ADMIN&&S.user&&S.me)for(const t of [...topicsOf(S.me),'student','public'])try{await FirebaseMessaging.unsubscribeFromTopic({topic:t})}catch{}
    clr();S.me=null;S.ann=[];S.inbox=[];S.users=[];S.open=null;S.edit=null;S.complete=false;S.ready={};S.rc={};S.tab=HOME;jset('bt','');
    try{if(native)await FirebaseAuthentication.signOut()}catch{}
    await signOut(auth);
  },
  back(){goBack()},cancel(){S.edit=null;render()},flt(_,el){S.f=el.dataset.k;render()},
  save(id){const s=saved(),on=!s.includes(id);jset('saved',on?[...s,id]:s.filter(x=>x!==id));
    if(S.f==='__saved'&&!on&&!S.open)return render();
    document.querySelectorAll('[data-act="save"]').forEach(b=>{if(b.closest('[data-id]')?.dataset.id===id)b.classList.toggle('on',on)})},
  async share(id){const a=all().find(x=>x.id===id);if(!a)return;const txt=`${a.title}\n${a.body||''}`.slice(0,500);
    try{if(navigator.share)await navigator.share({title:a.title,text:txt});else{await navigator.clipboard.writeText(txt);toast(T('copied'))}}catch{}},
  addlink(){document.getElementById('lks').insertAdjacentHTML('beforeend',linkRow())},
  addtype(){document.getElementById('trows').insertAdjacentHTML('beforeend',typeRow({id:'c'+Date.now().toString(36),e:'📌',en:'',bn:'',c:'#0b6b2b',k:'plain'}))},
  rmtype(_,el){el.closest('.trow').remove()},
  async resettypes(){if(!confirm(T('resetConfirm')))return;await setDoc(doc(db,'settings','main'),{types:deleteField()},{merge:true});const {types,...rest}=S.cfg;S.cfg=rest;toast(T('savedOk'));render()},
  edit(id){S.edit=S.ann.find(x=>x.id===id);S.tab='send';render();scrollTo(0,0)},
  async resend(id){try{await notify(S.ann.find(x=>x.id===id),id);toast(T('sentOk'))}catch(x){toast(err(x))}},
  pin(id){const a=S.ann.find(x=>x.id===id);return updateDoc(doc(db,'announcements',id),{pinned:!a.pinned})},
  del(id){if(confirm(T('delConfirm')))return deleteDoc(doc(db,'announcements',id))},
  async usave(id,el){const c=el.closest('[data-uid]');await updateDoc(doc(db,'users',id),{due:Math.max(0,Math.round(+c.querySelector('[data-due]').value||0)),batch:c.querySelector('[data-batch]').value.trim()});toast(T('savedOk'))},
  async reset(id){const u=S.users.find(x=>x.id===id);try{await sendPasswordResetEmail(auth,u.email);toast(T('resetTo')+u.email)}catch(x){toast(err(x))}},
  async rmuser(id){
    const u=S.users.find(x=>x.id===id);if(!confirm(T('delAccConfirm').replace('{n}',u.name)))return;
    await post({action:'deleteUser',uid:id});
    for(const d of (await getDocs(collection(db,'users',id,'inbox'))).docs)await deleteDoc(d.ref);
    await deleteDoc(doc(db,'users',id));toast(T('deleted'));
  }
};
app.onclick=async e=>{
  if(e.target.closest('a'))return;
  const tb=e.target.closest('[data-tab]');
  if(tb){S.tab=tb.dataset.tab;S.open=null;S.edit=null;S.f='';if(S.tab==='posts')S.rc={};render();return scrollTo(0,0)}
  const el=e.target.closest('[data-act]');
  if(el){const h=el.closest('[data-id],[data-uid]');try{await ACT[el.dataset.act](h?.dataset.id||h?.dataset.uid||el.dataset.id,el)}catch(x){toast(err(x))}return}
  const c=e.target.closest('[data-open]');if(c&&!ADMIN){openPost(c.dataset.id);render();scrollTo(0,0)}
};
app.onsubmit=async e=>{e.preventDefault();const f=e.target;
  if(f.id==='auth')doAuth(f);else if(f.id==='send')doSend(f);else if(f.id==='prof')doProf(f);else if(f.id==='fee')doFee(f);else if(f.id==='types')doTypes(f);
  else if(f.id==='set'){try{await saveCfg({cloud:f.c.value.trim(),preset:f.p.value.trim(),workerUrl:f.w.value.trim(),phone:f.tel.value.trim()});toast(T('savedOk'))}catch(x){toast(err(x))}}};
app.onchange=async e=>{const el=e.target;
  if(el.name==='aud'||el.name==='typ')viewSel(el.form);
  if(el.name==='r'&&el.form?.id==='prof'){const s=el.value==='student',f=el.form;f.querySelector('.n-stu').hidden=!s;f.querySelector('.n-cus').hidden=s;f.v.required=s;f.querySelector('.vl').textContent=s?T('village'):T('address')}
  if(el.dataset.role){try{await updateDoc(doc(db,'users',el.closest('[data-uid]').dataset.uid),{role:el.value});toast(T('updated'))}catch(x){toast(err(x))}}};
app.oninput=e=>{const el=e.target;if(!el.dataset.q)return;const v=el.value.toLowerCase();
  document.querySelectorAll(`#${el.dataset.q} [data-item]`).forEach(n=>{n.hidden=!n.textContent.toLowerCase().includes(v)})};

/* ---------- boot ---------- */
function start(){
  clr();S.ready={};const u=S.user.uid,ud=[];
  const ls=(q,k)=>onSnapshot(q,s=>{S[k]=s.docs.map(d=>({id:d.id,...d.data()}));S.ready[k]=true;soft()},x=>{console.warn(x);S.ready[k]=true;soft()});
  if(ADMIN){ud.push(ls(collection(db,'announcements'),'ann'),ls(collection(db,'users'),'users'))}
  else{
    ud.push(onSnapshot(doc(db,'users',u),s=>{const m=s.data();if(!m)return;const ch=S.me&&(S.me.role!==m.role||(S.me.batch||'')!==(m.batch||''));S.me=m;ch?start():soft()}),
      ls(query(collection(db,'announcements'),where('audience','array-contains-any',topicsOf(S.me))),'ann'),
      ls(collection(db,'users',u,'inbox'),'inbox'));
    reg(S.me);
  }
  ud.push(onSnapshot(doc(db,'settings','main'),s=>{S.cfg=s.data()||{};soft()}));
  S.un=ud;render();chk();
}
async function enter(u){
  clr();S.user=u;if(!u)return authV();
  try{
    if(ADMIN){const a=await getDoc(doc(db,'admins',u.uid));if(!a.exists()){toast(T('notAdmin'));return signOut(auth)}}
    else{
      let p=await getDoc(doc(db,'users',u.uid));
      if(!p.exists()){
        if(!S.signup)return profileV();
        await setDoc(doc(db,'users',u.uid),{name:S.signup.n,role:S.signup.r,email:u.email||'',mobile:'',village:'',photo:'',createdAt:serverTimestamp()});S.signup=null;
        p=await getDoc(doc(db,'users',u.uid));
      }
      S.me=p.data();S.complete=incomplete(S.me);
    }
    start();
  }catch(x){app.innerHTML=`<p class="empty">${T('offline')}<br>${esc(err(x))}</p>`}
}
onAuthStateChanged(auth,enter);
