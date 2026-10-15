# Android de ViajaFácil

Se conserva la PWA RC16 y su almacenamiento por viajes. Capacitor 7.6.9 incluye sus archivos en el APK, con origen estable `https://localhost`. No hay anuncios, compras, registro obligatorio ni servicios nuevos de pago. Identificador inicial: `com.viajafacil.app`; confirmar su disponibilidad antes de una publicación.

## Compilar

Requisitos: Node 22, Java 21, Android SDK 36 y build-tools 36.0.0. Gradle 8.13 y Android Gradle Plugin 8.13.2 están fijados en el proyecto.

```sh
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run android:sync
cd android
./gradlew assembleDebug testDebugUnitTest lintDebug bundleRelease
```

`package-lock.json` se recuperó de CI y se actualizó a Capacitor 7.6.9 tras corregir el aviso de seguridad documentado en la auditoría. CI usa `npm ci` para respetar también las versiones transitivas. No se incluye `node_modules` ni la configuración local del SDK.

APK: `android/app/build/outputs/apk/debug/app-debug.apk`.
AAB: `android/app/build/outputs/bundle/release/app-release.aab`.

Pruebas en dispositivo/emulador conectado: `./gradlew :app:connectedDebugAndroidTest`. La ejecución API 35 de entrega pasó las dos pruebas de arranque/persistencia y apertura/cancelación de copia grande; consultar la auditoría para los enlaces a informes. Los dispositivos antiguos necesitan Android System WebView actualizado para las API web modernas que ya utiliza la PWA.

El workflow **Android de prueba** compila en la rama independiente, conserva los informes y el APK durante 30 días y no publica en Google Play ni despliega GitHub Pages. El AAB de esta fase es **sin firma de distribución**. No se debe subir todavía a Google Play. La firma debug automática de CI puede cambiar entre ejecuciones; para actualizar una instalación debug existente puede ser necesario desinstalarla. Exportar antes los viajes para no perderlos.

## Archivos y datos

- El APK usa los mismos formatos de viaje y copia JSON v1 que la web.
- Exportar en Android abre `ACTION_CREATE_DOCUMENT`; no solicita permiso general de archivos ni deja una copia temporal pública.
- Las exportaciones pendientes usan caché privada para evitar el límite de tamaño del estado de Android. Se eliminan al guardar/cancelar; los restos abandonados se limpian después de un día al volver a cargar el componente.
- Importar conserva el selector de archivos de Capacitor/WebView, con validación y confirmación antes de sustituir viajes.
- La PWA y el APK tienen almacenes distintos. Para migrar: exportar en la web, guardar el JSON e importarlo en Android.
- No borrar datos de la aplicación ni desinstalarla sin exportar. El backup automático de Android está desactivado; no hay sincronización en la nube.
- Las copias JSON no están cifradas. El usuario elige dónde guardarlas; un proveedor elegido en el selector podría ser un servicio en la nube.
- Se conserva `https://localhost` para evitar cambios de origen que separen los datos en futuras actualizaciones.
- Android carga la interfaz desde el APK y no registra el service worker. La PWA mantiene el suyo, con versión de caché actualizada.
- Imágenes de Unsplash, búsquedas de lugares y enlaces externos requieren conexión. El servicio Geoapify compartido ya existía y su backend no está en este repositorio. No se garantiza su disponibilidad ni que sus condiciones sean gratuitas indefinidamente.

## Comportamiento Android

Atrás recorre las secciones abiertas, permite cancelar un formulario de actividad y minimiza desde Inicio. El paso a segundo plano intenta guardar el viaje. Los enlaces HTTPS se abren en el navegador externo. No se habilita tráfico HTTP ni contenido mixto. El único permiso funcional declarado es Internet; AndroidX añade un permiso interno de firma para sus receptores, sin solicitud al usuario.

Se habilita `adjustMarginsForEdgeToEdge: auto` para que las barras del sistema no tapen los controles en Android 15/16. El workflow **Android en emulador** instala en API 35, desactiva Wi-Fi/datos y comprueba arranque local, puente nativo, origen y persistencia al recargar. No sustituye la prueba manual del selector de archivos ni la prueba en dispositivo físico. El informe `service-check.json` registra una consulta real al servicio existente y su compatibilidad CORS con el origen Android; un aviso no se interpreta como servicio verificado.

El servicio de lugares responde pero no admite CORS para `https://localhost`. Android usa el cliente HTTP nativo incluido en Capacitor exclusivamente para ese endpoint HTTPS, con timeout y cancelación; la PWA conserva `fetch`. No se añade otro proveedor, clave en el navegador ni servidor de pago.

## Antes de entregar una versión de distribución

