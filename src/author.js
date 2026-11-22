import { h, clean } from './util.js';
import { SUBJECTS, CARDS, byId } from './content.js';
import { normalizeCard, extractJSON } from './validate.js';
import { check, previewCard, saveCard, removeCard, listCustom } from './custom.js';
import { toast } from './fx.js';

const TPL = {
  sorter: {
    title: 'Guruhlarga ajratiş', use: 'Biologiya, tarix, geografiya, ona tili (söz turkumlari), tabiiy fan: elementlarni toifalarga ajratiş.',
    doc: `params: { "cats": [ {"id":"sut","label":"Sutemizuvçilar","emoji":"🐕"} ... (2-5 ta guruh) ], "items": [ {"text":"It","emoji":"🐕","cat":"sut"} ... (4-12 ta element, har bir guruhda kamida 1 ta) ] }
O'zgaruvçilar (check uçun): placed (joylangan soni), correct (töğri joylangan soni), wrong (xato soni), done ("yes" bölsa hammasi töğri).
focus: "pool" yoki "buckets".
Namunadagi kabi, kamida bitta "aldamçi" element qöying (tashqi belgisi boşqa guruhga o'xşaydi, lekin aslida bu guruhda).`,
  },
  timeline: {
    title: 'Vaqt çizig’i (ingliz tili fe’l vaqtlari)', use: 'Ingliz tili: Past / Present / Future Simple, fe’l şakli vaqtga qarab özgaradi.',
    doc: `params: { "pre": "She ", "verbs": { "play": { "past":"played","present":"plays","future":"will play","rest":{"past":" football yesterday.","present":" football every day.","future":" football tomorrow."},"note":{"past":"...","present":"...","future":"..."} } ... (1-4 ta fe'l) } }
O'zgaruvçilar: time ("past"|"present"|"future"), verb (verbs kalitlaridan biri).
focus: "time" yoki "verb". note ixtiyoriy.`,
  },
  wordparts: {
    title: 'Söz tarkibi (qöşimçalar)', use: 'Ona tili: sözni ildiz va qöşimçalarga ajratiş.',
    doc: `params: { "word": "kitoblarimizdan", "roles": ["ildiz","koplik","egalik","chiqish"], "roleLabels": { "ildiz":"Ildiz", ... } }
O'zgaruvçilar: parts (bölaklar "kitob|lar|imiz|dan" ko'rinişida), roles (vazifalar "ildiz|koplik|egalik|chiqish" ko'rinişida, bölaklar tartibida).
focus: "parts" yoki "roles".`,
  },
};

function example(tpl) {
  const src = { sorter: 'bio-hayvon-guruhlari', timeline: 'eng-vaqtlar', wordparts: 'ona-soz-tarkibi' }[tpl];
  const c = normalizeCard(byId(src));
  delete c.verified; delete c.source; delete c.custom; delete c.vars;
  c.id = 'misol-id-yozing';
  if (tpl === 'timeline') c.params = { pre: 'She ', verbs: {
    play: { past: 'played', present: 'plays', future: 'will play', rest: { past: ' football yesterday.', present: ' football every day.', future: ' football tomorrow.' } },
    go: { past: 'went', present: 'goes', future: 'will go', rest: { past: ' to school yesterday.', present: ' to school every day.', future: ' to school tomorrow.' } } } };
  return JSON.stringify(c, null, 1);
}

