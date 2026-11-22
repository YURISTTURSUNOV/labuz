import { h } from '../util.js';
import { setFocusOn, setRead } from './common.js';

// Shablon: vaqt çizig'i. Fe'l şakli vaqtga qarab özgaradi (Past / Present / Future Simple).
// params.verbs bölmasa, standart play/go köplamlari ishlatiladi.
const DEFAULT = {
  pre: 'She ',
  verbs: {
    play: { past: 'played', present: 'plays', future: 'will play', rest: { past: ' football yesterday.', present: ' football every day.', future: ' football tomorrow.' },
      note: { past: 'Muntazam fe’l: oxiriga -ed qöşiladi.', present: 'He/she/it bilan fe’lga -s qöşiladi.', future: 'will + fe’lning asosiy şakli.' } },
    go: { past: 'went', present: 'goes', future: 'will go', rest: { past: ' to school yesterday.', present: ' to school every day.', future: ' to school tomorrow.' },
      note: { past: 'Notöğri fe’l: -ed emas, özining maxsus şakli bor.', present: 'He/she/it bilan -es qöşiladi.', future: 'will + fe’lning asosiy şakli.' } },
  },
};
const TIMES = [['past', '⏪', 'Kecha', 'Past Simple', 16], ['present', '🔁', 'Har kuni', 'Present Simple', 50], ['future', '⏩', 'Ertaga', 'Future Simple', 84]];
const GENERIC = { past: 'Past Simple: ötgan zamon şakli.', present: 'Present Simple: odatiy, takrorlanuvçi ish.', future: 'Future Simple: will + fe’l.' };

export function mount(el, params, { onState, ctx }) {
  const hide = ctx && ctx.hideNames;
  const cfg = params && params.verbs ? params : DEFAULT;
  const pre = cfg.pre != null ? cfg.pre : 'She ';
  const VERBS = cfg.verbs, keys = Object.keys(VERBS);
  const state = { time: 'present', verb: keys[0] };
  const marker = h('div', { class: 'tmark' }, '🧍');
  const line = h('div', { class: 'tline' }, h('i', { class: 'tbar' }), TIMES.map(t => h('div', { class: 'tpt', style: `left:${t[4]}%` }, h('b', {}, t[2]), h('small', {}, hide ? '' : t[3]))), marker);
  const sentence = h('div', { class: 'sentence' });
  const note = h('div', { class: 'readout' });
  const timeRow = h('div', { class: 'trow', 'data-var': 'time' }, TIMES.map(t => h('button', { class: 'tbtn', 'data-t': t[0], onclick: () => { state.time = t[0]; update(); } }, h('span', {}, t[1]), t[2])));
  const verbRow = h('div', { class: 'trow', 'data-var': 'verb' }, h('span', { class: 'sl-name' }, 'Fe’l:'), keys.map(v => h('button', { class: 'chip', 'data-v': v, onclick: () => { state.verb = v; update(); } }, v)));
  const root = h('div', { class: 'tpl' }, h('div', { class: 'cvwrap tlwrap' }, line, sentence), note, h('div', { class: 'controls' }, timeRow, keys.length > 1 ? verbRow : null));
  el.append(root);

  function update() {
    const V = VERBS[state.verb], t = TIMES.find(x => x[0] === state.time);
    marker.style.left = t[4] + '%';
    const vg = hide ? '____' : V[state.time];
    sentence.replaceChildren(pre, h('span', { class: 'vg ' + state.time }, vg), V.rest[state.time]);
    if (hide) setRead(note, 'Imtihon', 'Şakl yashirilgan: özingiz tanlang.');
    else setRead(note, t[3], (V.note && V.note[state.time]) || GENERIC[state.time]);
    timeRow.querySelectorAll('.tbtn').forEach(b => b.classList.toggle('on', b.dataset.t === state.time));
    verbRow.querySelectorAll('.chip').forEach(b => b.classList.toggle('on', b.dataset.v === state.verb));
    onState({ ...state });
  }
  update();
  return { getState: () => ({ ...state }), setFocus: n => setFocusOn(root, n), destroy() {} };
}
