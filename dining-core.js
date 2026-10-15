(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ViajaDining=api})(globalThis,()=>{
  'use strict';
  const endpoint='https://overpass.private.coffee/api/interpreter';
  function query(lat,lon,radius){
    if(!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lon)||Math.abs(lon)>180||![1000,2000,3000].includes(radius))throw Error('Ubicación o radio no válidos.');
    return `[out:json][timeout:15][maxsize:2097152];nwr(around:${radius},${lat},${lon})["amenity"~"^(restaurant|cafe|bar|pub|fast_food|ice_cream)$"]["name"];out center 80;`;
  }
  const labels={restaurant:'Restaurante',cafe:'Cafetería',bar:'Bar',pub:'Pub',fast_food:'Comida rápida',ice_cream:'Heladería'};
  function curated(city,country){
    const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
    if(norm(city)!=='losangeles'||!['us','usa','unitedstates','unitedstatesofamerica','estadosunidos','estadosunidosdeamerica'].includes(norm(country)))return [];
    return [
      ['bottega','Bottega Louie DTLA','restaurant','700 South Grand Avenue, Los Angeles, CA 90017, USA','https://bottegalouie.com/dtla'],
      ['philippe','Philippe The Original','restaurant','1001 N. Alameda St., Los Angeles, CA 90012, USA','https://philippes.com/'],
      ['verve','Verve Coffee · Arts District','cafe','500 Mateo Street, Los Angeles, CA 90013, USA','https://www.vervecoffee.com/pages/locations'],
      ['seven','Seven Grand Los Angeles','bar','515 W 7th St, 2nd floor, Los Angeles, CA 90014, USA','https://www.sevengrandbars.com/la']
    ].map(([id,name,type,address,website])=>({id:'official-la-'+id,name,type,label:labels[type],address,website,curated:true,source:'Web oficial consultada el 15/10/2026'}));
  }
  function places(data){
    if(data.remark||!Array.isArray(data.elements))throw Error('El servicio no pudo completar la búsqueda. Inténtalo más tarde.');
    const seen=new Set();return data.elements.flatMap(e=>{
      if(!e||typeof e!=='object')return [];
      const t=e.tags||{},lat=e.lat??e.center?.lat,lon=e.lon??e.center?.lon,id=e.type+'/'+e.id;
      if(typeof t.name!=='string'||!t.name.trim()||!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lon)||Math.abs(lon)>180||!labels[t.amenity]||seen.has(id))return [];
      seen.add(id);let website='';try{const url=new URL(t.website||t['contact:website']);if(url.protocol==='https:'&&!url.username&&!url.password)website=url.href}catch{}
      return [{id,name:t.name.slice(0,120),lat,lon,type:t.amenity,label:labels[t.amenity],website,address:[t['addr:street'],t['addr:housenumber'],t['addr:city']].filter(x=>typeof x==='string').join(' ').slice(0,300)}];
    });
  }
  function estimate(v){
    const integer=(x,min,max)=>x!==''&&Number.isInteger(Number(x))&&Number(x)>=min&&Number(x)<=max;
    if(!integer(v.people,1,40)||!integer(v.days,1,90)||!integer(v.meals,0,5)||!integer(v.drinks,0,10))throw Error('Revisa viajeros, días y consumiciones.');
    let cents=0,missing=0;
    for(const [count,price] of [[v.meals,v.mealPrice],[v.drinks,v.drinkPrice]]){
      if(Number(count)===0)continue;
      if(price===''){missing++;continue}
      const n=Number(price);if(!Number.isFinite(n)||n<0||n>10000)throw Error('Introduce importes válidos entre 0 y 10.000 €.');
      cents+=Number(count)*Math.round(n*100);
    }
    const base=cents*Number(v.people)*Number(v.days);
    if(v.extra==='')missing++;
    const pct=v.extra===''?0:Number(v.extra);if(!Number.isFinite(pct)||pct<0||pct>100)throw Error('El porcentaje debe estar entre 0 y 100.');
    return {total:Math.round(base*(1+pct/100))/100,missing};
  }
  function append(plan,dayIndex,place){
    if(!plan||!Array.isArray(plan.days)||!plan.days[dayIndex])throw Error('Elige un día válido.');
    const next=JSON.parse(JSON.stringify(plan)),items=next.days[dayIndex].items;
    if(items.some(x=>x.osmId===place.id))throw Error('Este local ya está añadido a ese día.');
    items.push({id:'food-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),name:place.name,time:'',cost:null,kind:'Comida',transport:'Por decidir',notes:(place.label+' · '+place.address+'\nFuente: '+(place.source||'OpenStreetMap / Overpass Private.coffee')+'. Precio pendiente: consulta carta, impuestos y propinas.'+(place.website?'\nWeb del local: '+place.website:'')).slice(0,1500),lat:place.lat,lon:place.lon,osmId:place.id});
    return next;
  }
  return {endpoint,query,places,estimate,append,curated};
});
