import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url),api=require('../dining-core.js');
await mkdir('artifacts',{recursive:true});
const url=new URL(api.endpoint);url.searchParams.set('data',api.query(34.0522,-118.2437,2000));
const report={city:'Los Ángeles, California, Estados Unidos',checkedAt:new Date().toISOString()};
try{
 const response=await fetch(url,{headers:{'User-Agent':'ViajaFacil/0.18 (https://github.com/juangarce34-blip/Viajaf-cil-)','Origin':'https://localhost'},signal:AbortSignal.timeout(20000)});
 report.status=response.status;report.cors=response.headers.get('access-control-allow-origin');
 if(!response.ok)throw Error('Estado '+response.status);
 const data=await response.json(),places=api.places(data);report.count=places.length;report.types=[...new Set(places.map(p=>p.type))];report.samples=places.slice(0,3).map(p=>({name:p.name,type:p.type}));
 if(!places.length)throw Error('No se encontraron locales en la prueba de Los Ángeles.');
}catch(error){report.error=error.message;process.exitCode=1}
await writeFile('artifacts/dining-live.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
