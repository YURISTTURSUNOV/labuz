import { h } from '../util.js';

// Slayder: {name,label,min,max,step,value} -> {el, set, input}
export function slider({ name, label, min, max, step, value, unit = '', onInput }) {
  const out = h('output', { class: 'sl-out' }, `${value}${unit}`);
  const input = h('input', { type: 'range', min, max, step, value, 'aria-label': label });
  input.addEventListener('input', () => { out.textContent = `${input.value}${unit}`; onInput(Number(input.value)); });
  const el = h('label', { class: 'sl', 'data-var': name }, h('span', { class: 'sl-name' }, label), input, out);
  return {
    el,
    set(v) { input.value = v; out.textContent = `${v}${unit}`; },
  };
}

export function setFocusOn(root, name) {
  root.querySelectorAll('[data-var]').forEach(n => n.classList.toggle('focus', n.dataset.var === name));
}

// Canvasni konteyner eniga moslaş (DPR bilan)
export function fitCanvas(canvas, heightCss, redraw) {
  const fit = () => {
    const w = canvas.parentElement.clientWidth || 600;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = w + 'px'; canvas.style.height = heightCss + 'px';
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(heightCss * dpr);
    const g = canvas.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw(g, w, heightCss);
  };
  const ro = new ResizeObserver(fit); ro.observe(canvas.parentElement); fit();
  return { fit, stop: () => ro.disconnect() };
}
