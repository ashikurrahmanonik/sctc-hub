# Runs in CI after `cap add android` (student app only): branded notification service
import os,re,sys
app=sys.argv[1]
if app!='student': sys.exit(0)
pkg='bd.pro.sabujcomputers.hub'
base='android/app/src/main'
# logo used as notification large icon
os.makedirs(base+'/res/drawable-nodpi',exist_ok=True)
import shutil; shutil.copy('assets/ic_logo.png',base+'/res/drawable-nodpi/ic_logo.png')
# java service
jd=f"{base}/java/{pkg.replace('.','/')}"; os.makedirs(jd,exist_ok=True)
open(jd+'/SctcMessagingService.java','w').write(open('scripts/SctcMessagingService.java.txt').read().replace('__PKG__',pkg))
# manifest: replace plugin service with ours (ours extends it)
mp=base+'/AndroidManifest.xml'; m=open(mp).read()
if 'xmlns:tools' not in m: m=m.replace('<manifest ','<manifest xmlns:tools="http://schemas.android.com/tools" ',1)
svc=('<service android:name="io.capawesome.capacitorjs.plugins.firebase.messaging.MessagingService" tools:node="remove" />'
     '<service android:name=".SctcMessagingService" android:exported="false"><intent-filter>'
     '<action android:name="com.google.firebase.MESSAGING_EVENT" /></intent-filter></service>')
m=m.replace('</application>',svc+'</application>',1); open(mp,'w').write(m)
# gradle: make firebase-messaging visible to the app module
gp='android/app/build.gradle'; g=open(gp).read()
g=g.replace('dependencies {','dependencies {\n    implementation "com.google.firebase:firebase-messaging:24.1.0"',1); open(gp,'w').write(g)
print('patched')
