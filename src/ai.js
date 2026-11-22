import { evalCheck } from './engine.js';
import { fmt } from './util.js';

// AI ishora qatlami.
// 1) window.LABUZ_AI_ENDPOINT berilsa: so'rov serverga ketadi (server/app.py, Claude API).
// 2) Aks holda deterministik zaxira: qadam ma'lumotidan ishora yasaydi. To'ğri javobni oçmaydi.
export async function getHint({ card, step, state, mode }) {
  const ep = typeof window !== 'undefined' && window.LABUZ_AI_ENDPOINT;
  if (ep) {
    try {
      const r = await fetch(ep, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: card.id, mode, state,
          step: { text: step.text, check: step.check || null, ask: step.ask ? { kind: step.ask.kind, label: step.ask.label } : null },
        }),
      });
      if (r.ok) { const j = await r.json(); if (j.hint) return { text: j.hint, source: 'ai' }; }
    } catch (e) { /* zaxiraga öting */ }
  }
  return { text: localHint(card, step, state), source: 'local' };
}

const OP = { '==': '=', '>': '>', '<': '<', '>=': '≥', '<=': '≤', '!=': '≠' };

function localHint(card, step, state) {
  const parts = [];
  if (step.check) {
    const r = evalCheck(step.check, state);
    for (const f of r.fails) {
      if (typeof f.val === 'number' && typeof f.cur === 'number') {
        const name = (card.vars && card.vars[f.v]) || f.v;
        parts.push(`Hozir ${name} = ${fmt(f.cur)}. Maqsad: ${name} ${OP[f.op]} ${fmt(f.val)}.`);
      }
    }
  }
  if (step.hint) parts.push(step.hint);
  return parts.join(' ') || 'Missiya matnini sekin qayta öqing.';
}
