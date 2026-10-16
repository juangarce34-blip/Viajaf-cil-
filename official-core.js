(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./destination-core.js'),require('./official-country-data.js'));else root.ViajaOfficial=factory(root.ViajaDestinationsCore,root.ViajaOfficialCountries);})(typeof globalThis!=='undefined'?globalThis:this,function(core,data){
'use strict';
const EU=new Set('AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE'.split(' '));
const euDocuments='https://europa.eu/youreurope/citizens/travel/entry-exit/eu-citizen/index_es.htm';
function guide(context){
 const country=core.country(context.country),passport=core.country(context.passportCountry);
 const spanish=context.nationality==='es'&&(!context.passportCountry||passport?.code==='ES');
 const profile=(spanish?'Pasaporte español':context.passportCountry?'Pasaporte indicado: '+core.query(context.passportCountry):'Pasaporte pendiente de indicar')+' · '+(context.purpose==='tourism'?'Turismo o visita':'Trabajo, estudios u otro motivo');
 const result={country,profile,links:[]};
 if(!country){result.missing='Indica un país reconocido para mostrar su ficha. No se deduce el país solo por el nombre de la ciudad.';return result}
 result.advice=data.countries[country.code];
 if(!result.advice&&country.code!=='ES'){
   result.missing='No hay una ficha específica verificada para '+country.name+' en este directorio. No aplicamos los requisitos de otro país o territorio. Comprueba la autoridad competente antes de viajar.';return result;
 }
 result.entry='Para entrar en '+country.name+', comprueba pasaporte o documento admitido, vigencia mínima, visado o exención, autorizaciones y duración de estancia. En la ficha oficial abre «Documentación y visados».';
 if(EU.has(country.code)){
   result.links.push({label:'Documentos para ciudadanos de la UE que viajan a '+country.name,url:euDocuments});
   if(spanish&&context.purpose==='tourism')result.entry='Para un viaje turístico a '+country.name+' como ciudadano español, lleva DNI o pasaporte válido. Cada menor necesita su propio documento. Revisa las condiciones de entrada y cualquier control temporal en las fuentes enlazadas.';
 }
 if(!spanish)result.entry+=' La ficha de Exteriores está orientada a ciudadanos españoles. Para tu pasaporte, comprueba los requisitos con la embajada o autoridad migratoria del destino; no se ha determinado tu elegibilidad.';
 if(context.purpose!=='tourism')result.entry+=' Para trabajo, estudios o residencia pueden exigirse permisos adicionales; esta guía no determina cuáles te corresponden.';
 if(country.code==='GB')result.links.push({label:'Comprobar visado o autorización de entrada en GOV.UK',url:'https://www.gov.uk/check-uk-visa'},{label:'Consultar ETA del Reino Unido (si te corresponde)',url:'https://www.gov.uk/eta'});
 if(country.code==='US')result.links.push({label:'Consultar ESTA de Estados Unidos (si te corresponde)',url:'https://esta.cbp.dhs.gov/'});
 result.health='Para '+country.name+', abre «Sanidad» o «Sanidad/Vacunas» en la ficha oficial: revisa vacunas y certificados de entrada, riesgos sanitarios, medicación y asistencia médica. La consulta sanitaria debe adaptarse a tu salud, itinerario y escalas; aquí no se ha certificado ninguna vacuna como obligatoria ni descartado riesgos.';
 if(EU.has(country.code))result.health='En '+country.name+', revisa si tienes derecho a usar la Tarjeta Sanitaria Europea y qué asistencia cubre. No sustituye un seguro de viaje ni cubre todas las situaciones. '+result.health;
 result.children=context.children>0?'Comprueba la documentación individual de los menores, autorizaciones según quién los acompañe y condiciones de la aerolínea y de '+country.name+'. No se presupone que una autorización sea necesaria o suficiente para todos los casos.':'';
 result.transit=context.transit?'Escalas indicadas: '+core.query(context.transit)+'. Revisa por separado los requisitos de cada país, incluso si no sales del aeropuerto.':'No has indicado países de escala. Si el viaje los incluye, añádelos: pueden exigir visado, autorización o condiciones sanitarias propias.';
 return result;
}
return {guide};
});
