# Asistente de viaje · primera integración 0.22

Cambio autorizado: convertir las herramientas existentes en un recorrido guiado, sin rehacer la app, sin anuncios, servicios de pago ni publicación.

## Implementado

- Inicio centrado en el viaje activo y una acción principal «Continuar mi viaje».
- Siete etapas accesibles: destino; vuelos; alojamiento; preparativos; llegada al hotel; itinerario; regreso.
- Avance guardado por viaje, distinto de la confirmación personal «resuelto». Se puede volver a dejar pendiente. Abrir un enlace no confirma una reserva ni requisitos.
- Búsquedas existentes de vuelos/alojamiento y acceso a documentación por país, operador/banco, propuestas, comidas e itinerario.
- Guardado de datos confirmados de vuelos, alojamiento y traslados; no se solicitan números de tarjeta ni pasaporte.
- Copias v1 conservadas: clave `vf-journey-v1` incluida en snapshots independientes.
- Primer destino vacío, sin Londres por defecto. No se borran datos del dispositivo.
- Propuestas: un botón geocodifica el destino ya escrito o reutiliza su ubicación guardada. Una sola coincidencia continúa automáticamente; varias exigen elegir para no confundir ciudades.
- Primera dirección visual: etapas numeradas, fondos claros, una acción destacada, controles táctiles y foco visible; herramientas anteriores disponibles en «Explorar destinos y herramientas».

## Pendiente de esta transformación

Esta entrega es una primera integración funcional, no el asistente completo solicitado. Aún falta desglosar preparativos en preguntas guiadas con seguimiento individual, guardar vuelos con campos estructurados y horarios, configurar viajeros sin acudir al itinerario, integrar fuentes contrastadas de transporte por ciudad y aeropuerto, taxis y traslados privados, moneda y referencia de cambio por país; adaptar el antiguo panel bancario/móvil que todavía contiene referencias a Reino Unido. Logo e iconos de Android pendientes de propuesta visual. No se han probado reservas reales ni contratado servicios.

La información gastronómica mundial sigue dependiendo de un servicio externo con caídas; no se presenta como reparado. Los horarios, condiciones, requisitos y precios personales deben confirmarse en sus fuentes.

## Verificación

26 pruebas unitarias locales correctas. Sintaxis de los nuevos módulos correcta. 14 grupos de regresión de navegador correctos en GitHub Actions, incluidos avance, recarga, aislamiento, copias, inicio vacío, anchuras móviles y destino automático. Emulador Android sin conexión correcto. Compilación y firma de la primera integración correctas; la entrega incorpora también la corrección de caché PWA y su nueva compilación. El entorno local no ha podido descargar dependencias: conexión al proxy rechazada. No se considera equivalente a haber pasado navegador/Android.

Versión Android 0.22.0, código 6; conserva identificador y firma persistente. `main` y la publicación quedan fuera del alcance.
