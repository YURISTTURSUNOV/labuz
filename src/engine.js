import { getHint } from './ai.js';

// Deklarativ tekşiruv: [[o'zgaruvchi, amal, qiymat], ...] hammasi bajarilişi kerak (VA).
export function evalCheck(check, state) {
  const fails = [];
  for (const [v, op, val] of check) {
    const cur = state[v];
    let ok = false;
    switch (op) {
      case '==': ok = typeof val === 'number' ? Math.abs(cur - val) < 1e-9 : cur === val; break;
      case '!=': ok = cur !== val; break;
      case '>': ok = cur > val; break;
      case '<': ok = cur < val; break;
      case '>=': ok = cur >= val; break;
      case '<=': ok = cur <= val; break;
    }
    if (!ok) fails.push({ v, op, val, cur });
  }
  return { ok: fails.length === 0, fails };
}

// Qadamlar mashinasi. Rejimlar: quest (Sarguzasht), free (Özing qil), exam (Imtihon).
export class Runner {
  constructor(card, mode, hooks) {
    this.card = card; this.mode = mode; this.hooks = hooks;
    this.steps = card.steps; this.idx = 0;
    this.hints = 0; this.errors = 0; this.finished = false; this.state = {}; this.wrong = new Set();
  }
  get step() { return this.steps[this.idx]; }
  get total() { return this.steps.length; }
  emit(type) {
    this.hooks.emit({ type, mode: this.mode, stepIdx: this.idx, total: this.total, hints: this.hints, errors: this.errors });
  }
  start() { this.emit('start'); this.focus(); }
  focus() { this.hooks.focus(this.mode === 'quest' && this.step ? this.step.focus || null : null); }
  onState(state) {
    this.state = state;
    const s = this.step;
    if (this.mode === 'free' || this.finished || !s || !s.check) return;
    if (evalCheck(s.check, state).ok) this.advance();
  }
  submit(value) {
    const a = this.step && this.step.ask;
    if (!a) return false;
    const ok = a.kind === 'number'
      ? Math.abs(Number(String(value).replace(',', '.')) - a.correct) < 1e-6
      : value === a.correct;
    if (ok) { this.emit('answer_right'); this.advance(); }
    else { this.errors++; this.wrong.add(value); this.emit('answer_wrong'); this.hooks.render(); }
    return ok;
  }
  advance() {
    this.emit('step_done');
    this.idx++; this.wrong = new Set();
    if (this.idx >= this.total) { this.finished = true; this.hooks.focus(null); this.emit('finish'); }
    else this.focus();
    this.hooks.render();
  }
  async hint() {
    if (this.mode !== 'quest') return null;
    this.hints++; this.emit('hint');
    return getHint({ card: this.card, step: this.step, state: this.state, mode: this.mode });
  }
  score() { return Math.round(100 * this.total / (this.total + this.errors)); }
}
