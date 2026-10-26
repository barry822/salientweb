'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { FunnelParticles, FunnelShape } from './funnelParticles';

/* "How we fill your calendar": a funnel of light. The screen stays pinned while
   you scroll through five steps; with each step the funnel narrows (wide target
   list at the top, a few meetings at the neck) and the step's content changes
   inside the light. The light is CSS; lead particles falling through it are
   three.js (loaded only in the browser, skipped without WebGL). */

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

/* funnel width at the mouth, the shoulder and the neck for each step, as a share of
   the screen width: it narrows step by step. On desktop the shoulder sits on the
   straight line (a plain cone); on phones the bowl stays wide where the content is
   and the spout below the shoulder does the narrowing. */
// steps 1-3 shrink 1.15x as much as the original design; steps 4-5 keep their original shrink
const WIDE = { top: [0.9, 0.785, 0.682, 0.602, 0.532], bot: [0.36, 0.291, 0.234, 0.184, 0.144], shoulder: null, sy: 0.74 };
const NARROW = { top: [1.08, 1.034, 0.988, 0.958, 0.928], shoulder: [1.0, 0.943, 0.885, 0.845, 0.805], bot: [0.5, 0.408, 0.316, 0.246, 0.176], sy: 0.74 };

const clamp = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (x: number) => x * x * (3 - 2 * x);

export default function Funnel() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const particles = useRef<FunnelParticles | null>(null);
  const activeRef = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sticky = stickyRef.current!, track = trackRef.current!;
    let shape: FunnelShape | null = null;

    // the 2,140 on step 1 counts up the first time it's shown
    const icp = sticky.querySelector<HTMLElement>('.icpCount');
    let icpDone = false;
    if (icp && !reduce) icp.textContent = '0';
    const countIcp = () => {
      if (icpDone || !icp) return;
      icpDone = true;
      if (reduce) { icp.textContent = '2,140'; return; }
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / 1200), e = 1 - Math.pow(1 - k, 3);
        icp.textContent = Math.round(2140 * e).toLocaleString('en-IN');
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight, r = track.getBoundingClientRect();
      const progress = clamp(-r.top / Math.max(1, r.height - vh));
      const f = progress * STEPS.length;                       // 0 .. 5 through the steps
      const i = Math.min(STEPS.length - 1, Math.floor(f));
      // narrow towards the next step's width over the last 40% of each step
      const k = i < STEPS.length - 1 ? smooth(clamp((f - i - 0.6) / 0.4)) : 0;
      const w = sticky.clientWidth, h = sticky.clientHeight;
      const set = w < 700 ? NARROW : WIDE;
      const lerp = (a: number[]) => a[i] + (a[Math.min(i + 1, a.length - 1)] - a[i]) * k;
      const topW = Math.min(lerp(set.top) * w, 1240), botW = lerp(set.bot) * w;
      const shoulderW = set.shoulder ? lerp(set.shoulder) * w : topW + (botW - topW) * set.sy;
      const mouthY = headRef.current!.offsetTop + headRef.current!.offsetHeight + 14;
      const neckY = h - (w < 700 ? 44 : 64);
      const green = smooth(clamp((f - 3.55) / 0.45));          // the light turns green for the meetings
      const s = sticky.style;
      s.setProperty('--mouth', `${mouthY}px`); s.setProperty('--neck', `${neckY}px`);
      s.setProperty('--tw', `${topW}px`); s.setProperty('--bw', `${botW}px`);
      s.setProperty('--sw', `${shoulderW}px`); s.setProperty('--sy', `${set.sy * 100}%`);
      s.setProperty('--green', green.toFixed(3));
      shape = { cx: w / 2, mouthY, neckY, poolY: h + 10, topW, botW, shoulderW, shoulderAt: set.sy };
      particles.current?.setShape(shape);

      const a = Math.min(STEPS.length - 1, Math.floor(f + 0.2));   // content swaps as the funnel narrows
      if (a !== activeRef.current) { activeRef.current = a; setActive(a); }
      if (r.top < vh * 0.6 && r.bottom > 0) countIcp();
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();

    // lead particles: three.js, browser only, only with WebGL, only while on screen
    let cancelled = false, visible = false, io: IntersectionObserver | null = null;
    const onVis = () => { if (document.hidden) particles.current?.stop(); else if (visible) particles.current?.start(); };
    import('./funnelParticles').then(({ FunnelParticles, webglAvailable }) => {
      if (cancelled || !canvasRef.current || !webglAvailable()) return;
      try { particles.current = new FunnelParticles(canvasRef.current, reduce); } catch { return; }
      if (shape) particles.current.setShape(shape);
      io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !document.hidden) particles.current?.start(); else particles.current?.stop();
      });
      io.observe(sectionRef.current!);
      document.addEventListener('visibilitychange', onVis);
    });

    return () => {
      cancelled = true;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      particles.current?.dispose();
      particles.current = null;
    };
  }, []);

  /* step markers jump to the middle of their step */
  const goTo = (i: number) => {
    const track = trackRef.current!;
    const top = window.scrollY + track.getBoundingClientRect().top;
    const span = track.offsetHeight - window.innerHeight;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: top + span * ((i + 0.3) / STEPS.length), behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <section className="lf dark" id="how" ref={sectionRef}>
      <div className="lf__track" ref={trackRef}>
        <div className="lf__sticky" ref={stickyRef}>
          <div className="lf__light" aria-hidden="true">
            <div className="lf__halo"><div className="lf__cone lf__cone--halo" /></div>
            <div className="lf__cone lf__cone--blue" />
            <div className="lf__cone lf__cone--green" />
            <div className="lf__mouth" />
            <div className="lf__neck" />
            <div className="lf__pool" />
          </div>
          <div className="lf__canvas" ref={canvasRef} />

          <div className="lf__head wrap" ref={headRef}>
            <h2>How we fill your calendar.</h2>
            <ol className="lf__rail" aria-label="The five steps">
              {STEPS.map((s, i) => (
                <li key={s.tier} className={i === active ? 'on' : i < active ? 'done' : ''}>
                  <button type="button" onClick={() => goTo(i)} aria-current={i === active ? 'step' : undefined}>
                    <span>0{i + 1}</span><b>{s.tier}</b>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          <div className="lf__steps">
            {STEPS.map((s, i) => (
              <article key={s.tier} className={`lfs${i === active ? ' on' : i < active ? ' past' : ''}`}>
                <p className="lfs__n">Step {i + 1} <span>· {s.tier}</span></p>
                <h3>{s.title}</h3>
                <p className="lfs__body">{s.body}</p>
                <div className="lfs__visual">{s.visual}</div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
