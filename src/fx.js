import { kv } from './store.js';

let muted = kv.get('labuz.mute') === '1';
export const isMuted = () => muted;
export function toggleMute() { muted = !muted; kv.set('labuz.mute', muted ? '1' : '0'); return muted; }

let ac;
function tone(freqs, dur = 0.12, type = 'sine', vol = 0.07) {
  if (muted) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const t = ac.currentTime;
    freqs.forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(vol, t + i * dur); g.gain.exponentialRampToValueAtTime(0.0001, t + i * dur + dur);
      o.connect(g); g.connect(ac.destination); o.start(t + i * dur); o.stop(t + i * dur + dur + 0.02);
    });
  } catch (e) { /* ovoz çiqmasa ham ishlayveradi */ }
}
export const sfx = {
  pick: () => tone([440], 0.08),
  ok: () => tone([660, 880]),
  bad: () => tone([220, 170], 0.14, 'triangle'),
  win: () => tone([523, 659, 784, 1047], 0.13),
};

export function confetti(n = 60) {
  if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.createElement('canvas');
  Object.assign(cv.style, { position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 50 });
  cv.width = innerWidth; cv.height = innerHeight; document.body.append(cv);
  const g = cv.getContext('2d'), cols = ['#FCA311', '#2F6FED', '#1B998B', '#E4572E', '#8E5BD6'];
  const ps = Array.from({ length: n }, () => ({
    x: cv.width / 2 + (Math.random() - 0.5) * 200, y: cv.height * 0.55,
    vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4, s: 5 + Math.random() * 6, c: cols[(Math.random() * cols.length) | 0], r: Math.random() * 6,
  }));
  const t0 = performance.now();
  (function loop(t) {
    const k = (t - t0) / 1400; g.clearRect(0, 0, cv.width, cv.height);
    ps.forEach(p => { p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.r += 0.2; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.globalAlpha = Math.max(0, 1 - k); g.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); g.restore(); });
    if (k < 1) requestAnimationFrame(loop); else cv.remove();
  })(t0);
}

export function toast(text) {
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = text; document.body.append(el);
  setTimeout(() => el.remove(), 1400);
}

export const getXP = () => Number(kv.get('labuz.xp') || 0);
export function addXP(n) {
  const v = getXP() + n; kv.set('labuz.xp', String(v));
  document.querySelectorAll('.xpval').forEach(e => { e.textContent = fmtXP(v); });
  return v;
}
export const level = xp => Math.floor(xp / 100) + 1;
export const fmtXP = xp => `Daraja ${level(xp)} · ${xp} XP`;

// Kartadagi eng yaxşi yulduzlar va kunlik seriya (streak)
export function getStars(id) { try { return (JSON.parse(kv.get('labuz.stars') || '{}'))[id] || 0; } catch (e) { return 0; } }
export function setStars(id, n) {
  let o = {}; try { o = JSON.parse(kv.get('labuz.stars') || '{}'); } catch (e) { o = {}; }
  if (n > (o[id] || 0)) { o[id] = n; kv.set('labuz.stars', JSON.stringify(o)); }
}
const day = d => d.toLocaleDateString('sv');
export function getStreak() { try { return JSON.parse(kv.get('labuz.streak') || '{"n":0}'); } catch (e) { return { n: 0 }; } }
export function touchStreak() {
  const st = getStreak(), today = day(new Date()), y = new Date(); y.setDate(y.getDate() - 1);
  if (st.last === today) return st.n;
  const n = st.last === day(y) ? st.n + 1 : 1;
  kv.set('labuz.streak', JSON.stringify({ n, last: today }));
  document.querySelectorAll('.streakval').forEach(e => { e.textContent = `🔥 ${n}`; });
  return n;
}
