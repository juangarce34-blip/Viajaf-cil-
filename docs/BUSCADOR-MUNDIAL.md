# Buscador mundial · 0.19.0

Problema comunicado: en Destinos, escribir «China» con Asia seleccionado no producía resultados. El buscador anterior solo filtraba seis tarjetas destacadas y no consultaba destinos mundiales.

Corrección:

- Países y territorios: 249 identificadores ISO 3166-1 más Kosovo, con nombres españoles e ingleses y códigos. Consulta local sin conexión; admite tildes, nombres parciales y variantes como EEUU. Los nombres se generaron con `Intl.DisplayNames` (Unicode CLDR), y los códigos proceden de los datos ISO del sistema. Las denominaciones no constituyen información de requisitos ni estatus jurídico.
- Ciudades y localidades: consulta explícita con botón o Enter al mismo servicio Geoapify que ya utilizaba la aplicación. No hay consultas remotas por cada pulsación, clave nueva, cuenta ni servicio de pago añadido. Se reutilizan caché de 24 horas y transporte nativo Android existente.
- Se muestran los resultados con su país para desambiguar nombres iguales. La cobertura, nombres y disponibilidad dependen del proveedor; una muestra satisfactoria no acredita todos los lugares del mundo.
- Cualquier nombre puede pasarse directamente al formulario del viaje aunque no figure en el catálogo o falle la red. Esta opción no lo presenta como ubicación verificada y permite indicar el país después.
- Los filtros de continente solo afectan a las seis sugerencias destacadas; nunca excluyen países o resultados del buscador mundial.
- Seleccionar exige la confirmación ya existente antes de cambiar el destino del viaje activo. No elimina actividades, días ni notas. Se descartan respuestas de consultas antiguas cuando cambia el texto o el viaje.
- Los módulos se incluyen en el APK y en la caché de la PWA. Versión Android 0.19.0, versionCode 3. Se mantiene el bloqueo de entrega de APK con firma efímera: la clave fija sigue pendiente de configurar y no se publica automáticamente.

Cobertura de validación: pruebas de países y desambiguación; regresión en navegador con China, confirmación/cancelación, persistencia, Santiago en dos países, conservación de itinerario, destino manual, caída del servicio y respuestas tardías. Diagnóstico no bloqueante con tres consultas reales (Asia, América y Oceanía), conservando el informe en `destination-live.json`. Compilación Android, análisis y arranque sin conexión en emulador mediante los workflows existentes.

## Resultado de las verificaciones

- Código de la aplicación: `85c8187858cc115ded030a4eb7b2c4780d674041`. Ajuste de la prueba de confirmación: `ded5714fe2883a5b7a72fb6bddeebb4e0e67aa0a`.
- [CI Android y navegador 38926872548](https://github.com/juangarce34-blip/Viajaf-cil-/actions/runs/38926872548): correcto; pruebas de datos, regresión en navegador, sincronización web, APK debug interno, AAB, lint y verificación de firma.
- [Emulador Android 38925736314](https://github.com/juangarce34-blip/Viajaf-cil-/actions/runs/38925736314): correcto sobre el mismo código de aplicación; el commit posterior solo ajusta la prueba de navegador. Arranque y persistencia sin conexión y cancelación de exportación grande.
- Las consultas reales resolvieron Shanghái (China), Ushuaia (Argentina) y Queenstown (Nueva Zelanda), HTTP 200. No acredita cobertura exhaustiva ni disponibilidad futura.
- La primera regresión falló por un manejador de diálogo pendiente de una prueba gastronómica anterior: la copia al presupuesto vacío no abría confirmación. Se corrigió la prueba para sustituir un importe previo, consumir su confirmación y comprobar después la cancelación del cambio de destino. La regresión final pasó.
- El build local no pudo iniciarse por `esbuild` ausente y el proxy local no era accesible; la compilación y las pruebas de navegador se ejecutaron con dependencias fijadas en GitHub Actions.
- No se entregó APK nuevo: faltan los secretos de firma fija. No hay publicación, despliegue ni modificación de main. El buscador de la app ya instalada permanece igual hasta instalar una versión nueva.
