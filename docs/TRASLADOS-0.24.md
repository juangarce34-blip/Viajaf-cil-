# Traslados y transporte público · 0.24.0

## Comportamiento

- Datos estructurados en vuelos y alojamiento: aeropuertos de llegada y salida, terminales, fechas/horas locales, aeropuerto al volver a casa, nombre y dirección del hotel. Se reutilizan automáticamente al abrir llegada y regreso.
- No se asigna ningún aeropuerto por defecto. La vuelta usa el aeropuerto de salida; solo copia el de llegada cuando el usuario confirma «Vuelvo por el mismo aeropuerto».
- Llegada aeropuerto → hotel y vuelta hotel → aeropuerto con los puntos correctos en Google Maps, transporte público o carretera. La app no calcula calles, tarifas, incidencias, accesibilidad ni tiempos en directo; el usuario ajusta fecha/hora en el servicio externo.
- Respuestas sobre trenes, autobuses, taxis y traslados, según aeropuerto. Fuentes oficiales del aeropuerto/operador, referencias de precios únicamente donde se han contrastado y fecha de revisión visible.
- Webs de transporte urbano para Nueva York, Londres, Los Ángeles, Roma, Madrid, Barcelona y Tokio. En cada actividad diaria, enlace al transporte público desde el hotel o desde la actividad anterior. Las ubicaciones por nombre se revisan en mapas.
- Opciones previstas guardadas; no son reservas ni acreditan disponibilidad. El contexto de un traslado cambia al editar aeropuerto, dirección, terminal, horario o elección y la etapa general vuelve a quedar pendiente.
- Último tramo aeropuerto de llegada a casa → origen del viaje cuando se indican ambos puntos. No se supone que ese aeropuerto esté en el municipio de origen.
- Guardado local por viaje y destino (`vf-transport-v1`, hasta ocho destinos recientes), recarga y copias v1. No se solicitan claves ni servicios de pago. No hay llamadas, solicitudes, reservas ni envíos de direcciones a terceros hasta que el usuario abre el enlace correspondiente.
- Notas y reservas anteriores se conservan como contenido opcional; no se interpretan como direcciones ni códigos de aeropuerto. Un campo antiguo de dirección del alojamiento se recupera únicamente en el primer contexto, sin reutilizarlo automáticamente al cambiar de destino.

## Alcance inicial

11 aeropuertos: JFK, EWR, LGA, LHR, LGW, LAX, FCO, CIA, MAD, BCN y NRT. Siete ciudades con red local. Un aeropuerto manual permite consultar el recorrido sin heredar otra ficha. Los aeropuertos conocidos que no coinciden con el país del destino se señalan y se bloquea la ruta hasta comprobar el contexto. Aeropuertos en otra ciudad del mismo país generan un aviso, ya que puede tratarse de un viaje entre ciudades.

El catálogo no cubre todos los aeropuertos del mundo ni garantiza rutas de puerta a puerta dentro de la app. Heathrow/TfL y ADR pueden bloquear la consulta automatizada aunque sus páginas oficiales estén identificadas. Para Ciampino se enlaza el portal de transporte de ADR sin inventar líneas, horarios ni tarifas. La app no conoce retrasos de vuelos ni calcula una hora garantizada de salida del hotel; indica comprobar facturación, controles, horarios y margen.

## Fuentes consultadas el 17/10/2026

