/* Guided journey. Trip-scoped state participates in existing backup format v1. */
(()=>{'use strict';
const $=id=>document.getElementById(id),n=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e};
const steps=[
 ['destination','Tu viaje','Destino, fechas y viajeros','Elige dónde quieres ir y cuándo.','setup'],
 ['flights','Vuelos','Ida y vuelta, sin cabos sueltos','Antes de reservar, revisa los requisitos de entrada. Anota aeropuertos y horarios confirmados.','world'],
 ['stay','Alojamiento','Tu punto de partida','Guarda el nombre y la dirección exacta, la entrada y la salida.','world'],
 ['prepare','Preparativos','Viaja con tranquilidad','Comprueba pasaporte, visado, salud y vacunas. Después, seguro, conexión móvil, moneda, tarjetas y comisiones.','world'],
 ['arrival','Llegar al hotel','Del aeropuerto a tu alojamiento','Compara transporte público, taxi autorizado y traslado privado. Confirma horarios, precio y punto de encuentro.','world'],
 ['days','Día a día','Visitas, comidas y tiempo para disfrutar','Organiza actividades y cómo llegar; añade dónde comer, cenar o tomar algo.','dayPlanner'],
 ['return','Volver a casa','El regreso también está preparado','Anota la salida del hotel, el traslado al aeropuerto y cómo llegar a casa.','world']
];
const KEY='vf-journey-v1';
function read(){try{const d=JSON.parse(localStorage.getItem(KEY)||'{}');return d&&typeof d==='object'&&!Array.isArray(d)?d:{}}catch{return {}}}
function save(d){localStorage.setItem(KEY,JSON.stringify(d));vf8SaveActive()}
function button(text,fn,primary=false){const b=n('button',text);b.type='button';b.className=primary?'btn':'btn secondary';b.onclick=fn;return b}
const panel=n('section');panel.id='journeyStep';panel.className='vf-journey';document.querySelector('main').insertBefore(panel,document.querySelector('nav'));
const home=$('home'),overview=n('div');overview.id='journeyOverview';overview.className='vf-journey';
// Keep the existing discovery tools accessible without competing with the next step.
const discovery=n('details');discovery.className='vf-discovery';const summary=n('summary','Explorar destinos y herramientas');discovery.append(summary);while(home.firstChild)discovery.append(home.firstChild);home.append(overview,discovery);
function resolved(step,state){const value=state[step[0]];return Boolean(value?.done)&&(step[0]!=='prepare'||value.entryKey===ViajaEntry.key(ViajaProceduresUI.context()))}
function render(){
 const state=read(),city=$('tripDestination').value.trim(),done=steps.filter(s=>resolved(s,state)).length;
 const next=steps.find(s=>!resolved(s,state))||steps[steps.length-1];
 overview.replaceChildren(n('p','TU VIAJE, PASO A PASO'),n('h1',city||'¿A dónde quieres viajar?'),n('p',city?'Preparamos tu viaje juntos, desde la salida hasta la vuelta.':'Empieza por el destino. Te acompañamos con lo que viene después.'));
 const progress=n('progress');progress.max=steps.length;progress.value=done;progress.setAttribute('aria-label','Etapas completadas');overview.append(progress,n('p',done+' de '+steps.length+' etapas resueltas'));
 const card=n('div');card.className='vf-next';card.append(n('small',done===steps.length?'TODO REVISADO':'TU SIGUIENTE PASO'),n('h2',done===steps.length?'Disfruta de tu viaje':next[1]),n('p',next[3]),button(done===steps.length?'Revisar mi viaje':'Continuar mi viaje',()=>open(next[0]),true));overview.append(card);
 const list=n('ol');list.className='vf-stages';steps.forEach((s,i)=>{const li=n('li'),b=button('',()=>open(s[0]));const number=n('span',resolved(s,state)?'✓':String(i+1));number.className='vf-stage-number';const text=n('span');text.append(n('strong',s[1]),n('small',resolved(s,state)?'Resuelto · puedes revisarlo':'Pendiente'));b.append(number,text,n('span','›'));li.append(b);list.append(li)});overview.append(list);
}
function field(label,key,value,container,values){const l=n('label',label),input=n('textarea');input.rows=3;input.maxLength=2000;input.id='journey-'+key;l.htmlFor=input.id;input.value=value||'';input.oninput=()=>{values[key]=input.value};container.append(l,input)}
function open(id){
 const step=steps.find(s=>s[0]===id);if(!step)return;
 const state=read(),saved={...(state[id]||{})};if(id==='prepare'&&saved.entryKey!==ViajaEntry.key(ViajaProceduresUI.context()))saved.done=false;const values={...saved};panel.replaceChildren(button('← Mi viaje',()=>show('home')),n('small','PASO '+(steps.indexOf(step)+1)+' DE '+steps.length),n('h1',step[1]),n('h2',step[2]),n('p',step[3]));
 if(id!=='destination'&&!$('tripDestination').value.trim())panel.append(n('p','Indica primero tu destino para que los enlaces correspondan a tu viaje.'),button('Elegir destino',()=>show('setup'),true));
 if(id==='destination')panel.append(button('Indicar destino, fechas y viajeros',()=>show('setup'),true));
 if(id==='flights'||id==='stay'){
  refreshWorld();const source=$(id==='flights'?'worldFlights':'worldHotels'),a=n('a',id==='flights'?'Buscar vuelos ↗':'Buscar alojamiento ↗');a.href=source.href;a.target='_blank';a.rel='noopener noreferrer';a.className='btn';panel.append(a,n('p','La búsqueda se abre fuera de la app. Confirma fechas, viajeros y precio final; no hemos realizado ninguna reserva.'));
  field(id==='flights'?'Vuelos elegidos · aeropuertos, fechas y horas':'Alojamiento · nombre, dirección, entrada y salida','booking',saved.booking,panel,values);
  if(id==='flights')panel.append(button('Comprobar documentación antes de reservar',()=>open('prepare')));
 }
 if(id==='prepare'){
  const requirements=n('div');requirements.id='journeyRequirements';panel.append(requirements);ViajaProceduresUI.mount(requirements);
  if(saved.checks){const previous=n('details');previous.append(n('summary','Tus notas anteriores'),n('p',saved.checks));panel.append(previous)}
  panel.append(button('Consultar operador, banco y comisiones',()=>show('personal')));
 }
 if(id==='arrival'||id==='return'){
  const stay=state.stay?.booking||'';if(stay)panel.append(n('p','Tu alojamiento: '+stay));
  field(id==='arrival'?'Aeropuerto → hotel · medio, hora, coste y punto de encuentro':'Hotel → aeropuerto → casa · horarios, medios y margen de tiempo','transfer',saved.transfer,panel,values);
  panel.append(n('p','Los enlaces y horarios de transporte específicos de cada ciudad se incorporarán en la siguiente fase. No hay un traslado contratado desde esta app.'));
 }
 if(id==='days')panel.append(button('Abrir mi itinerario',()=>show('dayPlanner'),true),button('Proponer visitas para mi destino',()=>show('geoPlanner')),button('Dónde comer y tomar algo',()=>show('dining')));
 const status=n('p');status.id='journeyStatus';status.setAttribute('role','status');
 function persist(done){try{const latest=read();latest[id]={...values,done,...(id==='prepare'?{entryKey:ViajaEntry.key(ViajaProceduresUI.context())}:{})};save(latest);status.textContent=done?'Etapa resuelta. Puedes revisarla cuando quieras.':'Avance guardado en este dispositivo.';render();return true}catch{status.textContent='No se pudo guardar. Comprueba el espacio del dispositivo.';return false}}
 panel.append(button('Guardar avance',()=>persist(Boolean(saved.done))),button(saved.done?'Dejar esta etapa pendiente':'Marcar resuelto y continuar',()=>{if(id==='destination'&&(!$('tripDestination').value.trim()||!$('tripCountry').value.trim()||!$('tripDepart').value||!$('tripReturn').value||$('tripReturn').value<$('tripDepart').value)){status.textContent='Completa destino, país y fechas válidas antes de resolver esta etapa.';return}if(persist(!saved.done))show('home')},true),status,n('p','Resolver una etapa es tu confirmación personal. Puedes guardar el avance y completar lo pendiente más tarde.'));
 show('journeyStep');
}
const previous=window.show;window.show=function(id){if(id==='home')render();previous(id)};
// Primary entry in trip detail; detailed tools remain available below.
const observer=new MutationObserver(()=>{const target=$('v12detail');if(!target||target.querySelector('#journeyDetailEntry'))return;const b=button('Continuar mi viaje',()=>show('home'),true);b.id='journeyDetailEntry';target.prepend(b)});observer.observe($('v12detail'),{childList:true});
window.ViajaJourney={open,render};render();
})();
