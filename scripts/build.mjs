import { mkdir, rm, cp, readdir, readFile, writeFile } from 'node:fs/promises';
import { REVISION } from '../web/data.js';
const v = `?v=${REVISION}`;
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('web', 'dist', { recursive: true });
for (const file of await readdir('dist'))
  if (file.endsWith('.js')) {
    const path = 'dist/' + file;
    await writeFile(path, (await readFile(path, 'utf8')).replace(/from '(\.\/[^']+\.js)'/g, `from '$1${v}'`));
  }
const html = await readFile('dist/index.html', 'utf8');
await writeFile(
  'dist/index.html',
  html.replace('./style.css', './style.css' + v).replace('./app.js', './app.js' + v)
);
console.log(`EMMET · Prototype ${REVISION} · static build ready`);
