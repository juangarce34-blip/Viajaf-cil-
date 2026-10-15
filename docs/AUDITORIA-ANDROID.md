# Auditoría y registro de correcciones — 15/10/2026

Base: `juangarce34-blip/Viajaf-cil-`, main `b4c713c4d52c829e6d9fef5029eef03e8e8e3896`. Rama de trabajo: `codex/auditoria-android-2026-10-15`.

## Resultado de entrega de prueba

Código verificado: `7cffc964bf84dea66746a891a04b93980025258c`. Android integrado sobre la aplicación existente; APK de prueba generado y AAB sin firma de distribución. Sin publicación, merge en main, anuncios, pagos ni implementación de wallet.

| Comprobación final | Resultado |
| --- | --- |
| Node: datos, restauración y adaptador HTTP | 15 pruebas correctas |
| Chromium: regresión de funciones existentes | 6 grupos correctos, sin errores JavaScript |
| Android 15/API 35 en emulador | 2 pruebas correctas: arranque sin conexión/persistencia y selector/cancelación de copia de 2 MB con Bundle acotado |
| Gradle | APK, pruebas unitarias Android, lint y AAB correctos |
| Lint | 0 errores, 14 advertencias no bloqueantes; informes conservados |
| Auditoría npm de dependencias de ejecución | 0 vulnerabilidades registradas |
| Backend existente | Respuesta 200 y ciudades válidas; CORS no admite localhost, consulta Android adaptada a CapacitorHttp |
| Firma del APK | Debug válida, verificada con apksigner |
| SHA-256 del APK descargado | `61c0037331578ede422dd17adaa4f319ae4ad242dc097b4c1f17e51b48e501d5` |

