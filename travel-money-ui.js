/* Destination-aware presentation, using existing cards and navigation. */
(()=>{'use strict';
const $=id=>document.getElementById(id),n=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e},M=ViajaMoney;
const panel=n('section');panel.id='travelMoney';document.querySelector('main').insertBefore(panel,document.querySelector('nav'));
let serial=0;
function read(key){try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{return {}}}
function link(label,url){const a=n('a',label+' ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a}
function btn(text,fn){const b=n('button',text);b.type='button';b.className='btn secondary';b.onclick=fn;return b}
function field(parent,label,id,value,type='number'){const l=n('label',label),e=n('input');e.id=id;l.htmlFor=id;e.type=type;e.value=value??'';if(type==='number'){e.min=0;e.step='any';e.inputMode='decimal'}parent.append(l,e);return e}
function select(parent,label,id,items,value){const l=n('label',label),e=n('select');l.htmlFor=id;e.id=id;for(const [key,item]of Object.entries({'':['Selecciona'],...items})){const o=n('option',item[0]);o.value=key;e.append(o)}e.value=value||'';parent.append(l,e);return e}
function render(){
 const generation=++serial,c=ViajaProceduresUI.context(),prefs=read('vf8-provider-preferences'),op=prefs.operator||localStorage.getItem('vf-operator')||'',bank=prefs.bank||localStorage.getItem('vf-bank')||'',g=M.guide(c,op,bank);
 panel.replaceChildren(n('h1','Móvil, moneda y pagos'),n('p',(c.destination||'Tu destino')+' · '+(g.country?.name||'País pendiente')));
 if(!g.country)panel.append(n('p','No se ha reconocido el país. No aplicamos condiciones de otro destino.'),btn('Elegir país',()=>show('setup')));
 const status=n('p');status.setAttribute('role','status');panel.append(status);
 const mobile=n('div');mobile.className='card';mobile.append(n('h2','Telefonía y roaming'));
 const os=select(mobile,'Tu operador español','moneyOperator',M.operators,op);
 mobile.append(n('p',g.roaming),link('Reglas oficiales de roaming UE','https://europa.eu/youreurope/citizens/consumers/internet-telecoms/mobile-roaming-costs/index_es.htm'));
 if(g.operator)mobile.append(link('Consultar '+g.operator[0],g.operator[1]));
 mobile.append(n('p','Condiciones de tu línea: pendientes de confirmar. Comprueba contrato o prepago, país incluido, GB, llamadas/SMS, uso razonable, recargo y fecha de fin de promociones. Llamar desde España al extranjero no es roaming. En barcos y aviones evita redes por satélite, que pueden quedar fuera del bono.'));
 const comparison=n('details');comparison.append(n('summary','Comparar mi tarifa con SIM/eSIM'));
 const key='vf-connectivity-'+(g.country?.code||'unknown'),saved=read(key);
 const roaming=field(comparison,'Coste extra total de roaming confirmado (€)','moneyRoaming',saved.roaming),sim=field(comparison,'Coste total SIM/eSIM confirmado (€)','moneySim',saved.sim);
 const result=n('p');result.setAttribute('aria-live','polite');comparison.append(result,n('p','Compara la misma duración y GB. Incluye activación, impuestos y exceso de datos. Una eSIM puede ser solo de datos: comprueba llamadas, compartir Internet, cobertura, compatibilidad y móvil desbloqueado. Si usas una SIM de datos, desactiva roaming y cambio automático de datos en la línea habitual.'));
 function compare(){const difference=M.compare(roaming.value,sim.value);result.textContent=difference===null?'Introduce ambos costes confirmados; no interpretamos un campo vacío como gratis.':difference===0?'Mismo coste anotado: decide según GB, cobertura y llamadas.':difference>0?'La SIM/eSIM cuesta '+difference.toFixed(2)+' € menos según tus importes.':'Tu roaming cuesta '+Math.abs(difference).toFixed(2)+' € menos según tus importes.';}
 for(const e of [roaming,sim])e.oninput=()=>{compare();try{localStorage.setItem(key,JSON.stringify({roaming:roaming.value,sim:sim.value}));vf8SaveActive()}catch{status.textContent='No se pudo guardar la comparación.'}};compare();mobile.append(comparison);panel.append(mobile);
 const fx=n('div');fx.className='card';fx.id='moneyExchange';fx.append(n('h2','Moneda y conversor'));
 const currency=g.currency;let rate=null;
 let name=currency;try{if(currency)name=new Intl.DisplayNames('es',{type:'currency'}).of(currency)}catch{}
 fx.append(n('p',currency?name+' · '+currency:'Información no disponible: no hay moneda catalogada para este destino.'),link('Catálogo oficial ISO 4217 · SIX','https://www.six-group.com/en/products-services/financial-information/data-standards.html'));
 const rateStatus=n('p');rateStatus.id='moneyRateStatus';rateStatus.setAttribute('role','status');fx.append(rateStatus);
 const amount=field(fx,'Cantidad','moneyAmount','100');const direction=select(fx,'Convertir','moneyDirection',{forward:['EUR → '+(currency||'?')],reverse:[(currency||'?')+' → EUR']},'forward');const output=n('p');output.id='moneyConverted';output.setAttribute('aria-live','polite');fx.append(output);
 function conversion(){const value=M.convert(amount.value,rate,direction.value==='reverse');output.textContent=value===null?'Conversión pendiente de importe y tipo de cambio válidos.':value.toLocaleString('es-ES',{maximumFractionDigits:2})+' '+(direction.value==='reverse'?'EUR':currency)}
 amount.oninput=direction.onchange=conversion;
 const refresh=btn('Actualizar cambio',async()=>{if(!currency)return;refresh.disabled=true;rateStatus.textContent='Consultando referencia…';const value=await M.exchange(currency,{fetcher:window.vfMoneyFetch||window.fetch.bind(window)});if(generation!==serial)return;refresh.disabled=false;rate=value.rate||null;rateStatus.textContent=value.error||('1 EUR = '+value.rate+' '+currency+' · Fecha de referencia: '+value.date+' · Consulta: '+new Date(value.retrievedAt).toLocaleString('es-ES')+' · Fuente: '+value.source+(value.offline?' · Último cambio guardado; puede estar desactualizado.':' · Puede corresponder al último día hábil.')+(value.persisted===false?' · No se pudo guardar para uso sin conexión.':''));conversion()});refresh.disabled=!currency;fx.append(refresh,n('p','Tipo de referencia, no oferta de cambio ni importe final de tu banco. Las comisiones, el margen y la fecha de liquidación pueden cambiar el coste.'),link('BCE · tipos de referencia','https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html'),link('Servicio gratuito Frankfurter','https://frankfurter.dev/'));panel.append(fx);conversion();if(currency)refresh.click();
 const payments=n('div');payments.className='card';payments.append(n('h2','Tarjetas, efectivo y cajeros'));const bs=select(payments,'Banco o proveedor','moneyBank',M.banks,bank);
 payments.append(n('p','Información orientativa · '+g.payments));if(g.bank)payments.append(link('Condiciones oficiales de '+g.bank[0],g.bank[1]));
 payments.append(n('p','Comisiones de tu tarjeta: información no disponible hasta comprobar el producto y plan exactos. Revisa comisión de compra en divisa, cambio aplicado, límite de retiradas, coste fijo/porcentaje, importe mínimo y posibles recargos del propietario del cajero. Una retirada a crédito puede generar intereses. No introduzcas credenciales, números de tarjeta ni saldo.'),n('h3','Elige la moneda local'),n('p',currency==='EUR'?'La moneda del destino es el euro: con una cuenta en euros no necesitas convertir. Aun así puede haber comisión por usar el cajero.':'Si el comercio o cajero ofrece cobrar en euros, es conversión dinámica (DCC): el proveedor fija su cambio y puede añadir un margen. Habitualmente conviene rechazar esa conversión y elegir '+(currency||'la moneda local')+' para que convierta tu tarjeta. Compara el coste completo si conoces ambas condiciones; elegir moneda local no elimina las comisiones de tu banco.'),n('p','En un cajero revisa el recargo mostrado antes de aceptar. Si no te conviene, cancela. Usa el localizador oficial de tu banco o red; la app no garantiza cajeros operativos ni retiradas gratuitas.'),link('Banco de España · tarjetas y pagos','https://clientebancario.bde.es/pcb/es/menu-horizontal/productosservici/serviciospago/'));
 if(g.country?.code==='JP')payments.append(link('Turismo oficial de Japón · dinero','https://www.japan.travel/en/plan/currency/'));
 panel.append(payments);
 for(const [e,k]of [[os,'operator'],[bs,'bank']])e.onchange=()=>{try{localStorage.setItem('vf8-provider-preferences',JSON.stringify({...read('vf8-provider-preferences'),[k]:e.value}));render()}catch{status.textContent='No se pudo guardar la preferencia en este dispositivo.'}};
 if(typeof isLondon==='function'&&isLondon())panel.append(btn('Mis comprobaciones y notas anteriores',()=>previous('personal')));
 panel.append(n('p','Operador y banco se recuerdan en este dispositivo para próximos viajes. Las comparaciones se guardan por viaje y país.'),btn('Volver a mi viaje',()=>show('home')));
}
const previous=window.show;window.show=function(id){if(id==='personal')id='travelMoney';if(id==='travelMoney')render();previous(id)};
window.ViajaMoneyUI={render};
})();
