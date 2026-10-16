# Ejecutar Android firmado sin modificar main

## Motivo del botón ausente

La rama predeterminada del repositorio es `main`, que no contiene `.github/workflows/`. El archivo `android.yml` está en `codex/auditoria-android-2026-10-15`. GitHub requiere que un workflow con `workflow_dispatch` exista en la rama predeterminada para admitir su ejecución manual. Tenerlo solo en la rama de trabajo no hace aparecer «Run workflow». No es un problema de los secretos ni se resuelve cambiando el selector de rama.

Fuente: [Ejecución manual de workflows — GitHub](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

No se añade nada a main ni se cambia la rama predeterminada. Se conserva `workflow_dispatch` para un futuro cambio aprobado; el botón seguirá ausente mientras no se cumpla la condición de GitHub.

## Solución utilizada

El workflow ya admite `push` exclusivamente sobre `codex/auditoria-android-2026-10-15`. Un commit de la revisión de firma en esa rama inicia la compilación completa con los secretos actuales. No crea releases, no sube a Google Play, no despliega webs ni modifica main.

Para repetir la misma compilación, abrir su ejecución en Actions y usar **Re-run jobs → Re-run all jobs**. Para construir código nuevo, subir sus cambios a la rama de Android. No es necesario crear una PR hacia main, cambiar la rama predeterminada o registrar un workflow en main.

## Uso de los cinco secretos

Los siguientes secretos de Actions deben estar disponibles para el repositorio. Si se crearon como secretos de un Environment, hay que decidir explícitamente qué Environment debe proteger el job; este workflow no los obtiene de un Environment arbitrario.

- `VF_SIGNING_KEYSTORE_BASE64`: almacén privado, base64 con o sin saltos de línea.
- `VF_SIGNING_STORE_PASSWORD`: contraseña del almacén.
- `VF_SIGNING_ALIAS`: alias de la clave privada.
- `VF_SIGNING_KEY_PASSWORD`: contraseña de la clave privada.
- `VF_SIGNING_CERT_SHA256`: huella pública SHA-256, con/sin dos puntos, espacios o prefijo SHA256.

Los secretos solo se entregan a dos pasos, ambos limitados al repositorio y rama autorizados y eventos push/workflow_dispatch. Las pull requests no reciben secretos de firma. El checkout no conserva credenciales Git. El script repite estas restricciones y bloquea main.

La comprobación inicial exige los cinco secretos (ya no permite saltarse silenciosamente la firma si faltan todos), decodifica el almacén, crea una solicitud de certificado temporal para comprobar el alias y las contraseñas y compara el certificado público con la huella fijada. No muestra contraseñas, alias ni base64. La clave no entra en Git ni en los artefactos; se restaura en un directorio temporal privado y se elimina al terminar, también si falla.

## Verificación de la entrega

El build `release` utiliza la configuración `stable` de Gradle con las variables `VF_SIGNING_STORE`, `VF_SIGNING_STORE_PASSWORD`, `VF_SIGNING_ALIAS` y `VF_SIGNING_KEY_PASSWORD`. El nombre y la ruta del archivo temporal no se usan como una clave nueva: siempre se restaura el almacén proporcionado.

- APK: `apksigner verify --verbose --print-certs`; exactamente un firmante, con la huella fijada. Se comprueba que el APK no sea depurable.
- AAB: `VerifyBundleSignature.java` lee cada entrada de contenido, exige una firma válida y compara su certificado con la misma huella. Así no se confunde un JAR sin firma con uno firmado aunque una herramienta termine con código 0.
- Solo después de verificar ambos se copian a `ViajaFacil-Android-firma-fija`: APK, AAB, informes públicos de certificado, metadatos, SHA256 de ambos archivos y `BUILD.json` con commit/rama/ejecución. La subida exige que existan los archivos.
- El artefacto de informes generales no incluye un AAB sin verificar, ni APK debug, ni almacén privado.

Las pruebas utilizan claves desechables para aceptar la configuración válida y rechazar secretos ausentes, base64 incorrecto, contraseñas/alias erróneos, otra huella, ejecución desde PR/main, AAB sin firma y AAB manipulado. El entorno local no tiene el ejecutable jarsigner completo: las pruebas que lo requieren se ejecutan en CI con JDK 21.

La disponibilidad de los secretos se comprueba mediante el job de Actions; la conexión usada no puede leer ni enumerar secretos. No se pide compartirlos por chat.

## Instalación

El APK firmado se puede instalar directamente en una instalación nueva. Las versiones 0.17/0.18 anteriores usaban certificados debug diferentes: no admiten actualización directa con la clave fija. Exportar viajes, comprobar la copia y solo entonces sustituir la instalación e importar. Las actualizaciones futuras deben mantener identificador/clave y aumentar versionCode. El AAB queda preparado como archivo de subida; publicarlo en Google Play requiere autorización y los trámites de Play App Signing.
