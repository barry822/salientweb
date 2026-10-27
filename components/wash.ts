/* Background art, painted in the browser:
   - paintWash: a watercolour wash (layered, noise-distorted SVG blobs) for the
     "How" section and the dark pilot / contact backgrounds
   - paintStreaks: the hero's soft blue light with thin lines and streaks racing
     along them (most blue, a few green, like qualified meetings coming through) */

type Layer = [fill: string, rim: string, opacity: number, count: number, r: [number, number], x: [number, number], y: [number, number]];
type WashCfg = { seed: number; base?: [number, string, number][]; blend: string; fade: [number, number][]; bloom: number; grain: number; glow?: boolean; layers: Layer[] };

/** small seeded random number generator, so every visit paints the same wash */
export function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function blob(r: () => number, cx: number, cy: number, rx: number, ry: number) {
  const n = 9 + Math.floor(r() * 6), p: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.3, k = 0.68 + r() * 0.55;
    p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  let s = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    s += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return s + 'Z';
}

const WASH: Record<string, WashCfg> = {
  hero: {
    seed: 7, base: [[0, '#3d61f0', 0.55], [0.35, '#8eabff', 0.55], [0.7, '#dbe6ff', 0.3], [1, '#fff', 0]], blend: 'multiply',
    fade: [[0, 1], [0.42, 1], [0.9, 0]], bloom: 14, grain: 0.14, glow: true, layers: [
      ['#dce7ff', '#b8ccff', 0.95, 8, [340, 560], [-100, 1700], [-60, 560]],
      ['#b4c9ff', '#7f9dff', 0.75, 9, [220, 400], [-80, 1600], [-80, 420]],
      ['#7d9cff', '#4c6ff5', 0.6, 8, [160, 300], [-60, 1250], [-100, 300]],
      ['#3f63f2', '#2041d6', 0.4, 6, [110, 230], [-40, 900], [-120, 190]],
      ['#1a39c9', '#10279a', 0.32, 4, [70, 150], [40, 640], [-80, 110]],
      ['#5f86ff', '#3557ea', 0.2, 4, [90, 180], [1150, 1650], [-60, 160]],
    ],
  },
  soft: {
    seed: 21, base: [[0, '#c6d5ff', 0.5], [0.5, '#fff', 0]], blend: 'multiply', fade: [[0, 0.9], [0.22, 0.5], [0.5, 0]], bloom: 6, grain: 0.1, layers: [
      ['#e3ebff', '#c3d3ff', 0.9, 6, [280, 460], [-100, 1700], [-120, 300]],
      ['#bfd0ff', '#93acff', 0.55, 6, [160, 300], [900, 1700], [-120, 200]],
      ['#8ca8ff', '#5b7cf6', 0.35, 3, [90, 180], [1150, 1650], [-100, 90]],
    ],
  },
  dark: {
    seed: 3, blend: 'screen', fade: [[0, 1], [0.55, 0.6], [1, 0.15]], bloom: 0, grain: 0, layers: [
      ['#1d2a8a', '#2433db', 0.9, 6, [260, 460], [600, 1750], [-150, 500]],
      ['#2433db', '#3e54ff', 0.55, 6, [160, 320], [800, 1700], [-120, 340]],
      ['#3e54ff', '#7e90ff', 0.35, 4, [90, 200], [1100, 1650], [-100, 200]],
      ['#1b2466', '#2433db', 0.6, 3, [200, 340], [-150, 500], [700, 1100]],
    ],
  },
};

