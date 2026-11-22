import { h } from '../util.js';
import { slider, setFocusOn, fitCanvas, setRead } from './common.js';

// Shablon: grafik (y = kx + b). Ko'rinish, slayder oraliqlari, yorliqlar va belgi (emoji) params orqali beriladi.
const DEF = {
  view: { x: [-6, 6], y: [-6, 6] }, tick: { x: 2, y: 2 },
  ranges: { k: [-5, 5, 0.5], b: [-5, 5, 1], x: [-5, 5, 1] }, init: { k: 1, b: 0, x: 3 },
  labels: { k: 'k', b: 'b', x: 'x' }, xlabel: 'x', ylabel: 'y', marker: null, pointFmt: 'x = {x} bölganda y = {y}',
};
const num = v => String(Math.round(v * 100) / 100).replace('.', ',');

export function mount(el, params, { onState }) {
  const P = { ...DEF, ...params };
  for (const key of ['view', 'tick', 'ranges', 'init', 'labels']) P[key] = { ...DEF[key], ...(params[key] || {}) };
  const state = { ...P.init };
  const canvas = h('canvas', { class: 'cv', role: 'img', 'aria-label': 'Funksiya grafigi' });
  const eq = h('div', { class: 'readout' });
  const mk = n => { const [mn, mx, st] = P.ranges[n]; return slider({ name: n, label: P.labels[n], min: mn, max: mx, step: st, value: state[n], onInput: v => { state[n] = v; update(); } }); };
  const root = h('div', { class: 'tpl' }, h('div', { class: 'cvwrap' }, canvas), eq, h('div', { class: 'controls' }, mk('k').el, mk('b').el, mk('x').el));
  el.append(root);
  const fitter = fitCanvas(canvas, 380, draw);

  function eqText() {
    const k = state.k, b = state.b;
    const kt = k === 1 ? '' : k === -1 ? '−' : num(k);
    const bt = b === 0 ? '' : b > 0 ? ` + ${num(b)}` : ` − ${num(-b)}`;
    return k === 0 ? `y = ${num(b)}` : `y = ${kt}x${bt}`;
  }
  function draw(g, W, H) {
    g.clearRect(0, 0, W, H);
    const pad = 30, [x0, x1] = P.view.x, [y0, y1] = P.view.y;
    const sx = (W - 2 * pad) / (x1 - x0), sy = (H - 2 * pad) / (y1 - y0);
    const X = x => pad + (x - x0) * sx, Y = y => H - pad - (y - y0) * sy;
    g.lineWidth = 1; g.strokeStyle = '#e3ddd0'; g.fillStyle = '#7c7668'; g.font = '11px system-ui';
    for (let i = Math.ceil(x0); i <= Math.floor(x1); i++) { g.beginPath(); g.moveTo(X(i), Y(y0)); g.lineTo(X(i), Y(y1)); g.stroke(); }
    for (let j = Math.ceil(y0); j <= Math.floor(y1); j++) { g.beginPath(); g.moveTo(X(x0), Y(j)); g.lineTo(X(x1), Y(j)); g.stroke(); }
    const ax = Math.max(x0, Math.min(x1, 0)), ay = Math.max(y0, Math.min(y1, 0));
    g.strokeStyle = '#14213D'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(X(x0), Y(ay)); g.lineTo(X(x1), Y(ay)); g.moveTo(X(ax), Y(y0)); g.lineTo(X(ax), Y(y1)); g.stroke();
    g.fillStyle = '#7c7668';
    g.textAlign = 'center'; for (let i = Math.ceil(x0); i <= Math.floor(x1); i++) if (i !== 0 && i % P.tick.x === 0) g.fillText(i, X(i), Y(ay) + 14);
    g.textAlign = 'right'; for (let j = Math.ceil(y0); j <= Math.floor(y1); j++) if (j !== 0 && j % P.tick.y === 0) g.fillText(j, X(ax) - 5, Y(j) + 4);
    g.fillStyle = '#14213D'; g.font = 'bold 13px system-ui'; g.textAlign = 'left';
    g.fillText(P.xlabel, X(x1) - 6 - 8 * P.xlabel.length, Y(ay) - 8); g.fillText(P.ylabel, X(ax) + 8, Y(y1) + 12);
    // çiziq
    g.save(); g.beginPath(); g.rect(X(x0), Y(y1), X(x1) - X(x0), Y(y0) - Y(y1)); g.clip();
    g.strokeStyle = '#2F6FED'; g.lineWidth = 3.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(X(x0), Y(state.k * x0 + state.b)); g.lineTo(X(x1), Y(state.k * x1 + state.b)); g.stroke(); g.restore();
    if (state.b >= y0 && state.b <= y1 && x0 <= 0) { g.fillStyle = '#FCA311'; g.beginPath(); g.arc(X(0), Y(state.b), 6, 0, 7); g.fill(); }
    const y = state.k * state.x + state.b;
    if (y >= y0 && y <= y1) {
      g.setLineDash([5, 4]); g.strokeStyle = '#E4572E'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(X(state.x), Y(ay)); g.lineTo(X(state.x), Y(y)); g.lineTo(X(ax), Y(y)); g.stroke(); g.setLineDash([]);
      if (P.marker) { g.font = '26px system-ui'; g.textAlign = 'center'; g.fillText(P.marker, X(state.x), Y(y) + 9); }
      else { g.fillStyle = '#E4572E'; g.beginPath(); g.arc(X(state.x), Y(y), 6, 0, 7); g.fill(); }
    }
  }
  function update() {
    const y = state.k * state.x + state.b;
    const t = P.pointFmt.replace('{x}', state.x).replace('{y}', num(y));
    setRead(eq, eqText(), t);
    fitter.fit(); onState({ ...state });
  }
  update();
  return { getState: () => ({ ...state }), setFocus: n => setFocusOn(root, n), destroy: () => fitter.stop() };
}
