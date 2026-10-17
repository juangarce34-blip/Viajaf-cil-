/* Shared offline-first guidance. No commercial rates are assumed. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./destination-core.js'));else root.ViajaMoney=factory(root.ViajaDestinationsCore)})(globalThis,function(core){
'use strict';
const operators={
 movistar:['Movistar','https://www.movistar.es/tarifas-moviles/roaming/'],o2:['O2','https://o2online.es/ayuda/roaming/'],vodafone:['Vodafone','https://www.vodafone.es/c/particulares/es/productos-y-servicios/movil/roaming-y-llamadas-internacionales/'],lowi:['Lowi','https://www.lowi.es/roaming/'],orange:['Orange','https://www.orange.es/servicios/roaming'],jazztel:['Jazztel','https://www.jazztel.com/roaming'],yoigo:['Yoigo','https://www.yoigo.com/roaming'],masmovil:['MásMóvil','https://www.masmovil.es/roaming'],pepephone:['Pepephone','https://www.pepephone.com/roaming'],digi:['DIGI','https://www.digimobil.es/tarifas/roaming']
};
const banks={caixa:['CaixaBank','https://www.caixabank.es/particular/tarjetas.html'],santander:['Santander','https://www.bancosantander.es/particulares/tarjetas'],bbva:['BBVA','https://www.bbva.es/personas/productos/tarjetas.html'],sabadell:['Sabadell','https://www.bancsabadell.com/bsnacional/es/particulares/tarjetas/'],ing:['ING','https://www.ing.es/tarjetas'],openbank:['Openbank','https://www.openbank.es/tarjetas'],revolut:['Revolut','https://www.revolut.com/es-ES/legal/standard-fees/'],n26:['N26','https://n26.com/es-es/precios'],traderepublic:['Trade Republic','https://traderepublic.com/es-es']};
const euro='AT BE BG HR CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES AD MC SM VA'.split(' ');
const currencies={};
for(const code of euro)currencies[code]='EUR';
for(const [currency,countries] of Object.entries({GBP:'GB',USD:'US EC SV',JPY:'JP',CHF:'CH LI',CAD:'CA',AUD:'AU',NZD:'NZ',CNY:'CN',HKD:'HK',SGD:'SG',THB:'TH',INR:'IN',KRW:'KR',MXN:'MX',BRL:'BR',ARS:'AR',CLP:'CL',COP:'CO',PEN:'PE',MAD:'MA',AED:'AE',TRY:'TR',EGP:'EG',ZAR:'ZA',NOK:'NO',SEK:'SE',DKK:'DK',PLN:'PL',CZK:'CZ',HUF:'HU',RON:'RO',IDR:'ID',MYR:'MY',PHP:'PH',VND:'VN',ISK:'IS',ILS:'IL',SAR:'SA',TND:'TN'}))for(const code of countries.split(' '))currencies[code]=currency;
const eea=new Set('AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO'.split(' '));
const cities={londres:'GB',london:'GB',paris:'FR',roma:'IT',rome:'IT',tokio:'JP',tokyo:'JP',lisboa:'PT',berlin:'DE',marrakech:'MA',bangkok:'TH',dubai:'AE','nueva york':'US','new york':'US',sidney:'AU',sydney:'AU','buenos aires':'AR'};
function destination(c){return core.country(c.country)||(!String(c.country||'').trim()?core.country(cities[core.normalize(c.destination||'')]):null)}
function guide(c,operator,bank){const country=destination(c),code=country?.code,currency=currencies[code]||null;return {country,currency,operator:operators[operator]||null,bank:banks[bank]||null,
 roaming:!code?'Selecciona el país para determinar la zona de roaming.':code==='ES'?'En España, con una línea española utilizas tu tarifa nacional. Las llamadas a números extranjeros pueden tener otra tarifa.':eea.has(code)?'Para una línea española en viajes periódicos por la UE/EEE se aplica el régimen de roaming como en casa, sujeto a uso razonable y condiciones de tu contrato. Puede haber límites de GB incluso con datos ilimitados; confirma tu bono y el recargo al agotarlo.':code==='GB'?'Reino Unido está fuera del régimen obligatorio de roaming de la UE. Tu operador puede incluirlo o cobrarlo según contrato, modalidad y promociones. No actives los datos hasta comprobar tu línea concreta.':'El destino está fuera de la zona UE/EEE. No presupongas datos ni llamadas incluidos. Comprueba zona, bono diario, activación automática y precio fuera del bono antes de conectarte.',
 payments:code==='GB'?'En Londres la tarjeta sin contacto es habitual y algunos establecimientos solo aceptan tarjeta. Conserva una alternativa por si falla tu tarjeta y consulta antes de depender del efectivo.':code==='JP'?'En Japón combina tarjeta y efectivo: pequeños comercios pueden exigir efectivo y algunos cajeros no admiten tarjetas extranjeras. Consulta la red admitida antes de retirar.':'La aceptación de tarjetas y la disponibilidad de cajeros varían por localidad, comercio y red. Lleva una alternativa de pago y una reserva moderada de efectivo; comprueba cajeros en la aplicación oficial de tu banco.'};}
const SOURCE='Frankfurter · tipos de referencia del BCE';
const ENDPOINT='https://api.frankfurter.dev/v1/latest?base=EUR';
function validateRate(data,currency,now=Date.now()){
 const rate=data?.rates?.[currency],date=data?.date;
 if(data?.base!=='EUR'||typeof rate!=='number'||!Number.isFinite(rate)||rate<=0||!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||Date.parse(date)>now+86400000)throw Error('Respuesta de cambio no válida');
 return {currency,rate,date,retrievedAt:new Date(now).toISOString(),source:SOURCE};
}
function cached(storage,currency){try{const x=JSON.parse(storage.getItem('vf8-fx-'+currency)||'null');const v=validateRate({base:'EUR',date:x.date,rates:{[currency]:x.rate}},currency);if(x.currency!==currency||!Number.isFinite(Date.parse(x.retrievedAt)))return null;return {...v,retrievedAt:x.retrievedAt}}catch{return null}}
async function exchange(currency,{fetcher=globalThis.fetch,storage=globalThis.localStorage,now=Date.now()}={}){
 if(currency==='EUR')return {currency,rate:1,date:new Date(now).toISOString().slice(0,10),retrievedAt:new Date(now).toISOString(),source:'Paridad EUR/EUR',offline:false};
 if(!/^[A-Z]{3}$/.test(currency||''))return {error:'Moneda no disponible',offline:true};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{const response=await fetcher(ENDPOINT+'&symbols='+currency,{signal:controller.signal});if(!response.ok)throw Error('Servicio no disponible');const value=validateRate(await response.json(),currency,now);let persisted=true;try{storage.setItem('vf8-fx-'+currency,JSON.stringify(value))}catch{persisted=false}return {...value,offline:false,persisted};}
 catch{return {...(cached(storage,currency)||{error:'No hay cambio guardado para esta moneda. Conéctate y vuelve a intentarlo.'}),offline:true};}finally{clearTimeout(timer)}
}
function convert(amount,rate,inverse=false){if(String(amount).trim()===''||!Number.isFinite(Number(amount))||Number(amount)<0||!Number.isFinite(rate)||rate<=0)return null;const result=inverse?Number(amount)/rate:Number(amount)*rate;return Number.isFinite(result)?result:null}
function compare(a,b){const valid=x=>String(x).trim()!==''&&Number.isFinite(Number(x))&&Number(x)>=0;return valid(a)&&valid(b)?Math.round((Number(a)-Number(b))*100)/100:null}
return {operators,banks,destination,guide,currencies,exchange,validateRate,cached,convert,compare,ENDPOINT};
});
