import {mkdir,writeFile} from 'node:fs/promises';
import core from '../destination-core.js';

// Small diagnostic sample, not a claim of exhaustive worldwide coverage.
const queries=['Shanghái, China','Ushuaia, Argentina','Queenstown, Nueva Zelanda'];
const checks=[];
for(const text of queries){
  const check={query:text,available:false};
  try{
    const url=new URL('https://viajafacil-conexion.fairflute64.chatgpt.site/api/geo');
    url.searchParams.set('mode','city');url.searchParams.set('text',text);
    const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
    check.status=response.status;
    const body=await response.json();
    check.matches=core.cities(body).map(c=>c.formatted);
    check.available=response.ok&&check.matches.length>0;
  }catch(error){check.error=error.message}
  checks.push(check);
}
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/destination-live.json',JSON.stringify({checkedAt:new Date().toISOString(),checks},null,2));
console.log(JSON.stringify(checks,null,2));
if(checks.some(c=>!c.available))console.log('::warning::La muestra mundial no se ha resuelto completamente. Países locales y destino manual siguen disponibles.');
