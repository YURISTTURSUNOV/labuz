import { CARDS, SUBJECTS } from './content.js';
import { kv } from './store.js';
import { validateCard, normalizeCard } from './validate.js';

const KEY = 'labuz.custom';
const MAX = 40;
const read = () => { try { const a = JSON.parse(kv.get(KEY) || '[]'); return Array.isArray(a) ? a.filter(x => x && typeof x === 'object' && !Array.isArray(x)) : []; } catch (e) { return []; } };
const builtinIds = () => CARDS.filter(c => !c.custom).map(c => c.id);
const sub = c => (SUBJECTS[c.subject] ? [] : [`subject "${c.subject}" yöq (${Object.keys(SUBJECTS).join(', ')})`]);

export function check(card) {
  const r = validateCard(card, { existingIds: builtinIds() });
  r.errors.push(...sub(card));
  return r;
}
function put(card, preview) {
  const i = CARDS.findIndex(c => c.id === card.id);
  const c = { ...card, ...(preview ? { preview: true } : {}) };
  if (i >= 0) CARDS[i] = c; else CARDS.push(c);
}
// Saqlangan kartalar qayta tekşiriladi: brauzer xotirasi özgartirilgan bölsa ham xavfsiz
export function loadCustom() {
  for (const raw of read().slice(0, MAX)) {
    try {
      const c = normalizeCard(raw);
      const r = validateCard(c, { existingIds: builtinIds() });
      if (!r.errors.length && SUBJECTS[c.subject]) put(c, false);
    } catch (e) { /* buzilgan karta tashlab yuboriladi */ }
  }
}
export function previewCard(raw) { const c = normalizeCard(raw); put(c, true); return c; }
export function saveCard(raw) {
  const c = normalizeCard(raw);
  const list = read().map(normalizeCard).filter(x => x.id !== c.id);
  list.push(c);
  kv.set(KEY, JSON.stringify(list.slice(-MAX)));
  put(c, false);
  const i = CARDS.findIndex(x => x.id === c.id); if (i >= 0) delete CARDS[i].preview;
  return c;
}
export function removeCard(id) {
  kv.set(KEY, JSON.stringify(read().filter(x => x && x.id !== id)));
  const i = CARDS.findIndex(c => c.id === id && c.custom); if (i >= 0) CARDS.splice(i, 1);
}
export const listCustom = () => CARDS.filter(c => c.custom && !c.preview);
export function dropPreviews() { for (let i = CARDS.length - 1; i >= 0; i--) if (CARDS[i].preview) CARDS.splice(i, 1); }
