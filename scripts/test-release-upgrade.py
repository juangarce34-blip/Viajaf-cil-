"""Compare public APK metadata/certificates and update a seeded release installation."""
import os,re,subprocess,time,json,xml.etree.ElementTree as ET
from pathlib import Path

def run(*args): return subprocess.check_output(args,text=True,stderr=subprocess.STDOUT)
bt=Path(os.environ['ANDROID_HOME'])/'build-tools/36.0.0'
old=next(Path('previous-release').rglob('*.apk'));new=next(Path('current-release').rglob('*.apk'))
def metadata(apk):
 signature=run(str(bt/'apksigner'),'verify','--verbose','--print-certs',str(apk))
 cert=re.findall(r'Signer #\d+ certificate SHA-256 digest: (\w+)',signature)
 badging=run(str(bt/'aapt'),'dump','badging',str(apk))
 package=re.search(r"package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'",badging)
 assert package and len(cert)==1
 return dict(package=package[1],code=int(package[2]),version=package[3],certificate=cert[0])
a,b=metadata(old),metadata(new)
assert a['package']==b['package']=='com.viajafacil.app'
assert a['certificate']==b['certificate'] and b['code']>a['code']
Path('artifacts').mkdir(exist_ok=True)
report={'previous':a,'current':b,'signatureMatch':True,'upgradeInstalled':False,'dataPreserved':False}
def save():Path('artifacts/release-upgrade.json').write_text(json.dumps(report,indent=2))
save()
def start():
 run('adb','shell','am','start','-n','com.viajafacil.app/.MainActivity');time.sleep(3)
def dump():
 run('adb','shell','uiautomator','dump','/sdcard/vf-window.xml')
 xml=run('adb','shell','cat','/sdcard/vf-window.xml')
 return ET.fromstring(xml)
def tap(node):
 x1,y1,x2,y2=map(int,re.findall(r'\d+',node.attrib['bounds']))
 run('adb','shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(1)
def button(text):
 for attempt in range(8):
  root=dump()
  for e in root.iter('node'):
   if text in (e.get('text','')+' '+e.get('content-desc','')):tap(e);return
  run('adb','shell','input','swipe','500','1300','500','400','300');time.sleep(.5)
 raise AssertionError('No se encuentra control: '+text)
try:
 assert 'Success' in run('adb','install',str(old));start()
 button('Continuar mi viaje');button('Indicar destino, fechas y viajeros')
 inputs=[e for e in dump().iter('node') if e.get('class')=='android.widget.EditText']
 assert inputs,'No hay campo de destino accesible'
 tap(inputs[0]);run('adb','shell','input','text','PruebaActualizacion');time.sleep(2)
 run('adb','shell','input','keyevent','BACK');time.sleep(1)
 button('Inicio')
 assert 'PruebaActualizacion' in ET.tostring(dump(),encoding='unicode'),'No se guardó el destino antes de actualizar'
 run('adb','shell','am','force-stop','com.viajafacil.app')
 assert 'Success' in run('adb','install','-r',str(new));report['upgradeInstalled']=True;save()
 run('adb','shell','svc','wifi','disable');run('adb','shell','svc','data','disable');start()
 xml=ET.tostring(dump(),encoding='unicode');Path('artifacts/upgrade-screen.xml').write_text(xml)
 assert 'PruebaActualizacion' in xml,'El destino guardado no aparece tras actualizar'
 report['dataPreserved']=True;save();print(json.dumps(report))
finally:
 run('adb','shell','screencap','-p','/sdcard/upgrade.png');run('adb','pull','/sdcard/upgrade.png','artifacts/upgrade.png')
