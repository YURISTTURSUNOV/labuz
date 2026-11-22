import { h } from '../util.js';
import { slider, setFocusOn, fitCanvas } from './common.js';

// Shablon: sabab-oqibat simulyatsiyasi (Om qonuni). Tok deterministik hisoblanadi: I = U / R.
export function mount(el, params, { onState }) {
  const maxI = params.maxI || 3;
  const state = { U: 3, R: 6, I: 0.5, burn: false };
  const canvas = h('canvas', { class: 'cv', role: 'img', 'aria-label': 'Elektr zanjiri' });
  const read = h('div', { class: 'readout' });
  const sU = slider({ name: 'U', label: 'U (kuçlaniş)', min: 1, max: 12, step: 1, value: state.U, unit: ' V', onInput: v => { state.U = v; update(); } });
  const sR = slider({ name: 'R', label: 'R (qarşilik)', min: 1, max: 20, step: 1, value: state.R, unit: ' Ω', onInput: v => { state.R = v; update(); } });
  const root = h('div', { class: 'tpl' }, h('div', { class: 'cvwrap' }, canvas), read, h('div', { class: 'controls' }, sU.el, sR.el));
  el.append(root);

  let phase = 0, raf = 0, W = 600, H = 340, alive = true;
  const fitter = fitCanvas(canvas, 340, (g, w, hh) => { W = w; H = hh; });

  function path(t) { // 0..1 sirtmoq bo'ylab nuqta (to'rtburçak)
    const x0 = 60, x1 = W - 60, y0 = 70, y1 = H - 60;
    const w = x1 - x0, hh = y1 - y0, per = 2 * (w + hh); let d = (t % 1) * per;
    if (d < w) return [x0 + d, y0]; d -= w;
    if (d < hh) return [x1, y0 + d]; d -= hh;
    if (d < w) return [x1 - d, y1]; d -= w;
    return [x0, y1 - d];
  }
  function frame() {
    if (!alive) return;
    const g = canvas.getContext('2d');
    const dpr = canvas.width / (parseFloat(canvas.style.width) || W);
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const x0 = 60, x1 = W - 60, y0 = 70, y1 = H - 60;
    const wire = state.burn ? '#E4572E' : '#14213D';
    g.lineWidth = 5; g.strokeStyle = wire; g.lineCap = 'round';
    if (state.burn) { g.shadowColor = '#E4572E'; g.shadowBlur = 16; }
    // sim (batareya va rezistor oraliqlari ochiq)
    g.beginPath();
    g.moveTo(x0, y0); g.lineTo(W / 2 - 55, y0); g.moveTo(W / 2 + 55, y0); g.lineTo(x1, y0); g.lineTo(x1, y1);
    g.lineTo(W / 2 + 34, y1); g.moveTo(W / 2 - 34, y1); g.lineTo(x0, y1); g.lineTo(x0, (y0 + y1) / 2 + 28); g.moveTo(x0, (y0 + y1) / 2 - 28); g.lineTo(x0, y0);
    g.stroke(); g.shadowBlur = 0;
    // rezistor (zigzag)
    g.beginPath(); g.moveTo(W / 2 - 55, y0);
    for (let i = 0; i < 6; i++) g.lineTo(W / 2 - 55 + 110 * (i + 0.5) / 6, y0 + (i % 2 ? 14 : -14));
    g.lineTo(W / 2 + 55, y0); g.lineWidth = 4; g.strokeStyle = state.burn ? '#E4572E' : '#8E5BD6'; g.stroke();
    g.fillStyle = '#5b5646'; g.font = '13px system-ui'; g.textAlign = 'center'; g.fillText(`R = ${state.R} Ω`, W / 2, y0 - 26);
    // batareya (ikki plastina)
    const by = (y0 + y1) / 2;
    g.strokeStyle = '#14213D'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(x0 - 22, by - 8); g.lineTo(x0 + 22, by - 8); g.stroke();
    g.lineWidth = 9; g.beginPath(); g.moveTo(x0 - 12, by + 10); g.lineTo(x0 + 12, by + 10); g.stroke();
    g.fillStyle = '#5b5646'; g.textAlign = 'left'; g.fillText(`U = ${state.U} V`, x0 + 30, by + 4);
    // ampermetr
    const ax = x1, ay = (y0 + y1) / 2;
    g.fillStyle = '#fff'; g.strokeStyle = '#14213D'; g.lineWidth = 3; g.beginPath(); g.arc(ax, ay, 26, 0, 7); g.fill(); g.stroke();
    g.fillStyle = state.burn ? '#E4572E' : '#14213D'; g.font = 'bold 14px system-ui'; g.textAlign = 'center';
    g.fillText('A', ax, ay - 4); g.font = '12px system-ui'; g.fillText(`${String(Math.round(state.I * 100) / 100).replace('.', ',')}`, ax, ay + 12);
    // chiroq: yorqinligi tok kuçiga mos
    const bright = Math.min(state.I / maxI, 1), bx = W / 2, byy = y1;
    if (!state.burn) {
      const gr = g.createRadialGradient(bx, byy, 4, bx, byy, 40 + 90 * bright);
      gr.addColorStop(0, `rgba(255,214,10,${0.15 + 0.7 * bright})`); gr.addColorStop(1, 'rgba(255,214,10,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(bx, byy, 40 + 90 * bright, 0, 7); g.fill();
    }
    g.fillStyle = state.burn ? '#ffd9cd' : `rgba(255,${240 - 30 * bright | 0},${200 - 180 * bright | 0},1)`;
    g.strokeStyle = '#14213D'; g.lineWidth = 3; g.beginPath(); g.arc(bx, byy, 24, 0, 7); g.fill(); g.stroke();
    g.strokeStyle = state.burn ? '#E4572E' : '#b45f06'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(bx - 12, byy + 10); g.lineTo(bx - 6, byy - 4); g.lineTo(bx, byy + 4); g.lineTo(bx + 6, byy - 4); g.lineTo(bx + 12, byy + 10); g.stroke();
    g.fillStyle = '#5b5646'; g.font = 'bold 13px system-ui'; g.textAlign = 'center';
    g.fillText(state.burn ? 'Chiroq kuydi!' : `Chiroq: ${Math.round(bright * 100)}%`, bx, byy + 44);
    if (state.burn) { g.font = '34px system-ui'; g.fillText('💥', bx, byy - 34); }
    // elektronlar: tezlik tok kuçiga mos (çegaralangan)
    const sp = Math.min(state.I, maxI + 1) * 0.0022;
    phase = (phase + sp) % 1;
    g.fillStyle = '#FCA311';
    for (let i = 0; i < 28; i++) { const [px, py] = path(phase + i / 28); g.beginPath(); g.arc(px, py, 5, 0, 7); g.fill(); }
    if (state.burn) {
      g.fillStyle = '#E4572E'; g.font = 'bold 15px system-ui'; g.textAlign = 'center';
      g.fillText('HIMOYA: tok kuçi juda katta! Haqiqiy simda qizib ketardi.', W / 2, 30);
    }
    raf = requestAnimationFrame(frame);
  }
  function update() {
    state.I = state.U / state.R; state.burn = state.I > maxI;
    read.innerHTML = `<b>I = U / R = ${state.U} / ${state.R} = ${String(Math.round(state.I * 100) / 100).replace('.', ',')} A</b><span>${state.burn ? 'Ortiqça yuklanish' : 'Normal rejim'}</span>`;
    onState({ ...state });
  }
  update(); frame();
  return {
    getState: () => ({ ...state }),
    setFocus: n => setFocusOn(root, n),
    destroy() { alive = false; cancelAnimationFrame(raf); fitter.stop(); },
  };
}
