# Runs in CI after `cap add android`, for both apps (admin + student).
import os,sys,shutil
app=sys.argv[1]
n=os.environ.get('BUILD_NUMBER','1')
base='android/app/src/main'

# 1) Google sign-in: the plugin only bundles its Google libraries when this flag is true
vp='android/variables.gradle'; v=open(vp).read()
if 'rgcfaIncludeGoogle' not in v:
    v=v.replace('ext {','ext {\n    rgcfaIncludeGoogle = true',1); open(vp,'w').write(v)

# 2) Gradle: fixed signing key (same key for every build) + increasing versionCode
gp='android/app/build.gradle'; g=open(gp).read()
g=g.replace('versionCode 1','versionCode '+n,1).replace('versionName "1.0"','versionName "5.'+n+'"',1)
sign=("    signingConfigs {\n        sctc {\n            storeFile file('sctc.keystore')\n            storePassword 'android'\n"
      "            keyAlias 'androiddebugkey'\n            keyPassword 'android'\n        }\n    }\n    buildTypes {\n        debug { signingConfig signingConfigs.sctc }")
g=g.replace('    buildTypes {',sign,1)
if app=='student':
    g=g.replace('dependencies {','dependencies {\n    implementation "com.google.firebase:firebase-messaging:24.1.0"',1)
assert 'signingConfigs.sctc' in g and 'versionCode '+n in g, 'build.gradle patch failed'
open(gp,'w').write(g)

# 3) Manifest: permission needed to open the APK installer for in-app updates
mp=base+'/AndroidManifest.xml'; m=open(mp).read()
m=m.replace('</manifest>','    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />\n</manifest>',1)

# 4) Student app only: branded notification service (logo + cover banner + tap opens the post)
if app=='student':
    pkg='bd.pro.sabujcomputers.hub'
    os.makedirs(base+'/res/drawable-nodpi',exist_ok=True)
    shutil.copy('assets/ic_logo.png',base+'/res/drawable-nodpi/ic_logo.png')
    jd=f"{base}/java/{pkg.replace('.','/')}"; os.makedirs(jd,exist_ok=True)
    open(jd+'/SctcMessagingService.java','w').write(open('scripts/SctcMessagingService.java.txt').read().replace('__PKG__',pkg))
    if 'xmlns:tools' not in m: m=m.replace('<manifest ','<manifest xmlns:tools="http://schemas.android.com/tools" ',1)
    svc=('<service android:name="io.capawesome.capacitorjs.plugins.firebase.messaging.MessagingService" tools:node="remove" />'
         '<service android:name=".SctcMessagingService" android:exported="false"><intent-filter>'
         '<action android:name="com.google.firebase.MESSAGING_EVENT" /></intent-filter></service>')
    m=m.replace('</application>',svc+'</application>',1)
open(mp,'w').write(m)
print('patched',app,'build',n)
