import {initializeApp} from 'firebase/app';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendPasswordResetEmail,signOut,GoogleAuthProvider,signInWithPopup,signInWithCredential} from 'firebase/auth';
import {initializeFirestore,persistentLocalCache,collection,doc,setDoc,getDoc,getDocs,addDoc,updateDoc,deleteDoc,deleteField,onSnapshot,query,where,serverTimestamp,Timestamp} from 'firebase/firestore';
import {Capacitor} from '@capacitor/core';
import {FirebaseMessaging} from '@capacitor-firebase/messaging';
import {FirebaseAuthentication} from '@capacitor-firebase/authentication';
import './style.css';

const fb=initializeApp({apiKey:"AIzaSyC04mr-q_WDGmaoiM-Pab2tWYDkxAFiby4",authDomain:"notification-1e6e5.firebaseapp.com",projectId:"notification-1e6e5",storageBucket:"notification-1e6e5.firebasestorage.app",messagingSenderId:"871534419453",appId:"1:871534419453:web:aaf8e899eb4877b9dbcd94"});
const auth=getAuth(fb),db=initializeFirestore(fb,{localCache:persistentLocalCache()});
const native=Capacitor.isNativePlatform(),ADMIN=import.meta.env.VITE_APP==='admin';
const BUILD=+import.meta.env.VITE_BUILD||0,REPO=import.meta.env.VITE_REPO||'';
const NAME='SCTC Resources Hub';
const TYPES={notice:['📢','Notice'],important:['🚨','Important'],exam:['📝','Exam'],fee:['💳','Fee'],holiday:['🏖️','Holiday'],event:['🎉','Event']};
const S={tab:ADMIN?'send':'home',ann:[],inbox:[],users:[],cfg:{},me:null,edit:null,open:null,f:'',un:[]};
const app=document.getElementById('app');
let mode='in';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=s=>esc(s).replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');
const fmt=d=>d?.toDate?d.toDate().toLocaleString([],{dateStyle:'medium',timeStyle:'short'}):'';
const loc=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,16);
const err=x=>String(x.code||x.message||'Error').replace('auth/','').replace(/-/g,' ');
const toast=m=>{const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),3500)};
const cl=()=>{S.un.forEach(f=>f());S.un=[]};
const secs=a=>a.createdAt?.seconds??Date.now()/1000;
const sorted=L=>[...L].sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||secs(b)-secs(a));
const soft=()=>{if(!['send','me','set','fees'].includes(S.tab))render()};
const seen=()=>{try{return JSON.parse(localStorage.getItem('seen')||'[]')}catch{return[]}};
const mark=id=>{try{const s=seen();if(!s.includes(id))localStorage.setItem('seen',JSON.stringify([...s,id].slice(-300)))}catch{}};
const all=()=>ADMIN?S.ann:[...S.ann,...S.inbox];

async function up(file){
  if(!S.cfg.cloud||!S.cfg.preset)throw Error('Cloudinary is not set up (Admin > Settings)');
  const f=new FormData();f.append('file',file);f.append('upload_preset',S.cfg.preset);
  const r=await fetch(`https://api.cloudinary.com/v1_1/${S.cfg.cloud}/auto/upload`,{method:'POST',body:f});
  const j=await r.json();if(!j.secure_url)throw Error(j.error?.message||'Upload failed');return j.secure_url;
}
async function post(body){
  if(!S.cfg.workerUrl)throw Error('Worker URL missing (Settings)');
  const r=await fetch(S.cfg.workerUrl,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+await auth.currentUser.getIdToken()},body:JSON.stringify(body)});
  if(!r.ok)throw Error('Server: '+await r.text());
}
const item=(a,id)=>({topics:a.audience,title:`${TYPES[a.type]?.[0]||''} ${a.title}`,body:(a.body||'').slice(0,180),image:a.cover||'',id});
const notify=(a,id)=>post({items:[item(a,id)]});
async function reg(role,uid){
  if(!native)return;
  try{
    if((await FirebaseMessaging.requestPermissions()).receive!=='granted')return;
    for(const t of ['all',role,'u_'+uid])await FirebaseMessaging.subscribeToTopic({topic:t});
    await FirebaseMessaging.unsubscribeFromTopic({topic:role==='student'?'public':'student'});
  }catch(e){console.warn(e)}
}
if(native&&!ADMIN){
  FirebaseMessaging.addListener('notificationActionPerformed',e=>{const id=e.notification?.data?.id;if(id){S.tab='home';S.open=id;mark(id);render()}});
  FirebaseMessaging.addListener('notificationReceived',e=>toast(e.notification?.title||'New notification'));
}
async function chk(){
  if(!REPO||!BUILD||!native)return;
  try{const r=await (await fetch(`https://api.github.com/repos/${REPO}/releases/tags/${ADMIN?'admin':'student'}`)).json();
    const n=+String(r.name).replace(/\D/g,'');const u=r.assets?.[0]?.browser_download_url;
    if(n>BUILD&&u)document.getElementById('upd').innerHTML=`<a class="upd" href="${esc(u)}" target="_blank" rel="noopener">⬆ New version available. Tap to update</a>`;}catch{}
}

