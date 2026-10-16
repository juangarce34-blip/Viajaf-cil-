const {test}=require('node:test');
const assert=require('node:assert/strict');
const api=require('../official-core.js'),data=require('../official-country-data.js');
const base={country:'Italia',nationality:'es',purpose:'tourism',children:1};
test('fichas por país extraídas del directorio oficial, sin construir enlaces supuestos',()=>{
  assert.equal(Object.keys(data.countries).length,197);
  for(const row of Object.values(data.countries)){
    const url=new URL(row.url);assert.equal(url.protocol,'https:');assert.equal(url.hostname,'www.exteriores.gob.es');
    assert.equal(url.searchParams.get('trc').trim(),row.title);
  }
  for(const country of ['Italy','China','Estados Unidos','South Korea','Bahréin'])assert.ok(api.guide({...base,country}).advice);
  assert.equal(api.guide({...base,country:'Guam'}).advice,undefined);
  assert.match(api.guide({...base,country:'Guam'}).missing,/No aplicamos los requisitos de otro país/);
});
test('documentos europeos solo se presentan como tales para el perfil aplicable',()=>{
  assert.match(api.guide(base).entry,/DNI o pasaporte válido/);
  for(const change of [{nationality:'other',passportCountry:'India'},{passportCountry:'Estados Unidos'},{purpose:'other'},{country:'Estados Unidos'}])
    assert.doesNotMatch(api.guide({...base,...change}).entry,/lleva DNI o pasaporte válido/);
  assert.match(api.guide({...base,transit:'Canadá'}).transit,/Canadá/);
  assert.match(api.guide(base).children,/menores/);
  assert.ok(api.guide({...base,country:'No existe'}).missing);
});