let washN = 0;
export function paintWash(el: HTMLElement) {
  const cfg = WASH[el.dataset.wash || 'hero'] || WASH.hero, r = rng(cfg.seed), id = 'wc' + washN++;
  const W = 1600, H = 1000, lerp = (a: number, b: number) => a + (b - a) * r();
  let defs = `<linearGradient id="${id}base" x1="0" y1="0" x2=".55" y2="1">${(cfg.base || []).map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient><linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1">${cfg.fade.map(([o, a]) => `<stop offset="${o}" stop-color="#fff" stop-opacity="${a}"/>`).join('')}</linearGradient>
    <mask id="${id}m" maskContentUnits="userSpaceOnUse"><rect width="${W}" height="${H}" fill="url(#${id}f)"/></mask>
    <radialGradient id="${id}g"><stop offset="0" stop-color="#fff" stop-opacity=".78"/><stop offset=".55" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="${id}k" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="${cfg.seed + 9}"/><feColorMatrix values="0 0 0 0 .08  0 0 0 0 .14  0 0 0 0 .55  0 0 0 -3 1.55"/></filter>`;
  let body = '';
  if (cfg.base) body += `<rect width="${W}" height="${H}" fill="url(#${id}base)"/>`;
  cfg.layers.forEach((L, i) => {
    const [fill, rim, op, n, [r0, r1], [x0, x1], [y0, y1]] = L;
    defs += `<filter id="${id}l${i}" x="-35%" y="-35%" width="170%" height="170%">
      <feTurbulence type="fractalNoise" baseFrequency=".0035 .0055" numOctaves="3" seed="${cfg.seed * 13 + i}" result="a"/>
      <feDisplacementMap in="SourceGraphic" in2="a" scale="${210 - i * 18}" xChannelSelector="R" yChannelSelector="G" result="b"/>
      <feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="${cfg.seed + i * 5}" result="c"/>
      <feDisplacementMap in="b" in2="c" scale="16" xChannelSelector="R" yChannelSelector="G" result="e"/>
      <feGaussianBlur in="e" stdDeviation="${Math.max(6, 16 - i * 2.4)}"/></filter>`;
    let g = '';
    for (let k = 0; k < n; k++) {
      const rx = lerp(r0, r1), ry = rx * lerp(0.5, 0.9);
      g += `<path d="${blob(r, lerp(x0, x1), lerp(y0, y1), rx, ry)}"/>`;
    }
    body += `<g filter="url(#${id}l${i})" fill="${fill}" fill-opacity="${op}" stroke="${rim}" stroke-opacity="${op * 0.4}" stroke-width="5" style="mix-blend-mode:${cfg.blend}">${g}</g>`;
  });
  if (cfg.bloom) {
    defs += `<filter id="${id}b" x="-50%" y="-50%" width="200%" height="200%"><feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="2" seed="${cfg.seed + 2}"/><feDisplacementMap in="SourceGraphic" scale="40" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation="9"/></filter>`;
    let g = '';
    for (let k = 0; k < cfg.bloom; k++) { const rx = lerp(18, 70); g += `<path d="${blob(r, lerp(0, W), lerp(-20, 380), rx, rx * lerp(0.6, 1))}"/>`; }
    body += `<g filter="url(#${id}b)" fill="#fff" fill-opacity=".16" stroke="#9fb6ff" stroke-opacity=".18" stroke-width="3">${g}</g>`;
  }
  if (cfg.grain) body += `<rect width="${W}" height="${H}" filter="url(#${id}k)" opacity="${cfg.grain}" style="mix-blend-mode:multiply"/>`;
  const glow = cfg.glow ? `<ellipse cx="${W / 2}" cy="${H * 0.54}" rx="${W * 0.36}" ry="${H * 0.3}" fill="url(#${id}g)"/>` : '';
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMin slice"><defs>${defs}</defs><g mask="url(#${id}m)">${body}</g>${glow}</svg>`;
}

/** hero background; returns a cleanup function */
export function paintStreaks(el: HTMLElement, reduce: boolean) {
  el.innerHTML = '<div class="mesh"><i></i><i></i><i></i><i></i></div><canvas class="field"></canvas><div class="field__glow"></div>';
  el.classList.add('wash--field');
  const cv = el.querySelector('canvas')!, ctx = cv.getContext('2d')!, R = rng(23);
  const LANES = 46, Y0 = 0.5, Y1 = 0.97;
  let Wd = 0, Hd = 0, last = 0, run = false, boost = 1, tb = 1, py = -1, raf = 0, bt = 0;
  type Streak = { x: number; len: number; v: number; green: boolean };
  const lanes = Array.from({ length: LANES }, (_, i) => {
    const k = i / (LANES - 1), edge = Math.sin(Math.PI * k);
    return { k, a: 0.05 + 0.1 * edge, streaks: Array.from({ length: 1 + Number(R() < 0.55) }, (): Streak => ({ x: R() * 1.4 - 0.2, len: 60 + R() * 220, v: 0.06 + R() * 0.22, green: R() < 0.1 })) };
  });
  function size() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    Wd = el.clientWidth; Hd = el.clientHeight;
    cv.width = Math.round(Wd * dpr); cv.height = Math.round(Hd * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function draw() {
    ctx.clearRect(0, 0, Wd, Hd);
    lanes.forEach((l) => {
      const y = Math.round(Hd * (Y0 + (Y1 - Y0) * l.k)) + 0.5, near = py < 0 ? 0 : Math.max(0, 1 - Math.abs(y - py) / 90);
      const lg = ctx.createLinearGradient(0, 0, Wd, 0);
      lg.addColorStop(0, 'rgba(62,84,255,0)'); lg.addColorStop(0.15, `rgba(62,84,255,${l.a + near * 0.1})`);
      lg.addColorStop(0.85, `rgba(62,84,255,${l.a + near * 0.1})`); lg.addColorStop(1, 'rgba(62,84,255,0)');
      ctx.strokeStyle = lg; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(Wd, y); ctx.stroke();
      l.streaks.forEach((s) => {
        const hx = s.x * Wd, tx = hx - s.len, edgeFade = Math.min(1, Math.max(0, Math.min(s.x, 1 - s.x) * 6 + 0.2));
        const g = ctx.createLinearGradient(tx, 0, hx, 0), c = s.green ? '34,176,38' : '36,51,219';
        g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(1, `rgba(${c},${((s.green ? 0.9 : 0.55) + near * 0.3) * edgeFade})`);
        ctx.strokeStyle = g; ctx.lineWidth = s.green ? 2.2 : 1.6; ctx.beginPath(); ctx.moveTo(tx, y); ctx.lineTo(hx, y); ctx.stroke();
        if (s.green) { ctx.fillStyle = `rgba(91,210,95,${0.9 * edgeFade})`; ctx.beginPath(); ctx.arc(hx, y, 2.6, 0, Math.PI * 2); ctx.fill(); }
      });
    });
  }
  function frame(now: number) {
    if (!run) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    boost += (tb - boost) * 0.06;
    lanes.forEach((l) => l.streaks.forEach((s) => {
      s.x += s.v * dt * boost;
      if (s.x > 1.25) { s.x = -0.2 - R() * 0.3; s.len = 60 + R() * 220; s.v = 0.06 + R() * 0.22; s.green = R() < 0.1; }
    }));
    draw(); raf = requestAnimationFrame(frame);
  }
  const onResize = () => { size(); draw(); };
  size(); draw();
  window.addEventListener('resize', onResize);
  if (reduce) return () => window.removeEventListener('resize', onResize);

  const host = el.closest('section')!;
  const onMove = (e: PointerEvent) => {
    const b = el.getBoundingClientRect(); py = e.clientY - b.top; tb = 1.9;
    clearTimeout(bt); bt = window.setTimeout(() => { tb = 1; }, 400);
  };
  const onLeave = () => { py = -1; tb = 1; };
  host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerleave', onLeave);
  const go = (on: boolean) => {
    if (on && !run) { run = true; last = 0; raf = requestAnimationFrame(frame); } else if (!on) { run = false; cancelAnimationFrame(raf); }
  };
  let vis = true;
  const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; go(vis && !document.hidden); });
  io.observe(host);
  const onVis = () => go(vis && !document.hidden);
  document.addEventListener('visibilitychange', onVis);
  return () => {
    go(false); io.disconnect(); clearTimeout(bt);
    window.removeEventListener('resize', onResize);
    host.removeEventListener('pointermove', onMove); host.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('visibilitychange', onVis);
  };
}