/* ---------- views ---------- */
function authV(){
  app.innerHTML=`<div class="auth"><img class="logo" src="logo.png" alt=""><h1>${NAME}${ADMIN?' · Admin':''}</h1>
  <form id="auth"><input name="e" type="email" placeholder="Email" required autocomplete="email"><input name="p" type="password" placeholder="Password" minlength="6" required>
  ${mode==='up'?`<input name="n" placeholder="Full name" required><select name="r"><option value="student">I am a Student</option><option value="public">I am a Customer / Public</option></select>`:''}
  <button class="btn">${mode==='up'?'Create account':'Sign in'}</button></form>
  <button class="lnk" data-act="fg">Forgot password?</button>
  ${ADMIN?'':`<button class="lnk" data-act="sw">${mode==='up'?'Have an account? Sign in':'New here? Sign up'}</button>`}
  <button class="btn ghost" data-act="gg">Continue with Google</button></div>`;
}
const profF=(c,m={})=>`<form id="prof"><h2>${c?'Complete your profile':'My profile'}</h2>${m.photo?`<img class="av" src="${esc(m.photo)}" alt="">`:''}
  <label>Name</label><input name="n" required value="${esc(m.name)}"><label>Mobile number</label><input name="m" type="tel" required value="${esc(m.mobile)}">
  <label>Village</label><input name="v" required value="${esc(m.village)}">
  ${c?`<label>I am a</label><select name="r"><option value="student">Student</option><option value="public">Customer / Public</option></select>`:''}
  <label>Photo (so we can recognise you easily)</label><input name="ph" type="file" accept="image/*">
  <p class="note">ℹ️ Use the same mobile number and name you gave at admission, plus your village name. Tell sir whenever anything needs to change.</p>
  <button class="btn">Save</button><button type="button" class="btn ghost" data-act="logout">Sign out</button></form>`;
async function profileV(){
  try{S.cfg=(await getDoc(doc(db,'settings','main'))).data()||{}}catch{}
  app.innerHTML=`<div class="auth" style="text-align:left">${profF(true,{name:S.user.displayName||''})}</div>`;
}
const meV=()=>(S.me.due>0?`<div class="note">💳 Fee due: <b>৳${esc(S.me.due)}</b></div>`:'')+profF(false,S.me)
  +(S.cfg.phone?`<a class="btn ghost" href="tel:${esc(S.cfg.phone)}">📞 Call sir</a><a class="btn ghost" href="https://wa.me/${esc(String(S.cfg.phone).replace(/\D/g,''))}" target="_blank" rel="noopener">💬 WhatsApp sir</a>`:'');
