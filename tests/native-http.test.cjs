const { test } = require('node:test');
const assert = require('node:assert/strict');
const endpoint = 'https://viajafacil-conexion.fairflute64.chatgpt.site/api/geo?mode=city&text=Madrid';

test('HTTP nativo conserva JSON y errores de estado del servicio existente', async () => {
  const { createGeoFetch } = await import('../native/geo-fetch.mjs');
  let options;
  const request = createGeoFetch(async value => { options = value; return { status: 200, data: { results: [] } }; });
  const response = await request(endpoint); assert.equal(response.ok, true);
  assert.deepEqual(await response.json(), { results: [] }); assert.equal(options.connectTimeout, 20000);
  const failed = await createGeoFetch(async () => ({ status: 503, data: '{"error":"No disponible"}' }))(endpoint);
  assert.equal(failed.ok, false); assert.deepEqual(await failed.json(), { error: 'No disponible' });
});
test('HTTP nativo restringe destino y no consulta otros servicios', async () => {
  const { createGeoFetch } = await import('../native/geo-fetch.mjs'); let calls = 0;
  const request = createGeoFetch(async () => { calls++; });
  for (const url of ['https://example.com/api/geo', endpoint.replace('/api/geo', '/api/other'), endpoint.replace('https:', 'http:')])
    await assert.rejects(request(url), TypeError);
  assert.equal(calls, 0);
});
test('cancelación/timeout no deja aceptar una respuesta nativa tardía', async () => {
  const { createGeoFetch } = await import('../native/geo-fetch.mjs');
  const controller = new AbortController();
  const pending = createGeoFetch(() => new Promise(() => {}))(endpoint, { signal: controller.signal });
  controller.abort(); await assert.rejects(pending, error => error.name === 'AbortError');
});
test('sin conexión se conserva la ruta de error traducida del planificador', async () => {
  const { createGeoFetch } = await import('../native/geo-fetch.mjs');
  await assert.rejects(createGeoFetch(async () => { throw Error('Unable to resolve host'); })(endpoint), TypeError);
});
