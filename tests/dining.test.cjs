const {test}=require('node:test'),assert=require('node:assert/strict'),d=require('../dining-core.js');
test('consulta limitada a comida en coordenadas válidas, sin inyección',()=>{
 assert.match(d.query(34.0522,-118.2437,2000),/restaurant\|cafe\|bar\|pub/);
 assert.match(d.query(34.0522,-118.2437,2000),/out center 80/);
 for(const v of [[91,0,2000],[1,'0);out;',2000],[0,0,50000]])assert.throws(()=>d.query(...v));
});
test('datos OSM conservan nombres reales, eliminan duplicados y webs inseguras',()=>{
 const node={type:'node',id:1,lat:34,lon:-118,tags:{name:'Café de prueba',amenity:'cafe',website:'javascript:alert(1)'}};
 const places=d.places({elements:[node,node,{type:'node',id:2,tags:{name:'Sin ubicación',amenity:'restaurant'}}]});
 assert.equal(places.length,1);assert.equal(places[0].label,'Cafetería');assert.equal(places[0].website,'');
 assert.throws(()=>d.places({elements:[],remark:'Timeout'}));
});
test('calcula grupo y días con redondeo monetario e impuestos previstos',()=>{
 assert.deepEqual(d.estimate({people:'3',days:'3',meals:'2',mealPrice:'20',drinks:'1',drinkPrice:'5',extra:'10'}),{total:445.5,missing:0});
 assert.equal(d.estimate({people:'1',days:'1',meals:'3',mealPrice:'0.10',drinks:'0',drinkPrice:'',extra:'0'}).total,0.3);
});
test('importes desconocidos no se convierten en gratuidad ni se completan con precios inventados',()=>{
 assert.deepEqual(d.estimate({people:'2',days:'1',meals:'2',mealPrice:'',drinks:'1',drinkPrice:'5',extra:''}),{total:10,missing:2});
 assert.throws(()=>d.estimate({people:'2',days:'1',meals:'2',mealPrice:'-1',drinks:'0',drinkPrice:'',extra:'0'}));
});
test('añadir comida conserva todas las actividades y evita duplicados',()=>{
 const plan={days:[{id:'d',date:'',items:[{id:'museum',name:'Museo',cost:20}]}]},place={id:'node/1',name:'Restaurante',label:'Restaurante',address:'Centro',lat:34,lon:-118};
 const next=d.append(plan,0,place);assert.equal(plan.days[0].items.length,1);assert.equal(next.days[0].items.length,2);
 assert.deepEqual(next.days[0].items[0],plan.days[0].items[0]);assert.equal(next.days[0].items[1].cost,null);assert.equal(next.days[0].items[1].kind,'Comida');
 assert.throws(()=>d.append(next,0,place),/ya está/);
});
test('cliente HTTP gastronómico solo permite su endpoint público gratuito',async()=>{
 const {createDiningFetch}=await import('../native/geo-fetch.mjs');let calls=0;
 const request=createDiningFetch(async()=>{calls++;return {status:200,data:{elements:[]}}});
 const response=await request(d.endpoint+'?data=test');assert.equal(response.ok,true);assert.equal(calls,1);
 await assert.rejects(request('https://example.com/api/interpreter'),TypeError);assert.equal(calls,1);
});
