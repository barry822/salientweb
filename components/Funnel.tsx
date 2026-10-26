'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Mark } from './Mark';
import type { FunnelScene, TierAnchor } from './funnelScene';

/* "How we fill your calendar": a 3D funnel (three.js) stays pinned while the five
   step cards scroll past; the tier for the card being read lights up. Without
   WebGL the funnel falls back to flat CSS tiers; the cards work either way. */

type Step = { tier: string; url: string; title: string; body: string; visual: ReactNode };

const STEPS: Step[] = [
  {
    tier: 'Target list', url: 'salient / target accounts', title: 'Pick the right companies.',
    body: 'We agree on who you sell to: the industry, company size, city and the person who signs. That becomes your target list.',
    visual: (
      <div className="icp">
        <div className="icp__row"><span>Industry</span><em>Logistics</em><em>Fintech</em><em>SaaS</em></div>
        <div className="icp__row"><span>Company size</span><em>50 to 500</em></div>
        <div className="icp__row"><span>Geography</span><em>Bengaluru</em><em>Mumbai</em><em>NCR</em></div>
        <div className="icp__row"><span>Buyer role</span><em>VP Ops</em><em>CFO</em><em>Founder</em></div>
        <div className="icp__out"><Mark /><b data-to="2140" className="icpCount">2,140</b><span>companies on your target list</span></div>
      </div>
    ),
  },
  {
    tier: 'Ready to buy', url: 'salient / ai engine', title: 'Find who is ready to buy.',
    body: 'We check every company on the list against our database and live signals like hiring, funding and web activity. The ones showing intent go first.',
    visual: (
      <div className="eng">
        <ul className="eng__in"><li>Internal database</li><li>Hiring and funding</li><li>Web and tech signals</li><li>Intent activity</li></ul>
        <div className="eng__core"><Mark /><b>Classification layer</b><span>fit, intent, timing</span></div>
        <ul className="eng__out"><li className="a"><b>Tier A</b>reach now</li><li className="b"><b>Tier B</b>nurture</li><li className="c"><b>Tier C</b>park</li></ul>
      </div>
    ),
  },
  {
    tier: 'Reached', url: 'salient / outreach sequence', title: 'Reach out everywhere.',
    body: 'Each buyer hears from you by call, email and LinkedIn over a couple of weeks, so they hear from you more than once, on the channel they answer.',
    visual: (
      <div className="seq">
        <div className="seq__days"><span /><span>Day 1</span><span>Day 3</span><span>Day 5</span><span>Day 8</span></div>
        <div className="seq__lane"><span>Call</span><i style={{ '--c': 1 } as CSSProperties} /><i className="off" /><i className="off" /><i style={{ '--c': 4 } as CSSProperties} /></div>
        <div className="seq__lane"><span>Email</span><i className="off" /><i style={{ '--c': 2 } as CSSProperties} /><i className="off" /><i style={{ '--c': 5 } as CSSProperties} /></div>
        <div className="seq__lane"><span>LinkedIn</span><i className="off" /><i className="off" /><i style={{ '--c': 3 } as CSSProperties} /><i className="off" /></div>
        <p className="seq__reply"><Mark />Replied on LinkedIn, day 5</p>
      </div>
    ),
  },
  {
    tier: 'Qualified', url: 'salient / qualifying call', title: 'Call and qualify.',
    body: "When a buyer responds, we talk to them and check them against your criteria. Anyone who doesn't fit stops here.",
    visual: (
      <ol className="conv">
        <li><b>Call</b><span>Lead picks up</span></li>
        <li><b>Qualify</b><span>Your criteria checked</span></li>
        <li><b>Decision-maker?</b><span>Yes</span></li>
        <li><b>Real need this quarter?</b><span>Yes</span></li>
        <li className="end"><b>Passes your criteria</b><span>Ready to book</span></li>
      </ol>
    ),
  },
  {
    tier: 'Meetings', url: 'salient / your calendar', title: 'Qualified meetings.',
    body: 'The meeting lands on your calendar with notes on the buyer and what they need. You show up and close.',
    visual: (
      <ul className="mtg">
        <li><time>Tue, 11:00</time><b>Head of Ops, 3PL company</b><span>Needs: route planning, 40 trucks</span></li>
        <li><time>Wed, 3:00</time><b>CFO, NBFC</b><span>Needs: collections tooling this quarter</span></li>
        <li><time>Thu, 9:00</time><b>Founder, B2B SaaS</b><span>Needs: pipeline for India launch</span></li>
        <li className="tot"><Mark /><b>Booked on your calendar</b><span>You close</span></li>
      </ul>
    ),
  },
];

