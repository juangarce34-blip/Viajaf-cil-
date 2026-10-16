# Cambios solicitados · Android 0.20.0

Se trabaja sobre la rama `codex/auditoria-android-2026-10-15`, manteniendo la aplicación existente, el formato de copia v1 y los almacenes por viaje. No hay publicación ni modificación de main, anuncios, pagos o implementación de wallet.

## Pantallas y comportamiento

- Destino: se elimina la explicación fija de Londres en el formulario. El texto refleja ciudad y país. Los campos de residencia británica solo aparecen para Londres/Reino Unido; la guía local aprobada se conserva. El buscador mundial de 0.19 permanece operativo.
- Documentación y salud: se extrajeron 198 enlaces de la página oficial de Exteriores, correspondientes a 197 destinos únicos, el 16/10/2026. Los enlaces se guardan literalmente por código de país (sin suponer slugs). Cada destino con ficha recibe su enlace específico a documentación, sanidad y avisos. La fecha es de revisión del directorio, no de vigencia de los requisitos ni comprobación personal de cada ficha.
- Se muestran pasaporte, motivo, fechas, menores y escalas para orientar la revisión. DNI/pasaporte válido para ciudadanos españoles en viajes turísticos a la UE se basa en Your Europe. Para otros pasaportes o motivos no se aplica esa conclusión. Reino Unido y Estados Unidos añaden accesos a comprobadores oficiales; no se decide automáticamente si corresponde visado, ETA o ESTA. No se incorporan solicitudes ni cobros.
- Las fichas de Exteriores orientan a españoles; se indica expresamente que otros pasaportes requieren revisión con la autoridad del destino. Los requisitos individuales continúan pendientes de comprobación oficial. Los destinos/territorios sin ficha verificada se señalan como tales; no se heredan requisitos del país del que dependen. España utiliza la fuente europea aplicable, sin inventar una ficha MAEC.
- Se conserva el directorio local para poder abrir enlaces incluso sin acceso a un backend. Leer fuentes externas requiere conexión. No se envían notas, pasaporte ni perfil a un servicio nuevo.
- Itinerario: el antiguo bloque Organiza tu viaje pasa a ser acceso a la planificación por días. Las notas personales se mantienen en un desplegable opcional; no se borra el contenido anterior. En el detalle, Día a día ocupa el acceso principal y Notas personales queda como acción secundaria.
- Gastronomía: un botón Ver dónde comer y tomar algo usa el destino actual, localiza una coincidencia única automáticamente y consulta locales. Una selección previa en el buscador mundial conserva sus coordenadas por viaje para reutilizarlas. Las coincidencias múltiples sí requieren elección. Cambiar zona queda en un desplegable; las búsquedas externas en mapas aparecen después de los resultados. No se sustituyen actividades al añadir un local.
- Copias: Guardar copia / Restaurar copia. La restauración valida el archivo, muestra cantidad y nombres de viajes y advierte que sustituye todos los actuales. Permite guardar copia actual primero, cancelar o confirmar explícitamente. Un fallo de escritura conserva la recuperación anterior. El selector nativo conserva su confirmación real de guardado/cancelación; la web informa que debe comprobarse la descarga. Nunca se restaura automáticamente al guardar una copia.

## Fuentes y revisión

- [Directorio de recomendaciones de Exteriores](https://www.exteriores.gob.es/es/ServiciosAlCiudadano/Paginas/recomendaciones-de-viaje.aspx), recuperado en [verificación 38928811120](https://github.com/juangarce34-blip/Viajaf-cil-/actions/runs/38928811120). Se incluyen los enlaces específicos extraídos en `official-country-data.js`.
- [Documentos de ciudadanos de la UE — Your Europe](https://europa.eu/youreurope/citizens/travel/entry-exit/eu-citizen/index_es.htm).
- [Visados de Reino Unido](https://www.gov.uk/check-uk-visa), [ETA](https://www.gov.uk/eta), [ESTA oficial](https://esta.cbp.dhs.gov/).

La inspección inicial de un endpoint sanitario devolvió una página de error con HTTP 200; sus fichas antiguas contienen referencias a 2015/2016. No se incorporaron como información sanitaria actual. Se enlaza la sección sanitaria de la ficha actual de Exteriores y se mantiene la necesidad de una consulta sanitaria personal. El script de inspección queda como diagnóstico, no es un backend de la app.

## Validación y entrega

Las pruebas cubren copia compatible, rechazo de archivos dañados, restauración/rollback, fichas y perfil aplicable; regresión de navegador para nueva copia guiada, itinerario conservado, gastronomía con un botón, ficha por país, escalas persistentes y notas secundarias. Los servicios externos se simulan para regresión, con diagnósticos reales separados. Se comprobarán sincronización, compilación APK debug interna y AAB, lint y arranque en emulador sin conexión.

El proveedor gastronómico externo ya presentó HTTP 500 y su disponibilidad sigue fuera de control de la app. La interfaz simplificada no implica que ese proveedor se haya reparado: se mantiene el error visible, selección oficial guardada cuando existe y acceso a mapas. No se inventan locales ni precios.

La clave de firma fija todavía no está configurada. CI no entrega APK con claves debug efímeras. No existe un nuevo instalador distribuible hasta configurar los secretos y validar la firma y la actualización; la app instalada no se modifica por estos commits.