- JFK: https://www.jfkairport.com/transportation/airtrain · https://www.jfkairport.com/transportation/taxi-service · https://www.jfkairport.com/transportation/van-shuttle-service
- Newark: https://www.newarkairport.com/transportation · https://www.newarkairport.com/transportation/taxi-service
- LaGuardia: https://www.laguardiaairport.com/transportation/public-transport · https://www.laguardiaairport.com/transportation/van-shuttle-service
- Heathrow: https://www.heathrow.com/transport-and-directions/getting-to-central-london · https://www.heathrow.com/transport-and-directions/by-taxi-or-mini-cab
- Gatwick: https://www.gatwickairport.com/transport-options/train.html · https://www.gatwickairport.com/transport-options/taxi.html
- LAX: https://www.flylax.com/flyaway-bus · https://www.flylax.com/lax-traffic-and-ground-transportation
- Fiumicino: https://www.trenitalia.com/es/conexiones/conexiones-con-los-aeropuertos/leonardo-express.html · https://romamobilita.it/muoversi-a-roma/taxi/
- Ciampino: https://www.adr.it/trasporti-cia · confirmación del teléfono municipal de taxi en https://www.comune.roma.it/web/it/scheda-servizi.page?contentId=INF1108290
- Madrid: https://www.aena.es/es/adolfo-suarez-madrid-barajas/como-llegar/autobus.html · https://www.aena.es/es/adolfo-suarez-madrid-barajas/como-llegar/taxi.html
- Barcelona: https://www.aena.es/es/josep-tarradellas-barcelona-el-prat/como-llegar/tren.html · https://www.aena.es/es/josep-tarradellas-barcelona-el-prat/como-llegar/autobus.html · https://www.aena.es/es/josep-tarradellas-barcelona-el-prat/como-llegar/taxi.html · https://www.aena.es/es/josep-tarradellas-barcelona-el-prat/como-llegar/vtc.html
- Narita: https://www.narita-airport.jp/en/access/ · https://www.narita-airport.jp/en/access/train/
- Redes locales: https://www.mta.info/maps · https://tfl.gov.uk/plan-a-journey/ · https://www.metro.net/riding/trip-planner/ · https://www.atac.roma.it/ · https://www.crtm.es/ · https://www.tmb.cat/es/home · https://www.tokyometro.jp/en/subwaymap/index.html

Teléfono ChiamaTaxi Roma: +39 06 0609, finalidad identificada por la autoridad municipal. No se presenta el 311 de Nueva York como teléfono de reserva. Airlink New York (+1 212 812 9000, https://www.goairlinkshuttle.com/) está enlazado por el directorio de JFK; Airport Cars Gatwick (https://www.airportcars-gatwick.com/) por Gatwick. Son empresas privadas, sin afiliación ni integración de contratación.

Referencias puntuales: Trenitalia publica 14 € y 32 minutos para el tramo Leonardo express Fiumicino–Termini; Aena publica 5 € para el Exprés Aeropuerto de Madrid. No son un presupuesto completo de grupo, puerta a puerta ni tarifas comprobadas en tiempo real para la fecha de cada viaje. No se incorporan como importes confirmados al presupuesto.

Se han descartado rutas web que devolvían 404 (por ejemplo, el antiguo punto de entrada del planificador MTA); no se sustituyen por URLs inventadas. LA Metro enlaza a su planificador externo desde su propia página.

## Pruebas y entrega

40 pruebas unitarias locales correctas. Regresión ampliada: reutilización vuelo/hotel, sentido de rutas, aeropuertos distintos, confirmación de mismo aeropuerto, elección sin reserva, recarga, copias, aislamiento de viaje/destino, teléfono municipal, aeropuerto manual y anchuras móviles. Emulador, navegador y compilación firmada pendientes de ejecución en Actions al registrar esta fase.

Android 0.24.0, versionCode 8; mismo paquete y firma persistente. Trabajo exclusivo en rama de desarrollo, sin modificar main ni publicar.

## Pendientes siguientes

Ampliar aeropuertos y redes, cobertura de taxi con teléfonos comprobados y operadores, accesibilidad detallada, precios por grupo y actualizaciones de incidencias. Continúan pendientes la ampliación del catálogo de permisos a todos los destinos, respuestas de telefonía/divisas/bancos por país y la identidad del icono. El proveedor gastronómico externo conserva su limitación anterior; esta entrega no la soluciona.