export default function Funnel() {
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<'flat' | '3d'>('flat');
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const labelRefs = useRef<(HTMLLIElement | null)[]>([]);
  const sceneRef = useRef<FunnelScene | null>(null);
  const activeRef = useRef(0);

  /* 3D scene: loaded only in the browser, only when WebGL is available */
  useEffect(() => {
    let cancelled = false, visible = false, scene: FunnelScene | null = null, io: IntersectionObserver | null = null;
    const onVis = () => { if (document.hidden) scene?.stop(); else if (visible) scene?.start(); };
    import('./funnelScene').then(({ FunnelScene, webglAvailable }) => {
      if (cancelled || !canvasRef.current || !webglAvailable()) return;
      try {
        scene = new FunnelScene(canvasRef.current, {
          reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          compact: canvasRef.current.clientWidth < 520,
          onLayout: (anchors: TierAnchor[]) => anchors.forEach((a, i) => {
            const li = labelRefs.current[i];
            if (li) { li.style.setProperty('--x', `${a.x}px`); li.style.setProperty('--y', `${a.y}px`); }
          }),
        });
      } catch {
        return;   // WebGL failed to start: keep the flat funnel
      }
      sceneRef.current = scene;
      scene.setFocus(activeRef.current + 0.5);
      setMode('3d');
      io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !document.hidden) scene!.start(); else scene!.stop();
      });
      io.observe(sectionRef.current!);
      document.addEventListener('visibilitychange', onVis);
    });
    return () => {
      cancelled = true;
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []);

  /* the reading line: mid-screen on desktop; on phones just under the funnel
     where it sits once pinned (not where it happens to be before it pins) */
  const readingLine = () => {
    const stage = stageRef.current!;
    if (!window.matchMedia('(max-width: 980px)').matches) return window.innerHeight * 0.5;
    return (parseFloat(getComputedStyle(stage).top) || 0) + stage.offsetHeight + 80;
  };

  /* scroll: which step is being read, as a continuous position (0..5) */
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const icp = sectionRef.current?.querySelector<HTMLElement>('.icpCount');
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
      const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
      if (!cards.length || !stageRef.current) return;
      const line = readingLine();
      let f = 0;
      cards.forEach((c, i) => {
        const top = c.getBoundingClientRect().top;
        if (top > line) return;
        const next = cards[i + 1]?.getBoundingClientRect().top ?? top + c.offsetHeight * 1.4;
        f = i + Math.min(1, (line - top) / Math.max(1, next - top));
      });
      sceneRef.current?.setFocus(f);
      const a = Math.min(STEPS.length - 1, Math.floor(f));
      if (a !== activeRef.current) { activeRef.current = a; setActive(a); }
      const sec = sectionRef.current!.getBoundingClientRect();
      if (sec.top < window.innerHeight * 0.6 && sec.bottom > 0) countIcp();
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);

  /* tier labels jump to their step */
  const goTo = (i: number) => {
    const card = cardRefs.current[i];
    if (!card || !stageRef.current) return;
    const line = readingLine();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: window.scrollY + card.getBoundingClientRect().top - line + 24, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <section className={`funnel dark funnel--${mode}`} id="how" ref={sectionRef}>
      <div className="wrap funnel__g">
        <header className="funnel__head">
          <h2>How we fill your calendar.</h2>
          <p>Five steps, from a list of companies to a meeting on your calendar. Every lead runs through the same funnel, and only the ones that fit come out the bottom.</p>
        </header>

        <div className="funnel__stage" ref={stageRef}>
          <div className="funnel__canvas" ref={canvasRef} />
          <ol className="funnel__tiers" aria-label="The five steps">
            {STEPS.map((s, i) => (
              <li key={s.tier} ref={(el) => { labelRefs.current[i] = el; }} className={i === active ? 'on' : i < active ? 'done' : ''}
                style={{ '--w': `${100 - i * 13}%` } as CSSProperties}>
                <button type="button" onClick={() => goTo(i)} aria-current={i === active ? 'step' : undefined}>
                  <span>0{i + 1}</span>{s.tier}
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="funnel__steps">
          {STEPS.map((s, i) => (
            <article key={s.url} className={`fstep${i === active ? ' on' : ''}`} ref={(el) => { cardRefs.current[i] = el; }}>
              <div className="box__bar"><i /><i /><i /><span>{s.url}</span></div>
              <div className={`sp${i === active ? ' on' : ''}`}>
                <div className="sp__t">
                  <span className="sp__n">Step {i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
                {s.visual}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
