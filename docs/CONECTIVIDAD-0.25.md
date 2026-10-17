# ViajaFácil 0.25.0

Base: `d008f881cc5eb28ff931f8c7f0f98405b62ef366`, versión 0.24.0 de `codex/auditoria-android-2026-10-15`. Main es anterior y no se ha modificado. Trabajo en `codex/conectividad-divisas-0-25`.

## Implementación

- Corregida la caché PWA: los scripts y estilos locales con modo no-cors también se sirven sin conexión; se mantiene la exclusión de recursos de otros orígenes.
- Nueva sección Móvil, moneda y pagos, accesible desde Consultas y Preparativos, para todos los países reconocidos. Reutiliza destino y país guardados; infiere un conjunto limitado de ciudades inequívocas si falta país. Un país explícito tiene prioridad.
- Diez operadores españoles y nueve bancos. Preferencias locales globales reutilizadas entre viajes; sin credenciales ni datos bancarios sensibles. Guía regulatoria y respuestas por operador para Reino Unido con fuentes oficiales consultadas el 17/10/2026. No se afirma conocer el contrato del usuario.
- Comparación de coste extra de roaming y coste total SIM/eSIM con importes confirmados por el usuario, aislada por viaje y país. No contrata servicios ni recomienda afiliados.
- Moneda y código para destinos catalogados, conversión EUR ↔ moneda local mediante Frankfurter v1, fecha de referencia, hora de consulta y fuente; último cambio validado conservado sin red. No confunde referencia con precio bancario. Sin conexión inicial o moneda no cubierta, indica ausencia de cambio.
- Orientación sobre efectivo, cajeros, comisiones, conversión dinámica y selección de moneda local. No garantiza gratuidad ni operación de cajeros.
- Trámites añadidos: Singapur, Corea del Sur, Vietnam e Indonesia. Estados de información, avisos EES/ETIAS y requisitos sanitarios individuales sin inferencias de obligatoriedad.
- Transporte: París/CDG/Orly, Lisboa/LIS, Berlín/BER; consultas de tren, metro y autobús, billetes, aplicaciones y pago. Conserva catálogos y funciones anteriores.

## Archivos

`travel-money.js`, `travel-money-ui.js`, `index.html`, `sw.js`, `scripts/build.mjs`, `native/{entry.js,geo-fetch.mjs}`, `entry-procedures{,-ui}.js`, `transport-{core,ui}.js`; versiones en `package*.json` y `android/app/build.gradle`; suites `tests/{money.test.cjs,browser.cjs,transport.test.cjs}` y `AndroidSmokeTest.java`; workflows Android y scripts de consulta de fuentes, firma y actualización. El script de firma solo adapta la rama autorizada: conserva los cinco secretos y todas las comprobaciones criptográficas.

## Servicios y limitaciones

Frankfurter es el único servicio nuevo de datos. Su API pública no necesita clave y es gratuita; no se añade backend, publicidad, afiliación ni coste recurrente. Se envía el código de moneda, no datos del viaje ni proveedores seleccionados. Android usa CapacitorHttp restringido al endpoint, la PWA usa fetch.

No hay cobertura universal de monedas/cambios ni de aeropuertos. Las tarifas personales, límites exactos y condiciones migratorias requieren confirmar el contrato/perfil en la fuente oficial. Los enlaces pueden bloquear consultas automatizadas o cambiar; un HTTP 200 no acredita condiciones. La comprobación de fuentes conserva fecha y resultado HTTP en `money-sources.json`. La app no tramita visados, reserva transportes ni efectúa pagos. Wallet fuera de alcance.

Las preferencias y la caché se guardan en claves `vf8-`, incluidas por las copias v1 existentes, sin copiarlas como si fueran exclusivas de un viaje. Las comparaciones usan claves `vf-` en el snapshot de cada viaje. Se mantiene el origen `https://localhost`, applicationId `com.viajafacil.app`, versionCode 9 y versionName 0.25.0.

## Validación

Pruebas locales de datos/sintaxis y rechazo de firmas ejecutadas. GitHub Actions ejecuta regresión de navegador, auditoría de dependencias, sync Capacitor, compilación, lint, firma persistente y pruebas en Android API 35. La prueba de fallback de divisas simula un rechazo del transporte nativo para que la conexión del emulador no falsee el resultado; la PWA también se prueba con la red completamente desactivada. La prueba de actualización descarga el APK 0.24.0 de la ejecución 39015639867, compara identificador/certificado/versionCode ejecuta `adb install -r` y compara byte a byte los archivos localStorage de WebView creados por la versión anterior antes del primer arranque nuevo. La imagen userdebug permite leer únicamente estos archivos de prueba con adb root. No es una copia de los datos del teléfono del usuario. Consultar la ejecución final y sus informes; no interpretar la existencia del script como prueba superada.
