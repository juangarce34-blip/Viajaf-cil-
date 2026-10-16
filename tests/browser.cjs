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
    await page.unroute('https://viajafacil-conexion.fairflute64.chatgpt.site/api/geo**');
    await page.route('https://viajafacil-conexion.fairflute64.chatgpt.site/api/geo**', route => {
      const city = new URL(route.request().url()).searchParams.get('mode') === 'city';
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify(city ? { results: [{ lat: 40.4168, lon: -3.7038, city: 'Madrid', country: 'España', formatted: 'Madrid, España' }] } :
          { features: [{ properties: { name: 'Plaza de prueba', lat: 40.4169, lon: -3.7039, place_id: 'test-place', formatted: 'Centro de Madrid' } }] }) });
    });
    await page.click('#geoSearch');
    await page.click('#geoCities button'); await page.click('#geoGenerate');
    await page.waitForSelector('#geoAccept', { state: 'visible' });
    await page.waitForFunction(() => document.getElementById('geoPreview').textContent.includes('Plaza de prueba'));
    assert.match(await page.locator('#geoPreview').textContent(), /Plaza de prueba/);
    assert.equal(await page.evaluate(() => document.getElementById('tripDestination').value), 'Londres');
    page.once('dialog', d => d.accept()); await page.click('#geoAccept');
    assert.match(await page.locator('#dpList').textContent(), /Plaza de prueba/);
    assert.equal(await page.evaluate(() => document.getElementById('tripDestination').value), 'Madrid');
    results.push('Propuestas de lugares con respuesta simulada: previsualizar y guardar únicamente tras confirmar');
    await page.route('https://overpass.private.coffee/api/interpreter**',route=>route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({elements:[
      {type:'node',id:101,lat:40.4169,lon:-3.7038,tags:{name:'Restaurante de prueba',amenity:'restaurant'}},
      {type:'node',id:102,lat:40.4168,lon:-3.7039,tags:{name:'Café de prueba',amenity:'cafe'}}]})}));
    await page.evaluate(()=>show('dining'));await page.click('#foodCitySearch');await page.click('#foodCities button');await page.click('#foodSearch');
    await page.waitForFunction(()=>document.getElementById('foodResults').textContent.includes('Restaurante de prueba'));
    await page.selectOption('#foodType','cafe');assert.doesNotMatch(await page.locator('#foodResults').textContent(),/Restaurante de prueba/);
    await page.click('#foodResults button');
    await page.evaluate(()=>show('dayPlanner'));
    assert.match(await page.locator('#dpList').textContent(),/Plaza de prueba/);assert.match(await page.locator('#dpList').textContent(),/Café de prueba/);
    await page.evaluate(()=>show('dining'));
    for(const [key,value] of Object.entries({people:'3',days:'3',meals:'2',mealPrice:'20',drinks:'1',drinkPrice:'5',extra:'10'}))await page.fill('#food-'+key,value);
    assert.match(await page.locator('#foodEstimate').textContent(),/445,50/);
    await page.evaluate(()=>document.querySelector('.cost[data-cost="comidas"]').value='1');
    page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Usar total previsto en el presupuesto'}).click();
    assert.equal(await page.locator('.cost[data-cost="comidas"]').inputValue(),'445.5');
    await page.reload({waitUntil:'domcontentloaded'});await page.evaluate(()=>show('dining'));
    assert.equal(await page.locator('#food-mealPrice').inputValue(),'20');
    assert.match(await page.locator('#foodEstimate').textContent(),/445,50/);
    await page.evaluate(()=>show('dayPlanner'));assert.match(await page.locator('#dpList').textContent(),/Café de prueba/);
    results.push('Gastronomía: buscar, filtrar, añadir sin borrar visitas, estimar grupo y conservar presupuesto');
    await page.evaluate(()=>{document.getElementById('tripDestination').value='Los Ángeles';document.getElementById('tripCountry').value='Estados Unidos';saveWorldDestination();vf8SaveActive();show('dining')});
    assert.match(await page.locator('#foodResults').textContent(),/Bottega Louie DTLA/);
    assert.match(await page.locator('#foodResults').textContent(),/Verve Coffee/);
    assert.match(await page.locator('#foodResults').textContent(),/Seven Grand/);
    assert.match(await page.locator('#foodResults').textContent(),/no filtrada por radio/);
    assert.match(await page.getByRole('link',{name:'Restaurantes ↗',exact:true}).getAttribute('href'),/Los/);
    await page.selectOption('#foodType','cafe');await page.click('#foodResults button');
    await page.evaluate(()=>show('dayPlanner'));assert.match(await page.locator('#dpList').textContent(),/Verve Coffee/);
    assert.match(await page.locator('#dpList').textContent(),/Plaza de prueba/);
    results.push('Los Ángeles: selección guardada de webs oficiales sin depender del servicio y cambio de destino en el mismo viaje');
    const beforeSearch=await page.evaluate(()=>localStorage.getItem('vf-day-planner-v1'));
    await page.evaluate(()=>show('v12destinations'));
    await page.getByRole('button',{name:'Asia',exact:true}).click();
    await page.fill('#destinationQuery','China');
    const china=page.locator('#destinationResults button').filter({has:page.locator('strong', {hasText:/^China$/})});
    assert.equal(await china.count(),1);
    page.once('dialog',d=>d.dismiss());await china.click();
    assert.equal(await page.locator('#tripDestination').inputValue(),'Los Ángeles');
    page.once('dialog',d=>d.accept());await china.click();
    assert.equal(await page.locator('#tripDestination').inputValue(),'China');
    assert.equal(await page.locator('#tripCountry').inputValue(),'China');
    assert.equal(await page.evaluate(()=>localStorage.getItem('vf-day-planner-v1')),beforeSearch);
    await page.reload({waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('#tripDestination').inputValue(),'China');
    await page.evaluate(()=>show('v12destinations'));
    await page.unroute('https://viajafacil-conexion.fairflute64.chatgpt.site/api/geo**');
    let delayedRoute, markDelayedReady;
    const delayedReady=new Promise(resolve=>{markDelayedReady=resolve});
    await page.route('https://viajafacil-conexion.fairflute64.chatgpt.site/api/geo**',route=>{
      const q=new URL(route.request().url()).searchParams.get('text');
      if(q==='Antiguo'){delayedRoute=route;markDelayedReady();return;}
      if(q==='Sin conexión')return route.abort();
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({results:q==='Santiago'?[
        {city:'Santiago',country:'Chile',formatted:'Santiago, Chile',lat:-33,lon:-70},
        {city:'Santiago',country:'España',formatted:'Santiago, España',lat:42,lon:-8}
      ]:[]})});
    });
    await page.fill('#destinationQuery','Santiago');await page.locator('#destinationQuery').press('Enter');
    await page.getByRole('button',{name:'Santiago, Chile Ciudad o localidad · Organizar viaje',exact:true}).waitFor();
    assert.match(await page.locator('#destinationResults').textContent(),/Santiago, España/);
    page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Santiago, Chile Ciudad o localidad · Organizar viaje',exact:true}).click();
    assert.equal(await page.locator('#tripDestination').inputValue(),'Santiago');
    assert.equal(await page.locator('#tripCountry').inputValue(),'Chile');
    await page.evaluate(()=>show('v12destinations'));
    await page.fill('#destinationQuery','Antiguo');await page.click('#destinationSearch');
    await delayedReady;
    assert.ok(delayedRoute);
    await page.fill('#destinationQuery','China');
    const lateResponse=page.waitForResponse(r=>new URL(r.url()).searchParams.get('text')==='Antiguo');
    await delayedRoute.fulfill({status:200,contentType:'application/json',body:JSON.stringify({results:[{city:'Antiguo',country:'Prueba',formatted:'Antiguo, Prueba',lat:1,lon:1}]})});
    await lateResponse;
    await page.waitForLoadState('networkidle');
    assert.doesNotMatch(await page.locator('#destinationResults').textContent(),/Antiguo, Prueba/);
    assert.match(await page.locator('#destinationResults').textContent(),/China/);
    await page.fill('#destinationQuery','Sin conexión');await page.click('#destinationSearch');
    await page.waitForFunction(()=>document.getElementById('destinationStatus').textContent.includes('No se pudo consultar'));
    assert.equal(await page.locator('#destinationManual').isEnabled(),true);
    await page.fill('#destinationQuery','Valle del Jerte');
    page.once('dialog',d=>d.accept());await page.click('#destinationManual');
    assert.equal(await page.locator('#tripDestination').inputValue(),'Valle del Jerte');
    assert.equal(await page.locator('#tripCountry').inputValue(),'');
    assert.equal(await page.evaluate(()=>localStorage.getItem('vf-day-planner-v1')),beforeSearch);
    results.push('Buscador mundial: China sin conexión, filtros independientes, cancelar/guardar sin perder planes, persistencia, desambiguación, error de red, respuesta tardía y destino libre');
    await page.evaluate(()=>show('v12destinations'));await page.fill('#destinationQuery','China');
    await page.screenshot({path:'artifacts/destinos-China-390.png',fullPage:true});
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
