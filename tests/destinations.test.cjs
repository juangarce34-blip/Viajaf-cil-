const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../destination-core.js');

test('países de todos los continentes disponibles sin red, con códigos y nombres españoles',()=>{
  for(const [q,code] of [['China','CN'],['España','ES'],['Canadá','CA'],['Kenia','KE'],['Australia','AU'],['Antártida','AQ'],['Kosovo','XK']])
    assert.equal(core.searchCountries(q)[0].code,code);
  assert.equal(core.searchCountries('espana')[0].name,'España');
  assert.equal(core.searchCountries('EEUU')[0].code,'US');
  assert.equal(core.searchCountries('South Korea')[0].code,'KR');
  assert.equal(core.searchCountries('GBR')[0].name,'Reino Unido');
  assert.deepEqual(core.searchCountries(''),[]);
  assert.deepEqual(core.searchCountries('Destino que no existe'),[]);
});
test('desambiguación conserva países, rechaza coordenadas inválidas y duplica solo lugares distintos',()=>{
  const entries=core.cities({results:[
    {city:'Santiago',country:'Chile',formatted:'Santiago, Chile',lat:-33,lon:-70},
    {city:'Santiago',country:'España',formatted:'Santiago, España',lat:42,lon:-8},
    {city:'Santiago',country:'Chile',formatted:'Santiago, Chile',lat:-33,lon:-70},
    {city:'Fuera',formatted:'Fuera',lat:91,lon:0},
    {city:'Sin coordenadas',formatted:'Sin coordenadas'},
    null,
  ]});
  assert.deepEqual(entries.map(c=>c.country),['Chile','España']);
  assert.deepEqual(core.cities({results:{}}),[]);
  assert.equal(core.query('  Valle   del Jerte  '),'Valle del Jerte');
  assert.equal(core.query('a'.repeat(200)).length,160);
});
