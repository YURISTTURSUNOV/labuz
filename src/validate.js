// Karta tekşiruvçisi: AI yozgan (yoki qöl bilan yozilgan) kartaning shakli, xavfsizligi va mantiqini tekşiradi.
// Sof modul: brauzerda ham, Node da ham ishlaydi.
export const CUSTOM_TEMPLATES = {
  sorter: { vars: ['placed', 'correct', 'wrong', 'done'], focus: ['pool', 'buckets'] },
  timeline: { vars: ['time', 'verb'], focus: ['time', 'verb'] },
  wordparts: { vars: ['parts', 'roles'], focus: ['parts', 'roles'] },
};
const OPS = ['==', '!=', '>', '<', '>=', '<='];
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const SLUG = /^[a-z0-9][a-z0-9-]{2,39}$/;
const isStr = (v, max = 220) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const isInt = v => Number.isInteger(v);

function walk(v, path, out) {
  if (typeof v === 'string') {
    if (OPS.includes(v)) return;
    if (/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)) out.errors.push(`${path}: "<", ">" yoki boshqaruv belgisi bor`);
    if (v.includes('—')) out.warnings.push(`${path}: uzun çiziqça (—) bor, tire (–) ishlating`);
    if (/[oOgG]['‘’ʻʼ]/.test(v)) out.warnings.push(`${path}: eski alifbo belgisi (o', g') bor, ö va ğ ishlating`);
  } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`, out));
  else if (v && typeof v === 'object') for (const k of Object.keys(v)) {
    if (BAD_KEYS.has(k)) out.errors.push(`${path}: taqiqlangan kalit "${k}"`);
    else walk(v[k], `${path}.${k}`, out);
  }
}

function checkParams(card, out) {
  const t = card.template, P = card.params, e = m => out.errors.push(`params: ${m}`);
  if (!P || typeof P !== 'object') return e('obyekt bölishi kerak');
  if (t === 'sorter') {
    if (!Array.isArray(P.cats) || P.cats.length < 2 || P.cats.length > 5) return e('cats: 2–5 ta guruh kerak');
    const ids = new Set();
    P.cats.forEach((c, i) => { if (!c || !SLUG.test(String(c.id || '').padEnd(3, 'x')) || !isStr(c.label, 40)) e(`cats[${i}]: id (lotin harf/raqam) va label (≤40) kerak`); else ids.add(c.id); });
    if (ids.size !== P.cats.length) e('cats: id lar takrorlanmasligi kerak');
    if (!Array.isArray(P.items) || P.items.length < 4 || P.items.length > 12) return e('items: 4–12 ta element kerak');
    const used = new Set();
    P.items.forEach((it, i) => { if (!it || !isStr(it.text, 40) || !ids.has(it.cat)) e(`items[${i}]: text (≤40) va mavjud cat kerak`); else used.add(it.cat); });
    if (used.size !== ids.size) e('Har bir guruhda kamida 1 ta element bölishi kerak');
  } else if (t === 'timeline') {
    const V = P.verbs;
    if (!V || typeof V !== 'object' || Array.isArray(V)) return e('verbs obyekt bölishi kerak');
    const ks = Object.keys(V);
    if (ks.length < 1 || ks.length > 4) return e('verbs: 1–4 ta fe’l kerak');
    if (P.pre != null && !(typeof P.pre === 'string' && P.pre.length <= 20)) e('pre: qisqa matn bölishi kerak');
    ks.forEach(k => {
      const v = V[k];
      if (!/^[A-Za-z]{2,20}$/.test(k)) e(`verbs.${k}: kalit lotin harflardan (2–20) iborat bölishi kerak`);
      if (!v || !['past', 'present', 'future'].every(x => isStr(v[x], 40)) || !v.rest || !['past', 'present', 'future'].every(x => isStr(v.rest[x], 60))) e(`verbs.${k}: past/present/future va rest.{past,present,future} kerak`);
    });
  } else if (t === 'wordparts') {
    if (!isStr(P.word, 25) || /[\s|]/.test(P.word)) return e('word: bitta söz (≤25 harf) kerak');
    if (!Array.isArray(P.roles) || P.roles.length < 2 || P.roles.length > 8 || !P.roles.every(r => /^[a-z]{2,20}$/.test(r))) return e('roles: 2–8 ta lotin id kerak');
    if (!P.roleLabels || !P.roles.every(r => isStr(P.roleLabels[r], 40))) e('roleLabels: har bir role uçun matn kerak');
  }
}

function checkValue(card, [name, op, val], where, out) {
  const t = card.template, P = card.params, e = m => out.errors.push(`${where}: ${m}`);
  if (t === 'sorter') {
    if (name === 'done') { if (val !== 'yes' && val !== 'no') e('done qiymati "yes" yoki "no"'); }
    else if (!isInt(val) || val < 0 || val > P.items.length) e(`${name} qiymati 0..${P.items.length} oralig'ida butun son bölishi kerak`);
  } else if (t === 'timeline') {
    if (name === 'time' && !['past', 'present', 'future'].includes(val)) e('time qiymati past/present/future');
    if (name === 'verb' && !Object.keys(P.verbs || {}).includes(val)) e(`verb qiymati: ${Object.keys(P.verbs || {}).join(', ')}`);
    if (op !== '==' && op !== '!=') e('time/verb uçun faqat == yoki !=');
  } else if (t === 'wordparts') {
    if (typeof val !== 'string') return e('qiymat matn bölishi kerak');
    if (name === 'parts' && val.split('|').join('') !== P.word) e(`parts qiymati "|" bilan bölingan va birlashtirilganda "${P.word}" bölishi kerak`);
    if (name === 'roles') {
      const ids = val.split('|');
      if (!ids.every(r => P.roles.includes(r))) e('roles: noma’lum vazifa id si bor');
      const pc = (card.steps.find(s => s.check && s.check.some(c => c[0] === 'parts')) || {}).check;
      if (pc) { const pv = pc.find(c => c[0] === 'parts')[2]; if (typeof pv === 'string' && pv.split('|').length !== ids.length) e('roles soni parts soniga teng bölishi kerak'); }
    }
  }
}

