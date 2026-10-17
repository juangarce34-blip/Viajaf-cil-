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
function resolved(step,state){const value=state[step[0]];return Boolean(value?.done)&&(step[0]!=='prepare'||value.entryKey===ViajaEntry.key(ViajaProceduresUI.context()))&&(!['arrival','return'].includes(step[0])||value.transferKey===ViajaTransferUI.routeKey(step[0]))}
function render(){
 const state=read(),city=$('tripDestination').value.trim(),done=steps.filter(s=>resolved(s,state)).length;
 const next=steps.find(s=>!resolved(s,state))||steps[steps.length-1];
 overview.replaceChildren(n('p','TU VIAJE, PASO A PASO'),n('h1',city||'¿A dónde quieres viajar?'),n('p',city?'Preparamos tu viaje juntos, desde la salida hasta la vuelta.':'Empieza por el destino. Te acompañamos con lo que viene después.'));
 const progress=n('progress');progress.max=steps.length;progress.value=done;progress.setAttribute('aria-label','Etapas completadas');overview.append(progress,n('p',done+' de '+steps.length+' etapas resueltas'));
 const card=n('div');card.className='vf-next';card.append(n('small',done===steps.length?'TODO REVISADO':'TU SIGUIENTE PASO'),n('h2',done===steps.length?'Disfruta de tu viaje':next[1]),n('p',next[3]),button(done===steps.length?'Revisar mi viaje':'Continuar mi viaje',()=>open(next[0]),true));overview.append(card);
 const list=n('ol');list.className='vf-stages';steps.forEach((s,i)=>{const li=n('li'),b=button('',()=>open(s[0]));const number=n('span',resolved(s,state)?'✓':String(i+1));number.className='vf-stage-number';const text=n('span');text.append(n('strong',s[1]),n('small',resolved(s,state)?'Resuelto · puedes revisarlo':'Pendiente'));b.append(number,text,n('span','›'));li.append(b);list.append(li)});overview.append(list);
}
function field(label,key,value,container,values){const l=n('label',label),input=n('textarea');input.rows=3;input.maxLength=2000;input.id='journey-'+key;l.htmlFor=input.id;input.value=value||'';input.oninput=()=>{values[key]=input.value};container.append(l,input)}
function focusTarget(target){if(!target)return;target.tabIndex=-1;target.focus();target.scrollIntoView({block:'start'})}
function preparations(){
 const target=$('prepareSummary');if(!target)return;
 const c=ViajaProceduresUI.context(),info=ViajaEntry.guide(c);
 let all={},prefs={};try{all=JSON.parse(localStorage.getItem('vf-entry-status-v1')||'{}')||{};prefs=JSON.parse(localStorage.getItem('vf8-provider-preferences')||'{}')||{}}catch{}
 const statuses=all[info.key]||{},finished=item=>['received','checked','notApplicable'].includes(statuses[item.id]),pending=info.items.filter(item=>!finished(item)),requested=pending.filter(item=>statuses[item.id]==='requested').length;
 const op=ViajaMoney.preference(prefs,'operator',localStorage.getItem('vf-operator')),bank=ViajaMoney.preference(prefs,'bank',localStorage.getItem('vf-bank')),money=ViajaMoney.guide(c,op,bank);
 target.replaceChildren(n('small','ANTES DE VIAJAR'),n('h2','Tus preparativos, de un vistazo'),n('p',(c.destination||'Destino pendiente')+' · '+(info.country?.name||'Indica el país')));
 const list=n('div');list.className='vf-preparation-list';
 function row(id,title,answer,action,fn){const card=n('article');card.dataset.preparation=id;card.append(n('h3',title),n('p',answer),button(action,fn));list.append(card)}
 row('documents','Pasaporte y entrada',info.items.length?pending.length+' de '+info.items.length+' trámites del catálogo pendientes'+(requested?' · '+requested+' solicitado(s), a la espera de respuesta':'')+'. Estados indicados por ti.':'Requisitos por comprobar: no hay trámites concretos catalogados para este perfil.',pending.length?'Continuar con '+pending[0].title:'Revisar documentación',()=>{const articles=[...document.querySelectorAll('#journeyRequirements [data-procedure]')];focusTarget(articles.find(a=>a.dataset.procedure===pending[0]?.id)||$('journeyRequirements'))});
 row('health','Salud y seguro','Consulta la sanidad del destino y las escalas; las vacunas dependen también de tu situación. Revisa asistencia médica, exclusiones y repatriación de tu cobertura.','Ver orientación sanitaria',()=>focusTarget(document.querySelector('#journeyRequirements .vf-health')));
 row('mobile','Tu móvil en destino',money.roaming+(money.operator?' Operador elegido: '+money.operator[0]+'.':' Elige tu operador para abrir sus condiciones.'),'Revisar roaming',()=>ViajaMoneyUI.open('mobile'));
 row('payments','Cómo pagar',money.currency?(money.currency==='EUR'?'La moneda del destino es el euro.':'Moneda del destino: '+money.currency+'. Puedes consultar su cambio de referencia.')+' '+(money.bank?'Banco elegido: '+money.bank[0]+'. Comprueba las comisiones de tu tarjeta concreta.':'Revisa tu tarjeta y las comisiones antes de viajar.'):'Moneda aún no disponible para este destino: compruébala antes de convertir.','Ver moneda y tarjetas',()=>ViajaMoneyUI.open('exchange'));
 target.append(list,n('small','Este resumen muestra el catálogo disponible. Seleccionar un operador o banco no confirma sus condiciones; los estados de trámites no acreditan una autorización.'));
}
document.addEventListener('vf:procedures-change',preparations);
function open(id){
 const step=steps.find(s=>s[0]===id);if(!step)return;
 const state=read(),saved={...(state[id]||{})};if(id==='prepare'&&saved.entryKey!==ViajaEntry.key(ViajaProceduresUI.context()))saved.done=false;if(['arrival','return'].includes(id)&&saved.transferKey!==ViajaTransferUI.routeKey(id))saved.done=false;const values={...saved};panel.replaceChildren(button('← Mi viaje',()=>show('home')),n('small','PASO '+(steps.indexOf(step)+1)+' DE '+steps.length),n('h1',step[1]),n('h2',step[2]),n('p',step[3]));
 if(id!=='destination'&&!$('tripDestination').value.trim())panel.append(n('p','Indica primero tu destino para que los enlaces correspondan a tu viaje.'),button('Elegir destino',()=>show('setup'),true));
 if(id==='destination')panel.append(button('Indicar destino, fechas y viajeros',()=>show('setup'),true));
 if(id==='flights'||id==='stay'){
  refreshWorld();const source=$(id==='flights'?'worldFlights':'worldHotels'),a=n('a',id==='flights'?'Buscar vuelos ↗':'Buscar alojamiento ↗');a.href=source.href;a.target='_blank';a.rel='noopener noreferrer';a.className='btn';panel.append(a,n('p','La búsqueda se abre fuera de la app. Confirma fechas, viajeros y precio final; no hemos realizado ninguna reserva.'));
  const data=n('div');panel.append(data);ViajaTransferUI.mount(data,id);
  const notes=n('details');notes.append(n('summary',id==='flights'?'Reserva y notas del vuelo (opcional)':'Reserva y notas del alojamiento (opcional)'));field(id==='flights'?'Vuelos elegidos · aeropuertos, fechas y horas':'Alojamiento · nombre, dirección, entrada y salida','booking',saved.booking,notes,values);panel.append(notes);
  if(id==='flights')panel.append(button('Comprobar documentación antes de reservar',()=>open('prepare')));
 }
 if(id==='prepare'){
  const summary=n('div');summary.id='prepareSummary';summary.className='vf-prepare-summary';panel.append(summary);
  const requirements=n('div');requirements.id='journeyRequirements';panel.append(requirements);ViajaProceduresUI.mount(requirements);
  if(saved.checks){const previous=n('details');previous.append(n('summary','Tus notas anteriores'),n('p',saved.checks));panel.append(previous)}
  panel.append(button('Consultar operador, banco y comisiones',()=>show('personal')));
 }
 if(id==='arrival'||id==='return'){
  const transfers=n('div');transfers.id='journeyTransfers';transfers.dataset.stage=id;panel.append(transfers);ViajaTransferUI.mount(transfers,id);
  if(saved.transfer){const notes=n('details');notes.append(n('summary','Tus notas de traslado anteriores'),n('p',saved.transfer));panel.append(notes)}
 }
 if(id==='days')panel.append(button('Abrir mi itinerario',()=>show('dayPlanner'),true),button('Proponer visitas para mi destino',()=>show('geoPlanner')),button('Dónde comer y tomar algo',()=>show('dining')));
 const status=n('p');status.id='journeyStatus';status.setAttribute('role','status');
 function persist(done){try{const latest=read();latest[id]={...values,done,...(id==='prepare'?{entryKey:ViajaEntry.key(ViajaProceduresUI.context())}:{}),...(['arrival','return'].includes(id)?{transferKey:ViajaTransferUI.routeKey(id)}:{})};save(latest);status.textContent=done?'Etapa resuelta. Puedes revisarla cuando quieras.':'Avance guardado en este dispositivo.';render();return true}catch{status.textContent='No se pudo guardar. Comprueba el espacio del dispositivo.';return false}}
 panel.append(button('Guardar avance',()=>persist(Boolean(saved.done))),button(saved.done?'Dejar esta etapa pendiente':'Marcar resuelto y continuar',()=>{if(id==='destination'&&(!$('tripDestination').value.trim()||!$('tripCountry').value.trim()||!$('tripDepart').value||!$('tripReturn').value||$('tripReturn').value<$('tripDepart').value)){status.textContent='Completa destino, país y fechas válidas antes de resolver esta etapa.';return}if(!saved.done&&['arrival','return'].includes(id)&&!ViajaTransport.guide(ViajaTransferUI.context(),ViajaTransferUI.current(),id).transit){status.textContent='Completa y comprueba el aeropuerto y la dirección del alojamiento antes de resolver el traslado.';return}if(persist(!saved.done))show('home')},true),status,n('p','Resolver una etapa es tu confirmación personal. Puedes guardar el avance y completar lo pendiente más tarde.'));
 show('journeyStep');
}
const previous=window.show;window.show=function(id){if(id==='home')render();previous(id);if(id==='journeyStep')preparations()};
// Primary entry in trip detail; detailed tools remain available below.
const observer=new MutationObserver(()=>{const target=$('v12detail');if(!target||target.querySelector('#journeyDetailEntry'))return;const b=button('Continuar mi viaje',()=>show('home'),true);b.id='journeyDetailEntry';target.prepend(b)});observer.observe($('v12detail'),{childList:true});
window.ViajaJourney={open,render};render();
})();
