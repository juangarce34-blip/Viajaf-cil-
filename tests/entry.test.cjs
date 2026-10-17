const {test}=require('node:test'),assert=require('node:assert/strict'),api=require('../entry-procedures.js');
const base={country:'Estados Unidos',passportCountry:'España',nationality:'es',purpose:'tourism',depart:'2026-11-10',returnDate:'2026-11-20',children:1};
test('ESTA y alternativa DS-160 explican condiciones y no conceden elegibilidad automática',()=>{
 const g=api.guide(base);assert.match(g.items.find(i=>i.id==='destination:US:esta').answer,/hasta 90 días/);assert.match(g.items.find(i=>i.id==='destination:US:esta').answer,/exclusiones/);
 assert.equal(g.items.find(i=>i.id==='destination:US:esta').url,'https://esta.cbp.dhs.gov/');assert.ok(g.items.some(i=>i.id==='destination:US:visa'));
 for(const changes of [{passportCountry:'India',nationality:'other'},{purpose:'other'}])assert.match(api.guide({...base,...changes}).items.find(i=>i.id==='destination:US:esta').answer,/No hemos determinado/);
 assert.match(api.guide({...base,returnDate:'2027-05-20'}).items.find(i=>i.id==='destination:US:esta').answer,/supera 90 días/);
});
test('pasaporte español da cita oficial; otra nacionalidad no recibe cita de renovación española',()=>{
 assert.ok(api.guide(base).items.some(i=>i.id==='passport:ES:passport'));
 assert.ok(!api.guide({...base,passportCountry:'India',nationality:'other'}).items.some(i=>i.scope==='passport'));
 assert.match(api.guide({...base,passportExpiry:'2026-11-15'}).alerts.join(' '),/caduca antes del regreso/);
});
test('Canadá distingue entrada por tierra/mar y Reino Unido tiene en cuenta permiso previo',()=>{
 assert.match(api.guide({...base,country:'Canadá',entryMode:'landSea'}).items.find(i=>i.id==='destination:CA:eta').answer,/no se exige eTA/);
 assert.match(api.guide({...base,country:'Reino Unido',ukstatus:'status'}).items.find(i=>i.id==='destination:GB:eta').answer,/exención antes de solicitar/);
});
test('declaraciones no se presentan como visados ni como garantía de admisión',()=>{
 const tdac=api.guide({...base,country:'Tailandia'}).items.find(i=>i.id==='destination:TH:tdac');assert.match(tdac.answer,/No sustituye el visado/);assert.match(tdac.when,/3 días/);
 assert.match(api.guide({...base,country:'Japón'}).items.find(i=>i.id==='destination:JP:declaration').answer,/no concede permiso de entrada/);
 assert.equal(api.guide({...base,country:'Nueva Zelanda'}).items.filter(i=>i.scope==='destination').length,2);
});
test('escalas reconocidas añaden trámites propios y países desconocidos quedan pendientes',()=>{
 const g=api.guide({...base,country:'Italia',transit:'Canadá; Estados Unidos, Canadá\nAtlantis'});
 assert.equal(g.items.filter(i=>i.id==='transit:CA:eta').length,1);assert.match(g.items.find(i=>i.id==='transit:US:esta').answer,/Escala:/);
 assert.match(g.alerts.join(' '),/Atlantis/);
 assert.match(api.guide({...base,country:'China'}).alerts.join(' '),/no hay un catálogo/);
});
test('cambiar el perfil invalida los estados; alias del mismo país mantienen su identidad',()=>{
 for(const changes of [{passportCountry:'India'},{country:'Canadá'},{depart:'2026-12-01'},{returnDate:'2026-11-22'},{purpose:'other'},{transit:'Canadá'},{entryMode:'air'},{passportExpiry:'2030-10-10'},{children:2},{ukstatus:'status'}])assert.notEqual(api.key(base),api.key({...base,...changes}));
 assert.equal(api.key(base),api.key({...base,country:'US'}));
});
test('catálogo usa HTTPS y autoridades revisadas, sin intermediarios ni URLs construidas desde texto libre',()=>{
 const allowed=new Set(['www.gov.uk','esta.cbp.dhs.gov','travel.state.gov','www.canada.ca','immi.homeaffairs.gov.au','nzeta.immigration.govt.nz','www.immigration.govt.nz','www.travellerdeclaration.govt.nz','www.indianvisaonline.gov.in','etakenya.go.ke','visa2egypt.gov.eg','tdac.immigration.go.th','www.digital.go.jp','www.citapreviadnie.es']);
 for(const country of ['GB','US','CA','AU','NZ','IN','KE','EG','TH','JP'])for(const item of api.guide({...base,country}).items)for(const key of ['url','check','source'])if(item[key]){const u=new URL(item[key]);assert.equal(u.protocol,'https:');assert.ok(allowed.has(u.hostname),u.hostname)}
 assert.equal(api.guide({...base,country:'<script>'}).country,null);
});