1. Probar instalación y actualización conservando datos con una misma clave, en dispositivo Android real y versiones mínima/reciente.
2. Verificar selector de archivos: exportar, cancelar, importar copia web, restaurar y denegar ubicación; teclado, gestos Atrás, márgenes del sistema, rotación y lector de pantalla.
3. Verificar el servicio de lugares desde el APK y errores sin conexión. Las pruebas del navegador simulan la respuesta fallida y no certifican el backend real.
4. Revisar vigencia de requisitos, tarifas, enlaces y atribuciones de fotos. No se han actualizado precios de terceros por suposición.
5. Confirmar identificador, versión, iconos y SDK objetivo exigido por Play en la fecha de envío.
6. Configurar clave de subida de forma privada y Play App Signing; firmar el AAB sin incluir claves ni contraseñas en Git.
7. Completar política de privacidad, seguridad de datos, clasificación, ficha y pruebas que pida Play. No afirmar ausencia de transferencias: imágenes y búsquedas contactan servicios externos.
8. Obtener autorización expresa para publicar. No existe automatización de publicación en esta rama.

## Wallet: evaluación, sin implementación

Viable como módulo local de PDF/imágenes asociado a cada viaje. Requiere almacenamiento privado, acceso sin conexión, cifrado y política de claves, límites de tamaño, borrado, selección explícita al compartir y un formato de copia propio (no `localStorage`). Un lector de códigos puede evaluarse después. No implica integración con Google Wallet, sincronización ni compras. Estimación inicial: 5–8 jornadas adicionales más validación de documentos. Pendiente de autorización.

## Incidente de instalación 0.17 → 0.18: firma diferente

Se verificaron ambos APK con `keytool -printcert -jarfile`. Los certificados SHA-256 son:

- 0.17: `C06C7D529C349E96EED7F2B7447755433C20BC68D8E3461F10D5D6EE48B86A83`.
- 0.18: `BC0775336DCD4F7CC1AA3351164A0E5FC4FFD8A0352427BA626E09D9B94A6AA5`.

La causa es la clave debug efímera generada en cada runner. Android rechaza actualizar el mismo paquete con un certificado distinto. Las claves anteriores no se conservaron: no se puede fabricar una actualización compatible a partir de sus certificados públicos.

Migración: exportar todos los viajes desde la instalación anterior, comprobar que el JSON está guardado fuera de la aplicación, desinstalar, instalar e importar. No desinstalar ni borrar datos antes de tener la copia. La primera instalación firmada con la futura clave fija también requiere esta migración si sustituye una versión debug.

Corrección: el workflow conserva las compilaciones debug para comprobaciones internas pero deja de incluir sus APK en los artefactos descargables. `ViajaFacil-Android-informes` contiene informes y el AAB; no es un instalador. Solo se genera `ViajaFacil-Android-firma-fija` cuando están configurados los cinco secretos siguientes. Una configuración parcial, un certificado diferente o una firma inválida bloquean la entrega.

### Activación pendiente por el propietario

En GitHub → Settings → Secrets and variables → Actions, configurar:

- `VF_SIGNING_KEYSTORE_BASE64`: almacén privado JKS/PKCS12 codificado en base64 en una sola línea.
- `VF_SIGNING_STORE_PASSWORD`: contraseña del almacén.
- `VF_SIGNING_ALIAS`: alias de la clave privada.
- `VF_SIGNING_KEY_PASSWORD`: contraseña de esa clave.
- `VF_SIGNING_CERT_SHA256`: huella SHA-256 del certificado, obtenida por `keytool -list -v` (admite dos puntos).

Si ya existe una clave oficial de la app, usarla; no generar otra sin comprobarlo. Si no existe, el propietario debe crear una clave duradera, guardar una copia y sus contraseñas en un almacén privado y configurar estos secretos. No enviarlos por chat ni guardarlos en Git, informes o artefactos. Esta conexión de GitHub no permite escribir secretos, por lo que la activación no se ha realizado.

Una vez configurados, volver a ejecutar **Android de prueba** sobre esta rama. El script reconstruye `release`, verifica certificado y APK, y entrega APK y AAB firmados sin publicar. En cada actualización, aumentar `versionCode` en `android/app/build.gradle`, conservar el identificador y la misma clave. Las claves se restauran solo en un directorio temporal con permisos privados y se eliminan al terminar. El AAB firmado queda preparado para revisión, sin subir a Google Play. Play App Signing requiere decidir la política de clave de subida y certificado de distribución antes de publicar.

Pendiente de validación: compilar con los secretos reales y probar una actualización firmada sobre otra con la misma clave conservando los viajes. La configuración preparada no certifica todavía esa actualización.