export function validateCard(card, { existingIds = [] } = {}) {
  const out = { errors: [], warnings: [] }, e = m => out.errors.push(m);
  if (!card || typeof card !== 'object' || Array.isArray(card)) { e('Karta obyekt bölishi kerak'); return out; }
  walk(card, 'karta', out);
  if (!SLUG.test(card.id || '')) e('id: kichik lotin harf, raqam va defis (3–40 belgi)');
  else if (existingIds.includes(card.id)) e(`id "${card.id}" band, boşqasini tanlang`);
  if (!isInt(card.grade) || card.grade < 1 || card.grade > 11) e('grade: 1–11 butun son');
  if (!isStr(card.topic, 80)) e('topic: matn (≤80) kerak');
  if (!isStr(card.emoji, 8)) e('emoji: bitta emoji kerak');
  if (!card.subject) e('subject kerak');
  const T = CUSTOM_TEMPLATES[card.template];
  if (!T) { e(`template "${card.template}" qöllab-quvvatlanmaydi (bölishi mumkin: ${Object.keys(CUSTOM_TEMPLATES).join(', ')})`); return out; }
  checkParams(card, out);
  const h = card.hook;
  if (!h || !isStr(h.q) || !Array.isArray(h.options) || h.options.length < 2 || h.options.length > 4 || !h.options.every(o => isStr(o, 60)) || !isInt(h.correct) || h.correct < 0 || h.correct >= (h.options || []).length || !isStr(h.why, 300)) e('hook: q, options (2–4), correct (indeks) va why kerak');
  if (!Array.isArray(card.claims) || !card.claims.length || !card.claims.every(c => isStr(c, 400))) e('claims: kamida 1 ta rasmiy qoida (≤400) kerak');
  if (!isStr(card.discovery, 400)) e('discovery: kashfiyot gapi (≤400) kerak');
  if (card.explore != null && !(Array.isArray(card.explore) && card.explore.length <= 4 && card.explore.every(x => isStr(x)))) e('explore: ≤4 ta qisqa matn');
  if (!Array.isArray(card.steps) || card.steps.length < 3 || card.steps.length > 8) { e('steps: 3–8 ta missiya kerak'); return out; }
  const hasAsk = card.steps.some(s => s && s.ask), hasCheck = card.steps.some(s => s && s.check);
  card.steps.forEach((s, i) => {
    const w = `${i + 1}-missiya`;
    if (!s || !isStr(s.emoji, 8) || !isStr(s.text) || !isStr(s.hint)) { e(`${w}: emoji, text, hint kerak`); return; }
    if (!!s.check === !!s.ask) { e(`${w}: check yoki ask dan aniq bittasi bölishi kerak`); return; }
    if (s.focus != null && !T.focus.includes(s.focus)) e(`${w}: focus "${s.focus}" noto’g’ri (${T.focus.join(', ')})`);
    if (s.check) {
      if (!Array.isArray(s.check) || s.check.length < 1 || s.check.length > 3) { e(`${w}: check 1–3 shartdan iborat bölishi kerak`); return; }
      s.check.forEach(c => {
        if (!Array.isArray(c) || c.length !== 3 || !T.vars.includes(c[0]) || !OPS.includes(c[1])) e(`${w}: shart [o’zgaruvchi, amal, qiymat]; o’zgaruvchilar: ${T.vars.join(', ')}`);
        else checkValue(card, c, w, out);
      });
    } else {
      const a = s.ask;
      if (a.kind === 'choice') { if (!Array.isArray(a.options) || a.options.length < 2 || a.options.length > 4 || !a.options.every(o => isStr(o, 60)) || !isInt(a.correct) || a.correct < 0 || a.correct >= a.options.length) e(`${w}: ask.options (2–4) va ask.correct (indeks) kerak`); }
      else if (a.kind === 'number') { if (typeof a.correct !== 'number' || !Number.isFinite(a.correct) || !isStr(a.label, 60)) e(`${w}: ask.correct (son) va ask.label kerak`); }
      else e(`${w}: ask.kind "choice" yoki "number"`);
    }
  });
  if (!hasAsk) out.warnings.push('Hech bir missiyada savol (ask) yöq: öquvçi tüşunganini tekşirmaydi');
  if (!hasCheck) out.warnings.push('Hech bir missiyada amaliy topşiriq (check) yöq');
  if (card.steps.every(s => s && s.hint && s.hint.length < 6)) out.warnings.push('Maslahatlar juda qisqa');
  return out;
}

