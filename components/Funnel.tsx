'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

/* "How we fill your calendar": a flat funnel that fills tier by tier as you
   scroll through the five steps beside it. The funnel's shape is built here
   (so it's in the page's HTML); scrolling sets how far it's filled. */

type Step = { tier: string; title: string; body: string; visual: ReactNode };

const STEPS: Step[] = [
  {
    tier: 'Target list', title: 'Pick the right companies.',
    body: 'We agree on who you sell to: the industry, company size, city and the person who signs. That becomes your target list.',
    visual: (
      <>
        <dl className="lf-icp">
          <div><dt>Industry</dt><dd><em>Logistics</em><em>Fintech</em><em>SaaS</em></dd></div>
          <div><dt>Company size</dt><dd><em>50 to 500</em></dd></div>
          <div><dt>Geography</dt><dd><em>Bengaluru</em><em>Mumbai</em><em>NCR</em></dd></div>
          <div><dt>Buyer role</dt><dd><em>VP Ops</em><em>CFO</em><em>Founder</em></dd></div>
        </dl>
        <p className="lf-out"><b className="icpCount" data-to="2140">2,140</b> companies on your target list</p>
      </>
    ),
  },
  {
    tier: 'Ready to buy', title: 'Find who is ready to buy.',
    body: 'We check every company on the list against our database and live signals like hiring, funding and web activity. The ones showing intent go first.',
    visual: (
      <>
        <ul className="lf-signals"><li>Internal database</li><li>Hiring and funding</li><li>Web and tech signals</li><li>Intent activity</li></ul>
        <p className="lf-core"><b>Classification layer</b> fit, intent, timing</p>
        <ul className="lf-tiers"><li className="a"><b>Tier A</b>reach now</li><li className="b"><b>Tier B</b>nurture</li><li className="c"><b>Tier C</b>park</li></ul>
      </>
    ),
  },
  {
    tier: 'Reached', title: 'Reach out everywhere.',
    body: 'Each buyer hears from you by call, email and LinkedIn over a couple of weeks, so they hear from you more than once, on the channel they answer.',
    visual: (
      <div className="lf-seq">
        <div className="lf-seq__row lf-seq__days"><span /><span>Day 1</span><span>Day 3</span><span>Day 5</span><span>Day 8</span></div>
        {([['Call', [1, 0, 0, 4]], ['Email', [0, 2, 0, 5]], ['LinkedIn', [0, 0, 3, 0]]] as const).map(([ch, dots]) => (
          <div className="lf-seq__row" key={ch}>
            <span>{ch}</span>
            {dots.map((c, k) => <i key={k} className={c ? '' : 'off'} style={c ? ({ '--c': c } as CSSProperties) : undefined} />)}
          </div>
        ))}
        <p className="lf-reply">Replied on LinkedIn, day 5</p>
      </div>
    ),
  },
  {
    tier: 'Qualified', title: 'Call and qualify.',
    body: "When a buyer responds, we talk to them and check them against your criteria. Anyone who doesn't fit stops here.",
    visual: (
      <ol className="lf-checks">
        <li><b>Call</b><span>Lead picks up</span></li>
        <li><b>Qualify</b><span>Your criteria checked</span></li>
        <li><b>Decision-maker?</b><span>Yes</span></li>
        <li><b>Real need this quarter?</b><span>Yes</span></li>
        <li className="end"><b>Passes your criteria</b><span>Ready to book</span></li>
      </ol>
    ),
  },
  {
    tier: 'Meetings', title: 'Qualified meetings.',
    body: 'The meeting lands on your calendar with notes on the buyer and what they need. You show up and close.',
    visual: (
      <>
        <ul className="lf-mtg">
          <li><time>Tue, 11:00</time><b>Head of Ops, 3PL company</b><span>Needs: route planning, 40 trucks</span></li>
          <li><time>Wed, 3:00</time><b>CFO, NBFC</b><span>Needs: collections tooling this quarter</span></li>
          <li><time>Thu, 9:00</time><b>Founder, B2B SaaS</b><span>Needs: pipeline for India launch</span></li>
        </ul>
        <p className="lf-booked"><b>Booked on your calendar.</b> You close.</p>
      </>
    ),
  },
];

