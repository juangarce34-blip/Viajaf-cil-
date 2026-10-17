"""Verify real release upgrade and byte-for-byte retention of WebView storage."""
import os,re,subprocess,time,json,shlex,xml.etree.ElementTree as ET
from pathlib import Path

def run(*args): return subprocess.check_output(args,text=True,stderr=subprocess.STDOUT)
bt=Path(os.environ['ANDROID_HOME'])/'build-tools/36.0.0'
old=next(Path('previous-release').rglob('*.apk'));new=next(Path('current-release').rglob('*.apk'))
def metadata(apk):
 cert=re.findall(r'Signer #\d+ certificate SHA-256 digest: (\w+)',run(str(bt/'apksigner'),'verify','--verbose','--print-certs',str(apk)))
 package=re.search(r"package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'",run(str(bt/'aapt'),'dump','badging',str(apk)))
 assert package and len(cert)==1
 return dict(package=package[1],code=int(package[2]),version=package[3],certificate=cert[0])
a,b=metadata(old),metadata(new)
assert a['package']==b['package']=='com.viajafacil.app'
assert a['certificate']==b['certificate'] and b['code']>a['code']
Path('artifacts').mkdir(exist_ok=True)
report={'previous':a,'current':b,'signatureMatch':True,'upgradeInstalled':False,'dataPreserved':False,'scope':'Emulator API 35; existing WebView localStorage files retained byte-for-byte across install -r, before first new-version launch. Fresh default trip from previous release, not a copy of the user phone.'}
def save():Path('artifacts/release-upgrade.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
def start():
 run('adb','shell','am','start','-W','-n','com.viajafacil.app/.MainActivity');time.sleep(5)
def dump():
 run('adb','shell','uiautomator','dump','/sdcard/vf-window.xml')
 return run('adb','shell','cat','/sdcard/vf-window.xml')
def hashes():
 path='/data/user/0/com.viajafacil.app/app_webview/Default/Local Storage/leveldb'
 data=run('adb','shell','find '+shlex.quote(path)+' -type f -exec sha256sum {} \\;')
 assert '.log' in data or '.ldb' in data,'No se encontró localStorage de la versión anterior'
 return sorted(data.splitlines())
save()
try:
 assert 'Success' in run('adb','install',str(old));start()
 xml=dump();Path('artifacts/previous-screen.xml').write_text(xml)
 assert 'com.viajafacil.app' in xml,'No arrancó el APK anterior'
 run('adb','shell','am','force-stop','com.viajafacil.app')
 # Google APIs userdebug image, only for reading this test app storage. No signing secrets.
 run('adb','root');run('adb','wait-for-device')
 before=hashes()
 assert 'Success' in run('adb','install','-r',str(new));report['upgradeInstalled']=True;save()
 after=hashes();assert before==after,'El almacenamiento WebView cambió durante la instalación'
 report['dataPreserved']=True;report['storageFilesCompared']=len(before);save()
 run('adb','shell','cmd','connectivity','airplane-mode','enable');run('adb','shell','svc','wifi','disable');run('adb','shell','svc','data','disable');start()
 xml=dump();Path('artifacts/upgrade-screen.xml').write_text(xml)
 assert 'com.viajafacil.app' in xml,'No arrancó la actualización'
 report['newVersionStarted']=True;save()
finally:
 run('adb','shell','screencap','-p','/sdcard/upgrade.png');run('adb','pull','/sdcard/upgrade.png','artifacts/upgrade.png')
