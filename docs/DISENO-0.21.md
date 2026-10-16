# Detalle de viaje · 0.21.0

Solicitud: sustituir los botones grises y desordenados del detalle del viaje por una interfaz sencilla y moderna. Se conserva la fotografía, todas las funciones y los datos existentes.

- Un botón principal: Abrir mi itinerario.
- Guía y presupuesto como accesos rápidos alineados; gastronomía debajo.
- Destino y fechas, consultas, ruta, resumen y notas en una lista con filas amplias, iconos lineales SVG locales y separadores discretos.
- Volver a Mis viajes como acción ligera. Tipografía y colores coherentes, esquinas suaves y foco de teclado visible; controles de al menos 44 px de altura. Sin fuentes, librerías ni servicios nuevos.
- Se quita «sin IA» del botón Proponer visitas y de su explicación.
- Origen pasa a «¿Desde dónde sales? (opcional)», con ejemplo de ciudad y país y explicación de su uso en la búsqueda de vuelos. Los viajes nuevos no reciben Alicante automáticamente. Los orígenes guardados se conservan; una búsqueda sin origen no inventa una ciudad.
- Versión Android 0.21.0, versionCode 5. No hay publicación ni APK distribuible mientras falte la firma fija.

Verificación: 26 pruebas de datos; regresión de las funciones existentes y revisión del detalle a 320, 390 y 560 px, navegación por teclado, conservación de notas e itinerarios y origen vacío. Capturas en artefactos de CI. Compilación Android y emulador con workflows existentes.

## Resultado

Código verificado: `8f601e1dea91c343bda195bf995fd3e29bdd458d`.

- [CI Android 38963147569](https://github.com/juangarce34-blip/Viajaf-cil-/actions/runs/38963147569): correcto; 26 pruebas de datos, 13 grupos de navegador sin errores JavaScript, sincronización, APK debug interno, AAB, lint y verificación de firma.
- [Emulador 38963147358](https://github.com/juangarce34-blip/Viajaf-cil-/actions/runs/38963147358): correcto, con las dos pruebas nativas existentes.
- Capturas del detalle a 320, 390 y 560 px: sin desbordamiento horizontal ni controles por debajo de 44 px de alto. Se revisó visualmente la captura de 390 px. Las fotos externas se bloquean durante la regresión; el diseño mantiene sus URLs y usa fondo de color cuando no cargan.
- Se verificaron acceso por teclado al itinerario, conservación de datos y notas, edición del destino y búsqueda de vuelos sin sustituir un origen vacío por Alicante.
- No hay cambios en main ni publicación. El APK debug no se distribuye y la firma fija continúa pendiente; la aplicación instalada no cambia hasta recibir e instalar otra versión.
