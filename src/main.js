import styles from './styles.css';
import { h, clean } from './util.js';
import { SUBJECTS, SOON, CARDS, byId, nextOf } from './content.js';
import { Runner } from './engine.js';
import { pushEvent, kv } from './store.js';
import { renderTeacher } from './teacher.js';
import { sfx, confetti, toast, addXP, getXP, fmtXP, isMuted, toggleMute, getStars, setStars, getStreak, touchStreak } from './fx.js';
import * as graph from './templates/graph.js';
import * as circuit from './templates/circuit.js';
import * as cell3d from './templates/cell3d.js';
import * as wordparts from './templates/wordparts.js';
import * as timeline from './templates/timeline.js';

const TEMPLATES = { graph, circuit, cell3d, wordparts, timeline };
const MODES = [['quest', 'Sarguzasht'], ['free', 'Özing qil'], ['exam', 'Imtihon']];

document.head.append(h('style', {}, styles));
const app = document.getElementById('app');
let cleanup = null;
const user = () => ({ name: kv.get('labuz.name') || '', code: kv.get('labuz.code') || 'SINF-7A' });

function header(route) {
  const u = user();
  const mute = h('button', { class: 'iconbtn', 'aria-label': 'Ovoz', onclick: () => { mute.textContent = toggleMute() ? '🔇' : '🔊'; } }, isMuted() ? '🔇' : '🔊');
  return h('header', { class: 'top' },
    h('a', { class: 'logo', href: '#/' }, h('span', { class: 'mark' }, '◐'), 'LabUz'),
    h('nav', {}, h('a', { href: '#/', class: route !== 'teacher' ? 'on' : '' }, 'Öquvçi'), h('a', { href: '#/teacher', class: route === 'teacher' ? 'on' : '' }, 'Öqituvçi')),
    h('span', { class: 'who' }, u.name && getStreak().n > 0 ? h('span', { class: 'streak streakval', title: 'Ketma-ket kunlar' }, `🔥 ${getStreak().n}`) : null, u.name ? h('span', { class: 'xp xpval' }, fmtXP(getXP())) : 'Prototip'), mute);
}

function ensureStudent(then) {
  const u = user();
  if (u.name) return then();
  const name = h('input', { placeholder: 'Ismingiz', maxlength: 24, autofocus: true });
  const code = h('input', { value: u.code, maxlength: 12 });
  const go = () => { kv.set('labuz.name', clean(name.value, 30) || 'Öquvçi'); kv.set('labuz.code', (clean(code.value, 12) || 'SINF-7A').toUpperCase()); route(); };
  document.body.append(h('div', { class: 'modal' }, h('div', { class: 'box' },
    h('h2', {}, 'Salom! 👋'), h('p', {}, 'Ismingni yoz va boşla. Parol kerak emas.'),
    h('label', {}, 'Ism', name), h('label', {}, 'Sinf kodi', code), h('button', { class: 'btn', onclick: go }, 'Boşlaş ▶'))));
}