const tag=a=>`<span class="tag t-${a.type}">${TYPES[a.type]?.[0]||''} ${TYPES[a.type]?.[1]||''}</span>${a.status==='scheduled'?`<span class="tag">⏰ ${fmt(a.sendAt)}</span>`:''}${!ADMIN&&!seen().includes(a.id)?'<span class="tag new">NEW</span>':''}${a.pinned?'<span class="pin">📌</span>':''}`;
const card=a=>`<article class="card" data-id="${a.id}" data-open="1" data-item>${a.cover?`<img class="cov" src="${esc(a.cover)}" loading="lazy" alt="">`:''}<div class="cb">${tag(a)}<h3>${esc(a.title)}</h3><p>${esc((a.body||'').slice(0,140))}</p><small>${fmt(a.createdAt)}</small>
  ${ADMIN?`<div class="row"><button data-act="edit">Edit</button><button data-act="resend">Resend</button><button data-act="pin">${a.pinned?'Unpin':'Pin'}</button><button data-act="del" class="dng">Delete</button></div>`:''}</div></article>`;
const detailV=a=>`<button class="lnk" data-act="back">← Back</button><article class="card">${a.cover?`<img class="cov" src="${esc(a.cover)}" alt="">`:''}<div class="cb">${tag(a)}<h2>${esc(a.title)}</h2>
  ${a.from?`<p>📅 ${esc(a.from)}${a.to?' → '+esc(a.to):''}</p>`:''}<p class="body">${link(a.body)}</p>
  ${(a.links||[]).map(l=>`<a class="btn" href="${esc(l.u)}" target="_blank" rel="noopener">🔗 ${esc(l.t)}</a>`).join('')}
  ${(a.files||[]).map(x=>`<a class="fl" href="${esc(x.u)}" target="_blank" rel="noopener">📎 ${esc(x.n)}</a>`).join('')}<small>${fmt(a.createdAt)}</small></div></article>`;
