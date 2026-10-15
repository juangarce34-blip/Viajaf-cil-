import { mkdir, writeFile } from 'node:fs/promises';

// One read-only query to the existing service. No token, booking or new service.
await mkdir('artifacts', { recursive: true });
const origin = 'https://localhost';
const report = { checkedAt: new Date().toISOString(), origin, available: false, corsCompatible: false };
try {
  const response = await fetch('https://viajafacil-conexion.fairflute64.chatgpt.site/api/geo?mode=city&text=Madrid%2C%20Espa%C3%B1a', {
    headers: { Origin: origin }, signal: AbortSignal.timeout(20000)
  });
  report.status = response.status;
  const allowed = response.headers.get('access-control-allow-origin');
  report.corsCompatible = allowed === '*' || allowed === origin;
  report.contentType = response.headers.get('content-type');
  const body = await response.json();
  report.available = response.ok && Array.isArray(body.results) && body.results.some(x => Number.isFinite(x.lat) && Number.isFinite(x.lon));
} catch (error) { report.error = error.message; }
await writeFile('artifacts/service-check.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
if (!report.available || !report.corsCompatible) console.log('::warning::El servicio externo necesita revisión antes de certificar la búsqueda de lugares en Android.');
