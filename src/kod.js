// Öqituvçi kodi yaratuvçi: hamma narsa shu brauzerda hisoblanadi, kod hech qayerga yuborilmaydi.
const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 31 belgi, adashtiradigan harflarsiz (I, L, O, 0, 1)
const $ = id => document.getElementById(id);
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');

function randomCode(n = 8) {
  const out = [], lim = 248; // 248 = 31*8: modul ko'rinişidagi og'işni oldini oladi
  while (out.length < n) { const b = crypto.getRandomValues(new Uint8Array(16)); for (const x of b) if (x < lim && out.length < n) out.push(A[x % A.length]); }
  return out.join('');
}
async function makeConfig(code) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iter = 200000;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, key, 256);
  return JSON.stringify({ salt: hex(salt), hash: hex(bits), iter });
}
async function copy(text, okMsg) {
  try { await navigator.clipboard.writeText(text); $('msg').textContent = okMsg; } catch (e) { $('msg').textContent = 'Nusxalanmadi: matnni qöl bilan belgilab Ctrl+C bosing'; }
}
$('gen').addEventListener('click', async () => {
  if (!(window.crypto && crypto.subtle)) { $('msg').textContent = 'Bu brauzer şifrlashni qöllamaydi. Chrome yoki Safari da oçing.'; return; }
  $('gen').disabled = true; $('msg').textContent = 'Yaratilmoqda…';
  const code = randomCode(), cfg = await makeConfig(code);
  $('code').textContent = code.slice(0, 4) + '-' + code.slice(4);
  $('json').value = cfg;
  $('result').hidden = false; $('gen').disabled = false; $('gen').textContent = 'Yana yangi kod yarat';
  $('msg').textContent = 'Tayyor. Kodni hozir saqlab qöying: keyin ko’ra olmaysiz.';
});
$('copyCode').addEventListener('click', () => copy($('code').textContent, 'Kod nusxalandi'));
$('copyJson').addEventListener('click', () => copy($('json').value, 'teacher.json matni nusxalandi. Endi GitHub tugmasini bosing'));
