import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { h } from '../util.js';

// Shablon: 3D model + bölaklarni tanlaş. Boşqa 3D mavzular uçun PARTS ni almaştirsa yetadi.
export const PARTS = {
  yadro: { name: 'Yadro', info: 'Irsiy ma’lumot (DNK) shu yerda saqlanadi va hujayra faoliyatini boshqaradi.', color: 0x4f6bed },
  mitoxondriya: { name: 'Mitoxondriya', info: 'Hujayra uçun energiya (ATF) hosil qiladi: “energiya stansiyasi”.', color: 0xf08a24 },
  ribosoma: { name: 'Ribosoma', info: 'Oqsil sintez qilinadigan mayda zarraçalar.', color: 0xb25fd9 },
  goldji: { name: 'Goldji apparati', info: 'Moddalarni qadoqlaydi va hujayradan çiqarişga tayyorlaydi.', color: 0x1fb58f },
  membrana: { name: 'Membrana', info: 'Hujayra çegarasi: moddalarning kirişi va çiqişini boshqaradi.', color: 0x9ec9ff },
};

export function mount(el, params, { onState, ctx }) {
  const hideNames = ctx && ctx.hideNames;
  const state = { selected: null, visited: 0 };
  const seen = new Set();
  const canvasWrap = h('div', { class: 'cvwrap three' });
  const info = h('div', { class: 'readout' });
  const list = h('div', { class: 'partlist' });
  const root = h('div', { class: 'tpl' }, canvasWrap, info, list);
  el.append(root);

  const W = () => canvasWrap.clientWidth || 600, Ht = 400;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W(), Ht);
  canvasWrap.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W() / Ht, 0.1, 100);
  camera.position.set(0, 1.5, 8.5);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 5; controls.maxDistance = 18;
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const dl = new THREE.DirectionalLight(0xffffff, 1.1); dl.position.set(4, 6, 5); scene.add(dl);

  const groups = {}; // id -> THREE.Group
  const mk = (id, geo, pos, rot, scale) => {
    const mat = new THREE.MeshStandardMaterial({ color: PARTS[id].color, roughness: 0.45, metalness: 0.05, emissive: 0x000000 });
    const m = new THREE.Mesh(geo, mat); m.position.set(...pos); if (rot) m.rotation.set(...rot); if (scale) m.scale.set(...scale);
    m.userData.part = id; (groups[id] ||= new THREE.Group()).add(m); return m;
  };
  // membrana
  const mem = new THREE.Mesh(new THREE.SphereGeometry(3.3, 48, 32), new THREE.MeshStandardMaterial({ color: PARTS.membrana.color, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
  mem.userData.part = 'membrana'; (groups.membrana ||= new THREE.Group()).add(mem);
  // yadro
  mk('yadro', new THREE.SphereGeometry(1.1, 40, 28), [0, 0, 0]);
  const nucleolus = new THREE.Mesh(new THREE.SphereGeometry(0.35, 20, 16), new THREE.MeshStandardMaterial({ color: 0x24378f }));
  nucleolus.position.set(0.3, 0.2, 0.7); nucleolus.userData.part = 'yadro'; groups.yadro.add(nucleolus);
  // mitoxondriyalar
  [[-2, 0.9, 0.6, 0.5], [1.9, 1.3, -0.8, -0.7], [-0.6, -1.9, 0.9, 1.1], [1.4, -1.3, 1.2, 0.3]].forEach(([x, y, z, r]) =>
    mk('mitoxondriya', new THREE.CapsuleGeometry(0.28, 0.75, 6, 14), [x, y, z], [0.3, r, r * 1.5]));
  // goldji (qatlamlar)
  for (let i = 0; i < 4; i++) mk('goldji', new THREE.SphereGeometry(1, 28, 16), [-1.5, -1.0 + i * 0.28, -1.3], [0.2, 0.4, 0.3], [1.15 - i * 0.06, 0.09, 0.75]);
  // ribosomalar
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 46; i++) {
    const u = rnd() * 2 - 1, th = rnd() * 6.283, rr = 1.7 + rnd() * 1.2, sq = Math.sqrt(1 - u * u);
    mk('ribosoma', new THREE.SphereGeometry(0.1, 10, 8), [rr * sq * Math.cos(th), rr * u, rr * sq * Math.sin(th)]);
  }
  Object.values(groups).forEach(g => scene.add(g));

  function select(id) {
    state.selected = id;
    if (id) seen.add(id);
    state.visited = seen.size;
    Object.entries(groups).forEach(([k, g]) => g.traverse(o => {
      if (o.material && o.material.emissive) o.material.emissive.setHex(k === id ? 0x555555 : 0x000000);
      if (o.material && k === 'membrana') o.material.opacity = k === id ? 0.32 : 0.16;
    }));
    const p = id && PARTS[id];
    info.innerHTML = p
      ? (hideNames ? '<b>Tanlandi</b><span>Imtihon rejimida nomi körsatilmaydi.</span>' : `<b>${p.name}</b><span>${p.info}</span>`)
      : '<b>Organoidni bosing</b><span>Modelni sichqoncha (yoki barmoq) bilan aylantiring.</span>';
    list.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.id === id));
    onState({ ...state });
  }
  Object.entries(PARTS).forEach(([id, p], i) =>
    list.append(h('button', { class: 'chip', 'data-id': id, 'data-var': 'selected', onclick: () => select(id) }, hideNames ? `Qism ${i + 1}` : p.name)));

  // sichqoncha bilan tanlaş: membrana oxirgi navbatda
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let down = null;
  const dom = renderer.domElement;
  dom.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
  dom.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
    const r = dom.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hits = ray.intersectObjects(scene.children, true).filter(x => x.object.userData.part);
    const inner = hits.find(x => x.object.userData.part !== 'membrana');
    const pick = inner || hits[0];
    if (pick) select(pick.object.userData.part);
  });

  let raf = 0, alive = true, last = performance.now();
  const loop = t => {
    if (!alive) return;
    const dt = (t - last) / 1000; last = t;
    if (!state.selected) scene.rotation.y += dt * 0.15;
    controls.update(); renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  const ro = new ResizeObserver(() => {
    const w = W(); renderer.setSize(w, Ht); camera.aspect = w / Ht; camera.updateProjectionMatrix();
    // tor ekranda (telefon) kamerani uzoqlaştirib, hujayra to'liq sığişini ta'minlaymiz
    camera.position.setLength(Math.max(8.5, 4.3 / (0.4142 * camera.aspect))); controls.update();
  });
  ro.observe(canvasWrap);
  select(null); loop(performance.now());

  return {
    getState: () => ({ ...state }),
    setFocus: () => {},
    destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); renderer.dispose(); },
  };
}
