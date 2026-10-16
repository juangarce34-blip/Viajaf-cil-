/* Shared PWA / Android presentation; existing trip and backup formats retained. */
(()=>{'use strict';
const $=id=>document.getElementById(id), node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
for(const id of ['passportCountry','tripTransit']){
  $(id).value=localStorage.getItem('vf-profile-'+id)||'';
  $(id).addEventListener('change',()=>{localStorage.setItem('vf-profile-'+id,$(id).value);vf8SaveActive();render()});
}
function context(){return {destination:$('tripDestination').value,country:$('tripCountry').value,
  nationality:$('nationality').value,passportCountry:$('passportCountry').value,transit:$('tripTransit').value,
  depart:$('tripDepart').value,returnDate:$('tripReturn').value,purpose:$('purpose').value,
  children:Number($('visitChildren').value)||0};}
const card=[...$('world').querySelectorAll('.card')].find(c=>c.querySelector('h2')?.textContent.includes('Documentación y salud'));
card.id='worldRequirements';
function link(label,url){const a=node('a',label+' ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a}
function render(){
  const passport=ViajaDestinationsCore.country($('passportCountry').value);
  if(passport&&passport.code!=='ES'&&$('nationality').value==='es'){
    $('nationality').value='other';localStorage.setItem('vf-profile-nationality','other');refreshProfile();vf8SaveActive();
  }
  const c=context(),info=ViajaOfficial.guide(c);
  $('destinationHelp').textContent=c.destination?'Tu destino: '+[c.destination,c.country].filter(Boolean).join(', ')+'. Completa las fechas y consulta su documentación antes de viajar.':'Elige una ciudad o destino y su país para preparar tu guía.';
  $('ukResidence').hidden=!(ViajaDestinationsCore.normalize(c.destination)==='londres'||ViajaDestinationsCore.normalize(c.destination)==='london')||ViajaDestinationsCore.country(c.country)?.code!=='GB';
  card.replaceChildren(node('h2','Documentación y salud · '+(info.country?.name||c.country||'elige un país')));
  card.append(node('p',info.profile));
  const dates=node('p',c.depart&&c.returnDate?'Viaje: '+c.depart+' → '+c.returnDate:'Completa las fechas del viaje para comprobar la vigencia de las condiciones.');card.append(dates);
  if(info.missing){card.append(node('p',info.missing));const b=node('button','Revisar país y pasaporte');b.onclick=()=>show('setup');card.append(b);return}
  card.append(node('h3','Documentos y entrada'),node('p',info.entry));
  for(const item of info.links){const p=node('p');p.append(link(item.label,item.url));card.append(p)}
  card.append(node('h3','Salud y vacunas'),node('p',info.health));
  if(info.advice){const p=node('p');p.append(link('Ficha oficial de '+info.country.name+': documentación, sanidad y avisos',info.advice.url));card.append(p)}
  if(info.children)card.append(node('h3','Viaje con menores'),node('p',info.children));
  card.append(node('h3','Escalas'),node('p',info.transit));
  const date=node('p','Directorio de fuentes revisado el 16/10/2026. Los requisitos aplicables a tu perfil y fechas están pendientes de comprobar en la fuente oficial.');date.className='muted';card.append(date);
}
for(const id of ['tripDestination','tripCountry','nationality','tripDepart','tripReturn','purpose','visitChildren'])$(id).addEventListener('change',render);
const previousShow=window.show;window.show=function(id){previousShow(id);if(['setup','world','v12detail','plan'].includes(id))render()};
const previousSave=window.saveWorldDestination;window.saveWorldDestination=function(){previousSave();render()};

// A selected file is validated and previewed before the destructive action is offered.
let selection=0;
$('vf9Choose').onclick=()=>{$('vf9File').value='';window.vf9ReviewedFile=null;$('vf9Review').hidden=true;selection++;$('vf9File').click()};
$('vf9File').onchange=async()=>{
  const version=++selection,file=$('vf9File').files?.[0];window.vf9ReviewedFile=null;$('vf9Review').hidden=true;
  if(!file)return;
  try{
    if(file.size>ViajaBackup.MAX_BYTES)throw Error('Archivo demasiado grande (máximo 5 MB).');
    const checked=ViajaBackup.validate(JSON.parse(await file.text()));
    if(version!==selection)return;
    window.vf9ReviewedFile=file;
    $('vf9Preview').textContent='La copia contiene '+checked.trips.length+' viaje(s): '+checked.trips.map(t=>t.name).join(', ')+'.';
    $('vf9Review').hidden=false;vf9Status('Copia válida. Revisa el contenido antes de restaurar.');
  }catch(error){if(version===selection)vf9Status('No se pudo importar: '+error.message)}
};
$('vf9SaveBefore').onclick=async()=>{await window.vf9Export()};
$('vf9Confirm').onclick=()=>window.vf9Import(true);
$('vf9Cancel').onclick=()=>{selection++;window.vf9ReviewedFile=null;$('vf9File').value='';$('vf9Review').hidden=true;vf9Status('Restauración cancelada. Tus viajes se conservan.')};
render();
})();