const feedV=()=>{
  const a=S.open&&all().find(x=>x.id===S.open);if(a&&!ADMIN)return detailV(a);
  let l=sorted(all()).filter(x=>ADMIN||x.status!=='scheduled');if(S.f)l=l.filter(x=>x.type===S.f);
  return `<div class="chips"><input class="q" data-q="feed" placeholder="Search…">${['',...Object.keys(TYPES)].map(k=>`<button data-act="flt" data-k="${k}" class="${S.f===k?'on':''}">${k?TYPES[k][0]+' '+TYPES[k][1]:'All'}</button>`).join('')}</div>
  <div id="feed">${l.length?l.map(card).join(''):'<p class="empty">No announcements yet</p>'}</div>`;
};
const linkRow=(l={})=>`<div class="two lk"><input placeholder="Button name" value="${esc(l.t)}"><input placeholder="https://…" value="${esc(l.u)}"></div>`;
const composeV=()=>{
  const a=S.edit||{},canSch=!S.edit||a.status==='scheduled',nt=!S.edit||a.status==='scheduled';
  return `<form id="send" class="card cb"><h3>🔔 ${S.edit?'Edit announcement':'New announcement'}</h3>
  <div class="two"><div><label>Send to</label><select name="aud"><option value="student">All students</option><option value="public">All customers</option><option value="all">Everyone</option><option value="users">Specific people…</option></select></div>
  <div><label>Type</label><select name="typ">${Object.entries(TYPES).map(([k,v])=>`<option value="${k}">${v[0]} ${v[1]}</option>`).join('')}</select></div></div>
  <div id="ul" class="ul" hidden>${S.users.map(u=>`<label class="ck"><input type="checkbox" class="uc" value="${esc(u.id)}" ${a.audience?.includes('u_'+u.id)?'checked':''}> ${esc(u.name)} · ${esc(u.village)} (${esc(u.role)})</label>`).join('')||'No users yet'}</div>
  <div id="hol" hidden><div class="two"><div><label>Holiday from</label><input type="date" name="hf" value="${esc(a.from)}"></div><div><label>to (optional)</label><input type="date" name="ht" value="${esc(a.to)}"></div></div>
  ${S.edit?'':'<label class="ck"><input type="checkbox" name="rm" checked> Auto-remind one day before (9:00 AM)</label>'}</div>
  <label>Title</label><input name="ttl" required maxlength="100" value="${esc(a.title)}">
  <label>Message</label><textarea name="msg" rows="6" placeholder="Links typed here become tappable">${esc(a.body)}</textarea>
  <label>Cover image (shows big in the notification and the app)</label><input name="cvr" type="file" accept="image/*">
  <label>🔗 Links (optional)</label><div id="lks">${(a.links?.length?a.links:[{}]).map(linkRow).join('')}</div><button type="button" class="btn ghost" data-act="addlink">+ Add another link</button>
  <label>Attach PDF or images (up to 5, max 10 MB each)</label><input name="att" type="file" multiple accept="application/pdf,image/*">
  ${canSch?`<label>⏰ Schedule (optional, empty = send now)</label><input type="datetime-local" name="sch" value="${a.sendAt?.toDate?loc(a.sendAt.toDate()):''}">`:''}
  <label class="ck"><input type="checkbox" name="pn" ${a.pinned?'checked':''}> Pin to top</label>
  <label class="ck"><input type="checkbox" name="nt" ${nt?'checked':''}> Send phone notification (works when the app is closed)</label>
  <button class="btn send">${S.edit?'Save changes':'Send'}</button>${S.edit?'<button type="button" class="btn ghost" data-act="cancel">Cancel edit</button>':''}</form>`;
};
const feeV=()=>{
  const l=S.users.filter(u=>u.role==='student'&&u.due>0);
  return `<form id="fee" class="card cb"><h3>💳 Fee due reminder</h3><small>Set each student's due in the Users tab. {name} and {due} are filled in automatically. Max 40 at a time.</small>
  <label>Message</label><textarea name="msg" rows="4">প্রিয় {name}, আপনার কোর্স ফি ৳{due} বাকি আছে। অনুগ্রহ করে দ্রুত পরিশোধ করুন।</textarea>
  <input class="q" data-q="fl" placeholder="Search student…"><div class="ul" id="fl" style="max-height:320px">${l.map(u=>`<label class="ck" data-item><input type="checkbox" class="fc" value="${esc(u.id)}" checked> ${esc(u.name)} · ${esc(u.village)} · ৳${esc(u.due)}</label>`).join('')||'No student has fee due'}</div>
  <button class="btn send">Send reminder to selected</button></form>`;
};
const usersV=()=>{
  const st=S.users.filter(u=>u.role==='student').length,due=S.users.reduce((s,u)=>s+(+u.due||0),0);
  return `<small>${st} students · ${S.users.length-st} customers · total due ৳${due}</small><input class="q" data-q="ulist" placeholder="Search name, mobile, village…" style="margin-top:8px">
  <div id="ulist">${S.users.map(u=>`<div class="card cb" data-uid="${esc(u.id)}" data-item>${u.photo?`<img class="av" src="${esc(u.photo)}" alt="">`:''}<b>${esc(u.name)}</b><br>📞 ${esc(u.mobile)} · 🏡 ${esc(u.village)}<br><small>${esc(u.email)}</small>
  <select data-role="1"><option value="student" ${u.role==='student'?'selected':''}>Student</option><option value="public" ${u.role==='public'?'selected':''}>Customer / Public</option></select>
  <label>Fee due (৳)</label><div class="two"><input type="number" min="0" data-due value="${+u.due||0}"><button class="btn ghost" data-act="due" style="margin:4px 0 10px">Save due</button></div>
  <div class="row"><button data-act="reset">Reset password</button><button data-act="rmuser" class="dng">Delete account</button></div></div>`).join('')||'<p class="empty">No users yet</p>'}</div>`;
};
const setV=()=>`<form id="set" class="card cb"><h3>⚙️ Settings</h3><label>Cloudinary cloud name</label><input name="c" value="${esc(S.cfg.cloud)}"><label>Cloudinary unsigned upload preset</label><input name="p" value="${esc(S.cfg.preset)}">
  <label>Cloudflare Worker URL</label><input name="w" type="url" placeholder="https://sctc-push.xxx.workers.dev" value="${esc(S.cfg.workerUrl)}">
  <label>Institute phone / WhatsApp (with country code, e.g. 8801XXXXXXXXX)</label><input name="tel" type="tel" value="${esc(S.cfg.phone)}">
  <button class="btn">Save</button><button type="button" class="btn ghost" data-act="logout">Sign out</button></form>`;

