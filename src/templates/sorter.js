import { h } from '../util.js';
import { setFocusOn, setRead } from './common.js';

// Universal shablon: elementlarni guruhlarga ajratiş (hayvonlar guruhi, tarixiy davrlar, söz turkumlari, ...).
// params: { cats:[{id,label,emoji?}], items:[{text,cat,emoji?}] }
// Holat: placed (joylangan), correct (töğri joylangan), wrong (xato joylangan), done ('yes' bölsa hammasi töğri)
export function mount(el, params, { onState, ctx }) {
  const exam = ctx && ctx.hideNames;
  const cats = params.cats, items = params.items.map((it, i) => ({ ...it, i, at: null }));
  let sel = null;
  const state = { placed: 0, correct: 0, wrong: 0, done: 'no' };
  const pool = h('div', { class: 'pool', 'data-var': 'pool' });
  const buckets = h('div', { class: 'buckets', 'data-var': 'buckets' });
  const read = h('div', { class: 'readout' });
  const root = h('div', { class: 'tpl sorter' }, h('div', { class: 'cvwrap sorterwrap' }, pool, buckets), read);
  el.append(root);

  const chip = (it, extra = '') => h('button', { class: 'itm' + extra, 'aria-label': it.text }, it.emoji ? h('span', { class: 'ie' }, it.emoji) : null, it.text);

  function render() {
    pool.replaceChildren(...items.filter(it => it.at == null).map(it => {
      const b = chip(it, sel === it.i ? ' sel' : '');
      b.addEventListener('click', () => { sel = sel === it.i ? null : it.i; render(); });
      return b;
    }));
    if (!pool.children.length) pool.append(h('span', { class: 'empty' }, 'Hammasi joylandi'));
    buckets.replaceChildren(...cats.map(c => {
      const inside = items.filter(it => it.at === c.id).map(it => {
        const ok = it.cat === c.id;
        const b = chip(it, exam ? ' placed' : ok ? ' placed ok' : ' placed bad');
        b.title = 'Qaytarish uçun bosing';
        b.addEventListener('click', ev => { ev.stopPropagation(); it.at = null; sel = null; render(); });
        return b;
      });
      const box = h('div', { class: 'bucket' + (sel != null ? ' ready' : ''), role: 'button', tabindex: 0, 'aria-label': c.label },
        h('div', { class: 'bh' }, c.emoji ? h('span', { class: 'ie' }, c.emoji) : null, h('b', {}, c.label)), h('div', { class: 'bi' }, inside));
      const put = () => { if (sel == null) { setRead(read, 'Avval elementni tanlang', 'Keyin guruhni bosing.'); return; } items[sel].at = c.id; sel = null; render(); };
      box.addEventListener('click', put);
      box.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); put(); } });
      return box;
    }));
    const placed = items.filter(it => it.at != null);
    state.placed = placed.length;
    state.correct = placed.filter(it => it.at === it.cat).length;
    state.wrong = state.placed - state.correct;
    state.done = state.correct === items.length ? 'yes' : 'no';
    if (sel != null) setRead(read, items[sel].text, 'Endi tegişli guruhni bosing.');
    else if (exam) setRead(read, `${state.placed} / ${items.length}`, 'Imtihon: töğri-xatoligi körsatilmaydi.');
    else setRead(read, `${state.correct} / ${items.length} töğri`, state.wrong ? `${state.wrong} tasi xato joyda: qizil elementni bosib qaytaring.` : 'Elementni tanlang, keyin guruhni bosing.');
    onState({ ...state });
  }
  render();
  return { getState: () => ({ ...state }), setFocus: n => setFocusOn(root, n), destroy() {} };
}
