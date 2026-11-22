import { h } from '../util.js';

// Shablon: söz bölaklarga ajratiş va rol berish (morfema tahlili). Qoida deterministik, AI uydirmaydi.
export function mount(el, params, { onState }) {
  const word = params.word, labels = params.roleLabels, roleIds = params.roles;
  const cuts = new Set(); // harf indeksi i: i-harfdan keyin çiziq
  const roles = {};
  const state = { parts: word, roles: '' };
  const wordEl = h('div', { class: 'word', 'data-var': 'parts' });
  const rolesEl = h('div', { class: 'roles', 'data-var': 'roles' });
  const read = h('div', { class: 'readout' });
  const root = h('div', { class: 'tpl wp' }, wordEl, rolesEl, read);
  el.append(root);

  const splitParts = () => {
    const out = []; let cur = '';
    [...word].forEach((ch, i) => { cur += ch; if (cuts.has(i) || i === word.length - 1) { out.push(cur); cur = ''; } });
    return out;
  };
  function render() {
    wordEl.replaceChildren();
    [...word].forEach((ch, i) => {
      wordEl.append(h('span', { class: 'ltr' }, ch));
      if (i < word.length - 1) wordEl.append(h('button', { class: 'cut' + (cuts.has(i) ? ' on' : ''), 'aria-label': `${i + 1}-harfdan keyin bölish`, onclick: () => { cuts.has(i) ? cuts.delete(i) : cuts.add(i); render(); } }));
    });
    const parts = splitParts();
    rolesEl.replaceChildren();
    const ids = [];
    parts.forEach((p, i) => {
      const sel = h('select', { 'aria-label': `${p} vazifasi` }, h('option', { value: '' }, 'Vazifa…'), roleIds.map(r => h('option', { value: r }, labels[r])));
      sel.value = roles[p + '#' + i] || '';
      sel.addEventListener('change', () => { roles[p + '#' + i] = sel.value; emit(); });
      rolesEl.append(h('div', { class: 'part' + (sel.value ? ' set ' + sel.value : '') }, h('b', {}, p), sel));
      ids.push(sel.value || '-');
    });
    state.parts = parts.join('|');
    state.roles = ids.join('|');
    read.innerHTML = `<b>${parts.join(' + ')}</b><span>${parts.length} bölak</span>`;
    onState({ ...state });
  }
  function emit() {
    const parts = splitParts();
    state.roles = parts.map((p, i) => roles[p + '#' + i] || '-').join('|');
    rolesEl.querySelectorAll('.part').forEach((d, i) => { const v = roles[parts[i] + '#' + i]; d.className = 'part' + (v ? ' set ' + v : ''); });
    onState({ ...state });
  }
  render();
  return {
    getState: () => ({ ...state }),
    setFocus: n => { wordEl.classList.toggle('focus', n === 'parts'); rolesEl.classList.toggle('focus', n === 'roles'); },
    destroy() {},
  };
}
