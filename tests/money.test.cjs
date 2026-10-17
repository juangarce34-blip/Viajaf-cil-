const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../travel-money.js');
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)}};
const response=(rate=.86,date='2026-10-16')=>({ok:true,json:async()=>({base:'EUR',date,rates:{GBP:rate}})});
test('destino guardado e inferencia limitada, sin aplicar Londres a otros destinos',()=>{
 assert.equal(M.guide({destination:'Londres'}).currency,'GBP');assert.equal(M.guide({destination:'Londres',country:'Francia'}).currency,'EUR');assert.equal(M.guide({destination:'Londres',country:'no existe'}).country,null);
 assert.match(M.guide({country:'GB'}).roaming,/fuera del régimen/);assert.match(M.guide({country:'FR'}).roaming,/uso razonable/);assert.equal(M.guide({country:'JP'}).currency,'JPY');assert.equal(M.guide({country:'AQ'}).currency,null);
 assert.equal(Object.keys(M.operators).length,10);assert.equal(Object.keys(M.banks).length,9);
});
test('guarda una referencia validada y la recupera sin conexión',async()=>{
 const s=storage(),now=Date.parse('2026-10-17T12:00Z');let r=await M.exchange('GBP',{storage:s,fetcher:async()=>response(),now});assert.equal(r.offline,false);assert.equal(r.rate,.86);
 r=await M.exchange('GBP',{storage:s,fetcher:async()=>{throw Error('offline')},now});assert.equal(r.offline,true);assert.equal(r.rate,.86);assert.equal(r.retrievedAt,'2026-10-17T12:00:00.000Z');
 assert.ok((await M.exchange('JPY',{storage:s,fetcher:async()=>{throw Error()},now})).error);
});
test('rechaza respuestas corruptas, futuras, HTTP fallido y caché de otra moneda',async()=>{
 const s=storage(),now=Date.parse('2026-10-17');for(const fetcher of [async()=>response(-1),async()=>response(1,'2099-01-01'),async()=>({ok:false}),async()=>({ok:true,json:async()=>({base:'USD',date:'2026-10-16',rates:{GBP:1}})})])assert.ok((await M.exchange('GBP',{storage:s,fetcher,now})).error);
 s.setItem('vf8-fx-GBP',JSON.stringify({currency:'USD',rate:1,date:'2026-10-16',retrievedAt:'2026-10-17'}));assert.equal(M.cached(s,'GBP'),null);
});
test('sin espacio sigue mostrando referencia y avisa; EUR no necesita red',async()=>{
 const r=await M.exchange('GBP',{storage:{setItem(){throw Error()},getItem(){}},fetcher:async()=>response()});assert.equal(r.persisted,false);assert.equal(r.rate,.86);
 assert.equal((await M.exchange('EUR',{fetcher:()=>{throw Error('No llamar')}})).rate,1);
});
test('conversiones y comparación no confunden pendiente con cero',()=>{
 assert.equal(M.convert('100',.86),86);assert.equal(M.convert('86',.86,true),100);assert.equal(M.convert('',1),null);assert.equal(M.convert('-1',1),null);assert.equal(M.compare('',0),null);assert.equal(M.compare(0,10),-10);assert.equal(M.compare(20,10),10);
});
test('nuevos catálogos respetan país y exponen autoridades',()=>{
 const T=require('../transport-core.js'),E=require('../entry-procedures.js');assert.equal(T.city({destination:'París',country:'FR'}).id,'paris');assert.equal(T.city({destination:'París',country:'GB'}),null);
 for(const code of ['CDG','ORY','LIS','BER'])assert.ok(T.airport(code).options[0].url.startsWith('https://'));
 for(const code of ['SG','KR','VN','ID'])assert.ok(E.guide({country:code,nationality:'es',purpose:'tourism'}).items.some(i=>i.id==='destination:'+code+':entry'));
});
test('cliente nativo de divisas solo permite el endpoint aprobado',async()=>{
 const {createMoneyFetch}=await import('../native/geo-fetch.mjs');const f=createMoneyFetch(async()=>({status:200,data:{base:'EUR'}}));assert.equal((await f(M.ENDPOINT)).ok,true);await assert.rejects(()=>f('https://example.com/v1/latest'));await assert.rejects(()=>f('https://api.frankfurter.dev/other'));
});

test('información oficial por operador y ampliación de roaming regulado',()=>{assert.match(M.operatorAdvice({country:'GB'},'lowi')[0],/zona 1/);assert.match(M.operatorAdvice({country:'GB'},'orange')[0],/condiciones específicas/);assert.equal(M.operatorAdvice({country:'JP'},'lowi'),null);assert.match(M.guide({country:'MD'}).roaming,/zona regulada/);});

test('preferencia vacía prevalece sobre valores heredados; migración solo cuando falta',()=>{
 assert.equal(M.preference({},'operator','movistar'),'movistar');
 assert.equal(M.preference({operator:''},'operator','movistar'),'');
 assert.equal(M.preference({bank:''},'bank','ing'),'');
 assert.equal(M.preference({operator:'inventado'},'operator','movistar'),'');
});
test('comparación se invalida al cambiar operador, fechas, destino o escalas',()=>{
 const c={destination:'Edimburgo',country:'GB',depart:'2026-11-01',returnDate:'2026-11-08',transit:''};
 const saved={version:2,context:M.comparisonKey(c,'movistar'),roaming:'20',sim:'10'};
 assert.deepEqual(M.comparison(saved,c,'movistar'),{roaming:'20',sim:'10'});
 for(const [context,operator] of [[c,'orange'],[{...c,depart:'2026-11-02'},'movistar'],[{...c,returnDate:'2026-11-09'},'movistar'],[{...c,country:'JP'},'movistar'],[{...c,destination:'Manchester'},'movistar'],[{...c,transit:'Canadá'},'movistar']])assert.deepEqual(M.comparison(saved,context,operator),{roaming:'',sim:''});
 assert.deepEqual(M.comparison({roaming:'20',sim:'10'},c,'movistar'),{roaming:'',sim:''});
});
test('pagos británicos no atribuyen Londres a otras ciudades',()=>{
 for(const destination of ['Edimburgo','Manchester','Londres'])assert.doesNotMatch(M.guide({destination,country:'GB'}).payments,/Londres/);
});
