import { build } from 'esbuild';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
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
const cfg = ep ? `window.LABUZ_AI_ENDPOINT=${JSON.stringify(ep)};` : '/* AI server ulanmagan: mahalliy maslahat ishlaydi */';
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

if (!existsSync('docs/teacher.json')) console.warn('DIQQAT: docs/teacher.json yöq, öqituvçi bölimlari yopiq qoladi. node tools/set-code.mjs ni ishga tushiring.');

// Öqituvçi kodi yaratuvçi sahifasi (docs/kod/): özining CSP si bor, tarmoqqa umuman çiqmaydi
const kj = (await build({ entryPoints: ['src/kod.js'], bundle: true, minify: true, write: false, format: 'iife', target: 'es2020' })).outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const kcsp = ["default-src 'none'", `script-src ${hash(kj)}`, "style-src 'unsafe-inline'", "img-src data:", "connect-src 'none'", "base-uri 'none'", "form-action 'none'", "object-src 'none'"].join('; ');
const GH = 'https://github.com/YURISTTURSUNOV/labuz/edit/main/docs/teacher.json';
const khtml = `<!doctype html>
<html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${kcsp}"><meta name="referrer" content="no-referrer"><meta name="robots" content="noindex,nofollow">
<title>LabUz: öqituvçi kodi yaratuvçi</title>
<style>body{font:16px/1.5 system-ui,sans-serif;background:#f6f3ec;color:#14213d;margin:0}main{max-width:640px;margin:0 auto;padding:28px 18px}
h1{font-size:26px;margin:0 0 6px}.card{background:#fff;border:2px solid #e4ddcc;border-radius:16px;padding:18px;margin:16px 0}
button,a.b{font:700 16px system-ui;background:#14213d;color:#fff;border:0;border-radius:12px;padding:12px 18px;cursor:pointer;text-decoration:none;display:inline-block;margin:4px 6px 4px 0}
button.g,a.g{background:#fff;color:#14213d;border:2px solid #14213d}.code{font:800 40px ui-monospace,Consolas,monospace;letter-spacing:5px;margin:8px 0}
textarea{width:100%;font:13px ui-monospace,Consolas,monospace;border:2px solid #e4ddcc;border-radius:10px;padding:10px;box-sizing:border-box}
ol{padding-left:20px}.m{color:#5b6477;font-size:14px}#msg{color:#1f9d55;font-weight:700;min-height:24px}</style></head>
<body><main><h1>🔑 Öqituvçi kodi yaratuvçi</h1>
<p class="m">Bu sahifa kodni özingning brauzeringda yaratadi va hech qayerga yubormaydi. Yangi kod yaratilgach, eskisi ishlamay qoladi.</p>
<div class="card"><button id="gen">Yangi kod yarat</button><div id="msg"></div>
<div id="result" hidden><div class="code" id="code"></div><button class="g" id="copyCode">📋 Kodni nusxalaş</button>
<ol><li>Kodni saqlab qöying (daftar yoki parol menejeri). Öquvçilarga bermang.</li>
<li>Pastdagi matnni nusxalang: <button id="copyJson">📋 teacher.json ni nusxalaş</button></li>
<li><a class="b g" href="${GH}" target="_blank" rel="noopener">GitHub da oçish</a> Faylning hamma matnini öçirib, nusxalanganini qöying, "Commit changes" ni (ikki marta) bosing.</li>
<li>1–10 daqiqadan keyin yangi kod ishlaydi.</li></ol>
<textarea id="json" rows="3" readonly></textarea></div></div></main>
<script>${kj}</script></body></html>`;
mkdirSync('docs/kod', { recursive: true }); writeFileSync('docs/kod/index.html', khtml);
console.log('kod/index.html', Math.round(khtml.length / 1024) + ' KB');
