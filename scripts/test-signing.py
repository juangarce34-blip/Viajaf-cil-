"""Exercise real private-key checks and signed/unsigned/tampered JAR verification with disposable test keys."""
import base64
import hashlib
import os
import shutil
from pathlib import Path
import subprocess
import tempfile
import zipfile

root = Path(__file__).resolve().parents[1]
script = str(root / 'scripts/sign-android.sh')
verifier = str(root / 'scripts/VerifyBundleSignature.java')
names = ['VF_SIGNING_KEYSTORE_BASE64', 'VF_SIGNING_STORE_PASSWORD', 'VF_SIGNING_ALIAS',
         'VF_SIGNING_KEY_PASSWORD', 'VF_SIGNING_CERT_SHA256']

def run(args, env, success=True):
    result = subprocess.run(args, cwd=root, env=env, capture_output=True, text=True)
    if (result.returncode == 0) != success:
        raise AssertionError('Resultado inesperado en comprobación de firma: ' + args[0])
    # Fixture values must not leak even on failure; never print captured process output.
    for key in ['VF_SIGNING_KEYSTORE_BASE64', 'VF_SIGNING_STORE_PASSWORD', 'VF_SIGNING_KEY_PASSWORD']:
        value = env.get(key, '')
        if value and value in result.stdout + result.stderr:
            raise AssertionError('Una prueba expuso un valor privado: ' + key)
    return result

with tempfile.TemporaryDirectory(prefix='vf-signing-tests-') as temp:
    directory = Path(temp)
    env = {k:v for k,v in os.environ.items() if k not in names}
    env.update(GITHUB_ACTIONS='true', GITHUB_REPOSITORY='juangarce34-blip/Viajaf-cil-',
               GITHUB_REF='refs/heads/codex/auditoria-android-2026-10-15', GITHUB_EVENT_NAME='push',
               FIXTURE_STORE_PASS='test-store-password', FIXTURE_KEY_PASS='test-private-password')
    store = directory / 'test.jks'
    run(['keytool', '-genkeypair', '-storetype', 'JKS', '-keystore', str(store), '-alias', 'fixture',
         '-storepass:env', 'FIXTURE_STORE_PASS', '-keypass:env', 'FIXTURE_KEY_PASS', '-keyalg', 'RSA',
         '-dname', 'CN=Disposable test certificate', '-validity', '1'], env)
    cert = directory / 'cert.der'
    run(['keytool', '-exportcert', '-keystore', str(store), '-alias', 'fixture',
         '-storepass:env', 'FIXTURE_STORE_PASS', '-file', str(cert)], env)
    fingerprint = hashlib.sha256(cert.read_bytes()).hexdigest()
    run(['bash', script, '--check'], env, success=False)
    print('PASS: secretos ausentes bloquean la firma')
    encoded = base64.encodebytes(store.read_bytes()).decode()
    env.update(dict(zip(names, [encoded, env['FIXTURE_STORE_PASS'], 'fixture', env['FIXTURE_KEY_PASS'],
                                'SHA256: ' + ':'.join(fingerprint[i:i+2] for i in range(0,64,2)).upper()])))
    run(['bash', script, '--check'], env)
    print('PASS: cinco secretos, base64 multilinea y huella con formato keytool')
    standard=base64.b64encode(store.read_bytes()).decode()
    for wrapped in ["'"+standard+"'", '-----BEGIN CERTIFICATE-----\n'+encoded+'-----END CERTIFICATE-----',
                    'data:application/octet-stream;base64,'+standard, standard.rstrip('=')]:
        run(['bash',script,'--check'],{**env,'VF_SIGNING_KEYSTORE_BASE64':wrapped})
    print('PASS: formato certutil, comillas, data URI y padding omitido conservan la misma clave')
    for name, value in [('VF_SIGNING_CERT_SHA256', '00' * 32), ('VF_SIGNING_ALIAS', 'missing'),
                        ('VF_SIGNING_KEY_PASSWORD', 'incorrect-test-password'),
                        ('VF_SIGNING_STORE_PASSWORD', 'incorrect-test-store-password'),
                        ('VF_SIGNING_KEYSTORE_BASE64', 'not-valid-base64!')]:
        run(['bash', script, '--check'], {**env, name:value}, success=False)
    print('PASS: huella, alias, contraseñas y base64 incorrectos se rechazan')
    run(['bash', script, '--check'], {**env, 'GITHUB_EVENT_NAME':'pull_request'}, success=False)
    run(['bash', script, '--check'], {**env, 'GITHUB_REF':'refs/heads/main'}, success=False)
    print('PASS: pull requests y main no pueden firmar')
    unsigned = directory / 'unsigned.aab'
    with zipfile.ZipFile(unsigned, 'w') as bundle:
        bundle.writestr('base/manifest/AndroidManifest.xml', b'fixture payload')
    run(['java', verifier, str(unsigned), fingerprint], env, success=False)
    signed = directory / 'signed.aab'
    signer=['jarsigner'] if shutil.which('jarsigner') else ['java','-m','jdk.jartool/sun.security.tools.jarsigner.Main']
    run(signer + ['-keystore', str(store), '-storepass:env', 'FIXTURE_STORE_PASS',
         '-keypass:env', 'FIXTURE_KEY_PASS', '-signedjar', str(signed), str(unsigned), 'fixture'], env)
    run(['java', verifier, str(signed), fingerprint], env)
    run(['java', verifier, str(signed), '00' * 32], env, success=False)
    with zipfile.ZipFile(signed, 'a') as bundle:
        bundle.writestr('base/unsigned-extra', b'unsigned')
    run(['java', verifier, str(signed), fingerprint], env, success=False)
    print('PASS: AAB firmado válido; AAB sin firma, certificado distinto y entrada añadida se rechazan')
    tampered = directory / 'tampered.aab'
    with zipfile.ZipFile(signed) as source, zipfile.ZipFile(tampered, 'w') as target:
        for name in source.namelist():
            if name == 'base/unsigned-extra': continue
            content = source.read(name)
            target.writestr(name, b'changed' if name == 'base/manifest/AndroidManifest.xml' else content)
    run(['java', verifier, str(tampered), fingerprint], env, success=False)
    print('PASS: manipulación de contenido firmado detectada')