function home() {
  let filter = null;
  const grid = h('div', { class: 'grid' }), chips = h('div', { class: 'chips' });
  const draw = () => {
    chips.replaceChildren(h('button', { class: 'chip' + (!filter ? ' on' : ''), onclick: () => { filter = null; draw(); } }, 'Hammasi'),
      ...Object.entries(SUBJECTS).map(([k, s]) => h('button', { class: 'chip' + (filter === k ? ' on' : ''), onclick: () => { filter = k; draw(); } }, `${s.icon} ${s.name}`)));
    grid.replaceChildren(...CARDS.filter(c => !filter || c.subject === filter).map(c => {
      const s = SUBJECTS[c.subject];
      return h('a', { class: 'card', href: `#/card/${c.id}`, style: `--c:${s.color}` },
        h('div', { class: 'ico' }, c.emoji),
        h('div', { class: 'meta' }, `${s.name} · ${c.grade}-sinf`, h('em', {}, 'namuna')),
        h('h3', {}, c.topic),
        h('p', { class: 'q' }, '❓ ' + c.hook.q),
        h('div', { class: 'foot' }, h('span', {}, getStars(c.id) ? '⭐'.repeat(getStars(c.id)) + ' Qayta ▶' : 'Taxmin qil ▶'), h('span', {}, `${c.steps.length} missiya`)));
    }));
  };
  draw();
  return h('div', { class: 'page' },
    h('section', { class: 'hero' },
      h('h1', {}, 'Avval ', h('mark', {}, 'taxmin'), ' qil, keyin özing tekşir'),
      h('p', {}, 'Har bir mavzu savoldan boşlanadi. Nazariyani kitobdan öqimaysan: uni özing sinab, kashf qilasan.')),
    h('div', { class: 'progress' }, h('b', {}, `${CARDS.filter(c => getStars(c.id)).length}/${CARDS.length}`), ' mavzu tugatilgan'),
    chips, grid,
    h('section', { class: 'soon' }, h('h4', {}, 'Tez kunda'), h('div', { class: 'chips' }, SOON.map(t => h('span', { class: 'chip dis' }, t)))),
    h('p', { class: 'muted note' }, 'Prototip. Sinf va mavzular darslik bilan hali tekşirilmagan, kontentni fan metodisti tasdiqlaşi kerak.'));
}