[Compilación y artefactos](https://github.com/juangarce34-blip/Viajaf-cil-/actions/runs/38821245807) · [Pruebas en emulador](https://github.com/juangarce34-blip/Viajaf-cil-/actions/runs/38821245770).

La auditoría npm cubre dependencias de ejecución, no garantiza ausencia de vulnerabilidades desconocidas. Las advertencias de lint corresponden a versiones disponibles, recursos de plantilla y forma/duplicación de iconos. No hay errores de lint ocultados.

Pendiente antes de distribución: validación en móvil físico, guardado real del documento con distintos proveedores del selector, apertura de enlaces, búsqueda real desde el APK y teclado/rotación/accesibilidad. La conexión nativa tiene pruebas de adaptador y el backend una consulta real; no se ha certificado todavía el flujo completo de búsqueda en un móvil. Para Play faltan clave privada de subida, firma del AAB, ficha/política de privacidad y validación final. Los artefactos de CI caducan a los 30 días.

## Estado inicial

Se inspeccionaron los seis archivos del árbol completo de main: `index.html` (interfaz, estilos y cuatro scripts internos), `geo-planner.js`, `manifest.webmanifest`, `sw.js` y dos PNG. No había AGENTS.md, README, gestor de dependencias, tests, proyecto Android, firma o configuración APK/AAB. PWA en HTML/CSS/JavaScript, almacenamiento local y servicios externos; sin framework ni backend propio incluido. El último despliegue GitHub Pages estaba correcto; no equivale a pruebas funcionales o compilación Android.

Funciones conservadas: viajes múltiples; destino y fechas; guías específicas de Londres y planificación general mundial; presupuesto; operadores/bancos y enlaces oficiales; parking; consultas de vuelos y alojamiento; checklist; notas; itinerario local; organizador editable por días; propuestas por cercanía de Geoapify/OpenStreetMap; exportación/importación JSON.

## Cambios realizados

| Hallazgo | Corrección |
| --- | --- |
| Sin integración Android | Proyecto Capacitor a partir de la plantilla oficial 7.4.3; web incluida, Gradle y SDK configurados |
| Descarga web mediante Blob sin adaptación Android | Plugin local que guarda mediante selector de documentos del sistema |
| Atrás no conoce las secciones de la SPA | Historial de secciones, formulario con confirmación y minimización desde Inicio |
| Copias validaban formato general pero no estructura del itinerario | Validador compartido: días, actividades, IDs, campos y costes; rechazo antes de modificar almacenamiento |
| Se podían crear más viajes de los que admitía la restauración | Límite de creación consistente de 100 viajes |
| Exportación podía producir un JSON mayor que el límite de importación | Validación previa y límite de 5 MB también al exportar |
| Fallo de restauración mostraba mensaje ambiguo sobre recuperación | Diferencia entre rollback completado y recuperación incompleta |
| Service worker innecesario dentro de APK | Registro exclusivo de la PWA; caché web actualizada para incorporar backup.js |
| Sin pruebas o informes | Pruebas Node, regresión de navegador, análisis Android y artefactos de CI |

No se han eliminado secciones ni añadido pagos, anuncios o wallet. No se han modificado contenidos y tarifas oficiales sin verificación. No se ha publicado la aplicación.

## Entorno y evidencia

La terminal no pudo conectar con el proxy configurado (`EPERM`/conexión a puerto 8080). Las peticiones de permisos anteriores terminaron interrumpidas. Se recuperó el código y la plantilla mediante el conector autorizado de GitHub, sin cambiar la política de red ni desactivar TLS. La compilación se prepara en GitHub Actions para no depender de las descargas del entorno local. Esta vía no significa que se haya reparado la red de la terminal.

Las comprobaciones locales de sintaxis y las pruebas Node pasan. La ejecución de Chromium y el servidor de pruebas están bloqueados por las restricciones de sockets del entorno. El resultado de navegador, Gradle y lint debe comprobarse en el trabajo de CI y registrarse por commit. No se declara validación en dispositivo físico ni APK disponible hasta disponer del artefacto real.

Primera ejecución CI (`38819529596`): falló en la instalación predeterminada del paquete obsoleto `tools` de setup-android. Se corrigió solicitando únicamente `platform-tools`. Once pruebas locales cubren además confirmación, cancelación y recuperación de datos tras fallo de almacenamiento durante la restauración.

Segunda ejecución CI (`38819669068`, commit `086d940`): correcta. Once pruebas Node, cinco grupos de regresión en Chromium y compilación Gradle (`assembleDebug`, `testDebugUnitTest`, `lintDebug`, `bundleRelease`) completadas. APK `com.viajafacil.app`, versión 0.17.0, mínimo API 23 y objetivo API 36; firma debug verificada con esquemas v1/v2. SHA-256 del primer APK: `93fdddb98311d3793055bfc44f4a7ed885c6c2c7d99ba170127aac336ebda080`. El artefacto incluye AAB sin firma y lockfile recuperado para fijar dependencias.

Lint inicial: 0 errores y 16 advertencias. Se corrige orden del manifiesto y se añaden exclusiones explícitas de copia/transferencia para Android 12+. Quedan advertencias de versiones más recientes, recursos de plantilla y diseño de iconos; no se ocultan los informes. El análisis detecta además un permiso interno de firma de AndroidX, sin acceso adicional solicitado al usuario.

La captura sin imágenes remotas mostró pérdida de contraste en el encabezado principal. Se añade un color de fondo de reserva sin cambiar el diseño conectado. Se incorpora ajuste de márgenes para barras del sistema y prueba de instalación/arranque sin red en emulador; sus resultados se registrarán al completarse.

La ampliación de regresión para propuestas geográficas detectó que `.btn { display:block }` anulaba el atributo HTML `hidden` del botón de aceptar propuesta. Se corrige globalmente el respeto de `[hidden]` y se espera explícitamente a la respuesta asíncrona en la prueba. No se modifica el algoritmo de propuestas.

Se refuerza la exportación nativa de copias grandes: el contenido pasa a caché privada temporal y las opciones de la llamada solo guardan el nombre del archivo, evitando introducir hasta 5 MB en el Bundle de estado de Android. Se confirma éxito después de cerrar el archivo destino, se limpia la caché al guardar/cancelar y se añade prueba de apertura/cancelación con 2 MB y límite del Bundle.

Ejecución `38820427338` (commit `f3913fb`): once pruebas de datos, seis grupos de navegador y Gradle correctos. La consulta real al backend devuelve 200 con resultados válidos, pero no admite CORS desde `https://localhost`. Se adapta únicamente esa consulta al cliente `CapacitorHttp` incluido, con destino restringido y cancelación; la PWA mantiene su transporte.

El informe npm de esa ejecución detecta el aviso crítico [GHSA-rvm3-566m-v7fv](https://github.com/advisories/GHSA-rvm3-566m-v7fv) en `@capacitor/android <7.6.9`. Se actualizan Android, core y CLI a 7.6.9 antes de entregar. Los APK anteriores son evidencia de compilación, **no deben usarse como versión de entrega**. La auditoría de dependencias de ejecución bloqueará futuras compilaciones con avisos altos/críticos.

La prueba de aplicación en emulador API 35 del commit `c53a70a` pasó: 1 prueba, 0 fallos/errores. El job agregado falló después en las pruebas de ejemplo del módulo Cordova generado por clases Kotlin duplicadas; se acota la orden a `:app:connectedDebugAndroidTest`, que comprueba la aplicación real.

## Pendientes y esfuerzo

Estimación inicial total: 6–10 jornadas de integración y calidad, condicionada al funcionamiento del servicio externo y al entorno de compilación. La entrega de prueba requiere CI correcto y validación en Android. La preparación de publicación añade firma privada, documentación de Play y validación final; el tiempo de revisión de Google no está incluido.

Riesgos pendientes: backend externo sin fuentes en este repo, disponibilidad/cuotas/CORS desde Android, contenido y precios estáticos, fotos remotas y atribuciones, almacenamiento no cifrado de la PWA, datos corruptos preexistentes y migración mediante copia. Consultar [ANDROID.md](ANDROID.md) para pruebas de aceptación y preparación del AAB.
