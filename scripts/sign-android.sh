#!/usr/bin/env bash
set -euo pipefail

# Never enable shell tracing here: secret values must not reach logs.
if [[ ${GITHUB_ACTIONS:-} == true ]]; then
  if [[ ${GITHUB_REPOSITORY:-} != juangarce34-blip/Viajaf-cil- || ${GITHUB_REF:-} != refs/heads/codex/conectividad-divisas-0-25 || ! ${GITHUB_EVENT_NAME:-} =~ ^(push|workflow_dispatch)$ ]]; then
    echo '::error::La firma solo está permitida desde la rama Android autorizada, mediante push o ejecución manual.'
    exit 1
  fi
fi
if [[ $# -gt 1 || ( $# -eq 1 && $1 != --check ) ]]; then
  echo 'Uso: bash scripts/sign-android.sh [--check]'
  exit 1
fi
missing=0
for variable in VF_SIGNING_KEYSTORE_BASE64 VF_SIGNING_STORE_PASSWORD VF_SIGNING_ALIAS VF_SIGNING_KEY_PASSWORD VF_SIGNING_CERT_SHA256; do
  if [[ -z ${!variable:-} ]]; then
    echo "::error::Falta el secreto $variable. Revisa su nombre y disponibilidad en Actions."
    missing=1
  fi
done
[[ $missing -eq 0 ]] || exit 1

umask 077
signing_dir=$(mktemp -d)
trap 'rm -rf "$signing_dir"' EXIT
export VF_SIGNING_STORE="$signing_dir/distribution.jks"
python3 - <<'PY'
import base64, json, os, re
from pathlib import Path
try:
    value=os.environ['VF_SIGNING_KEYSTORE_BASE64'].strip().lstrip('\ufeff').strip()
    # Accept common copy envelopes, but never guess or generate a different key.
    if len(value)>1 and value[0]==value[-1] and value[0] in ('"', "'"):
        try: value=json.loads(value) if value[0]=='"' else value[1:-1]
        except json.JSONDecodeError: value=value[1:-1]
    if not isinstance(value,str): raise ValueError()
    if value.startswith('-----BEGIN CERTIFICATE-----') and value.endswith('-----END CERTIFICATE-----'):
        value=value[len('-----BEGIN CERTIFICATE-----'):-len('-----END CERTIFICATE-----')]
    if value.startswith('data:') and ';base64,' in value: value=value.split(';base64,',1)[1]
    encoded=''.join(value.split())
    encoded+='='*((-len(encoded))%4)
    decoded=base64.b64decode(encoded,altchars=b'-_',validate=True)
    if not decoded: raise ValueError()
    Path(os.environ['VF_SIGNING_STORE']).write_bytes(decoded)
except Exception:
    raise SystemExit('::error::VF_SIGNING_KEYSTORE_BASE64 no es base64 válido. Regenera el secreto desde el archivo original del almacén, no desde su nombre o ruta.')

PY
unset VF_SIGNING_KEYSTORE_BASE64

# Exercise the store password, alias and private-key password without printing them.
if ! keytool -certreq -keystore "$VF_SIGNING_STORE" -alias "$VF_SIGNING_ALIAS" \
  -storepass:env VF_SIGNING_STORE_PASSWORD -keypass:env VF_SIGNING_KEY_PASSWORD \
  -file "$signing_dir/check.csr" > "$signing_dir/key-check.log" 2>&1; then
  echo '::error::No se pudo usar la clave privada. Revisa el almacén, VF_SIGNING_ALIAS y ambas contraseñas.'
  exit 1
fi
keytool -exportcert -keystore "$VF_SIGNING_STORE" \
  -alias "$VF_SIGNING_ALIAS" -storepass:env VF_SIGNING_STORE_PASSWORD \
  -file "$signing_dir/certificate.der" > "$signing_dir/cert-export.log" 2>&1
actual=$(sha256sum "$signing_dir/certificate.der" | cut -d ' ' -f 1)
expected=$(python3 - <<'PY'
import os,re
value=os.environ['VF_SIGNING_CERT_SHA256'].strip()
value=re.sub(r'^SHA-?256\s*:\s*','',value,flags=re.I)
print(re.sub(r'[:\s]','',value).lower())
PY
)
if [[ ! $expected =~ ^[0-9a-f]{64}$ || "$actual" != "$expected" ]]; then
  echo '::error::VF_SIGNING_CERT_SHA256 no coincide con el certificado del almacén. No se entrega ningún archivo firmado.'
  exit 1
fi
if [[ ${VF_SIGNING_ALIAS,,} == androiddebugkey ]]; then
  echo '::error::No se permite distribuir con la clave debug de Android.'
  exit 1
fi
if [[ ${1:-} == --check ]]; then
  echo 'Cinco secretos disponibles; almacén, alias, contraseñas y certificado verificados.'
  exit 0
fi

(cd android && bash gradlew --no-daemon assembleRelease bundleRelease lintRelease)
apksigner="$ANDROID_HOME/build-tools/36.0.0/apksigner"
apk=android/app/build/outputs/apk/release/app-release.apk
aab=android/app/build/outputs/bundle/release/app-release.aab
"$apksigner" verify --verbose --print-certs "$apk" > "$signing_dir/apk-verification.txt"
python3 - "$signing_dir/apk-verification.txt" "$actual" <<'PY'
from pathlib import Path
import re,sys
certificates=re.findall(r'^Signer #\d+ certificate SHA-256 digest: ([0-9a-f]+)$',Path(sys.argv[1]).read_text(),re.M|re.I)
if [c.lower() for c in certificates] != [sys.argv[2]]:
    raise SystemExit('::error::El certificado del APK no coincide con el único firmante esperado.')
PY
java scripts/VerifyBundleSignature.java "$aab" "$actual" > "$signing_dir/aab-verification.txt"
"$ANDROID_HOME/build-tools/36.0.0/aapt" dump badging "$apk" > "$signing_dir/apk-metadata.txt"
if grep -q 'application-debuggable' "$signing_dir/apk-metadata.txt"; then
  echo '::error::El APK no debe ser depurable.'
  exit 1
fi

# Only verified public outputs are copied. The private store never leaves the temporary directory.
mkdir -p artifacts/distribucion
cp "$apk" artifacts/distribucion/ViajaFacil-firma-fija.apk
cp "$aab" artifacts/distribucion/ViajaFacil-firma-fija.aab
cp "$signing_dir/apk-verification.txt" artifacts/distribucion/APK-FIRMA.txt
cp "$signing_dir/aab-verification.txt" artifacts/distribucion/AAB-FIRMA.txt
cp "$signing_dir/apk-metadata.txt" artifacts/distribucion/APK-METADATA.txt
python3 - <<'PY'
import json,os
from pathlib import Path
Path('artifacts/distribucion/BUILD.json').write_text(json.dumps({
    'commit':os.getenv('GITHUB_SHA'),'branch':os.getenv('GITHUB_REF_NAME'),
    'run':os.getenv('GITHUB_RUN_ID'),'secretsValidated':5,'apkCertificateVerified':True,
    'aabCertificateVerified':True,'published':False},indent=2))
PY
(cd artifacts/distribucion && sha256sum *.apk *.aab > SHA256.txt)
echo 'APK y AAB release firmados con el mismo certificado, verificados y preparados como artefactos. Sin publicación.'

