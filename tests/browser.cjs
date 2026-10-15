const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');

(async () => {
  await fs.mkdir('artifacts', { recursive: true });
  const root = process.cwd();
  const server = http.createServer(async (req, res) => {
    const name = new URL(req.url, 'http://localhost').pathname;
    const target = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
    if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    try {
      const data = await fs.readFile(target);
      res.setHeader('Content-Type', ({ '.html':'text/html', '.js':'text/javascript', '.png':'image/png', '.webmanifest':'application/manifest+json' })[path.extname(target)] || 'application/octet-stream');
      res.end(data);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  const results = [], errors = [];
  try {
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    // Functional tests run without depending on third-party image/service uptime.
    await page.route('https://images.unsplash.com/**', route => route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#geoPlanner', { state: 'attached' });
    assert.equal(await page.locator('section.active').getAttribute('id'), 'home');
    results.push('Arranque y creación de todas las secciones sin errores JavaScript');

    await page.evaluate(() => show('budget'));
    await page.evaluate(() => {
      document.querySelectorAll('.cost').forEach(e => e.value = '');
      document.querySelector('.cost').value = '10.01';
      document.getElementById('contingency').value = '10'; calculateBudget();
    });
    assert.match(await page.locator('#budgetResult').textContent(), /11,01/);
    assert.match(await page.locator('#budgetResult').textContent(), /Subtotal conocido/);
    results.push('Presupuesto decimal e importes sin estimar');

    await page.evaluate(() => show('dayPlanner'));
    await page.click('#dpAdd'); await page.fill('#dpName', 'Museo de prueba');
    await page.fill('#dpNotes', 'Notas conservadas'); await page.click('#dpForm button[type=submit]');
    assert.match(await page.locator('#dpList').textContent(), /Museo de prueba/);
    assert.match(await page.locator('#dpTotal').textContent(), /sin estimar/);
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.evaluate(() => show('dayPlanner'));
    assert.match(await page.locator('#dpList').textContent(), /Notas conservadas/);
    const firstId = await page.evaluate(() => localStorage.getItem('vf8-active'));
    page.once('dialog', d => d.accept('Segundo viaje de prueba'));
    await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), page.evaluate(() => rc8NewTrip())]);
    await page.evaluate(() => show('dayPlanner'));
    assert.doesNotMatch(await page.locator('#dpList').textContent(), /Museo de prueba/);
    await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), page.evaluate(id => vf8Switch(id), firstId)]);
    await page.evaluate(() => show('dayPlanner'));
    assert.match(await page.locator('#dpList').textContent(), /Museo de prueba/);
    results.push('Actividad, notas y aislamiento entre viajes después de recargar y cambiar de viaje');

    await page.evaluate(() => show('v12trips'));
    const downloadPromise = page.waitForEvent('download');
    await page.evaluate(() => vf9Export());
    const download = await downloadPromise;
    const exported = await fs.readFile(await download.path(), 'utf8');
    const backup = JSON.parse(exported); assert.equal(JSON.parse(backup.data['vf8-trips']).length, 2);
    const before = await page.evaluate(() => JSON.stringify(vf9All()));
    const invalid = JSON.parse(exported); invalid.data['vf-day-planner-v1'] = '{"days":[{}]}';
    await page.setInputFiles('#vf9File', { name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(invalid)) });
    await page.evaluate(() => vf9Import());
    assert.match(await page.locator('#vf9Status').textContent(), /No se pudo importar/);
    assert.equal(await page.evaluate(() => JSON.stringify(vf9All())), before);
    await page.setInputFiles('#vf9File', { name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(exported) });
    page.once('dialog', d => d.accept());
    await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), page.evaluate(() => vf9Import())]);
    await page.evaluate(() => show('dayPlanner'));
    assert.match(await page.locator('#dpList').textContent(), /Museo de prueba/);
    results.push('Exportar/importar copia compatible y rechazar copia dañada sin alterar datos');

    await page.evaluate(() => show('geoPlanner'));
    await page.route('https://viajafacil-conexion.fairflute64.chatgpt.site/api/geo**', route => route.fulfill({
      status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Servicio no disponible' }) }));
    await page.fill('#geoQuery', 'Madrid, España'); await page.click('#geoSearch');
    await page.waitForFunction(() => document.getElementById('geoStatus').textContent.includes('Servicio no disponible'));
    assert.equal(await page.locator('#geoSearch').isEnabled(), true);
    results.push('Error de servicio de lugares: mensaje visible y controles recuperados');
    await page.evaluate(() => show('home'));
    await page.screenshot({ path: 'artifacts/inicio-390.png', fullPage: true });
    assert.deepEqual(errors, []);
    await fs.writeFile('artifacts/browser-results.json', JSON.stringify({ passed: results, errors }, null, 2));
    console.log(results.join('\n'));
  } catch (error) {
    await fs.writeFile('artifacts/browser-results.json', JSON.stringify({ passed: results, errors, failure: error.stack }, null, 2));
    throw error;
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