export function buildPrompt({ subject, grade, topic, tpl, source }) {
  const s = SUBJECTS[subject];
  return `Sen maktab metodistisan. Vazifang: darslik mavzusini "taxmin qil, sinab kör, kashf qil" formatidagi interaktiv kartaga aylantiriş.

MAVZU: ${topic}
FAN: ${s ? s.name : subject} (subject kaliti: "${subject}")
SINF: ${grade}-sinf
SHABLON: ${tpl} (${TPL[tpl].title})
${source ? `\nDARSLIKDAN PARÇA (faqat şunga tayan, boşqa fakt qöşma):\n"""\n${source}\n"""\n` : ''}
QOIDALAR
1. Javobda FAQAT bitta JSON obyekt bölsin. Izoh, sarlavha va \`\`\` belgilari bölmasin.
2. Matn özbek tilida, YANGI lotin alifbosida: o' → ö, g' → ğ, ch → ç, sh → ş (masalan: töğri, qöşimça, çiziq, ş). Ingliz tilidagi gaplar ingliz tilida qoladi.
3. Faqat haqiqiy va darslikda bor faktlarni yoz. Aniq bilmagan narsangni yozma, uydirma. Mavzu bu yerda yetarli emas bölsa, soddaroq, aniq qismini ol.
4. "<" va ">" belgilarini, uzun çiziqça (—) ni ishlatma.
5. "hook": bola mavzuni bilmasa ham qiziqib qoladigan, tasavvurga zid yoki esda qoladigan savol (2–4 variant, correct = töğri variant indeksi, 0 dan boşlanadi). "why" bir-ikki gapda sababni tüşuntirsin.
6. "steps": 4–6 ta missiya. Har biri bir qisqa gap. Amaliy topşiriq ("check") va savol ("ask") aralaş bölsin, kamida 1 tasi "ask". Har bir missiyada "emoji", "text", "hint" bölsin (hint javobni aytmasin, yönaltirsin). Har bir missiyada "check" YOKI "ask" bölsin, ikkalasi emas.
7. "check" formati: [ ["o'zgaruvçi", "amal", qiymat], ... ], amal: == != > < >= <=. Faqat shablonda ruxsat etilgan o'zgaruvçilarni ishlat.
8. "ask" formati: {"kind":"choice","options":["..","..",".."],"correct":0}.
9. "claims": darslikdagi rasmiy qoida (1–2 gap). "discovery": öquvçi nimani kashf qilganini bir gapda ayt.
10. "id": kichik lotin harf, raqam, defis (masalan "bio-hayvon-guruhlari"). "emoji": bitta emoji. "grade": ${grade}. "subject": "${subject}". "template": "${tpl}".

SHABLON TAVSIFI
${TPL[tpl].doc}

NAMUNA (shu tuzilmani aynan takrorla, mazmunni özgartir):
${example(tpl)}`;
}

const sel = (opts, val) => { const s = h('select', {}, opts.map(([v, t]) => h('option', { value: v }, t))); s.value = val; return s; };

