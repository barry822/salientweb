'use client';

import { useEffect } from 'react';
import { paintStreaks, paintWash } from './wash';

/* Page-wide effects on the server-rendered markup: background washes, the
   filling calendar, scroll reveals, the "No black box" tool views, the "who runs
   each stage" panel, nav theme, progress rail, the invoice, counters and the
   phone booking bar. (The funnel and the booking form are their own components.) */
export default function Effects() {
  useEffect(() => {
    const d = document, w = window;
    const reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = d) => r.querySelector(s) as T | null;
    const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = d) => Array.from(r.querySelectorAll(s)) as T[];
    const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const fmt = (n: number, dec = 0) => n.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const timers: number[] = [], intervals: number[] = [], cleanups: (() => void)[] = [];
    const later = (fn: () => void, ms: number) => { const t = w.setTimeout(fn, ms); timers.push(t); return t; };
    const on = (t: EventTarget, ev: string, fn: EventListener, opt?: AddEventListenerOptions) => {
      t.addEventListener(ev, fn, opt); cleanups.push(() => t.removeEventListener(ev, fn, opt));
    };
    const observe = (fn: IntersectionObserverCallback, el: Element | null, opt?: IntersectionObserverInit) => {
      if (!el) return null;
      const io = new IntersectionObserver(fn, opt); io.observe(el); cleanups.push(() => io.disconnect()); return io;
    };

    function countUp(el: HTMLElement, to: number, dur: number, dec = 0, suf = '') {
      if (reduce) { el.textContent = fmt(to, dec) + suf; return; }
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)), dec) + suf;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    /* backgrounds: hero light and streaks, soft wash in "How", dark wash in the pilot and contact card */
    const heroWash = $('#heroWash');
    if (heroWash) cleanups.push(paintStreaks(heroWash, reduce));
    $$('[data-wash]').forEach(paintWash);
    ['#pilot', '.cta'].forEach((s) => {
      const host = $(s);
      if (!host || $(':scope > .wash[data-wash="dark"]', host)) return;
      const el = d.createElement('div');
      el.className = 'wash'; el.dataset.wash = 'dark'; el.setAttribute('aria-hidden', 'true');
      host.prepend(el); paintWash(el);
      cleanups.push(() => el.remove());
    });

    /* "What if your calendar looked full": meetings land, pipeline value climbs */
    const grid = $('#calGrid');
    if (grid) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      let h = '<span></span>';
      days.forEach((x) => { h += `<span class="d">${x}</span>`; });
      ['9', '11', '1', '3', '5'].forEach((t, s) => { h += `<span class="t">${t}</span>`; days.forEach((_, k) => { h += `<span class="slot" data-k="${k}-${s}"></span>`; }); });
      grid.innerHTML = h;
      const kind: Record<string, [string, string]> = { D: ['Demo', '#2433DB'], Q: ['Qualified', '#1E9E23'], P: ['Proposal', '#12164A'] };
      const items: [number, number, string, string][] = [[0,0,'Q','CFO, NBFC'],[1,1,'D','Head of Ops, 3PL'],[2,0,'D','VP Sales, SaaS'],[3,1,'Q','Founder, fintech'],[4,0,'P','COO, logistics'],[0,2,'D','IT head, hospital'],[1,3,'P','GM, realty'],[2,2,'Q','Plant head'],[3,3,'D','Growth lead, D2C'],[4,2,'D','CEO, edtech'],[0,4,'P','Director, IT services'],[1,0,'Q','VP Ops, retail'],[2,4,'D','CFO, logistics'],[3,0,'P','Founder, SaaS'],[4,4,'Q','Head of sales, B2B'],[0,1,'D','Procurement, pharma'],[2,1,'P','CTO, fintech'],[3,4,'D','Ops lead, EV'],[4,3,'Q','Partner, consulting'],[1,4,'D','COO, manufacturing']];
      const cnt = $('#calCount')!, rev = $('#revVal')!, line = $('#revLine')!, area = $('#revArea')!, ys = [62];
      const add = (it: (typeof items)[number], i: number) => {
        const slot = $(`[data-k="${it[0]}-${it[1]}"]`, grid)!, m = d.createElement('span');
        m.className = 'm'; m.style.background = kind[it[2]][1]; m.innerHTML = `${kind[it[2]][0]}<small>${it[3]}</small>`;
        slot.appendChild(m); requestAnimationFrame(() => requestAnimationFrame(() => m.classList.add('in')));
        const n = i + 1;
        cnt.textContent = `${n} qualified meeting${n === 1 ? '' : 's'}`;
        rev.textContent = '₹' + (4.6 * n + (n > 3 ? 0.8 * n : 0)).toFixed(0) + 'L';
        ys.push(Math.max(6, 62 - 2.7 * n + 2 * Number(n % 3 === 0)));
        const st = 300 / items.length;
        let p = 'M0 ' + ys[0];
        for (let k = 1; k < ys.length; k++) p += ` L${(k * st).toFixed(1)} ${ys[k].toFixed(1)}`;
        line.setAttribute('d', p); area.setAttribute('d', `${p} L${((ys.length - 1) * st).toFixed(1)} 70 L0 70 Z`);
      };
      const io = observe((e, o) => {
        if (!e[0].isIntersecting) return;
        items.forEach((it, i) => (reduce ? add(it, i) : later(() => add(it, i), 260 * i)));
        o.disconnect();
      }, $('#cal'), { threshold: 0.35 });
      void io;
    }

    /* reveal on scroll */
    const rvo = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rvo.unobserve(e.target); } }), { threshold: 0.18 });
    $$('.rv').forEach((e) => (reduce ? e.classList.add('in') : rvo.observe(e)));
    cleanups.push(() => rvo.disconnect());

    /* pipeline dashboard (inside "No black box"): rows narrow and count up */
    const eng = $('#engine');
    if (eng) {
      const rows = $$('.engine__rows li', eng);
      if (!reduce) rows.forEach((li) => { $('b', li)!.textContent = '0'; });
      observe((e, o) => {
        if (!e[0].isIntersecting) return;
        o.disconnect();
        rows.forEach((li, i) => later(() => {
          ($('i', li) as HTMLElement).style.width = li.dataset.w + '%';
          const b = $('b', li)!; countUp(b, +b.dataset.to!, 1100);
        }, reduce ? 0 : 300 + 220 * i));
      }, eng, { threshold: 0.4 });
    }

    /* phones: sticky "Book a call" bar between the hero and the contact section */
    const mcta = $('#mcta'), contactSec = $('#contact');
    const mctaTick = () => { if (!mcta || !contactSec) return; const c = contactSec.getBoundingClientRect(); mcta.classList.toggle('on', w.scrollY > w.innerHeight * 0.8 && c.top > w.innerHeight * 0.9); };
    on(w, 'scroll', mctaTick, { passive: true }); mctaTick();

    /* "No black box": three tool views that rotate every 7 s until one is clicked */
    const rep = $('#report');
    if (rep) {
      const tabs = $$('.rt', rep), panes = $$('.rp', rep), tabWrap = $('.rep__tabs', rep)!;
      let cur = 0, timer = 0, manual = false, repIn = false;
      const restart = (el: HTMLElement) => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; };

      const toast = $('#toast')!;
      const TO = [['Meeting booked', 'CFO, NBFC · Wed, 3:00'], ['Meeting booked', 'Head of Ops, 3PL · Tue, 11:00'], ['Qualified on a call', 'Founder, B2B SaaS · Bengaluru'], ['Replied on LinkedIn', 'VP Sales, fintech · Day 5']];
      let tI = 0, tT = 0;
      const stopToast = () => { clearTimeout(tT); toast.classList.remove('in'); };
      const startToast = () => {
        stopToast(); if (reduce) return;
        const tick = () => {
          const [b, s] = TO[tI++ % TO.length];
          $('b', toast)!.textContent = b; $('span', toast)!.textContent = s; toast.classList.add('in');
          tT = w.setTimeout(() => { toast.classList.remove('in'); tT = w.setTimeout(tick, 700); }, 2400);
        };
        tT = w.setTimeout(tick, 900);
      };

      const icpGrid = $('#icpGrid')!, icpBox = $('.icpm', rep)!, roles = $$('#icpRoles em');
      const SIZES = ['50–100', '100–250', '250–500'], INDS = ['Logistics', 'Fintech', 'SaaS', 'IT services', 'Manufacturing'];
      const CNT = [[180, 240, 150], [120, 210, 190], [260, 220, 90], [110, 130, 80], [40, 70, 50]];
      const FIT = [[0.6, 0.95, 0.8], [0.5, 0.85, 0.9], [0.7, 0.75, 0.4], [0.35, 0.5, 0.45], [0.15, 0.3, 0.25]];
      let gh = '<span></span>' + SIZES.map((s) => `<span class="h">${s}</span>`).join(''), k = 0;
      INDS.forEach((n, r) => {
        gh += `<span class="r">${n}</span>`;
        CNT[r].forEach((c, j) => { const f = FIT[r][j]; gh += `<span class="c${f >= 0.85 ? ' a' : ''}" style="--a:${(0.12 + f * 0.75).toFixed(2)};--k:${k++}">${c}</span>`; });
      });
      icpGrid.innerHTML = gh;
      const cells = $$('.c', icpGrid);
      let iT = 0, sc = 0, icpCounted = false;
      const stopIcp = () => { clearInterval(iT); icpBox.classList.remove('in'); cells.forEach((c) => c.classList.remove('scan')); };
      const startIcp = () => {
        stopIcp(); requestAnimationFrame(() => requestAnimationFrame(() => icpBox.classList.add('in')));
        if (!icpCounted) { icpCounted = true; countUp($('#icpN')!, 2140, 1300); }
        if (reduce) return;
        iT = w.setInterval(() => {
          cells.forEach((c) => c.classList.remove('scan')); cells[sc++ % cells.length].classList.add('scan');
          roles.forEach((e, i) => e.classList.toggle('hl', i === Math.floor(sc / 4) % roles.length));
        }, 240);
      };

      const list = $('#sigList')!;
      const POOL: [string, string, string[], number][] = [['3PL company', 'Bengaluru', ['Hiring 4 SDRs', 'New VP Sales'], 92], ['NBFC', 'Mumbai', ['Raised Series B', 'Pricing page visits'], 88], ['B2B SaaS', 'Bengaluru', ['Hiring Head of Sales'], 76], ['EV charging operator', 'NCR', ['Expanding to 2 cities'], 71], ['IT services firm', 'Pune', ['Moved to a new CRM'], 54], ['D2C brand', 'Mumbai', ['New Head of Growth', 'Hiring'], 83], ['Hospital chain', 'Bengaluru', ['Opening 3 sites'], 79], ['Manufacturer', 'Chennai', ['Evaluating ERP vendors'], 66]];
      const tier = (s: number) => (s >= 80 ? ['A', 'ta'] : s >= 65 ? ['B', 'tb'] : ['C', 'tc']);
      const row = (a: (typeof POOL)[number], fresh = false) => {
        const [t, c] = tier(a[3]);
        return `<li class="${fresh ? 'new' : ''}"><div class="sig__acc"><b>${a[0]}</b><span>${a[1]}</span></div><div class="sig__chips">${a[2].map((x) => `<em>${x}</em>`).join('')}</div><div class="sig__score"><b>${a[3]}<small class="${c}">Tier ${t}</small></b><i style="--s:${a[3]}%"></i></div></li>`;
      };
      list.innerHTML = POOL.slice(0, 5).map((a) => row(a)).join('');
      let pI = 5, sT = 0;
      const stopSig = () => clearInterval(sT);
      const startSig = () => {
        stopSig(); if (reduce) return;
        sT = w.setInterval(() => {
          list.insertAdjacentHTML('afterbegin', row(POOL[pI++ % POOL.length], true));
          const items = $$('li', list);
          items.forEach((li, i) => { if (i) li.classList.remove('new'); });
          if (items.length > 5) items[items.length - 1].remove();
        }, 2600);
      };

      const show = (i: number) => {
        cur = i;
        tabs.forEach((t, n) => { t.classList.toggle('on', n === i); t.setAttribute('aria-selected', String(n === i)); });
        restart($('.rt__bar', tabs[i])!);
        panes.forEach((p, n) => { p.classList.toggle('on', n === i); p.setAttribute('aria-hidden', String(n !== i)); });
        if (i === 0) startToast(); else stopToast();
        if (i === 1) startIcp(); else stopIcp();
        if (i === 2) startSig(); else stopSig();
        clearTimeout(timer);
        if (!manual && repIn && !reduce) timer = w.setTimeout(() => show((cur + 1) % tabs.length), 7000);
      };
      tabs.forEach((t, n) => on(t, 'click', () => { manual = true; tabWrap.classList.add('manual'); show(n); }));
      observe(([e]) => {
        repIn = e.isIntersecting;
        if (repIn) show(cur); else { clearTimeout(timer); stopToast(); stopSig(); clearInterval(iT); }
      }, $('.rep__stage', rep), { threshold: 0.3 });
      cleanups.push(() => { clearTimeout(timer); stopToast(); stopSig(); clearInterval(iT); });
    }

    /* "Three ways": the stage panel shows who runs each stage, cycling through the cards */
    const pv = $('#pv');
    if (pv) {
      const cards = $$('.way'), stages = $$('.pv__st', pv), barS = $('#pvS')!, barY = $('#pvY')!, modeEl = $('#pvMode')!, capEl = $('#pvCap')!, foot = $('#pvFoot')!, waysEl = $('#ways')!;
      const MODES = cards.map((c) => {
        const l = $$('.way__lane span', c);
        const pos = (s: HTMLElement) => ({ left: parseFloat(s.style.left), width: parseFloat(s.style.width), text: s.textContent || '' });
        return { name: $('h3', c)!.textContent || '', cap: $('.way__sit', c)!.textContent || '', s: pos(l[0]), y: pos(l[1]) };
      });
      const FOOT = ['Salient runs <b>__ of 5 stages</b>. Your team takes the meeting.', 'Salient adds pipeline across <b>__ stages</b>, on top of your team.', 'Salient fixes <b>__ stages</b> alongside your team.'];
      cards.forEach((c) => { if (!$('.way__prog', c)) c.insertAdjacentHTML('beforeend', '<i class="way__prog" aria-hidden="true"></i>'); });
      let m = -1, pT = 0, pManual = false, pIn = false;
      const owns = (b: { left: number; width: number }, n: number) => b.left < (n + 1) * 20 - 0.1 && b.left + b.width > n * 20 + 0.1;
      const next = (ms: number) => { clearTimeout(pT); if (!pManual && pIn && !reduce) pT = w.setTimeout(() => setMode((m + 1) % MODES.length), ms); };
      function setMode(i: number) {
        const M = MODES[i];
        let ns = 0;
        barS.style.left = M.s.left + '%'; barS.style.width = M.s.width + '%'; barS.textContent = M.s.text;
        barY.style.left = M.y.left + '%'; barY.style.width = M.y.width + '%'; barY.textContent = M.y.text;
        stages.forEach((st, n) => { const s = owns(M.s, n), y = owns(M.y, n); ns += Number(s); st.className = 'pv__st' + (s && y ? ' sy' : s ? ' s' : y ? ' y' : ''); });
        if (i !== m) {
          modeEl.textContent = M.name; capEl.textContent = M.cap;
          [modeEl, capEl].forEach((e) => { e.classList.remove('sw'); void e.offsetWidth; e.classList.add('sw'); });
        }
        foot.innerHTML = (FOOT[i] || FOOT[0]).replace('__', String(ns));
        m = i;
        cards.forEach((c, n) => { c.classList.toggle('sel', n === i); const p = $('.way__prog', c)!; p.style.animation = 'none'; void p.offsetWidth; p.style.animation = ''; });
        next(5000);
      }
      cards.forEach((c, n) => {
        on($('.way__top', c)!, 'click', () => { pManual = true; waysEl.classList.add('manual'); setMode(n); });
        on(c, 'mouseenter', () => { if (!pManual) { setMode(n); clearTimeout(pT); } });
        on(c, 'mouseleave', () => next(2500));
      });
      observe(([e]) => {
        pIn = e.isIntersecting;
        if (pIn) later(() => setMode(m < 0 ? 0 : m), m < 0 ? 400 : 0); else clearTimeout(pT);
      }, pv, { threshold: 0.35 });
      cleanups.push(() => clearTimeout(pT));
    }

    /* three ways: cards slide in, and open on click */
    const ways = $('#ways');
    observe((e, o) => { if (e[0].isIntersecting) { ways!.classList.add('in'); o.disconnect(); } }, ways, { threshold: 0.25 });
    $$('.way__top').forEach((b) => on(b, 'click', () => {
      const p = b.parentElement!, open = !p.classList.contains('open');
      p.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
    }));

    /* scroll-driven: nav theme, progress rail, hero parallax, the invoice, depth */
    const nav = $('#nav')!, railFill = $('#railFill'), railMark = $('#railMark'), railBox = $('.rail'), hero = $('.hero'),
      fnTrack = $('#fnTrack'), inv = $('#inv'), invRows = $$('.inv__rows li'), invTotal = $('#invTotal')!,
      reasons = $$('#reasons p'), invMark = $('#invMark'), invLbl = $('.inv__total span')!, paper = $('#paper')!, inv2 = $('#inv2')!,
      depth = $$('[data-depth]'), darks = $$('.dark, .pricing');
    let locked = false, cut = -1, lastY = w.scrollY, dir = 0, total = 4.5, raf = 0;
    const money = (v: number) => '₹' + v.toFixed(1) + 'L';
    const tweenTotal = (to: number) => {
      cancelAnimationFrame(raf);
      if (reduce) { total = to; invTotal.textContent = to === 0 ? '₹0' : money(to); return; }
      const from = total, t0 = performance.now();
      const st = (t: number) => {
        const p = Math.min(1, (t - t0) / 500);
        total = from + (to - from) * (1 - Math.pow(1 - p, 3)); invTotal.textContent = total < 0.05 ? '₹0' : money(total);
        if (p < 1) raf = requestAnimationFrame(st);
      };
      raf = requestAnimationFrame(st);
    };
    const onScroll = () => {
      const y = w.scrollY, vh = w.innerHeight, maxY = d.documentElement.scrollHeight - vh;
      dir = y > lastY ? 1 : y < lastY ? -1 : dir; lastY = y;
      const overDark = darks.some((s) => { const b = s.getBoundingClientRect(); return b.top <= 72 && b.bottom > 72; });
      const atTop = y < 30;
      nav.classList.toggle('top', atTop && !overDark);
      nav.classList.toggle('ondark', overDark && !atTop);
      nav.classList.toggle('solid', !overDark && !atTop);
      if (railFill && railMark && railBox) {
        const p = maxY > 0 ? clamp(y / maxY) : 0;
        railFill.style.height = p * 100 + '%';
        railMark.style.transform = `translateY(${-p * (railBox.clientHeight - 23)}px) rotate(${180 * Number(dir < 0)}deg)`;
      }
      if (!reduce && hero && heroWash) {
        const hb = hero.getBoundingClientRect();
        if (hb.bottom > 0) heroWash.style.transform = `translateY(${(Math.max(0, -hb.top) * 0.28).toFixed(1)}px)`;
      }
      if (fnTrack && inv) {
        const b = fnTrack.getBoundingClientRect(), q = clamp(-b.top / (b.height - vh)), n = invRows.length;
        const a = Math.min(n + 1, Math.floor(Math.min(1, q / 0.58) * (n + 1.6)));
        if (a !== cut) {
          cut = a;
          let left = 0;
          invRows.forEach((li, i) => { li.classList.toggle('cut', i < a); li.classList.toggle('gone', a > n); if (i >= a) left += parseFloat(li.dataset.v!); });
          const fin = a > n;
          inv.classList.toggle('done', fin); tweenTotal(left);
          invLbl.textContent = a === 0 ? 'You pay for headcount' : 'Still paying for headcount';
          paper.classList.toggle('flip', fin); inv2.setAttribute('aria-hidden', String(!fin));
          if (fin && !locked && !reduce) {   // hold the page a moment so the flip is seen
            locked = true;
            const pd = (e: Event) => e.preventDefault(), kd = (e: KeyboardEvent) => { if ([32, 33, 34, 35, 38, 40].includes(e.keyCode)) e.preventDefault(); };
            w.addEventListener('wheel', pd, { passive: false }); w.addEventListener('touchmove', pd, { passive: false }); w.addEventListener('keydown', kd);
            later(() => { w.removeEventListener('wheel', pd); w.removeEventListener('touchmove', pd); w.removeEventListener('keydown', kd); }, 1100);
          }
          reasons.forEach((r, i) => r.classList.toggle('on', i === Math.min(a, reasons.length - 1)));
        }
        if (invMark) invMark.style.transform = `translateY(${-(10 * q)}px)`;
      }
      if (!reduce && w.innerWidth > 980) depth.forEach((e) => {
        const b = e.getBoundingClientRect(), off = b.top + b.height / 2 - vh / 2;
        e.style.transform = `translateY(${(-(off * parseFloat(e.dataset.depth!))).toFixed(1)}px)`;
      });
    };
    let tick = false;
    on(w, 'scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { onScroll(); tick = false; }); } }, { passive: true });
    on(w, 'resize', onScroll);
    onScroll();

    /* case-study counters */
    if (!reduce) $$('.case__r [data-to]').forEach((el) => { el.textContent = '0'; });
    const counts = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      counts.unobserve(e.target);
      const t = e.target as HTMLElement;
      countUp(t, parseFloat(t.dataset.to!), 1400, +(t.dataset.dec || 0), t.dataset.suf || '');
    }), { threshold: 0.6 });
    $$('.count').forEach((c) => counts.observe(c));
    cleanups.push(() => counts.disconnect());

    const yr = $('#year'); if (yr) yr.textContent = String(new Date().getFullYear());

    return () => { timers.forEach(clearTimeout); intervals.forEach(clearInterval); cancelAnimationFrame(raf); cleanups.forEach((f) => f()); };
  }, []);

  return null;
}
