# Preparativos y correcciones · 0.26.0

Base: Astra 0.25.0, e63ac9f87d3f2e5c493966515de678e881cc863d. Rama de desarrollo: codex/conectividad-divisas-0-25. Se conserva el trabajo existente, sin cambiar main ni publicar.

## Correcciones de la revisión

- Las comparaciones SIM/roaming se asocian al operador, país, ciudad, fechas y escalas del viaje. Cambiar cualquiera deja los campos pendientes. Los datos anteriores sin contexto no se presentan como confirmados ni se calculan; se conservan hasta que el usuario introduzca nuevos importes. Regresar al contexto anterior recupera su comparación si no se ha sobrescrito. No se consultan precios privados: cambiar de tarifa/bono exige comprobar de nuevo los importes, como indica la pantalla.
- Elegir «Selecciona» guarda un vacío explícito. Solo se migra el operador/banco antiguo cuando la propiedad nueva está ausente; un vacío no resucita datos antiguos.
- Reino Unido usa orientación general de pagos. Edimburgo y Manchester ya no muestran afirmaciones sobre Londres.

## Siguiente fase implementada: preparativos claros

- Resumen al principio de Preparativos con el destino actual: documentos, salud/seguro, móvil y pagos.
- Cuenta únicamente trámites del catálogo: solicitado sigue pendiente; recibido/comprobado/no corresponde son estados personales, no concesiones verificadas. No promete cobertura completa.
- Acceso directo al siguiente trámite pendiente, sanidad, roaming y conversor/tarjetas; conserva todos los formularios y enlaces oficiales existentes.
- Resumen actualizado al cambiar un estado o perfil. Fechas/pasaporte/país/escalas reutilizan el contexto existente; no arrastran estados de otra situación.
- Enlaces oficiales separados, campos y botones táctiles y tarjetas legibles en pantallas pequeñas. Sin nuevas cuentas, anuncios, servicios de pago ni permisos.
- Los datos bancarios y de operador siguen siendo orientación y enlaces: no se inventan comisiones personales, vacunas ni elegibilidad. Seleccionar banco/operador no completa un preparativo.

## Validación

51 pruebas Node locales correctas, incluidas las tres regresiones. Se añaden dos grupos al navegador: preferencias/comparaciones y resumen de preparativos (estados, cambio de contexto, recarga, foco, copias y 320/390/560 px). Navegador: 20 grupos correctos y cero errores JavaScript. Android: tres pruebas de emulador correctas, arranque sin red; compilación, análisis y firma correctos. Auditoría de dependencias de ejecución: cero vulnerabilidades conocidas.

APK/AAB: versión 0.26.0, código 10. Firma persistente, mismos cinco secretos y guardas de rama/evento. Prueba de actualización configurada desde la 0.25 firmada (run 39019120369). No se cambia identificador ni origen WebView.

## Trabajo posterior

La cobertura concreta permanece en 14 países de trámites, 15 aeropuertos, 10 ciudades y moneda identificada para 67 países/territorios; esta fase mejora el flujo para todos los destinos, no amplía el catálogo. Pendientes: ampliar fuentes de destinos con verificación, resolver la disponibilidad del proveedor gastronómico y renovar de forma coherente icono/identidad visual. Wallet sin implementar.

## Incidencias de validación

La primera ejecución de navegador falló en el nuevo test de recarga: asignaba el pasaporte directamente a `value`, sin disparar el guardado asociado al campo. Se corrigió el test para introducir destino, pasaporte, fechas y escalas mediante los controles reales, y se añadió comparación de la clave de contexto antes/después de recargar. No se relajó la comprobación de persistencia.

## Evidencia final

- Código de aplicación: `2fffcbf9269ab9c32eae4a4e0bc2e3e56a07f9bc`.
- [Compilación, firma y actualización 39021288153](https://github.com/juangarce34-blip/Viajaf-cil-/actions/runs/39021288153): éxito en apk y upgrade.
- [Emulador 39021288149](https://github.com/juangarce34-blip/Viajaf-cil-/actions/runs/39021288149): tres pruebas correctas.
- Cinco secretos validados. APK y AAB descargados: SHA256 coincidentes; certificado APK leído de forma independiente y AAB íntegro en 440 entradas.
- Certificado persistente: `1119e73a9d7343c1879a612c918fed5a349d47dc8d41fdb491704d83aa27c55f`.
- APK SHA256: `82d81079052373dc9077634fc29eea9f0edebef8368b90a0b409ae98bf38f519`.
- AAB SHA256: `d83fd1e760779f4cf69ad23b03c42b3bae4b5c883f1f7d98a70da640a580eab0`.
- Actualización real 0.25/código 9 → 0.26/código 10 mediante install -r, mismo paquete/certificado, almacenamiento conservado y arranque nuevo sin conexión. Alcance: viaje inicial de prueba del emulador API 35, archivos localStorage comparados antes del primer arranque nuevo; no es una copia del teléfono del usuario.
- Captura de Preparativos revisada; sin desbordamiento horizontal a 320, 390 y 560 px.
- Main sin modificar; sin publicación ni integración.
