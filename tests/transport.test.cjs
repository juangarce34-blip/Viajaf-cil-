const {test}=require('node:test'),assert=require('node:assert/strict'),api=require('../transport-core.js');
const c={destination:'Nueva York',country:'Estados Unidos',origin:'Madrid, España',depart:'2026-11-10',returnDate:'2026-11-20'};
const d={arrivalAirport:'JFK',departureAirport:'EWR',homeAirport:'MAD',hotelName:'Hotel de prueba',hotelAddress:'20 W 34th St, Manhattan',arrivalTerminal:'4',departureTerminal:'B',arrivalAt:'2026-11-10T18:00',departureAt:'2026-11-20T21:00'};
test('identifica la ciudad con país y no asigna un aeropuerto por defecto',()=>{
 assert.equal(api.city(c).id,'nyc');assert.equal(api.city({...c,destination:'New York'}).id,'nyc');assert.equal(api.city({...c,country:'Italia'}),null);
 assert.equal(api.airport('jfk').code,'JFK');assert.equal(api.airport('Aeropuerto inventado'),null);
 const g=api.guide(c,{});assert.equal(g.airport,null);assert.equal(g.transit,null);assert.match(g.alerts.join(' '),/no elegimos uno por defecto/);
});
test('ruta de llegada y vuelta usa aeropuertos diferentes y conserva el sentido',()=>{
 const arrival=api.guide(c,d),back=api.guide(c,d,'return');
 assert.equal(arrival.airport.code,'JFK');assert.equal(back.airport.code,'EWR');
 const a=new URL(arrival.transit),b=new URL(back.transit);
 assert.match(a.searchParams.get('origin'),/Kennedy/);assert.match(a.searchParams.get('destination'),/20 W 34th/);
 assert.match(b.searchParams.get('origin'),/20 W 34th/);assert.match(b.searchParams.get('destination'),/Newark/);
 assert.match(new URL(back.home).searchParams.get('origin'),/Madrid-Barajas/);assert.equal(new URL(back.home).searchParams.get('destination'),'Madrid, España');
 assert.equal(api.guide(c,{...d,sameAirport:true},'return').airport.code,'JFK');
});
test('un aeropuerto de otro país bloquea recomendaciones y un aeropuerto manual no hereda otra ficha',()=>{
 const wrong=api.guide({...c,country:'Italia',destination:'Roma'},d);assert.equal(wrong.transit,null);assert.equal(wrong.options.length,0);assert.match(wrong.alerts.join(' '),/otro país/);
 const manual=api.guide(c,{...d,arrivalAirport:'Aeropuerto alternativo, New York, USA'});assert.ok(manual.transit);assert.equal(manual.options.length,0);assert.match(manual.alerts.join(' '),/manualmente/);
 assert.equal(api.guide(c,{...d,hotelAddress:''}).transit,null);
});
test('JFK, Newark, LaGuardia y los dos aeropuertos romanos tienen instrucciones propias',()=>{
 assert.match(api.guide(c,d).options.find(x=>x.type==='transit').text,/Jamaica/);
 assert.match(api.guide(c,{...d,arrivalAirport:'EWR'}).options.find(x=>x.type==='transit').text,/NJ Transit/);
 assert.match(api.guide(c,{...d,arrivalAirport:'LGA'}).options.find(x=>x.type==='transit').text,/Q70/);
 const rome={...c,country:'Italia',destination:'Roma'};
 assert.match(api.guide(rome,{...d,arrivalAirport:'FCO'}).options[0].title,/Leonardo/);
 assert.doesNotMatch(api.guide(rome,{...d,arrivalAirport:'CIA'}).options[0].title,/Leonardo/);
});
test('las rutas codifican texto libre y no añaden parámetros o enlaces del usuario',()=>{
 const u=new URL(api.maps('JFK & api=evil','Hotel ?q=javascript:alert(1) &key=fake'));
 assert.equal(u.origin,'https://www.google.com');assert.equal(u.searchParams.get('api'),'1');assert.equal(u.searchParams.get('destination'),'Hotel ?q=javascript:alert(1) &key=fake');assert.equal(u.searchParams.has('key'),false);
 assert.equal(api.maps('','Hotel'),null);
});
test('cambios de vuelo, dirección, terminal, horario y elección dejan pendiente el traslado',()=>{
 const key=api.routeKey(c,d,'arrival');for(const changes of [{arrivalAirport:'LGA'},{hotelAddress:'Otra dirección'},{arrivalTerminal:'5'},{arrivalAt:'2026-11-11T08:00'},{arrivalChoice:'taxi'}])assert.notEqual(api.routeKey(c,{...d,...changes},'arrival'),key);
 assert.notEqual(api.routeKey(c,d,'return'),api.routeKey(c,{...d,homeAirport:'BCN'},'return'));
 assert.notEqual(api.contextKey(c),api.contextKey({...c,destination:'Los Ángeles'}));assert.equal(api.contextKey(c),api.contextKey({...c,country:'US'}));
});
test('fuentes HTTPS estáticas y teléfonos identificados, sin inventar tarifas en directo ni llamadas automáticas',()=>{
 assert.equal(api.airports.length,15);assert.equal(api.cities.length,10);
 for(const a of api.airports){assert.match(a.code,/^[A-Z]{3}$/);for(const o of a.options){if(o.url)assert.equal(new URL(o.url).protocol,'https:');if(o.phone){assert.match(o.phone,/^\+\d{7,15}$/);assert.ok(o.phoneLabel)}}}
 const rome=api.airport('FCO').options.find(o=>o.type==='taxi');assert.equal(rome.phone,'+39060609');
 const privateRide=api.airport('JFK').options.find(o=>o.type==='private');assert.equal(privateRide.kind,'private');assert.match(privateRide.source,/jfkairport.com/);
});