function cardPage(id, mode) {
  const card = byId(id);
  if (!card) return { el: h('div', { class: 'page' }, h('p', {}, 'Karta topilmadi.'), h('a', { href: '#/' }, 'Orqaga')), destroy() {} };
  const s = SUBJECTS[card.subject], u = user();
  const body = h('div', { class: 'body' });
  let runner = null, tpl = null, pick = null, side = null, finaleTimer = 0, lastHints = 0, xpGained = 0, nudgeT = 0, lastHint = null;

  const hooks = {
    emit: e => {
      pushEvent({ ts: Date.now(), student: u.name, classCode: u.code, cardId: card.id, cardTitle: card.topic, ...e });
      if (e.type === 'step_done' || e.type === 'finish') {
        if (e.type === 'step_done') {
          const gain = 10 + (e.hints === lastHints ? 5 : 0); lastHints = e.hints; xpGained += gain;
          addXP(gain); sfx.ok(); confetti(26); toast(`+${gain} XP`);
        } else { xpGained += 20; addXP(20); sfx.win(); confetti(140); touchStreak(); }
      }
      if (e.type === 'answer_wrong') sfx.bad();
    },
    focus: n => tpl && tpl.setFocus(n),
    render: () => {
      renderMission();
      if (runner && runner.finished && !finaleTimer) finaleTimer = setTimeout(showFinale, 1100);
    },
  };

  function destroyTpl() { if (tpl) { tpl.destroy(); tpl = null; } clearTimeout(finaleTimer); clearTimeout(nudgeT); finaleTimer = 0; }

  function showHook() {
    destroyTpl();
    const opts = card.hook.options.map((o, i) => h('button', { class: 'opt big', onclick: ev => lock(i, ev.currentTarget) }, o));
    const note = h('div', { class: 'locknote' });
    function lock(i) {
      pick = i; sfx.pick();
      opts.forEach((b, j) => { b.disabled = true; b.classList.toggle('picked', j === i); });
      pushEvent({ ts: Date.now(), student: u.name, classCode: u.code, cardId: card.id, mode, type: 'hook', stepIdx: 0, total: card.steps.length, hints: 0, errors: 0 });
      note.replaceChildren(h('p', {}, '🔒 Taxmining qabul qilindi. Endi özing tekşirib köramiz!'), h('button', { class: 'btn big', onclick: showPlay }, 'Tekşirişni boşlaş ▶'));
    }
    body.replaceChildren(h('div', { class: 'hook' }, h('div', { class: 'bigemoji' }, card.emoji), h('small', {}, 'Avval taxmin qil!'), h('h2', {}, card.hook.q), h('div', { class: 'opts' }, opts), note));
  }

  function showPlay() {
    destroyTpl();
    side = h('aside', { class: 'side' });
    const stage = h('section', { class: 'stage' });
    body.replaceChildren(h('div', { class: 'split' }, side, stage));
    runner = new Runner(card, mode, hooks); lastHints = 0;
    tpl = TEMPLATES[card.template].mount(stage, card.params || {}, { onState: st => runner && runner.onState(st), ctx: { hideNames: mode === 'exam' } });
    runner.state = tpl.getState();
    if (mode !== 'free') runner.start();
    renderMission();
  }

  function renderMission() {
    if (!side || !runner) return;
    if (mode === 'free') {
      side.replaceChildren(h('div', { class: 'mission' }, h('small', {}, 'Erkin tajriba'), h('h3', {}, 'Qanday qiziq natija chiqarasan?'),
        h('ul', { class: 'explore' }, card.explore.map(t => h('li', {}, t))),
        h('a', { class: 'btn', href: `#/card/${id}?mode=quest` }, 'Missiyaga qaytish ▶')));
      return;
    }
    if (runner.finished) { side.replaceChildren(h('div', { class: 'mission win' }, h('div', { class: 'bigemoji' }, '🎉'), h('h3', {}, 'Barça missiyalar bajarildi!'))); return; }
    const st = runner.step, n = runner.total;
    const dots = h('div', { class: 'dots' }, card.steps.map((_, i) => h('i', { class: i < runner.idx ? 'd' : i === runner.idx ? 'c' : '' })));
    const ctrls = [];
    if (st.ask) {
      const a = st.ask;
      if (a.kind === 'number') {
        const inp = h('input', { type: 'text', inputmode: 'decimal', placeholder: '?', 'aria-label': a.label });
        const send = () => { if (inp.value.trim()) runner.submit(inp.value); };
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
        ctrls.push(h('div', { class: 'ask' }, h('span', {}, a.label), inp, a.unit ? h('span', {}, a.unit) : null, h('button', { class: 'btn', onclick: send }, 'Tekşir')));
      } else {
        ctrls.push(h('div', { class: 'ask choice' }, a.options.map((o, i) => h('button', { class: 'opt' + (runner.wrong.has(i) ? ' dis' : ''), disabled: runner.wrong.has(i), onclick: () => runner.submit(i) }, o))));
      }
      if (runner.wrong.size || (a.kind === 'number' && runner.errors > 0)) ctrls.push(h('div', { class: 'wrong' }, 'Yaqin! Yana bir urinib köring 💪'));
    } else if (mode !== 'exam') {
      ctrls.push(h('div', { class: 'doit' }, '👉 Öng tarafdagi modelni özingiz sinab köring'));
    }
    if (mode === 'quest') {
      const hintBox = h('div', { class: 'hintbox' });
      const showHint = r => { lastHint = { idx: runner.idx, ...r }; hintBox.replaceChildren(h('span', { class: 'tag' }, r.source === 'ai' ? 'AI maslahat' : 'Maslahat'), ' ' + r.text); };
      const hb = h('button', { class: 'btn ghost hintbtn', onclick: async ev => {
        ev.currentTarget.disabled = true; hintBox.textContent = 'Maslahat tayyorlanmoqda…';
        showHint(await runner.hint()); ev.currentTarget.disabled = false;
      } }, '💡 Maslahat');
      ctrls.push(hb, hintBox);
      if (lastHint && lastHint.idx === runner.idx) showHint(lastHint);
      // qiynalgan bolaga yordam: 2 ta xatodan keyin avtomatik, 40 soniya qotsa esa yumşoq eslatma
      if (st.ask && runner.wrong.size >= 2 && !(lastHint && lastHint.idx === runner.idx)) runner.hint().then(showHint);
      clearTimeout(nudgeT);
      nudgeT = setTimeout(() => { hb.classList.add('nudge'); if (!hintBox.textContent) hintBox.textContent = 'Qiynalyapsanmi? Maslahat tugmasini bos 👆'; }, 40000);
    }
    side.replaceChildren(h('div', { class: 'mission' + (runner.wrong.size ? ' shake' : '') },
      h('div', { class: 'mhead' }, h('span', {}, `${mode === 'exam' ? 'Imtihon' : 'Missiya'} ${runner.idx + 1}/${n}`), dots),
      h('div', { class: 'mtext' }, h('span', { class: 'memoji' }, st.emoji || '🎯'), h('p', {}, st.text)), ctrls));
  }

  function showFinale() {
    destroyTpl();
    const stars = mode === 'exam' ? (runner.errors === 0 ? 3 : runner.errors <= 2 ? 2 : 1) : (runner.errors + runner.hints === 0 ? 3 : runner.errors + runner.hints <= 2 ? 2 : 1);
    setStars(card.id, stars);
    const nx = nextOf(card.id);
    const parts = [h('div', { class: 'bigemoji' }, mode === 'exam' ? '🏆' : '🎉'),
      h('h2', {}, mode === 'exam' ? `Natija: ${runner.score()}%` : 'Sen kashf qilding!'),
      h('div', { class: 'stars' }, '⭐'.repeat(stars) + '☆'.repeat(3 - stars))];
    if (mode === 'quest' && pick != null) {
      const ok = pick === card.hook.correct;
      parts.push(h('div', { class: 'predict ' + (ok ? 'ok' : 'no') }, h('b', {}, ok ? '✅ Taxmining töğri çiqdi!' : '🤔 Taxmining boşqaçaroq edi.'), h('span', {}, ' ' + card.hook.why)));
    }
    parts.push(h('div', { class: 'discovery' }, h('small', {}, 'Sirni oçding'), h('p', {}, card.discovery)),
      h('div', { class: 'formal' }, h('small', {}, 'Kitobda şunday yoziladi'), h('p', {}, card.claims[0])),
      h('div', { class: 'statrow' }, h('span', {}, `+${xpGained} XP`), h('span', {}, `Maslahat: ${runner.hints}`), h('span', {}, `Xato: ${runner.errors}`)),
      h('div', { class: 'row' },
        h('a', { class: 'btn big', href: `#/card/${nx.id}` }, `Keyingisi: ${nx.topic} ▶`),
        mode === 'quest' ? h('a', { class: 'btn ghost', href: `#/card/${id}?mode=exam` }, 'Imtihon qil') : null,
        h('a', { class: 'btn ghost', href: `#/card/${id}?mode=free` }, 'Erkin tajriba')));
    body.replaceChildren(h('div', { class: 'finale' }, parts));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (mode === 'quest') showHook(); else showPlay();
  const el = h('div', { class: 'page', style: `--c:${s.color}` },
    h('a', { class: 'back', href: '#/' }, '← Barça mavzular'),
    h('div', { class: 'headline' }, h('span', { class: 'badge' }, `${s.icon} ${s.name}`), h('h1', {}, card.topic), h('span', { class: 'grade' }, `${card.grade}-sinf (namuna)`)),
    h('div', { class: 'modes' }, MODES.map(([m, l]) => h('a', { class: 'mode' + (m === mode ? ' on' : ''), href: `#/card/${id}?mode=${m}` }, l))),
    body);
  return { el, destroy: destroyTpl };
}

function route() {
  document.querySelectorAll('.modal').forEach(n => n.remove());
  if (cleanup) { cleanup(); cleanup = null; }
  app.replaceChildren();
  const [path, q] = location.hash.replace(/^#/, '').split('?');
  const mode = new URLSearchParams(q || '').get('mode') || 'quest';
  const m = path.match(/^\/card\/(.+)$/);
  if (path === '/teacher') {
    const view = h('div', {}); app.append(header('teacher'), view); cleanup = renderTeacher(view, user().code); return;
  }
  if (m) {
    app.append(header('card'));
    ensureStudent(() => { const cp = cardPage(m[1], mode); app.append(cp.el); cleanup = cp.destroy; });
    return;
  }
  app.append(header('home'), home());
  ensureStudent(() => {});
}
window.addEventListener('hashchange', route);
route();
