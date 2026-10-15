# Android de ViajaFácil

Se conserva la PWA RC16 y su almacenamiento por viajes. Capacitor 7.4.3 incluye sus archivos en el APK, con origen estable `https://localhost`. No hay anuncios, compras, registro obligatorio ni servicios nuevos de pago. Identificador inicial: `com.viajafacil.app`; confirmar su disponibilidad antes de una publicación.

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

`package-lock.json` se recuperó de la primera compilación correcta y se incorpora a la rama. CI usa `npm ci` para respetar también las versiones transitivas. No se incluye `node_modules` ni la configuración local del SDK.

APK: `android/app/build/outputs/apk/debug/app-debug.apk`.
AAB: `android/app/build/outputs/bundle/release/app-release.aab`.

El workflow **Android de prueba** compila en la rama independiente, conserva los informes y el APK durante 30 días y no publica en Google Play ni despliega GitHub Pages. El AAB de esta fase es **sin firma de distribución**. No se debe subir todavía a Google Play. La firma debug automática de CI puede cambiar entre ejecuciones; para actualizar una instalación debug existente puede ser necesario desinstalarla. Exportar antes los viajes para no perderlos.

## Archivos y datos

- El APK usa los mismos formatos de viaje y copia JSON v1 que la web.
- Exportar en Android abre `ACTION_CREATE_DOCUMENT`; no solicita permiso general de archivos ni deja una copia temporal pública.
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
