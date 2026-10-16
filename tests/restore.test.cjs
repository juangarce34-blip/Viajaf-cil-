const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ViajaBackup = require('../backup.js');
const html = fs.readFileSync('index.html', 'utf8');
const source = html.slice(html.indexOf('async function vf9Import('), html.indexOf('\n</script>', html.indexOf('async function vf9Import(')));

function fixture() {
  return { app: 'ViajaFácil', format: 'viajafacil-backup', version: 1, data: {
    'vf8-trips': '[{"id":"trip-new","name":"Restaurado"}]', 'vf8-active': 'trip-new',
    'vf8-data-trip-new': '{"vf-world-city":"Roma"}', 'vf-world-city': 'Roma' } };
}
function context(obj, { accept = true, failOnce = false } = {}) {
  const data = { 'vf8-trips': '[{"id":"trip-old","name":"Anterior"}]', 'vf8-active': 'trip-old',
    'vf8-data-trip-old': '{"vf-world-city":"París"}', 'vf-world-city': 'París' };
  const previous = { ...data };
  let failed = false, reloaded = false, status = '';
  const ctx = vm.createContext({ ViajaBackup, vf8Reloading: false,
    document: { getElementById: () => ({ files: [{ size: 100, text: async () => JSON.stringify(obj) }] }) },
    vf9All: () => ({ ...data }), vf9Status: text => status = text, confirm: () => accept,
    location: { reload: () => reloaded = true },
    localStorage: { removeItem: key => delete data[key], setItem: (key, value) => {
      if (failOnce && !failed) { failed = true; throw Error('QuotaExceededError'); } data[key] = value;
    } }
  });
  vm.runInContext(source, ctx);
  return { run: () => vm.runInContext('vf9Import()', ctx), data, previous, ctx,
    status: () => status, reloaded: () => reloaded };
}
test('restaurar sustituye datos solo tras validar y confirmar', async () => {
  const obj = fixture(), c = context(obj); await c.run();
  assert.deepEqual(c.data, obj.data); assert.equal(c.reloaded(), true);
});
test('cancelar restauración conserva íntegra la información anterior', async () => {
  const c = context(fixture(), { accept: false }); await c.run();
  assert.deepEqual(c.data, c.previous); assert.equal(c.reloaded(), false);
});
test('fallo de almacenamiento recupera todos los datos anteriores y permite seguir guardando', async () => {
  const c = context(fixture(), { failOnce: true }); await c.run();
  assert.deepEqual(c.data, c.previous); assert.equal(c.reloaded(), false);
  assert.equal(c.ctx.vf8Reloading, false); assert.match(c.status(), /recuperado los datos anteriores/);
});
test('archivo con estructura dañada no modifica almacenamiento ni recarga', async () => {
  const obj = fixture(); obj.data['vf8-data-trip-new'] = '{"vf-day-planner-v1":"{}"}';
  const c = context(obj); await c.run();
  assert.deepEqual(c.data, c.previous); assert.equal(c.reloaded(), false);
  assert.match(c.status(), /No se pudo importar/);
});
