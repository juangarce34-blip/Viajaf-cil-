const { test } = require('node:test');
const assert = require('node:assert/strict');
const backup = require('../backup.js');
const fs = require('node:fs');
const vm = require('node:vm');

function fixture() {
  const plan = { days: [{ id: 'day1', date: '', items: [{ id: 'item1', name: 'Museo', time: '',
    cost: null, kind: 'Visita', transport: 'A pie', notes: 'Comprobar horario' }] }] };
  const data = { 'vf8-trips': JSON.stringify([{ id: 'trip-one', name: 'Primer viaje' }]),
    'vf8-active': 'trip-one', 'vf8-data-trip-one': JSON.stringify({ 'vf-day-planner-v1': JSON.stringify(plan) }),
    'vf-day-planner-v1': JSON.stringify(plan) };
  return { app: 'ViajaFácil', format: 'viajafacil-backup', version: 1, data };
}
test('copia v1 compatible: exportar y validar conserva planes, notas y coste desconocido', () => {
  const obj = fixture();
  const restored = backup.validate(JSON.parse(backup.serialize(obj.data)));
  assert.deepEqual(restored.data, obj.data);
  assert.equal(restored.trips[0].name, 'Primer viaje');
});
test('copias antiguas sin planificador siguen siendo válidas', () => {
  const obj = fixture();
  delete obj.data['vf-day-planner-v1']; obj.data['vf8-data-trip-one'] = '{}';
  assert.equal(backup.validate(obj).trips.length, 1);
});
test('no acepta viajes duplicados, activos inexistentes o snapshots ausentes', () => {
  for (const mutate of [
    x => x.data['vf8-active'] = 'trip-missing',
    x => delete x.data['vf8-data-trip-one'],
    x => x.data['vf8-trips'] = JSON.stringify([{ id: 'trip-one', name: 'A' }, { id: 'trip-one', name: 'B' }])
  ]) { const obj = fixture(); mutate(obj); assert.throws(() => backup.validate(obj)); }
});
test('rechaza un itinerario dañado también dentro de un viaje inactivo', () => {
  const obj = fixture();
  obj.data['vf8-trips'] = JSON.stringify([{ id: 'trip-one', name: 'A' }, { id: 'trip-two', name: 'B' }]);
  obj.data['vf8-data-trip-two'] = JSON.stringify({ 'vf-day-planner-v1': '{"days":[{"id":"d","date":"","items":null}]}' });
  assert.throws(() => backup.validate(obj), /día dañado/);
});
test('rechaza costes negativos, tipos incorrectos, IDs duplicados y horas inválidas', () => {
  for (const mutate of [p => p.days[0].items[0].cost = -1, p => p.days[0].items[0].cost = '0',
    p => p.days[0].items[0].time = '25:00', p => p.days.push(p.days[0]),
    p => p.days[0].items.push(p.days[0].items[0]), p => p.days[0].items[0].notes = {}]) {
    const obj = fixture(), plan = JSON.parse(obj.data['vf-day-planner-v1']); mutate(plan);
    obj.data['vf-day-planner-v1'] = JSON.stringify(plan); assert.throws(() => backup.validate(obj));
  }
});
test('rechaza claves ajenas y snapshots con valores que no sean texto', () => {
  const obj = fixture(); obj.data.other = 'oops'; assert.throws(() => backup.validate(obj));
  delete obj.data.other; obj.data['vf8-data-trip-one'] = '{"vf-example":{}}';
  assert.throws(() => backup.validate(obj));
});
test('sintaxis de todos los scripts web y manifiesto', () => {
  const html = fs.readFileSync('index.html', 'utf8'); let count = 0;
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (match[1].trim()) { new vm.Script(match[1]); count++; }
  }
  assert.equal(count, 4);
  for (const path of ['geo-planner.js', 'dining-core.js', 'dining.js', 'sw.js', 'backup.js']) new vm.Script(fs.readFileSync(path, 'utf8'));
  assert.equal(JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8')).display, 'standalone');
});