/* funnel geometry (SVG units): five tiers from `top` to `bot`, then a spout */
const TONE = ['#8ea3ff', '#7089ff', '#5370f8', '#3049e2', '#22b026'];
const VB = { w: 440, h: 580, top: 30, bot: 500, tw: 420, bw: 64, gap: 10, spout: 540, sw: 30 };
const BH = (VB.bot - VB.top) / STEPS.length, CX = VB.w / 2;
const halfAt = (y: number) => y <= VB.bot
  ? (VB.tw + ((VB.bw - VB.tw) * (y - VB.top)) / (VB.bot - VB.top)) / 2
  : (VB.bw + ((VB.sw - VB.bw) * (y - VB.bot)) / (VB.spout - VB.bot)) / 2;
/** flat trapezoid from y0 to y1 with softly rounded corners */
function slice(y0: number, y1: number, r = 7) {
  const P = [[CX - halfAt(y0), y0], [CX + halfAt(y0), y0], [CX + halfAt(y1), y1], [CX - halfAt(y1), y1]];
  const at = (p: number[], q: number[], t: number) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  let s = '';
  P.forEach((p, i) => {
    const a = P[(i + 3) % 4], b = P[(i + 1) % 4];
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const k = Math.min(r, la / 2, lb / 2), s0 = at(p, a, k / la), s1 = at(p, b, k / lb);
    s += `${i ? 'L' : 'M'}${s0[0].toFixed(1)} ${s0[1].toFixed(1)}Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${s1[0].toFixed(1)} ${s1[1].toFixed(1)}`;
  });
  return s + 'Z';
}
const BANDS = STEPS.map((_, i) => {
  const y0 = VB.top + i * BH + (i ? VB.gap / 2 : 0), y1 = VB.top + (i + 1) * BH - VB.gap / 2;
  return { y0, y1, mid: (y0 + y1) / 2, d: slice(y0, y1) };
});
const SPOUT = slice(VB.bot + VB.gap / 2, VB.spout, 4);

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default function Funnel() {
  const sectionRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const w = window, reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const how = sectionRef.current!, svg = svgRef.current!;
    const arts = Array.from(how.querySelectorAll<HTMLElement>('.lfs'));
    const rail = Array.from(how.querySelectorAll<HTMLLIElement>('.lf__rail li'));
    const clip = svg.querySelector('#fzClipR')!, pool = svg.querySelector<SVGElement>('.fz-pool')!;
    const lbl = Array.from(svg.querySelectorAll('.fz-lbl')), halo = svg.querySelector('#fzHalo')!, haloP = svg.querySelector('#fzHaloP')!;
    let level = VB.top, active = -1, inView = false, raf = 0, icpDone = false;

    // the 2,140 counts up the first time the section is reached
    const icp = how.querySelector<HTMLElement>('.icpCount');
    if (icp && !reduce) icp.textContent = '0';
    const countIcp = () => {
      if (icpDone || !icp) return;
      icpDone = true;
      if (reduce) { icp.textContent = '2,140'; return; }
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / 1200);
        icp.textContent = Math.round(2140 * (1 - Math.pow(1 - k, 3))).toLocaleString('en-IN');
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const progress = () => {   // 0 .. 5: how far through the five steps
      const vh = w.innerHeight;
      return arts.reduce((p, a) => { const b = a.getBoundingClientRect(); return p + clamp((vh * 0.62 - b.top) / b.height); }, 0);
    };
    const fill = (force = false) => {
      const p = progress(), i = Math.min(STEPS.length - 1, Math.floor(p)), b = BANDS[i];
      const tgt = p >= STEPS.length - 0.55 ? VB.spout + 10 : p <= 0 ? VB.top - 10 : b.y0 + (p - i) * (b.y1 - b.y0);
      level = reduce || force ? tgt : level + (tgt - level) * 0.1;
      if (Math.abs(tgt - level) < 0.2) level = tgt;
      clip.setAttribute('height', Math.max(0, level).toFixed(1));
      pool.style.opacity = level >= VB.spout ? '1' : '0';
      BANDS.forEach((bd, k) => lbl[k].classList.toggle('on', level > bd.mid + 6));
    };
    const setStep = () => {
      const vh = w.innerHeight;
      let i = 0;
      arts.forEach((a, k) => { if (a.getBoundingClientRect().top < vh * 0.55) i = k; });
      if (i === active) return;
      active = i;
      arts.forEach((a, k) => { a.classList.toggle('on', k === i); a.classList.toggle('past', k < i); });
      rail.forEach((li, k) => {
        li.className = k === i ? 'on' : k < i ? 'done' : '';
        const b = li.querySelector('button')!;
        if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      haloP.setAttribute('d', BANDS[i].d);
      haloP.setAttribute('fill', i === STEPS.length - 1 ? '#22b026' : '#3e54ff');
      halo.setAttribute('opacity', '.45');
    };

    const loop = () => { if (!inView) return; fill(); raf = requestAnimationFrame(loop); };
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) raf = requestAnimationFrame(loop); });
    io.observe(how);

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        setStep();
        const b = how.getBoundingClientRect();
        if (b.top < w.innerHeight * 0.6 && b.bottom > 0) countIcp();
        if (reduce || !inView) fill(true);
      });
    };
    w.addEventListener('scroll', onScroll, { passive: true });
    w.addEventListener('resize', onScroll);
    fill(true); setStep(); onScroll();

    // step markers jump to their step
    const clicks = rail.map((li, k) => {
      const fn = () => w.scrollTo({ top: w.scrollY + arts[k].getBoundingClientRect().top - 130, behavior: reduce ? 'auto' : 'smooth' });
      li.querySelector('button')!.addEventListener('click', fn);
      return () => li.querySelector('button')!.removeEventListener('click', fn);
    });

    return () => {
      io.disconnect(); cancelAnimationFrame(raf);
      w.removeEventListener('scroll', onScroll); w.removeEventListener('resize', onScroll);
      clicks.forEach((off) => off());
    };
  }, []);

  return (
    <section className="lf" id="how" ref={sectionRef}>
      <div className="wash" data-wash="soft" aria-hidden="true" />
      <div className="wrap lf__intro"><p className="eyebrow">How it works</p><h2>How we fill your calendar.</h2></div>
      <div className="lf__bar">
        <div className="wrap">
          <ol className="lf__rail" aria-label="The five steps">
            {STEPS.map((s, i) => (
              <li key={s.tier} className={i === 0 ? 'on' : ''}>
                <button type="button" aria-current={i === 0 ? 'step' : undefined}><span>0{i + 1}</span><b>{s.tier}</b></button>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="wrap lf__g">
        <div className="lf__funnel" id="funnel" aria-hidden="true">
          <svg ref={svgRef} viewBox={`0 0 ${VB.w} ${VB.h}`} preserveAspectRatio="xMidYMid meet" role="presentation">
            <defs>
              <radialGradient id="fzPool"><stop offset="0" stopColor="#5bd25f" stopOpacity=".5" /><stop offset="1" stopColor="#5bd25f" stopOpacity="0" /></radialGradient>
              <filter id="fzGlow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="12" /></filter>
              <clipPath id="fzClip"><rect id="fzClipR" x="0" y="0" width={VB.w} height="0" /></clipPath>
            </defs>
            <ellipse cx={CX} cy={VB.spout + 12} rx="110" ry="22" fill="url(#fzPool)" className="fz-pool" />
            <g id="fzHalo" filter="url(#fzGlow)" opacity="0"><path id="fzHaloP" d="" fill="#3e54ff" /></g>
            {BANDS.map((b) => <path key={b.y0} d={b.d} className="fz-flat" />)}
            <path d={SPOUT} className="fz-flat" />
            <g clipPath="url(#fzClip)">
              {BANDS.map((b, i) => <path key={b.y0} d={b.d} fill={TONE[i]} />)}
              <path d={SPOUT} fill={TONE[4]} />
            </g>
            {BANDS.map((b, i) => (
              <g key={b.y0} className="fz-lbl" data-i={i}>
                <text x={CX} y={b.mid.toFixed(1)}><tspan className="fz-n">0{i + 1}</tspan><tspan dx="7">{STEPS[i].tier}</tspan></text>
              </g>
            ))}
          </svg>
        </div>
        <div className="lf__steps">
          {STEPS.map((s, i) => (
            <article key={s.tier} className={`lfs${i === 0 ? ' on' : ''}`}>
              <p className="lfs__n">Step {i + 1} <span>· {s.tier}</span></p>
              <h3>{s.title}</h3>
              <p className="lfs__body">{s.body}</p>
              <div className="lfs__visual">{s.visual}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
