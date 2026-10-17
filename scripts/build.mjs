import { mkdir, rm, copyFile, readFile, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
// Explicit list: repository files, credentials and development tools never enter the APK.
for (const name of ['entry-procedures.js', 'entry-procedures-ui.js', 'journey.js', 'journey.css', 'geo-planner.js', 'destination-core.js', 'destinations.js', 'official-country-data.js', 'official-core.js', 'trip-experience.js', 'dining-core.js', 'dining.js', 'backup.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']) {
  await copyFile(name, `dist/${name}`);
}
await build({ entryPoints: ['native/entry.js'], bundle: true, outfile: 'dist/native.js',
  format: 'iife', target: ['chrome89'], legalComments: 'eof' });
const html = await readFile('index.html', 'utf8');
await writeFile('dist/index.html', html.replace('</body>', '<script src="./native.js"></script></body>'));
console.log('Web incluida en dist; sin servidor remoto de arranque ni service worker en Android.');
