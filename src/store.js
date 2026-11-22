import { safeStore, clean } from './util.js';
const store = safeStore();
const KEY = 'labuz.events';
const ch = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('labuz') : null;
const listeners = new Set();

const TYPES = new Set(['start', 'step_done', 'hint', 'answer_right', 'answer_wrong', 'finish', 'hook']);
const num = v => (Number.isFinite(v) ? Math.max(0, Math.min(1e13, v)) : 0);
// Tashqaridan (localStorage, BroadcastChannel) kelgan ma'lumotga ishonmaymiz: shakli va uzunligi tekshiriladi
export function sane(e) {
  if (!e || typeof e !== 'object' || !TYPES.has(e.type)) return null;
  return { ts: num(e.ts), student: clean(e.student, 30), classCode: clean(e.classCode, 12), cardId: clean(e.cardId, 60),
    mode: clean(e.mode, 10), type: e.type, stepIdx: num(e.stepIdx), total: num(e.total), hints: num(e.hints), errors: num(e.errors) };
}
export function load() {
  try { const a = JSON.parse(store.get(KEY) || '[]'); return Array.isArray(a) ? a.slice(-800).map(sane).filter(Boolean) : []; } catch (e) { return []; }
}
export function pushEvent(e) {
  const ev = sane(e); if (!ev) return;
  const list = load(); list.push(ev);
  if (list.length > 800) list.splice(0, list.length - 800);
  store.set(KEY, JSON.stringify(list));
  if (ch) ch.postMessage(ev);
  listeners.forEach(f => f(ev));
}
export function onEvent(fn) {
  listeners.add(fn);
  const bc = ev => { const d = sane(ev.data); if (d) fn(d); };
  if (ch) ch.addEventListener('message', bc);
  return () => { listeners.delete(fn); if (ch) ch.removeEventListener('message', bc); };
}
export function clearEvents() { store.set(KEY, '[]'); }
export const kv = store;
