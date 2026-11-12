# Runs in CI after `cap add android`, for both apps.
import os,sys,shutil
app=sys.argv[1]
base='android/app/src/main'
# 1) Google sign-in: the plugin only bundles its Google libraries when this flag is true
vp='android/variables.gradle'; v=open(vp).read()
if 'rgcfaIncludeGoogle' not in v:
    v=v.replace('ext {','ext {\n    rgcfaIncludeGoogle = true',1); open(vp,'w').write(v)
if app!='student':
    print('patched (google only)'); sys.exit(0)
# 2) student app: branded notification service (logo + cover banner)
pkg='bd.pro.sabujcomputers.hub'
os.makedirs(base+'/res/drawable-nodpi',exist_ok=True)
shutil.copy('assets/ic_logo.png',base+'/res/drawable-nodpi/ic_logo.png')
jd=f"{base}/java/{pkg.replace('.','/')}"; os.makedirs(jd,exist_ok=True)
open(jd+'/SctcMessagingService.java','w').write(open('scripts/SctcMessagingService.java.txt').read().replace('__PKG__',pkg))
mp=base+'/AndroidManifest.xml'; m=open(mp).read()
if 'xmlns:tools' not in m: m=m.replace('<manifest ','<manifest xmlns:tools="http://schemas.android.com/tools" ',1)
svc=('<service android:name="io.capawesome.capacitorjs.plugins.firebase.messaging.MessagingService" tools:node="remove" />'
     '<service android:name=".SctcMessagingService" android:exported="false"><intent-filter>'
     '<action android:name="com.google.firebase.MESSAGING_EVENT" /></intent-filter></service>')
m=m.replace('</application>',svc+'</application>',1); open(mp,'w').write(m)
gp='android/app/build.gradle'; g=open(gp).read()
g=g.replace('dependencies {','dependencies {\n    implementation "com.google.firebase:firebase-messaging:24.1.0"',1); open(gp,'w').write(g)
print('patched (google + notification service)')
