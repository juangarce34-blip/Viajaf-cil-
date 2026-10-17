# Respuestas y trámites oficiales · 0.23.0

## Cambio

Preparativos deja de ser un cuadro vacío para escribir lo que falta: muestra respuestas, documentación a preparar, plazos, vigencia, tasas cuando están contrastadas y un botón al procedimiento oficial. Las notas de 0.22 se conservan como contenido secundario si existen.

Catálogo directo inicial: Reino Unido (ETA y visado visitante), Estados Unidos (ESTA y DS-160), Canadá (eTA), Australia (eVisitor 651), Nueva Zelanda (NZeTA y declaración de llegada), India (e-Visa), Kenia (eTA), Egipto (e-Visa), Tailandia (TDAC) y Japón (Visit Japan Web). Hay fichas de Exteriores para los 197 destinos del directorio anterior; esto no significa disponer de un formulario directo o de requisitos exhaustivos para los 197.

Incluye cita de pasaporte español, permiso de salida de menores según las condiciones de Policía y acceso al procedimiento de consulta/cita de vacunación internacional en España. La cita de pasaporte no se ofrece para pasaportes de otros países. La consulta sanitaria no prescribe vacunas.

Se tienen en cuenta pasaporte indicado, motivo, fechas, menores, países de escala, residencia/permiso británico indicado, entrada por avión/tierra/mar y caducidad opcional del pasaporte. No se ha creado un motor exhaustivo de elegibilidad ni se recopilan antecedentes, números de pasaporte, imágenes o tarjetas. Requisitos individuales y excepciones se comprueban en la autoridad.

Estados: pendiente, solicitado, recibido, comprobado o no aplicable comprobado. Los marca el usuario; abrir una web nunca los cambia. Se guardan por viaje y contexto (pasaporte, fechas, país, motivo, escalas, etc.), con hasta ocho contextos recientes. Cambiar contexto deja las nuevas fichas pendientes; volver al mismo permite recuperar su progreso. Copias v1 conservadas. La etapa general de preparativos también queda pendiente al cambiar su contexto.

## Fuentes consultadas el 17/10/2026

- Reino Unido: https://www.gov.uk/eta/apply · https://www.gov.uk/check-uk-visa · https://www.gov.uk/standard-visitor/apply-standard-visitor-visa
- Estados Unidos (DS-160 directo confirmado desde el enlace del Departamento de Estado): https://ceac.state.gov/genniv/ · https://esta.cbp.dhs.gov/ · https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visa-waiver-program.html · https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/forms/ds-160-online-nonimmigrant-visa-application.html
- Canadá: https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta/apply.html · https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/entry-requirements-country.html
- Australia: https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/evisitor-651
- Nueva Zelanda: https://www.immigration.govt.nz/visas/new-zealand-electronic-travel-authority-nzeta/ · https://nzeta.immigration.govt.nz/ · https://www.travellerdeclaration.govt.nz/completing-your-declaration/
- India: https://www.indianvisaonline.gov.in/evisa/ (contenido identificado por índice oficial; apertura automatizada no disponible, formulario no probado).
- Kenia: https://etakenya.go.ke/
- Egipto: https://visa2egypt.gov.eg/eVisa/Home
- Tailandia: https://tdac.immigration.go.th/manual/en/ · https://tdac.immigration.go.th/arrival-card/
- Japón: https://www.digital.go.jp/en/policies/visit_japan_web (enlaza el servicio oficial).
- Pasaporte: https://www.citapreviadnie.es/citaPreviaDni/Inicio.action
- Menores: https://sede.policia.gob.es/portalCiudadano/_es/tramites_ciudadania_documentacionviajar.php
- Salud: https://www.sanidad.gob.es/areas/sanidadExterior/laSaludTambienViaja/centrosVacunacionInternacional/sisaex-vac.htm
- ETIAS: https://travel-europe.europa.eu/etias/rtl/not-operational.html indica que no admite solicitudes en la consulta; no se introduce un enlace a una solicitud inexistente.

La fecha es una revisión de contenido y fuentes, no una comprobación en tiempo real para cada viajero. No se rellenan ni envían solicitudes, no se realizan pagos, no se crea una cuenta en esos portales ni se certifica una concesión. Portales con JavaScript, autenticación o medidas antibot pueden no ser comprobables de extremo a extremo mediante consulta automatizada.

## Verificación

33 pruebas unitarias locales correctas, siete nuevas sobre elegibilidad condicionada, renovación, escalas, declaraciones y aislamiento del contexto. Regresión de navegador ampliada para enlaces, estados, recarga, cambio de pasaporte/fechas, copias y anchuras móviles. Compilación APK/AAB y emulador se validan mediante Actions en la rama de desarrollo. VersionCode 7, misma firma y paquete de 0.21/0.22. Sin publicación ni cambios en main.

## Pendiente

Ampliar los formularios específicos al resto de países, permisos de regiones/actividades y todos los documentos del itinerario, preguntas de elegibilidad y seguimiento por viajero, renovación de pasaportes no españoles y actualización continuada del catálogo. La salud no se determina solo por nacionalidad/destino. Transporte, telefonía, divisas y nueva identidad visual mantienen su trabajo pendiente anterior; no se consideran terminados por esta entrega.
