# Auditoría y registro de correcciones — 15/10/2026

Base: `juangarce34-blip/Viajaf-cil-`, main `b4c713c4d52c829e6d9fef5029eef03e8e8e3896`. Rama de trabajo: `codex/auditoria-android-2026-10-15`.

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

## Pendientes y esfuerzo

Estimación inicial total: 6–10 jornadas de integración y calidad, condicionada al funcionamiento del servicio externo y al entorno de compilación. La entrega de prueba requiere CI correcto y validación en Android. La preparación de publicación añade firma privada, documentación de Play y validación final; el tiempo de revisión de Google no está incluido.

Riesgos pendientes: backend externo sin fuentes en este repo, disponibilidad/cuotas/CORS desde Android, contenido y precios estáticos, fotos remotas y atribuciones, almacenamiento no cifrado de la PWA, datos corruptos preexistentes y migración mediante copia. Consultar [ANDROID.md](ANDROID.md) para pruebas de aceptación y preparación del AAB.