function render(){
  if(!S.user||(!ADMIN&&!S.me))return;
  const tabs=ADMIN?[['send','✍️','Send'],['posts','📋','Posts'],['fees','💳','Fees'],['users','👥','Users'],['set','⚙️','Settings']]:[['home','🏠','Home'],['me','👤','Profile']];
  const body={send:composeV,posts:feedV,fees:feeV,users:usersV,set:setV,home:feedV,me:meV}[S.tab]();
  app.innerHTML=`<header><img src="logo.png" alt=""><b>${NAME}${ADMIN?' · Admin':''}</b></header><div id="upd"></div><main>${body}</main><nav>${tabs.map(([k,i,l])=>`<button data-tab="${k}" class="${S.tab===k?'on':''}"><i>${i}</i>${l}</button>`).join('')}</nav>`;
  const f=document.getElementById('send');
  if(f){const a=S.edit;if(a){f.typ.value=a.type;f.aud.value=a.audience?.[0]?.startsWith('u_')?'users':a.audience?.[0]||'student'}
    document.getElementById('ul').hidden=f.aud.value!=='users';document.getElementById('hol').hidden=f.typ.value!=='holiday'}
}

/* ---------- actions ---------- */
const audOf=f=>{if(f.aud.value!=='users')return [f.aud.value];const l=[...f.querySelectorAll('.uc:checked')].map(c=>'u_'+c.value);if(!l.length)throw Error('Select at least one person');if(l.length>40)throw Error('Select max 40 people');return l};
async function doSend(f){
  const b=f.querySelector('.send');b.disabled=true;b.textContent='Working…';
  try{
    const old=S.edit||{},cv=f.cvr.files[0],fl=[...f.att.files];
    if(fl.length>5)throw Error('Max 5 attachments');const big=fl.find(x=>x.size>1e7);if(big)throw Error(big.name+' is over 10 MB');
    const sch=f.sch?.value?new Date(f.sch.value):null;if(sch&&sch<=new Date())throw Error('Schedule time must be in the future');
    const hol=f.typ.value==='holiday';
    const a={title:f.ttl.value.trim(),body:f.msg.value.trim(),type:f.typ.value,audience:audOf(f),pinned:f.pn.checked,push:f.nt.checked,
      cover:cv?await up(cv):old.cover||'',from:hol?f.hf.value:'',to:hol?f.ht.value:'',status:sch?'scheduled':'sent',
      links:[...f.querySelectorAll('.lk')].map(r=>({t:r.children[0].value.trim(),u:r.children[1].value.trim()})).filter(l=>l.t&&/^https?:\/\//i.test(l.u)),
      files:[...(old.files||[]),...await Promise.all(fl.map(async x=>({n:x.name,u:await up(x)})))].slice(0,5)};
    if(sch)a.sendAt=Timestamp.fromDate(sch);else if(old.sendAt)a.sendAt=deleteField();
    let id=old.id;
    if(id){if(old.status==='scheduled'&&!sch)a.createdAt=serverTimestamp();await updateDoc(doc(db,'announcements',id),a)}
    else id=(await addDoc(collection(db,'announcements'),{...a,createdAt:serverTimestamp()})).id;
    let m=sch?'Scheduled ✓':f.nt.checked?'Sent ✓':'Saved ✓';
    if(!sch&&f.nt.checked)await notify(a,id);
    if(!old.id&&hol&&f.hf.value&&f.rm?.checked){
      const r=new Date(f.hf.value+'T09:00:00');r.setDate(r.getDate()-1);
      if(r>new Date()){await addDoc(collection(db,'announcements'),{...a,title:'Reminder: '+a.title,body:('Holiday starts tomorrow. '+a.body).trim(),pinned:false,push:true,status:'scheduled',sendAt:Timestamp.fromDate(r),createdAt:serverTimestamp()});m+=' + reminder set'}
      else m+=' (reminder time already passed)';
    }
    toast(m);S.edit=null;S.tab='posts';render();
  }catch(x){toast(err(x));b.disabled=false;b.textContent='Send'}
}
async function doFee(f){
  const b=f.querySelector('.send');b.disabled=true;
  try{
    const ids=[...f.querySelectorAll('.fc:checked')].map(c=>c.value);
    if(!ids.length)throw Error('Select at least one student');if(ids.length>40)throw Error('Select max 40 at a time');
    const items=[];
    await Promise.all(ids.map(async id=>{
      const u=S.users.find(x=>x.id===id);
      const a={title:'Fee due reminder',body:f.msg.value.replace(/\{name\}/g,u.name).replace(/\{due\}/g,u.due),type:'fee',audience:['u_'+id],pinned:false,status:'sent',push:true,cover:'',links:[],files:[],createdAt:serverTimestamp()};
      const r=await addDoc(collection(db,'users',id,'inbox'),a);items.push(item(a,r.id));
    }));
    await post({items});toast('Reminders sent ✓ ('+ids.length+')');
  }catch(x){toast(err(x))}
  b.disabled=false;
}
async function doProf(f){
  try{
    let photo=S.me?.photo||'';if(f.ph.files[0])photo=await up(f.ph.files[0]);
    const d={name:f.n.value.trim(),mobile:f.m.value.trim(),village:f.v.value.trim(),photo};
    if(!S.me){d.role=f.r.value;d.email=S.user.email||'';d.createdAt=serverTimestamp()}
    await setDoc(doc(db,'users',S.user.uid),d,{merge:true});toast('Saved ✓');if(!S.me)enter(S.user);
  }catch(x){toast(err(x))}
}
async function doAuth(f){
  try{
    if(mode==='up'){S.signup={n:f.n.value.trim(),r:f.r.value};await createUserWithEmailAndPassword(auth,f.e.value.trim(),f.p.value)}
    else await signInWithEmailAndPassword(auth,f.e.value.trim(),f.p.value);
  }catch(x){S.signup=null;toast(err(x))}
}
const ACT={
  sw(){mode=mode==='up'?'in':'up';authV()},
  async fg(){const e=document.querySelector('[name=e]')?.value.trim();if(!e)return toast('Enter your email first');try{await sendPasswordResetEmail(auth,e);toast('Reset link sent')}catch(x){toast(err(x))}},
  async gg(){
    try{
      if(native){const r=await FirebaseAuthentication.signInWithGoogle({skipNativeAuth:true});await signInWithCredential(auth,GoogleAuthProvider.credential(r.credential?.idToken))}
      else await signInWithPopup(auth,new GoogleAuthProvider());
    }catch(x){toast(err(x))}
  },
  async logout(){
    if(native&&!ADMIN&&S.user)for(const t of ['all','student','public','u_'+S.user.uid])try{await FirebaseMessaging.unsubscribeFromTopic({topic:t})}catch{}
    cl();S.me=null;S.ann=[];S.inbox=[];S.users=[];S.open=null;S.edit=null;S.tab=ADMIN?'send':'home';
    try{if(native)await FirebaseAuthentication.signOut()}catch{}
    await signOut(auth);
  },
  back(){S.open=null;render()},cancel(){S.edit=null;render()},flt(_,el){S.f=el.dataset.k;render()},
  addlink(){document.getElementById('lks').insertAdjacentHTML('beforeend',linkRow())},
  edit(id){S.edit=S.ann.find(x=>x.id===id);S.tab='send';render();scrollTo(0,0)},
  async resend(id){try{await notify(S.ann.find(x=>x.id===id),id);toast('Sent ✓')}catch(x){toast(err(x))}},
  pin(id){const a=S.ann.find(x=>x.id===id);return updateDoc(doc(db,'announcements',id),{pinned:!a.pinned})},
  del(id){if(confirm('Delete this announcement?'))return deleteDoc(doc(db,'announcements',id))},
  async due(id,el){const v=Math.max(0,Math.round(+el.closest('[data-uid]').querySelector('[data-due]').value||0));await updateDoc(doc(db,'users',id),{due:v});toast('Saved ✓')},
  async reset(id){const u=S.users.find(x=>x.id===id);try{await sendPasswordResetEmail(auth,u.email);toast('Reset link sent to '+u.email)}catch(x){toast(err(x))}},
  async rmuser(id){
    const u=S.users.find(x=>x.id===id);if(!confirm(`Delete ${u.name} completely? Login account, profile and messages will be removed.`))return;
    await post({action:'deleteUser',uid:id});
    for(const d of (await getDocs(collection(db,'users',id,'inbox'))).docs)await deleteDoc(d.ref);
    await deleteDoc(doc(db,'users',id));toast('Deleted ✓');
  }
};
app.onclick=async e=>{
  if(e.target.closest('a'))return;
  const tb=e.target.closest('[data-tab]');if(tb){S.tab=tb.dataset.tab;S.open=null;S.edit=null;return render()}
  const el=e.target.closest('[data-act]');
  if(el){const h=el.closest('[data-id],[data-uid]');try{await ACT[el.dataset.act](h?.dataset.id||h?.dataset.uid,el)}catch(x){toast(err(x))}return}
  const c=e.target.closest('[data-open]');if(c&&!ADMIN){S.open=c.dataset.id;mark(S.open);render();scrollTo(0,0)}
};
app.onsubmit=async e=>{e.preventDefault();const f=e.target;
  if(f.id==='auth')doAuth(f);else if(f.id==='send')doSend(f);else if(f.id==='prof')doProf(f);else if(f.id==='fee')doFee(f);
  else if(f.id==='set'){try{await setDoc(doc(db,'settings','main'),{cloud:f.c.value.trim(),preset:f.p.value.trim(),workerUrl:f.w.value.trim(),phone:f.tel.value.trim()});toast('Saved ✓')}catch(x){toast(err(x))}}};
app.onchange=async e=>{const t=e.target;
  if(t.name==='aud')document.getElementById('ul').hidden=t.value!=='users';
  if(t.name==='typ')document.getElementById('hol').hidden=t.value!=='holiday';
  if(t.dataset.role){try{await updateDoc(doc(db,'users',t.closest('[data-uid]').dataset.uid),{role:t.value});toast('Updated ✓')}catch(x){toast(err(x))}}};
app.oninput=e=>{const t=e.target;if(!t.dataset.q)return;const v=t.value.toLowerCase();
  document.querySelectorAll(`#${t.dataset.q} [data-item]`).forEach(n=>{n.hidden=!n.textContent.toLowerCase().includes(v)})};

/* ---------- boot ---------- */
function start(){
  cl();const u=S.user.uid,ud=[];
  const ls=(q,k)=>onSnapshot(q,s=>{S[k]=s.docs.map(d=>({id:d.id,...d.data()}));soft()},x=>console.warn(x));
  if(ADMIN){ud.push(ls(collection(db,'announcements'),'ann'),ls(collection(db,'users'),'users'))}
  else{
    ud.push(onSnapshot(doc(db,'users',u),s=>{const m=s.data();if(!m)return;const ch=S.me&&S.me.role!==m.role;S.me=m;ch?start():soft()}),
      ls(query(collection(db,'announcements'),where('audience','array-contains-any',['all',S.me.role,'u_'+u])),'ann'),
      ls(collection(db,'users',u,'inbox'),'inbox'));
    reg(S.me.role,u);
  }
  ud.push(onSnapshot(doc(db,'settings','main'),s=>{S.cfg=s.data()||{}}));
  S.un=ud;render();chk();
}
async function enter(u){
  cl();S.user=u;if(!u)return authV();
  try{
    if(ADMIN){const a=await getDoc(doc(db,'admins',u.uid));if(!a.exists()){toast('This account is not an admin');return signOut(auth)}}
    else{
      let p=await getDoc(doc(db,'users',u.uid));
      if(!p.exists()){
        if(!S.signup)return profileV();
        await setDoc(doc(db,'users',u.uid),{name:S.signup.n,role:S.signup.r,email:u.email||'',mobile:'',village:'',photo:'',createdAt:serverTimestamp()});S.signup=null;
        p=await getDoc(doc(db,'users',u.uid));S.tab='me';
      }
      S.me=p.data();
    }
    start();
  }catch(x){app.innerHTML=`<p class="empty">Connect to the internet once to sign in.<br>${esc(err(x))}</p>`}
}
onAuthStateChanged(auth,enter);
