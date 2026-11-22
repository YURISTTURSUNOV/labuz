export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) { if (typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v); }
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}
export const clean = (v, n = 40) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export function fmt(n) {
  if (typeof n !== 'number') return String(n);
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100).replace('.', ',');
}
export function safeStore() {
  const mem = {};
  try {
    localStorage.setItem('__t', '1'); localStorage.removeItem('__t');
    return { get: k => localStorage.getItem(k), set: (k, v) => localStorage.setItem(k, v) };
  } catch (e) {
    return { get: k => (k in mem ? mem[k] : null), set: (k, v) => { mem[k] = v; } };
  }
}
