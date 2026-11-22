import { h } from './util.js';
import { kv } from './store.js';

// Öqituvçi kodi: faqat bolalarni qaytaradi. Kod saytda saqlanmaydi, faqat PBKDF2 xeşi turadi.
// Diqqat: bu brauzer ichidagi to'siq, jiddiy himoya uçun server kerak.
let CFG = null; // docs/teacher.json dan o'qiladi: {salt, hash, iter}
const okCfg = c => c && /^[0-9a-f]{32}$/.test(c.salt) && /^[0-9a-f]{64}$/.test(c.hash) && Number.isInteger(c.iter) && c.iter >= 100000 && c.iter <= 2000000;
async function loadCfg() { try { const r = await fetch('teacher.json', { cache: 'no-store' }); const c = r.ok ? await r.json() : null; return okCfg(c) ? c : null; } catch (e) { return null; } }
const TTL = 8 * 3600e3, KEY = 'labuz.tk';
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const unhex = s => new Uint8Array((s.match(/../g) || []).map(x => parseInt(x, 16)));
let fails = 0;

export const isUnlocked = () => { const t = Number(kv.get(KEY)); return t > 0 && t <= Date.now() && Date.now() - t < TTL; };
export const lock = () => kv.set(KEY, '');

async function verify(code) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: unhex(CFG.salt), iterations: CFG.iter, hash: 'SHA-256' }, key, 256);
  return hex(bits) === CFG.hash;
}

export function gateView(onOk) {
  const input = h('input', { type: 'password', autocomplete: 'off', maxlength: 20, placeholder: 'XXXX-XXXX', 'aria-label': 'Öqituvçi kodi' });
  const msg = h('p', { class: 'muted' }, window.crypto && crypto.subtle ? 'Bu bölim öqituvçilar uçun. Kodni kiriting.' : 'Bu brauzer şifrlashni qöllamaydi, bölim yopiq.');
  const btn = h('button', { class: 'btn', type: 'button' }, 'Kirish');
  const go = async () => {
    if (!(window.crypto && crypto.subtle)) return;
    const code = input.value.toUpperCase().replace(/[\s-]/g, '');
    btn.disabled = true; msg.textContent = 'Tekşirilmoqda…';
    CFG = await loadCfg();
    if (!CFG) { btn.disabled = false; msg.textContent = 'Sozlama yuklanmadi. Birozdan keyin qayta urining.'; return; }
    if (fails >= 3) await new Promise(r => setTimeout(r, Math.min(2 ** (fails - 2), 30) * 1000));
    let ok = false; try { ok = code.length >= 8 && await verify(code); } catch (e) { ok = false; }
    btn.disabled = false;
    if (ok) { fails = 0; kv.set(KEY, String(Date.now())); onOk(); } else { fails++; msg.textContent = 'Kod noto’g’ri'; input.value = ''; input.focus(); }
  };
  btn.addEventListener('click', go);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  return h('div', { class: 'page gate' }, h('h1', {}, '🔒 Öqituvçilar uçun'), msg, h('div', { class: 'row' }, input, btn), h('a', { class: 'muted', href: '#/' }, '← Öquvçi bölimiga qaytiş'));
}