export function renderAuthor() {
  const subj = sel(Object.entries(SUBJECTS).map(([k, v]) => [k, v.name]), 'biologiya');
  const grade = sel(Array.from({ length: 11 }, (_, i) => [String(i + 1), `${i + 1}-sinf`]), '5');
  const topic = h('input', { type: 'text', maxlength: 80, placeholder: 'Masalan: Hayvonlar guruhlari' });
  const tpl = sel(Object.entries(TPL).map(([k, v]) => [k, `${v.title}: ${v.use}`]), 'sorter');
  const src = h('textarea', { rows: 4, maxlength: 3000, placeholder: 'Darslikdan mavzu matnini shu yerga qöying (ixtiyoriy, lekin aniqlikni oşiradi)' });
  const promptOut = h('textarea', { rows: 8, readonly: true, class: 'mono' });
  const answer = h('textarea', { rows: 10, class: 'mono', placeholder: 'AI bergan JSON ni shu yerga qöying' });
  const report = h('div', { class: 'report' });
  const actions = h('div', { class: 'row' });
  const mine = h('div', { class: 'mine' });
  let current = null;

  const make = () => {
    const t = clean(topic.value, 80);
    if (!t) { topic.focus(); toast('Avval mavzu nomini yozing'); return; }
    promptOut.value = buildPrompt({ subject: subj.value, grade: grade.value, topic: t, tpl: tpl.value, source: src.value.replace(/[<>]/g, '').slice(0, 3000).trim() });
    promptOut.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const copy = async () => { try { await navigator.clipboard.writeText(promptOut.value); toast('Nusxalandi. Endi AI ga (Claude, ChatGPT, Gemini) yopiştiring'); } catch (e) { promptOut.select(); toast('Belgilandi: Ctrl+C bosing'); } };
  const verify = () => {
    report.replaceChildren(); actions.replaceChildren(); current = null;
    let raw; try { raw = extractJSON(answer.value); } catch (e) { report.append(h('p', { class: 'bad' }, '✖ ' + e.message)); return; }
    const norm = normalizeCard(raw);
    const r = check({ ...raw, ...norm, id: raw.id });
    r.errors.slice(0, 12).forEach(m => report.append(h('p', { class: 'bad' }, '✖ ' + m)));
    r.warnings.slice(0, 8).forEach(m => report.append(h('p', { class: 'warn' }, '⚠ ' + m)));
    if (r.errors.length) { report.append(h('p', { class: 'muted' }, 'Xatolarni AI ga yozib, "şularni tuzat" deng va yangi javobni qaytadan qöying.')); return; }
    current = norm;
    report.append(h('p', { class: 'good' }, `✔ Karta töğri: ${norm.steps.length} missiya. Sinab köring, keyin saqlang.`));
    actions.append(h('button', { class: 'btn', onclick: () => { previewCard(norm); location.hash = `#/card/${norm.id}`; } }, '▶ Sinab köriş'),
      h('button', { class: 'btn ghost', onclick: () => { saveCard(norm); toast('Saqlandi: bosh sahifada köriladi'); drawMine(); } }, '💾 Saqlaş'));
  };
  function drawMine() {
    const list = listCustom();
    mine.replaceChildren(h('h3', {}, `Mening kartalarim (${list.length})`),
      list.length ? h('div', { class: 'mlist' }, list.map(c => h('div', { class: 'mrow' },
        h('span', {}, `${c.emoji} ${c.topic} · ${c.grade}-sinf`),
        h('a', { class: 'btn ghost sm', href: `#/card/${c.id}` }, '▶'),
        h('button', { class: 'btn ghost sm', onclick: () => { const b = new Blob([JSON.stringify(c, null, 1)], { type: 'application/json' }); const a = h('a', { href: URL.createObjectURL(b), download: c.id + '.json' }); a.click(); } }, '⬇ JSON'),
        h('button', { class: 'btn ghost sm', onclick: () => { removeCard(c.id); drawMine(); } }, '🗑')))) : h('p', { class: 'muted' }, 'Hali saqlangan karta yöq.'));
  }
  drawMine();
  const field = (l, el) => h('label', { class: 'fld' }, h('span', {}, l), el);
  const root = h('div', { class: 'page author' },
    h('h1', {}, 'Karta tuzuvçi'),
    h('p', { class: 'muted' }, 'Mavzu yozing, tayyor topşiriqni AI ga bering, javobini şu yerga qöying: sayt tekşirib, sinab körsatadi. Yangi karta "tasdiqlanmagan" bölib saqlanadi: metodist tekşirmaguncha namuna hisoblanadi.'),
    h('section', { class: 'step' }, h('h3', {}, '1. Mavzuni yozing'),
      h('div', { class: 'grid2' }, field('Fan', subj), field('Sinf', grade)), field('Mavzu nomi', topic), field('Shablon', tpl), field('Darslikdan parça', src),
      h('button', { class: 'btn', onclick: make }, 'Topşiriq (prompt) tayyorla')),
    h('section', { class: 'step' }, h('h3', {}, '2. AI ga bering'), promptOut, h('button', { class: 'btn ghost', onclick: copy }, '📋 Nusxalaş')),
    h('section', { class: 'step' }, h('h3', {}, '3. AI javobini qöying'), answer, h('button', { class: 'btn', onclick: verify }, 'Tekşirish'), report, actions),
    mine);
  return root;
}
