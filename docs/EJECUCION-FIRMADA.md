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

Las pruebas utilizan claves desechables para aceptar la configuración válida y rechazar secretos ausentes, base64 incorrecto, contraseñas/alias erróneos, otra huella, ejecución desde PR/main, AAB sin firma y AAB manipulado. Las pruebas usan el ejecutable jarsigner o el módulo equivalente de JDK 21 cuando ese ejecutable no está en PATH.

La disponibilidad de los secretos se comprueba mediante el job de Actions; la conexión usada no puede leer ni enumerar secretos. No se pide compartirlos por chat.

## Instalación

El APK firmado se puede instalar directamente en una instalación nueva. Las versiones 0.17/0.18 anteriores usaban certificados debug diferentes: no admiten actualización directa con la clave fija. Exportar viajes, comprobar la copia y solo entonces sustituir la instalación e importar. Las actualizaciones futuras deben mantener identificador/clave y aumentar versionCode. El AAB queda preparado como archivo de subida; publicarlo en Google Play requiere autorización y los trámites de Play App Signing.

## Generar base64 con PowerShell

Usar el archivo privado original, sin codificar el texto de su ruta ni copiar los asteriscos con los que GitHub oculta un secreto. Este comando no imprime el valor; lo copia al portapapeles para pegarlo directamente en la configuración del secreto de GitHub:

```powershell
$vfKeystorePath = 'C:\ruta\ViajaFacil.jks'
[Convert]::ToBase64String([IO.File]::ReadAllBytes($vfKeystorePath)) | Set-Clipboard
```

El lector admite saltos de línea, comillas de copia, envoltura certutil y ausencia de padding; después exige igualmente almacén válido, clave privada y certificado fijado. Nunca genera ni sustituye la clave para conseguir que pase una comprobación. Si un secreto es incorrecto, la ejecución falla sin entregar APK/AAB.

## Comprobaciones iniciales (intento 1)

Código de la solución: `3fce5fdfe73efed3ffd145e8c8278917e4b63296`.

- [Primera ejecución 38967078809](https://github.com/juangarce34-blip/Viajaf-cil-/actions/runs/38967078809): el push de la rama sí inició el workflow. Los cinco secretos no estaban vacíos, pero el almacén no se pudo decodificar como base64.
- [Segunda ejecución 38967464543](https://github.com/juangarce34-blip/Viajaf-cil-/actions/runs/38967464543): mismo rechazo, incluso admitiendo los formatos de copia habituales. Se detuvo en el paso Validar los cinco secretos de firma, antes de las dependencias y de la compilación.
- Esto prueba la disponibilidad de los cinco nombres, no la validez de las dos contraseñas, alias o huella de los secretos reales: esas comprobaciones dependen de poder abrir el almacén.
- Pruebas locales con claves desechables: configuración válida; base64 multilinea/certutil/comillas/padding; rechazo de credenciales incorrectas, otra huella, PR/main, AAB sin firma, AAB con entradas añadidas o contenido manipulado. Todas correctas. Las 26 pruebas de datos existentes también pasan.
- No se han generado APK/AAB firmados reales en estas ejecuciones. No se declara completada la firma. Falta sustituir VF_SIGNING_KEYSTORE_BASE64 por los bytes del archivo privado original codificados correctamente y reejecutar el job fallido.
- Main verificada sin cambios: `b4c713c4d52c829e6d9fef5029eef03e8e8e3896`. No se modificó su rama ni se publicó ningún producto.

Una vez corregido el secreto, usar Re-run jobs en la segunda ejecución, o reejecutar únicamente su job fallido. Se conserva el código de la solución y se vuelve a validar el almacén antes de compilar. El certificado fijado impide aceptar una clave distinta por accidente.

## Entrega firmada confirmada (intento 2)

Tras corregir el secreto en GitHub, se reejecutó únicamente el job fallido. [Ejecución 38967464543, intento 2](https://github.com/juangarce34-blip/Viajaf-cil-/actions/runs/38967464543/attempts/2): **correcta**. Código `3fce5fdfe73efed3ffd145e8c8278917e4b63296`, rama `codex/auditoria-android-2026-10-15`.

Los cinco secretos se utilizaron correctamente: almacén base64, alias, contraseña del almacén, contraseña de la clave y huella esperada. La comprobación previa pasó, se ejecutaron las pruebas de datos, navegador y firma y se construyeron APK y AAB release. Ambos certificados coinciden con la huella fijada; el APK no es depurable. El verificador del AAB comprobó todas las entradas de contenido firmadas.

Artefacto de CI: **ViajaFacil-Android-firma-fija**, ID `12076325459`, retención 30 días. Contiene APK, AAB, certificados públicos/verificaciones, metadatos y hashes; no contiene el almacén privado ni contraseñas. BUILD.json registra cinco secretos validados y las dos verificaciones correctas.

Certificado público SHA-256, extraído de los archivos finales:

`1119e73a9d7343c1879a612c918fed5a349d47dc8d41fdb491704d83aa27c55f`

SHA-256 de los binarios entregados (el renombrado no modifica sus bytes):

- APK 0.21.0, applicationId `com.viajafacil.app`, versionCode 5: `0e242afd26fa64939f234a78f878f031a4f993ba9ff3523d6a658a65e8a95bda`.
- AAB 0.21.0 firmado: `d599037ffe0f7ae98e185255d4f5e65eb217731cbbfe05d65621a3baabca0e84`.

Se descargó el artefacto, se recalcularon los hashes, se comprobó localmente el certificado del APK con keytool y se volvió a verificar criptográficamente el AAB con VerifyBundleSignature.java. Todo correcto. La clave privada no se descargó ni se expuso.

Entrega local: `/workspace/viajafacil-entrega-0.21-firmada/`; paquete `/workspace/ViajaFacil-Android-0.21.0-firmada.zip`, con instrucciones para migrar desde los APK debug anteriores.

Main continúa en `b4c713c4d52c829e6d9fef5029eef03e8e8e3896`. No hay modificación de main, release publicada, subida a Google Play ni despliegue web. El AAB firmado queda preparado para revisión; la publicación y Play App Signing siguen requiriendo decisión del propietario. Esta ejecución no sustituye las pruebas de instalación y actualización en el móvil.
