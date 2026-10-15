# Gastronomía y previsión de costes — 0.18.0

Se añade «Dónde comer y tomar algo» al detalle del viaje, planificador por días, propuestas, planificación mundial, presupuesto y guía de comida de Londres. Conserva las actividades existentes al añadir un local al día elegido y rechaza añadirlo dos veces al mismo día.

## Datos y gratuidad

El endpoint Geoapify compartido existente devuelve 400 «Filtros no válidos» para restaurante, cafetería y bar/pub (consulta real en Los Ángeles, ejecución 38823145364). No se ha modificado ni publicado ese Site. Se inspeccionó mediante Sites, pero la integración final no necesita cambiarlo.

La geocodificación conserva ese servicio. La búsqueda gastronómica consulta datos abiertos OSM en [Overpass de Private.coffee](https://overpass.private.coffee/), que permite el uso gratuito sin registro. No se añade cuenta, clave del usuario, facturación ni publicidad. No se usa la instancia principal overpass-api.de, cuyas restricciones de uso son diferentes.

Consulta acotada a 1–3 km, 15 segundos de ejecución del servidor, 80 elementos y 2 MB de memoria del servidor; una petición simultánea, separación mínima de 30 segundos en la sesión y caché de 24 horas con ocho consultas como máximo. Los filtros se aplican localmente sin nuevas peticiones. No se envían notas, presupuesto ni GPS: solo el centro de la ciudad seleccionada y el radio. La pantalla enlaza las condiciones/privacidad del operador y la licencia de OpenStreetMap.

Son lugares presentes en OSM, sin reseñas, valoración ni precios certificados. Los enlaces de web proceden de las etiquetas OSM y se aceptan solo con HTTPS. El servicio gratuito puede no estar disponible; se muestran errores y límites sin reintentos masivos. La búsqueda no garantiza una lista exhaustiva ni que el local siga abierto.

## Costes

El calculador usa los importes que indica el usuario: viajeros × días × (comidas por día × previsión por comida + consumiciones por día × previsión por consumición), con el porcentaje de impuestos/propinas previsto. Calcula en céntimos y redondea el total. Está expresado en euros, coherente con el presupuesto existente; no convierte desde dólares ni obtiene cartas en tiempo real.

## Disponibilidad y alternativa comprobada

La prueba real del 15/10/2026 en Private.coffee devolvió HTTP 500 tanto con GET como con POST, también con una consulta simple y otro límite de memoria. Se conserva el informe de disponibilidad; no se declara que ese proveedor haya pasado una prueba real. La caída externa no impide compilar ni usar mapas, selección local y calculadora. El listado dinámico OSM sigue condicionado a que el proveedor vuelva a responder.

La sección incluye búsquedas directas de restaurantes, cafeterías y bares en Google Maps para cualquier destino. Para Los Ángeles de Estados Unidos incorpora además una selección local, identificada como guardada y no filtrada por radio, consultada en fuentes oficiales el 15/10/2026:

- [Bottega Louie DTLA](https://bottegalouie.com/dtla): 700 South Grand Avenue, Los Angeles, CA 90017.
- [Philippe The Original](https://philippes.com/): 1001 N. Alameda St., Los Angeles, CA 90012.
- [Verve Arts District](https://www.vervecoffee.com/pages/locations): 500 Mateo Street, Los Angeles, CA 90013. No se incluye la antigua sucursal de Spring Street, marcada como cerrada en la web oficial.
- [Seven Grand Los Angeles](https://www.sevengrandbars.com/la): 515 W 7th St, 2nd floor, Los Angeles, CA 90014.

No se copian precios ni horarios como si estuvieran vigentes en la fecha del viaje. No se inventan coordenadas: los enlaces de estos locales buscan la dirección oficial. Se pueden añadir al itinerario con precio pendiente, conservando las demás visitas.

Campos vacíos quedan pendientes, no son gratuidad. Se permite copiar el total completo al nuevo concepto «Comida y bebida» del presupuesto; si ya hay importe se solicita confirmación y se sustituye, no se suma dos veces. Los locales añadidos al itinerario mantienen precio pendiente; no se asigna a un restaurante el precio orientativo del usuario como si estuviera verificado. La configuración se conserva por viaje y en las copias JSON existentes.

Ejemplo de cálculo, no precios de Los Ángeles: 3 personas × 3 días × (2 comidas × 20 € + 1 consumición × 5 €), más un 10 % previsto = 445,50 €.

## Validación

Seis pruebas unitarias nuevas comprueban consultas acotadas, normalización, enlaces, costes desconocidos, redondeo, preservación de actividades, duplicados y restricción del cliente HTTP nativo. La regresión de navegador añade búsqueda, filtro, guardado de local sin borrar visitas, copia del cálculo y persistencia. `scripts/check-dining.mjs` realiza una consulta real de prueba en el centro de Los Ángeles; su informe distingue disponibilidad real de los resultados simulados de las pruebas.

El APK sigue siendo debug: puede requerir desinstalar la versión anterior por cambio de clave automática de CI. Exportar los viajes antes de desinstalar e importar la copia después. El AAB permanece sin firma de distribución. No se publica automáticamente ni se modifica main.
