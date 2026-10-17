/* Shared structured trip details and airport/city guidance. Stored locally per trip and destination. */
(()=>{'use strict';
const $=id=>document.getElementById(id),n=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e};
const KEY='vf-transport-v1';let serial=0;
function context(){return {destination:$('tripDestination').value.trim(),country:$('tripCountry').value.trim(),origin:$('tripOrigin').value.trim(),depart:$('tripDepart').value,returnDate:$('tripReturn').value}}
function all(){try{const d=JSON.parse(localStorage.getItem(KEY)||'{}');return d&&typeof d==='object'&&!Array.isArray(d)?d:{}}catch{return {}}}
function current(){const records=all(),key=ViajaTransport.contextKey(context());const d=ViajaTransport.clean(records[key]);if(!records[key]&&!Object.keys(records).length&&$('hotel').value.trim())d.hotelAddress=$('hotel').value.trim();return d}
function save(value){const records=all(),key=ViajaTransport.contextKey(context());records[key]=ViajaTransport.clean(value);const keys=Object.keys(records);while(keys.length>8)delete records[keys.shift()];localStorage.setItem(KEY,JSON.stringify(records));vf8SaveActive()}
function routeKey(direction){return ViajaTransport.routeKey(context(),current(),direction)}
function link(text,url,primary=false){const a=n('a',text+' ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';if(primary)a.className='btn';return a}
function mount(target,stage){
 target.replaceChildren();target.classList.add('vf-transfers');const prefix='transfer-'+(++serial)+'-',form=n('form'),status=n('p'),results=n('div');results.className='vf-transfer-results';status.setAttribute('role','status');let draft=current();
 const fields={};
 function field(key,label,type='text'){const l=n('label',label),input=n('input');input.id=prefix+key;input.name=key;input.type=type;input.maxLength=key==='hotelAddress'?300:160;input.value=draft[key]||'';l.htmlFor=input.id;fields[key]=input;form.append(l,input);return input}
 const suggestions=n('datalist');suggestions.id=prefix+'airports';const c=context(),suggested=ViajaTransport.city(c);const rows=[...ViajaTransport.airports].sort((a,b)=>Number(b.city===suggested?.id)-Number(a.city===suggested?.id));for(const a of rows){const o=n('option');o.value=a.code;o.label=a.name+' · '+ViajaTransport.cities.find(c=>c.id===a.city)?.name;suggestions.append(o)}form.append(suggestions);
 function airportField(key,label){const input=field(key,label);input.setAttribute('list',suggestions.id);input.placeholder='Código IATA o nombre completo';return input}
 const full=stage==='arrival'||stage==='return';
 if(stage==='flights'||full){
  airportField('arrivalAirport','Aeropuerto de llegada al destino');
  const sameLabel=n('label'),same=n('input');same.type='checkbox';same.id=prefix+'sameAirport';same.checked=draft.sameAirport;sameLabel.htmlFor=same.id;sameLabel.append(same,document.createTextNode(' Vuelvo por el mismo aeropuerto'));fields.sameAirport=same;form.append(sameLabel);
  airportField('departureAirport','Aeropuerto de salida del destino');fields.departureAirport.disabled=draft.sameAirport;
  field('arrivalTerminal','Terminal de llegada (opcional)');field('departureTerminal','Terminal de salida (opcional)');
  field('arrivalAt','Llegada al destino · fecha y hora local del aeropuerto','datetime-local');field('departureAt','Vuelo de vuelta · fecha y hora local del aeropuerto','datetime-local');
  airportField('homeAirport','Aeropuerto al volver a casa (opcional)');
 }
 if(stage==='stay'||full){field('hotelName','Nombre del alojamiento (opcional)');field('hotelAddress','Dirección del alojamiento');}
 function collect(){const next={...current()};for(const [key,input] of Object.entries(fields))next[key]=input.type==='checkbox'?input.checked:input.value;return ViajaTransport.clean(next)}
 function commit(){try{draft=collect();if(draft.sameAirport&&fields.departureAirport){draft.departureAirport=draft.arrivalAirport;fields.departureAirport.value=draft.arrivalAirport}save(draft);if(fields.departureAirport)fields.departureAirport.disabled=draft.sameAirport;status.textContent='Datos guardados para este destino.';if(full)renderGuide();return true}catch{status.textContent='No se pudo guardar. Comprueba el espacio del dispositivo.';return false}}
 form.onchange=commit;form.onsubmit=e=>{e.preventDefault();commit()};
 const submit=n('button',full?'Guardar datos y ver cómo llegar':'Guardar estos datos');submit.type='submit';submit.className='btn secondary';form.append(submit,status);
 if(full){const details=n('details');details.className='vf-transfer-edit';details.open=!draft.hotelAddress||!(stage==='return'?(draft.sameAirport?draft.arrivalAirport:draft.departureAirport):draft.arrivalAirport);details.append(n('summary','Aeropuertos y alojamiento · revisar o cambiar'),form);target.append(details)}else target.append(n('h2',stage==='flights'?'Aeropuertos y horarios de tu vuelo':'Tu alojamiento, listo para los traslados'),n('p','Estos datos se reutilizan en la llegada y el regreso. No realizamos una reserva al guardarlos.'),form);
 function renderGuide(){
  const c=context(),d=current(),g=ViajaTransport.guide(c,d,stage),returning=stage==='return';results.replaceChildren(n('h2',returning?'Del hotel al aeropuerto':'Del aeropuerto al hotel'));
  const airportName=g.airport?g.airport.code+' · '+g.airport.name:(returning?(d.sameAirport?d.arrivalAirport:d.departureAirport):d.arrivalAirport)||'Aeropuerto pendiente';
  results.append(n('p',(returning?'Salida: ':'Llegada: ')+airportName));if(d.hotelAddress)results.append(n('p','Alojamiento: '+[d.hotelName,d.hotelAddress].filter(Boolean).join(' · ')));
  if(g.localTime)results.append(n('p',(returning?'Vuelo de vuelta: ':'Aterrizaje: ')+g.localTime.replace('T',' · ')+' (hora local del aeropuerto)'));
  for(const message of g.alerts){const p=n('p',message);p.className='vf-entry-alert';results.append(p)}
  if(g.transit){const route=n('div');route.className='vf-entry-card';route.append(n('h3','Tu recorrido completo'),link(returning?'Ruta hotel → aeropuerto en transporte público':'Ruta aeropuerto → hotel en transporte público',g.transit,true),link('Consultar trayecto por carretera',g.driving),n('p','Se abre Google Maps con tus puntos de salida y llegada. Ajusta fecha, hora, terminal y accesibilidad allí; la app no ha comprobado tiempos, incidencias ni tarifas en directo.'));results.append(route)}
  if(returning)results.append(n('p','Para la vuelta, comprueba el primer servicio disponible, la terminal y la hora límite de facturación que indique tu aerolínea. Añade margen para equipaje, controles y posibles incidencias; la hora del vuelo no es la hora de llegada al aeropuerto.'));
  results.append(n('h3','Opciones para comparar'),n('p','Transporte público si priorizas las conexiones y el presupuesto; taxi o traslado con conductor si prefieres menos cambios. La mejor opción depende de tu dirección, horario, equipaje y necesidades.'));
  if(!g.options.length)results.append(n('p','No hay una ficha de transporte contrastada para ese aeropuerto en el catálogo actual. Puedes indicar cualquier aeropuerto y consultar la ruta en mapas; no se aplican las instrucciones de otro destino.'));
  for(const option of g.options){const card=n('article');card.className='vf-entry-card';card.dataset.transport=option.type;card.append(n('small',option.kind==='private'?'EMPRESA PRIVADA · SIN AFILIACIÓN':option.kind==='advice'?'ORIENTACIÓN PARA ELEGIR':'INFORMACIÓN DEL AEROPUERTO U OPERADOR'),n('h3',option.title),n('p',option.text));
   if(option.url)card.append(link(option.kind==='private'?'Consultar al proveedor privado':'Consultar horarios, paradas y condiciones',option.url));if(option.source)card.append(link('Fuente: directorio oficial del aeropuerto',option.source));
   if(option.phone){const a=n('a','Llamar · '+option.phoneLabel);a.href='tel:'+option.phone;a.className='vf-phone';card.append(a,n('p','Se abre el marcador; la llamada puede tener coste según tu tarifa. No se ha solicitado un vehículo.'))}
   const choice=n('button',d[returning?'returnChoice':'arrivalChoice']===option.type?'Opción prevista ✓':'Elegir como opción prevista');choice.type='button';choice.className='btn secondary';choice.disabled=!g.transit;choice.onclick=()=>{try{const latest=current();latest[returning?'returnChoice':'arrivalChoice']=option.type;save(latest);status.textContent='Opción prevista guardada. No es una reserva ni confirma disponibilidad.';renderGuide()}catch{status.textContent='No se pudo guardar la opción.'}};card.append(choice);results.append(card);
  }
  const urban=g.urban;if(urban){const city=n('div');city.className='vf-entry-card';city.append(n('h3','Moverse por '+urban.name),link(urban.label,urban.url),n('p','Consulta líneas, mapas, horarios y billetes de la red local. Para cada actividad, utiliza también el mapa de tu itinerario.'));results.append(city)}
  if(returning){const home=n('div');home.className='vf-entry-card';home.append(n('h3','Último tramo: del aeropuerto a casa'));if(g.home)home.append(link('Consultar regreso hasta tu origen',g.home,true));else home.append(n('p','Indica el aeropuerto al volver a casa y el origen del viaje para preparar este recorrido.'));home.append(n('p','Revisa el destino exacto y la hora de llegada en mapas. No se ha supuesto que el aeropuerto esté en la ciudad de origen.'));results.append(home)}
  results.append(n('small','Fuentes revisadas: '+g.reviewed+'. Catálogo inicial de aeropuertos; confirma los cambios con el operador. No hay billetes ni vehículos reservados.'));
 }
 if(full){target.append(results);renderGuide()}
}
window.ViajaTransferUI={mount,current,context,routeKey};
function dayRoutes(){
 const c=context(),d=current(),cards=[...$('dpList').querySelectorAll('.dp-item')];
 cards.forEach((card,i)=>{const name=card.querySelector('h3')?.textContent,previous=i?cards[i-1].querySelector('h3')?.textContent:d.hotelAddress;let a=card.querySelector('[data-transit-route]');if(!name||!previous||!c.destination){a?.remove();return}if(!a){a=n('a');a.dataset.transitRoute='1';a.target='_blank';a.rel='noopener noreferrer';card.append(a)}a.textContent=i?'Cómo llegar desde la actividad anterior ↗':'Cómo llegar desde el alojamiento ↗';a.href=ViajaTransport.maps([previous,c.destination,c.country].filter(Boolean).join(', '),[name,c.destination,c.country].filter(Boolean).join(', '))});
 let tools=$('transportDayTools');if(!tools){tools=n('details');tools.id='transportDayTools';tools.append(n('summary','Transporte público de mi destino'));$('dayPlanner').insertBefore(tools,$('dpTop'))}const summary=tools.querySelector('summary');while(summary.nextSibling)summary.nextSibling.remove();const urban=ViajaTransport.city(c);if(urban)tools.append(link(urban.label,urban.url));else tools.append(n('p','No hay una ficha de red local contrastada para este destino. Las rutas de tus actividades se pueden consultar en mapas.'));tools.append(n('p','Los enlaces de cada actividad abren el trayecto desde el alojamiento o desde el plan anterior. Ajusta fecha y hora, y verifica qué lugar ha encontrado el mapa.'));
}
const observer=new MutationObserver(dayRoutes);observer.observe($('dpList'),{childList:true});
const previousShow=window.show;window.show=function(id){previousShow(id);if(id==='journeyStep'){const target=$('journeyTransfers');if(target)mount(target,target.dataset.stage)}if(id==='dayPlanner')dayRoutes()};
})();