// Kartani ruxsat etilgan maydonlar bilan qayta quradi, "tasdiqlanmagan" belgisini majburan qöyadi
export function normalizeCard(c) {
  if (!c || typeof c !== 'object') c = {};
  if (!Array.isArray(c.steps)) c = { ...c, steps: [] };
  const pick = (o, ks) => Object.fromEntries(ks.filter(k => o && o[k] !== undefined).map(k => [k, o[k]]));
  const steps = c.steps.filter(s => s && typeof s === 'object').map(s => ({ ...pick(s, ['emoji', 'text', 'hint', 'focus', 'check']), ...(s.ask && typeof s.ask === 'object' ? { ask: pick(s.ask, ['kind', 'label', 'unit', 'correct', 'options']) } : {}) }));
  return { ...pick(c, ['id', 'subject', 'grade', 'emoji', 'topic', 'template', 'params']), vars: {}, hook: pick(c.hook || {}, ['q', 'options', 'correct', 'why']),
    claims: c.claims, discovery: c.discovery, explore: c.explore || [], steps, verified: false, source: null, custom: true };
}

// AI javobidan JSON ajratib oladi (```json ... ``` va ortiqça matnni kesib tashlaydi)
export function extractJSON(text) {
  const t = String(text || '').replace(/```(?:json)?/gi, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('JSON topilmadi: javobda { ... } bölishi kerak');
  return JSON.parse(t.slice(a, b + 1));
}
