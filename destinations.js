/* Worldwide destination search. Remote geocoding only on explicit submission. */
(()=>{'use strict';
const core=window.ViajaDestinationsCore, ui=window.ViajaDestinations;
const $=id=>document.getElementById(id), input=$('destinationQuery'), form=$('destinationSearchForm');
const results=$('destinationResults'), status=$('destinationStatus'), submit=$('destinationSearch');
const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
let revision=0, originTrip='';
function choose(destination){ui.choose([destination.name,destination.country])}
function card(destination){
  const button=node('button');button.type='button';button.className='card';
  button.style.cssText='display:block;width:100%;text-align:left';
  button.append(node('strong',destination.formatted),node('p',destination.kind==='country'?'País o territorio · Organizar viaje':'Ciudad o localidad · Organizar viaje'));
  button.onclick=()=>choose(destination);return button;
}
function local(){
  results.replaceChildren();const q=core.query(input.value);
  const countries=core.searchCountries(q);
  if(countries.length){
    results.append(node('h2','Países y territorios'));
    countries.slice(0,12).forEach(c=>results.append(card(c)));
    if(countries.length>12)results.append(node('p','Hay más coincidencias. Escribe un nombre más completo.'));
  }
  if(q.length>=2){
    const manual=node('button','Organizar viaje a «'+q+'»');manual.type='button';manual.className='btn secondary';
    manual.id='destinationManual';
    manual.onclick=()=>{const exact=countries.find(c=>core.normalize(c.name)===core.normalize(q));choose(exact||{name:q,country:''})};
    const manualHint=node('p','También puedes usar el nombre escrito por ti e indicar su país en el siguiente paso.');manualHint.className='muted';
    results.append(manual,manualHint);
  }
  return countries;
}
function reset(){revision++;local();submit.disabled=false;results.removeAttribute('aria-busy');status.textContent=core.query(input.value).length>=2?'Los países aparecen sin conexión. Pulsa Buscar para consultar ciudades y localidades de todo el mundo.':'Escribe un país, ciudad o localidad (al menos dos caracteres).';ui.refreshGallery()}
input.oninput=reset;
form.onsubmit=async event=>{
  event.preventDefault();const q=core.query(input.value);
  if(q.length<2){status.textContent='Escribe al menos dos caracteres para buscar un destino.';return}
  if(submit.disabled)return;
  const current=++revision, trip=localStorage.getItem('vf8-active');local();submit.disabled=true;results.setAttribute('aria-busy','true');
  status.textContent='Buscando ciudades y localidades…';
  try{
    const response=await window.ViajaPlaces.request('/v1/geocode/search',{text:q,type:'city',lang:'es',format:'json',limit:5});
    if(current!==revision||trip!==localStorage.getItem('vf8-active'))return;
    const cities=core.cities(response);
    if(cities.length){
      results.append(node('h2','Ciudades y localidades'));
      cities.forEach(c=>results.append(card(c)));
      const source=node('p');source.className='muted';source.append(document.createTextNode('Resultados de Geoapify · '));
      const link=node('a','© OpenStreetMap contributors');link.href='https://www.openstreetmap.org/copyright';link.target='_blank';link.rel='noopener noreferrer';source.append(link);results.append(source);
    }
    status.textContent=cities.length?'Selecciona el destino correcto y comprueba su país antes de continuar.':'No se han encontrado ciudades con ese nombre. Puedes elegir un país de la lista, añadir el país a la búsqueda o usar el nombre escrito.';
  }catch(error){if(current===revision)status.textContent='No se pudo consultar ciudades. '+error.message+' Puedes elegir un país o usar el nombre escrito para organizar tu viaje.'}
  finally{if(current===revision){submit.disabled=false;results.removeAttribute('aria-busy')}}
};
const previousShow=window.show;window.show=function(id){
  if(id==='v12destinations'){
    const trip=localStorage.getItem('vf8-active');
    if(originTrip!==trip){originTrip=trip;input.value='';reset()}
  }
  previousShow(id);
};
})();
