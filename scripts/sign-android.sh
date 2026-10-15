#!/usr/bin/env bash
set -euo pipefail

# CI debug keys are temporary. Only distribute APKs signed by the pinned key.
configured=0
for variable in VF_SIGNING_KEYSTORE_BASE64 VF_SIGNING_STORE_PASSWORD VF_SIGNING_ALIAS VF_SIGNING_KEY_PASSWORD VF_SIGNING_CERT_SHA256; do
  if [[ -n ${!variable:-} ]]; then configured=$((configured + 1)); fi
done
if [[ $configured -eq 0 ]]; then
  echo '::notice::Firma fija pendiente: solo se generan informes y AAB sin firma. No distribuir el APK debug.'
  exit 0
fi
if [[ $configured -ne 5 ]]; then
  echo '::error::Configuración de firma incompleta: se requieren los cinco secretos VF_SIGNING_*.'
  exit 1
fi

umask 077
signing_dir=$(mktemp -d)
trap 'rm -rf "$signing_dir"' EXIT
export VF_SIGNING_STORE="$signing_dir/distribution.jks"
python3 - <<'PY'
import base64, os
from pathlib import Path
Path(os.environ['VF_SIGNING_STORE']).write_bytes(base64.b64decode(
    os.environ['VF_SIGNING_KEYSTORE_BASE64'], validate=True))
PY
unset VF_SIGNING_KEYSTORE_BASE64

# Pin the public certificate before compiling, so an accidental key replacement fails.
keytool -exportcert -keystore "$VF_SIGNING_STORE" \
  -alias "$VF_SIGNING_ALIAS" -storepass:env VF_SIGNING_STORE_PASSWORD \
  -file "$signing_dir/certificate.der" >/dev/null
actual=$(sha256sum "$signing_dir/certificate.der" | cut -d ' ' -f 1)
expected=$(printf '%s' "$VF_SIGNING_CERT_SHA256" | tr -d ':[:space:]' | tr '[:upper:]' '[:lower:]')
if [[ ! $expected =~ ^[0-9a-f]{64}$ || "$actual" != "$expected" ]]; then
  echo '::error::La clave no coincide con el certificado fijado. No se entrega ningún APK.'
  exit 1
fi

(cd android && bash gradlew --no-daemon assembleRelease bundleRelease lintRelease)
apksigner="$ANDROID_HOME/build-tools/36.0.0/apksigner"
apk=android/app/build/outputs/apk/release/app-release.apk
"$apksigner" verify --verbose --print-certs "$apk" > "$signing_dir/verification.txt"
grep -Fqi "Signer #1 certificate SHA-256 digest: $actual" "$signing_dir/verification.txt"
mkdir -p artifacts/distribucion
cp "$apk" artifacts/distribucion/ViajaFacil-firma-fija.apk
cp android/app/build/outputs/bundle/release/app-release.aab artifacts/distribucion/ViajaFacil-firma-fija.aab
cp "$signing_dir/verification.txt" artifacts/distribucion/CERTIFICADO.txt
(cd artifacts/distribucion && sha256sum *.apk *.aab > SHA256.txt)
