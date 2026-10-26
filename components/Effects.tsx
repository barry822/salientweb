'use client';

import { useEffect } from 'react';

/* Page-wide effects that work directly on the server-rendered markup: hero
   counters, the filling calendar, the "pay for outcomes" invoice, nav theme,
   progress rail, parallax, case-study counters and the "three ways" cards.
   (The funnel and the booking form are their own components.) */
export default function Effects() {
  useEffect(() => {
    const d = document, w = window;
    const reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $ = <T extends Element = HTMLElement>(s: string, c: ParentNode = d) => c.querySelector(s) as T | null;
    const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = d) => Array.from(c.querySelectorAll(s)) as T[];
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => { timers.push(w.setTimeout(fn, ms)); };
    const cleanups: (() => void)[] = [];

    const fmtN = (v: number, dec = 0) => v.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    function countUp(el: HTMLElement, to: number, ms: number, dec = 0, suf = '') {
      if (reduce) { el.textContent = fmtN(to, dec) + suf; return; }
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmtN(to * e, dec) + suf;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    /* The HTML carries the final figures (for search engines and no-JS visitors);
       zero the ones that are about to count up. */
    if (!reduce) $$('#engine [data-to], .case__r [data-to]').forEach((el) => { el.textContent = '0'; });

    /* hero: pipeline engine narrows */
    const engRows = $$('#engine .engine__rows li');
    later(() => {
      engRows.forEach((li, k) => later(() => {
        ($('i', li) as HTMLElement).style.width = li.dataset.w + '%';
        const b = $('b', li)!;
        countUp(b, +b.dataset.to!, 1100);
      }, reduce ? 0 : k * 220));
    }, reduce ? 0 : 500);

    /* not an agency: calendar fills, revenue climbs */
    const calGrid = $('#calGrid');
    if (calGrid) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], times = ['9', '11', '1', '3', '5'];
      let html = '<span></span>';
      days.forEach((x) => { html += `<span class="d">${x}</span>`; });
      times.forEach((t, r) => {
        html += `<span class="t">${t}</span>`;
        days.forEach((_, c) => { html += `<span class="slot" data-k="${c}-${r}"></span>`; });
      });
      calGrid.innerHTML = html;
      const K: Record<string, [string, string]> = { D: ['Demo', '#2433DB'], Q: ['Qualified', '#1E9E23'], P: ['Proposal', '#12164A'] };
      const M: [number, number, string, string][] = [
        [0,0,'Q','CFO, NBFC'],[1,1,'D','Head of Ops, 3PL'],[2,0,'D','VP Sales, SaaS'],[3,1,'Q','Founder, fintech'],[4,0,'P','COO, logistics'],
        [0,2,'D','IT head, hospital'],[1,3,'P','GM, realty'],[2,2,'Q','Plant head'],[3,3,'D','Growth lead, D2C'],[4,2,'D','CEO, edtech'],
        [0,4,'P','Director, IT services'],[1,0,'Q','VP Ops, retail'],[2,4,'D','CFO, logistics'],[3,0,'P','Founder, SaaS'],[4,4,'Q','Head of sales, B2B'],
        [0,1,'D','Procurement, pharma'],[2,1,'P','CTO, fintech'],[3,4,'D','Ops lead, EV'],[4,3,'Q','Partner, consulting'],[1,4,'D','COO, manufacturing'],
      ];
      const calCount = $('#calCount')!, revVal = $('#revVal')!, line = $('#revLine')!, area = $('#revArea')!;
      const pts = [62];
      const draw = () => {
        const step = 300 / M.length;
        let dd = 'M0 ' + pts[0];
        for (let j = 1; j < pts.length; j++) dd += ` L${(j * step).toFixed(1)} ${pts[j].toFixed(1)}`;
        line.setAttribute('d', dd);
        area.setAttribute('d', `${dd} L${((pts.length - 1) * step).toFixed(1)} 70 L0 70 Z`);
      };
      const add = (m: (typeof M)[number], k: number) => {
        const slot = $(`[data-k="${m[0]}-${m[1]}"]`, calGrid)!;
        const el = d.createElement('span'); el.className = 'm'; el.style.background = K[m[2]][1];
        el.innerHTML = `${K[m[2]][0]}<small>${m[3]}</small>`;
        slot.appendChild(el);
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
        const n = k + 1;
        calCount.textContent = `${n} qualified meeting${n === 1 ? '' : 's'}`;
        revVal.textContent = '₹' + (n * 4.6 + (n > 3 ? n * 0.8 : 0)).toFixed(0) + 'L';
        pts.push(Math.max(6, 62 - n * 2.7 + (n % 3 === 0 ? 2 : 0)));
        draw();
      };
      const fill = () => { if (reduce) M.forEach(add); else M.forEach((m, k) => later(() => add(m, k), k * 260)); };
      const cio = new IntersectionObserver((e) => { if (e[0].isIntersecting) { fill(); cio.disconnect(); } }, { threshold: 0.35 });
      cio.observe($('#cal')!);
      cleanups.push(() => cio.disconnect());
    }

    /* three ways: expand on click */
    $$('.way__top').forEach((b) => {
      const onClick = () => {
        const card = b.parentElement!, open = !card.classList.contains('open');
        card.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
      };
      b.addEventListener('click', onClick);
      cleanups.push(() => b.removeEventListener('click', onClick));
    });

    /* scroll-driven pieces */
    const nav = $('#nav')!, railFill = $('#railFill'), railMark = $('#railMark'), rail = $('.rail');
    const heroMark = $('#heroMark'), hero = $('.hero');
    const fnTrack = $('#fnTrack'), inv = $('#inv'), rows = $$('.inv__rows li'), total = $('#invTotal')!,
      reasons = $$('#reasons p'), invMark = $('#invMark'), invTotalLabel = $('.inv__total span')!;
    const paper = $('#paper')!, inv2 = $('#inv2')!;
    const depthEls = $$('[data-depth]'), heroGrid = $('#heroGrid');
    const darks = $$('.dark');
    let held = false, lastStage = -1, lastY = w.scrollY, dir = 0;

    function holdScroll(ms: number) {
      const stop = (e: Event) => e.preventDefault();
      const keys = (e: KeyboardEvent) => { if ([32, 33, 34, 35, 38, 40].includes(e.keyCode)) e.preventDefault(); };
      w.addEventListener('wheel', stop, { passive: false });
      w.addEventListener('touchmove', stop, { passive: false });
      w.addEventListener('keydown', keys);
      later(() => { w.removeEventListener('wheel', stop); w.removeEventListener('touchmove', stop); w.removeEventListener('keydown', keys); }, ms);
    }
    const fmt = (v: number) => '₹' + v.toFixed(1) + 'L';
    let shown = 4.5, totRaf = 0;
    function animTotal(to: number) {
      cancelAnimationFrame(totRaf);
      if (reduce) { shown = to; total.textContent = to === 0 ? '₹0' : fmt(to); return; }
      const from = shown, t0 = performance.now();
      const f = (t: number) => {
        const k = Math.min(1, (t - t0) / 500), e = 1 - Math.pow(1 - k, 3);
        shown = from + (to - from) * e; total.textContent = shown < 0.05 ? '₹0' : fmt(shown);
        if (k < 1) totRaf = requestAnimationFrame(f);
      };
      totRaf = requestAnimationFrame(f);
    }

    function onScroll() {
      const y = w.scrollY, vh = w.innerHeight, doc = d.documentElement.scrollHeight - vh;
      dir = y > lastY ? 1 : y < lastY ? -1 : dir; lastY = y;

      /* nav theme: dark over dark sections, frosted light elsewhere */
      const overDark = darks.some((s) => { const r = s.getBoundingClientRect(); return r.top <= 72 && r.bottom > 72; });
      nav.classList.toggle('ondark', overDark && y > 20);
      nav.classList.toggle('solid', !overDark);

      /* rail: the Salient arrow climbs as you read, tilts with direction */
      if (rail && railMark && railFill) {
        const p = doc > 0 ? Math.min(1, Math.max(0, y / doc)) : 0;
        railFill.style.height = p * 100 + '%';
        railMark.style.transform = `translateY(${-p * (rail.clientHeight - 23)}px) rotate(${dir < 0 ? 180 : 0}deg)`;
      }

      /* hero mark drifts upward */
      if (heroMark && hero && !reduce) {
        const hr = hero.getBoundingClientRect();
        if (hr.bottom > 0) heroMark.style.transform = `translateY(${-Math.max(0, -hr.top) * 0.55}px)`;
      }

      /* invoice: headcount lines get struck out, then the Salient version flips in */
      if (fnTrack && inv) {
        const tr = fnTrack.getBoundingClientRect();
        const prog = Math.min(1, Math.max(0, -tr.top / (tr.height - vh)));
        const n = rows.length, stage = Math.min(n + 1, Math.floor(Math.min(1, prog / 0.58) * (n + 1.6)));
        if (stage !== lastStage) {
          lastStage = stage;
          let v = 0;
          rows.forEach((r, k) => {
            r.classList.toggle('cut', k < stage);
            r.classList.toggle('gone', stage > n);
            if (k >= stage) v += parseFloat(r.dataset.v!);
          });
          const done = stage > n;
          inv.classList.toggle('done', done);
          animTotal(v);
          invTotalLabel.textContent = stage === 0 ? 'You pay for headcount' : 'Still paying for headcount';
          paper.classList.toggle('flip', done); inv2.setAttribute('aria-hidden', String(!done));
          if (done && !held && !reduce) { held = true; holdScroll(1100); }
          reasons.forEach((r, k) => r.classList.toggle('on', k === Math.min(stage, reasons.length - 1)));
        }
        if (invMark) invMark.style.transform = `translateY(${-prog * 10}px)`;
      }

      /* depth: gentle parallax on panels and the hero floor */
      if (!reduce && w.innerWidth > 980) {
        depthEls.forEach((el) => {
          const r = el.getBoundingClientRect(), c = r.top + r.height / 2 - vh / 2;
          el.style.transform = `translateY(${(c * -parseFloat(el.dataset.depth!)).toFixed(1)}px)`;
        });
        if (heroGrid) heroGrid.style.backgroundPosition = `0 ${(y * 0.35).toFixed(1)}px`;
      }
    }
    let ticking = false;
    const onScrollRaf = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); } };
    w.addEventListener('scroll', onScrollRaf, { passive: true });
    w.addEventListener('resize', onScroll);
    cleanups.push(() => { w.removeEventListener('scroll', onScrollRaf); w.removeEventListener('resize', onScroll); });
    onScroll();

    /* case-study counters */
    const counters = $$('.count');
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const el = e.target as HTMLElement;
        countUp(el, parseFloat(el.dataset.to!), 1400, +(el.dataset.dec || 0), el.dataset.suf || '');
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => io.observe(c));
    cleanups.push(() => io.disconnect());

    const yr = $('#year'); if (yr) yr.textContent = String(new Date().getFullYear());

    return () => { timers.forEach(clearTimeout); cleanups.forEach((f) => f()); };
  }, []);

  return null;
}
