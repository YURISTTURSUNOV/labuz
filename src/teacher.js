import { h } from './util.js';
import { load, onEvent, pushEvent, clearEvents, kv } from './store.js';
import { byId, CARDS } from './content.js';

const STUCK_MS = 45000;
const MODE = { quest: 'Sarguzasht', guide: 'Sarguzasht', free: 'Özing qil', exam: 'Imtihon' };

function aggregate(events, code) {
  const rows = new Map();
  for (const e of events) {
    if (code && e.classCode !== code) continue;
    const key = e.student + '|' + e.cardId;
    const r = rows.get(key) || { student: e.student, cardId: e.cardId, firstTs: e.ts };
    Object.assign(r, { mode: e.mode, step: e.type === 'finish' ? e.total : e.stepIdx, total: e.total, hints: e.hints, errors: e.errors, ts: e.ts, done: e.type === 'finish' || (r.done && e.type !== 'start') });
    rows.set(key, r);
  }
  return [...rows.values()];
}
function difficulty(events, code) {
  const m = new Map();
  for (const e of events) {
    if (code && e.classCode !== code) continue;
    if (e.type !== 'answer_wrong' && e.type !== 'hint') continue;
    const k = e.cardId + '#' + e.stepIdx;
    const r = m.get(k) || { cardId: e.cardId, step: e.stepIdx, wrong: 0, hints: 0, who: new Set() };
    if (e.type === 'hint') r.hints++; else r.wrong++;
    r.who.add(e.student); m.set(k, r);
  }
  return [...m.values()].sort((a, b) => (b.wrong * 2 + b.hints) - (a.wrong * 2 + a.hints)).slice(0, 5);
}
const status = (r, now) => r.done ? 'done' : (r.mode !== 'free' && now - r.ts > STUCK_MS ? 'stuck' : 'active');
const LBL = { done: 'Tugatdi', stuck: 'Qotib qoldi', active: 'Ishlamoqda' };

export function renderTeacher(root, classCode) {
  const board = h('div', { class: 'board' });
  const diff = h('div', { class: 'diff' });
  const tiles = h('div', { class: 'tiles' });
  const demo = h('button', { class: 'btn ghost', onclick: seed }, 'Demo öquvçilar qöş');
  const clear = h('button', { class: 'btn ghost', onclick: () => { clearEvents(); drawAll(); } }, 'Tozalaş');
  root.append(
    h('div', { class: 'page' },
      h('div', { class: 'headline' }, h('h1', {}, 'Öqituvçi paneli'), h('div', { class: 'code' }, 'Sinf kodi: ', h('b', {}, classCode))),
      h('p', { class: 'muted' }, 'Demo: öquvçi ikkinçi oynada şu kod bilan ishlasa, bu yerda jonli körinadi. Haqiqiy versiyada bu server (WebSocket) orqali ishlaydi.'),
      h('div', { class: 'actions' }, demo, clear),
      tiles, board, diff));

  function seed() {
    const now = Date.now();
    const names = ['Aziza', 'Bekzod', 'Dilnoza', 'Sardor', 'Madina', 'Jasur'];
    const prof = [[5, 0, 0, 'guide', 0], [3, 2, 1, 'guide', 5000], [2, 3, 4, 'guide', 90000], [5, 0, 1, 'exam', 0], [1, 1, 2, 'guide', 120000], [4, 1, 0, 'exam', 8000]];
    names.forEach((n, i) => {
      const card = CARDS[i % CARDS.length], [step, hints, errors, mode, age] = prof[i];
      const total = card.steps.length, st = Math.min(step, total), cur = Math.min(st, total - 1);
      for (let k = 0; k < errors; k++) pushEvent({ ts: now - age - 2000 + k, student: n, classCode, cardId: card.id, mode, type: 'answer_wrong', stepIdx: cur, total, hints, errors: k + 1 });
      for (let k = 0; k < hints; k++) pushEvent({ ts: now - age - 1500 + k, student: n, classCode, cardId: card.id, mode, type: 'hint', stepIdx: cur, total, hints: k + 1, errors });
      pushEvent({ ts: now - age, student: n, classCode, cardId: card.id, mode, type: st >= total ? 'finish' : 'step_done', stepIdx: st, total, hints, errors });
    });
  }
  function draw() {
    const now = Date.now();
    const rows = aggregate(load(), classCode).map(r => ({ ...r, st: status(r, now) }));
    const order = { stuck: 0, active: 1, done: 2 };
    rows.sort((a, b) => order[a.st] - order[b.st]);
    const cnt = s => rows.filter(r => r.st === s).length;
    const avgErr = rows.length ? (rows.reduce((a, r) => a + r.errors, 0) / rows.length).toFixed(1).replace('.', ',') : '–';
    tiles.replaceChildren(
      ...[['Ishlamoqda', cnt('active'), 'active'], ['Qotib qoldi', cnt('stuck'), 'stuck'], ['Tugatdi', cnt('done'), 'done'], ['O’rtaça xato', avgErr, '']]
        .map(([l, v, c]) => h('div', { class: 'tile ' + c }, h('b', {}, v), h('span', {}, l))));
    board.replaceChildren(rows.length ? h('table', {},
      h('thead', {}, h('tr', {}, ['Öquvçi', 'Mavzu', 'Rejim', 'Progress', 'Ishora', 'Xato', 'Holat'].map(t => h('th', {}, t)))),
      h('tbody', {}, rows.map(r => {
        const c = byId(r.cardId);
        return h('tr', { class: r.st }, h('td', {}, r.student), h('td', {}, c ? c.topic : r.cardId), h('td', {}, MODE[r.mode] || r.mode),
          h('td', {}, h('div', { class: 'bar' }, h('i', { style: `width:${Math.round(100 * r.step / r.total)}%` })), h('small', {}, `${r.step}/${r.total}`)),
          h('td', {}, r.hints), h('td', {}, r.errors), h('td', {}, h('span', { class: 'pill ' + r.st }, LBL[r.st])));
      }))) : h('p', { class: 'empty' }, 'Hali faoliyat yöq. Öquvçi sifatida biror karta boşlang yoki “Demo öquvçilar qöş” ni bosing.'));
  }
  function drawDiff() {
    const rows = difficulty(load(), classCode);
    const max = Math.max(1, ...rows.map(r => r.wrong * 2 + r.hints));
    diff.replaceChildren(h('h3', {}, 'Qiyinlik xaritasi'), h('p', { class: 'muted' }, 'Sinf qaysi missiyada köproq qiynalyapti. Şu joyni darsda qayta tuşuntiring.'),
      rows.length ? h('div', { class: 'drows' }, rows.map(r => {
        const c = byId(r.cardId), st = c && c.steps[r.step];
        return h('div', { class: 'drow' },
          h('div', { class: 'dtxt' }, h('b', {}, c ? c.topic : r.cardId), h('span', {}, st ? `${r.step + 1}-missiya: ${st.text}` : '')),
          h('div', { class: 'dbar' }, h('i', { style: `width:${Math.round(100 * (r.wrong * 2 + r.hints) / max)}%` })),
          h('small', {}, `${r.wrong} xato · ${r.hints} maslahat · ${r.who.size} öquvçi`));
      })) : h('p', { class: 'empty' }, 'Hali xato yoki maslahat so\u2019rovi yöq.'));
  }
  const drawAll = () => { draw(); drawDiff(); };
  drawAll();
  const stop = onEvent(drawAll), timer = setInterval(drawAll, 5000);
  return () => { stop(); clearInterval(timer); };
}
