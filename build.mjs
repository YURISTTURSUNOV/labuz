import { build } from 'esbuild';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Ixtiyoriy AI server: LABUZ_AI_ENDPOINT=https://server.uz/api/hint node build.mjs
const ep = process.env.LABUZ_AI_ENDPOINT || '';
let epOrigin = '';
if (ep) { const u = new URL(ep); if (u.protocol !== 'https:') throw new Error('AI endpoint faqat https bölishi kerak'); epOrigin = u.origin; }

const r = await build({
  entryPoints: ['src/main.js'], bundle: true, minify: true, write: false, format: 'iife',
  loader: { '.css': 'text' }, target: 'es2020', legalComments: 'none',
});
const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const teacher = existsSync('teacher.json') ? JSON.parse(readFileSync('teacher.json', 'utf8')) : null;
if (!teacher) console.warn('DIQQAT: teacher.json yöq, öqituvçi bölimlari yopiq qoladi. node tools/set-code.mjs ni ishga tushiring.');
const cfg = (teacher ? `window.LABUZ_TEACHER=${JSON.stringify({ salt: teacher.salt, hash: teacher.hash, iter: teacher.iter })};` : '')
  + (ep ? `window.LABUZ_AI_ENDPOINT=${JSON.stringify(ep)};` : '/* AI server ulanmagan: mahalliy maslahat ishlaydi */');
const hash = s => `'sha256-${createHash('sha256').update(s, 'utf8').digest('base64')}'`;
const csp = [
  "default-src 'none'",
  `script-src ${hash(cfg)} ${hash(js)}`,
  "style-src 'unsafe-inline'",
  "img-src 'self' data: blob:",
  `connect-src 'self'${epOrigin ? ' ' + epOrigin : ''}`,
  "base-uri 'none'", "form-action 'none'", "object-src 'none'",
].join('; ');
const html = `<!doctype html>
<html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex,nofollow">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23FCA311'/%3E%3C/svg%3E">
<title>LabUz – nazariyani amalda körsat (prototip)</title></head>
<body><div id="app"></div>
<script>${cfg}</script>
<script>${js}</script></body></html>`;
for (const d of ['dist', 'docs']) { mkdirSync(d, { recursive: true }); writeFileSync(`${d}/index.html`, html); }
console.log('index.html', Math.round(html.length / 1024) + ' KB', '| CSP hash ok');
