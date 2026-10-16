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

Validación prevista: pruebas de países y desambiguación; regresión en navegador con China, confirmación/cancelación, persistencia, Santiago en dos países, conservación de itinerario, destino manual, caída del servicio y respuestas tardías. Diagnóstico no bloqueante con tres consultas reales (Asia, América y Oceanía), conservando el informe en `destination-live.json`. Compilación Android, análisis y arranque sin conexión en emulador mediante los workflows existentes.
