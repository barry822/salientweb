(function () {
  var d = document, w = window;
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  function countUp(el, to, ms, dec, suf) {
    dec = dec || 0; suf = suf || '';
    if (reduce) { el.textContent = (+to).toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; return; }
    var t0 = performance.now();
    (function tick(t) {
      var k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      el.textContent = (to * e).toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* The HTML carries the final figures (for search engines and no-JS visitors);
     zero them here because they are about to count up. */
  if (!reduce) $$('[data-to]').forEach(function (el) { el.textContent = '0'; });

  /* ---------- hero: pipeline engine narrows ---------- */
  var engRows = $$('#engine .engine__rows li');
  setTimeout(function () {
    engRows.forEach(function (li, k) {
      setTimeout(function () {
        li.querySelector('i').style.width = li.getAttribute('data-w') + '%';
        countUp(li.querySelector('b'), +li.querySelector('b').getAttribute('data-to'), 1100);
      }, reduce ? 0 : k * 220);
    });
  }, reduce ? 0 : 500);

  /* ---------- not an agency: calendar fills, revenue climbs ---------- */
  var calGrid = $('#calGrid');
  if (calGrid) {
    var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], times = ['9', '11', '1', '3', '5'];
    var html = '<span></span>';
    days.forEach(function (x) { html += '<span class="d">' + x + '</span>'; });
    times.forEach(function (t, r) {
      html += '<span class="t">' + t + '</span>';
      days.forEach(function (_, c) { html += '<span class="slot" data-k="' + c + '-' + r + '"></span>'; });
    });
    calGrid.innerHTML = html;
    var K = { D: ['Demo', '#2433DB'], Q: ['Qualified', '#1E9E23'], P: ['Proposal', '#12164A'] };
    var M = [
      [0,0,'Q','CFO, NBFC'],[1,1,'D','Head of Ops, 3PL'],[2,0,'D','VP Sales, SaaS'],[3,1,'Q','Founder, fintech'],[4,0,'P','COO, logistics'],
      [0,2,'D','IT head, hospital'],[1,3,'P','GM, realty'],[2,2,'Q','Plant head'],[3,3,'D','Growth lead, D2C'],[4,2,'D','CEO, edtech'],
      [0,4,'P','Director, IT services'],[1,0,'Q','VP Ops, retail'],[2,4,'D','CFO, logistics'],[3,0,'P','Founder, SaaS'],[4,4,'Q','Head of sales, B2B'],
      [0,1,'D','Procurement, pharma'],[2,1,'P','CTO, fintech'],[3,4,'D','Ops lead, EV'],[4,3,'Q','Partner, consulting'],[1,4,'D','COO, manufacturing']
    ];
    var calCount = $('#calCount'), revVal = $('#revVal'), line = $('#revLine'), area = $('#revArea');
    var pts = [62];
    function draw(n) {
      var step = 300 / (M.length), dd = 'M0 ' + pts[0];
      for (var j = 1; j < pts.length; j++) dd += ' L' + (j * step).toFixed(1) + ' ' + pts[j].toFixed(1);
      line.setAttribute('d', dd);
      area.setAttribute('d', dd + ' L' + ((pts.length - 1) * step).toFixed(1) + ' 70 L0 70 Z');
    }
    function add(m, k) {
      var slot = calGrid.querySelector('[data-k="' + m[0] + '-' + m[1] + '"]');
      var el = d.createElement('span'); el.className = 'm'; el.style.background = K[m[2]][1];
      el.innerHTML = K[m[2]][0] + '<small>' + m[3] + '</small>';
      slot.appendChild(el);
      requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('in'); }); });
      var n = k + 1;
      calCount.textContent = n + ' qualified meeting' + (n === 1 ? '' : 's');
      var v = n * 4.6 + (n > 3 ? n * 0.8 : 0);
      revVal.textContent = '₹' + v.toFixed(0) + 'L';
      pts.push(Math.max(6, 62 - n * 2.7 + (n % 3 === 0 ? 2 : 0)));
      draw();
    }
    var started = false;
    function fill() {
      if (started) return; started = true;
      if (reduce) { M.forEach(add); return; }
      M.forEach(function (m, k) { setTimeout(function () { add(m, k); }, k * 260); });
    }
    if ('IntersectionObserver' in w) {
      var cio = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { fill(); cio.disconnect(); } }, { threshold: .35 });
      cio.observe($('#cal'));
    } else fill();
  }

  /* ---------- three ways: expand on click ---------- */
  $$('.way__top').forEach(function (b) {
    b.addEventListener('click', function () {
      var card = b.parentNode, open = !card.classList.contains('open');
      card.classList.toggle('open', open); b.setAttribute('aria-expanded', open);
    });
  });
  /* ---------- plug-in tabs ---------- */
  var tabs = $$('.plug__tabs [role=tab]'), flow = $('#flow');
  function select(t) {
    tabs.forEach(function (b) {
      var on = b === t;
      b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
      var p = d.getElementById(b.getAttribute('aria-controls'));
      p.hidden = !on; p.classList.toggle('on', on);
    });
    if (flow) flow.setAttribute('data-mode', t.getAttribute('data-i'));
  }
  tabs.forEach(function (b, k) {
    b.addEventListener('click', function () { select(b); });
    b.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (n) { e.preventDefault(); var t = tabs[(k + n + tabs.length) % tabs.length]; t.focus(); select(t); }
    });
  });

  /* ---------- scroll-driven pieces ---------- */
  var nav = $('#nav'), railFill = $('#railFill'), railMark = $('#railMark'), rail = $('.rail');
  var heroMark = $('#heroMark'), hero = $('.hero');
  var fnTrack = $('#fnTrack'), inv = $('#inv'), rows = $$('.inv__rows li'), total = $('#invTotal'),
      reasons = $$('#reasons p'), invTitle = $('#invTitle'), invMark = $('#invMark'), invTotalLabel = $('.inv__total span');
  var steps = $('#steps'), stepLis = $$('#steps li');
  var paper = $('#paper'), inv2 = $('#inv2'), held = false;
  function holdScroll(ms) {
    var stop = function (e) { e.preventDefault(); };
    var keys = function (e) { if ([32, 33, 34, 35, 38, 40].indexOf(e.keyCode) > -1) e.preventDefault(); };
    w.addEventListener('wheel', stop, { passive: false });
    w.addEventListener('touchmove', stop, { passive: false });
    w.addEventListener('keydown', keys);
    setTimeout(function () {
      w.removeEventListener('wheel', stop); w.removeEventListener('touchmove', stop); w.removeEventListener('keydown', keys);
    }, ms);
  }
  var depthEls = $$('[data-depth]'), heroGrid = $('#heroGrid');
  var howTrack = $('#howTrack'), sps = $$('#box .sp'), navLis = $$('#howNav li'), boxUrl = $('#boxUrl'), icpCount = $('.icpCount'), lastHow = -1, icpDone = false;
  var darks = $$('.dark');
  var lastStage = -1, lastY = w.scrollY, dir = 0;

  function fmt(v) { return '₹' + v.toFixed(1) + 'L'; }
  var shown = 4.5, totRaf;
  function animTotal(to) {
    cancelAnimationFrame(totRaf);
    if (reduce) { shown = to; total.textContent = to === 0 ? '₹0' : fmt(to); return; }
    var from = shown, t0 = performance.now();
    (function f(t) {
      var k = Math.min(1, (t - t0) / 500), e = 1 - Math.pow(1 - k, 3);
      shown = from + (to - from) * e; total.textContent = shown < .05 ? '₹0' : fmt(shown);
      if (k < 1) totRaf = requestAnimationFrame(f);
    })(t0);
  }

  function onScroll() {
    var y = w.scrollY, vh = w.innerHeight, doc = d.documentElement.scrollHeight - vh;
    dir = y > lastY ? 1 : y < lastY ? -1 : dir; lastY = y;

    /* nav theme: dark over dark sections, frosted light elsewhere */
    var overDark = darks.some(function (s) { var r = s.getBoundingClientRect(); return r.top <= 72 && r.bottom > 72; });
    nav.classList.toggle('ondark', overDark && y > 20);
    nav.classList.toggle('solid', !overDark);

    /* rail: the Salient arrow climbs as you read, tilts with direction */
    if (rail && railMark) {
      var p = doc > 0 ? Math.min(1, Math.max(0, y / doc)) : 0;
      var h = rail.clientHeight - 23;
      railFill.style.height = (p * 100) + '%';
      railMark.style.transform = 'translateY(' + (-p * h) + 'px) rotate(' + (dir < 0 ? 180 : 0) + 'deg)';
    }

    /* hero mark drifts upward */
    if (heroMark && hero && !reduce) {
      var hr = hero.getBoundingClientRect();
      if (hr.bottom > 0) heroMark.style.transform = 'translateY(' + (-Math.max(0, -hr.top) * 0.55) + 'px)';
    }

    /* invoice: headcount lines get struck out, then disappear */
    if (fnTrack && inv) {
      var tr = fnTrack.getBoundingClientRect();
      var prog = Math.min(1, Math.max(0, -tr.top / (tr.height - vh)));
      var n = rows.length, stage = Math.min(n + 1, Math.floor(Math.min(1, prog / .58) * (n + 1.6)));
      if (stage !== lastStage) {
        lastStage = stage;
        var v = 0;
        rows.forEach(function (r, k) {
          r.classList.toggle('cut', k < stage);
          r.classList.toggle('gone', stage > n);
          if (k >= stage) v += parseFloat(r.getAttribute('data-v'));
        });
        var done = stage > n;
        inv.classList.toggle('done', done);
        animTotal(v);
        invTotalLabel.textContent = stage === 0 ? 'You pay for headcount' : 'Still paying for headcount';
        invTitle.textContent = 'Building it in-house';
        paper.classList.toggle('flip', done); inv2.setAttribute('aria-hidden', !done);
        if (done && !held && !reduce) { held = true; holdScroll(1100); }
        reasons.forEach(function (r, k) { r.classList.toggle('on', k === Math.min(stage, reasons.length - 1)); });
      }
      if (invMark) invMark.style.transform = 'translateY(' + (-prog * 10) + 'px) rotate(' + (prog * 0) + 'deg)';
    }

    /* how we build it: steps roll up inside one box */
    if (howTrack) {
      var hr2 = howTrack.getBoundingClientRect();
      var hp = Math.min(.9999, Math.max(0, -hr2.top / (hr2.height - vh)));
      var hs = Math.floor(hp * sps.length);
      var within = hp * sps.length - hs;
      navLis.forEach(function (li, k) {
        li.classList.toggle('on', k === hs); li.classList.toggle('done', k < hs);
        li.style.setProperty('--f', (k < hs ? 100 : k === hs ? within * 100 : 0) + '%');
      });
      if (!icpDone && hr2.top < vh * .5) { icpDone = true; countUp(icpCount, 2140, 1200); }
      if (hs !== lastHow) {
        lastHow = hs;
        sps.forEach(function (p, k) { p.classList.toggle('on', k === hs); p.classList.toggle('past', k < hs); });
        boxUrl.textContent = sps[hs].getAttribute('data-url');
      }
    }
    /* depth: gentle parallax on panels and the hero floor */
    if (!reduce && w.innerWidth > 980) {
      depthEls.forEach(function (el) {
        var r = el.getBoundingClientRect(), c = r.top + r.height / 2 - vh / 2;
        el.style.transform = 'translateY(' + (c * -parseFloat(el.dataset.depth)).toFixed(1) + 'px)';
      });
      if (heroGrid) heroGrid.style.backgroundPosition = '0 ' + (y * .35).toFixed(1) + 'px';
    }
    /* how it works: progress line */
    if (steps) {
      var sr = steps.getBoundingClientRect();
      var sp = Math.min(1, Math.max(0, (vh * .85 - sr.top) / (vh * .5)));
      steps.style.setProperty('--p', (sp * 100) + '%');
      stepLis.forEach(function (li, k) { li.classList.toggle('on', sp >= k / (stepLis.length - 1) - .02); });
    }
  }
  navLis.forEach(function (li, k) {
    li.style.cursor = 'pointer';
    li.addEventListener('click', function () {
      var top = howTrack.offsetTop + (howTrack.offsetHeight - w.innerHeight) * ((k + .5) / navLis.length);
      w.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    });
  });
  var ticking = false;
  w.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { onScroll(); ticking = false; }); } }, { passive: true });
  w.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- counters ---------- */
  var counters = $$('.count');
  if ('IntersectionObserver' in w) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target, to = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0), suf = el.dataset.suf || '';
        if (reduce) { el.textContent = to.toFixed(dec) + suf; return; }
        var t0 = performance.now();
        (function tick(t) {
          var k = Math.min(1, (t - t0) / 1400), e2 = 1 - Math.pow(1 - k, 3);
          el.textContent = (to * e2).toFixed(dec) + suf;
          if (k < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: .6 });
    counters.forEach(function (c) { io.observe(c); });
  } else counters.forEach(function (c) { c.textContent = c.dataset.to + (c.dataset.suf || ''); });

  /* ---------- booking slots (IST) + contact form ----------
     Slots are the next 3 working days at 11:00 and 16:00 IST. When the form's
     data-booking URL (Google Apps Script, see booking-setup/Code.gs) is set, the
     slots come from your Google Calendar, taken ones are greyed out, and picking
     one books a Google Meet. Every submission is also sent to Formspree. */
  var form = $('#contact-form'), slotsEl = $('#slots'), pref = $('#prefTime'), bookBtn = $('#bookBtn');
  var status = $('#form-status');
  var BOOKING = form ? (form.getAttribute('data-booking') || '') : '';
  if (BOOKING.indexOf('YOUR_') !== -1) BOOKING = '';
  var SLOT_TIMES = ['11:00', '16:00'], WORKING_DAYS = 3;   // keep in sync with Code.gs
  var IST = 'Asia/Kolkata', btnLabel = bookBtn ? bookBtn.textContent : '';
  var chosen = null;

  function istParts(date, opts) {
    var o = { timeZone: IST }; for (var k in opts) o[k] = opts[k];
    return new Intl.DateTimeFormat('en-IN', o).format(date);
  }
  function slotLabel(iso) {
    var dt = new Date(iso);
    return {
      day: istParts(dt, { weekday: 'short' }) + ' ' + istParts(dt, { day: 'numeric' }),
      time: istParts(dt, { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase() + ' IST',
      local: dt.toLocaleString([], { weekday: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    };
  }
  function localSlots() {   // same rule as Code.gs, used until (or unless) the calendar answers
    var ymd = new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(new Date()).split('-');
    var day = Date.UTC(+ymd[0], +ymd[1] - 1, +ymd[2]), out = [], found = 0;
    while (found < WORKING_DAYS) {
      day += 86400000;
      var dow = new Date(day).getUTCDay();
      if (dow === 0 || dow === 6) continue;
      found++;
      var iso = new Date(day).toISOString().slice(0, 10);
      SLOT_TIMES.forEach(function (t) { out.push({ start: iso + 'T' + t + ':00+05:30', free: true }); });
    }
    return out;
  }
  function renderSlots(list) {
    if (!slotsEl) return;
    var html = '', istHere = new Date().getTimezoneOffset() === -330;
    list.forEach(function (s) {
      var l = slotLabel(s.start), on = chosen === s.start && s.free;
      html += '<button type="button" class="slot-b" role="radio" aria-checked="' + on + '"' +
        (s.free ? '' : ' aria-disabled="true"') + ' data-v="' + s.start + '"' +
        (istHere ? '' : ' title="Your time: ' + l.local + '"') +
        '><b>' + l.day + '</b><span>' + (s.free ? l.time : 'Taken') + '</span></button>';
    });
    slotsEl.innerHTML = html;
    if (chosen && !list.some(function (s) { return s.start === chosen && s.free; })) pick(null);
  }
  function pick(iso) {
    chosen = iso;
    $$('.slot-b', slotsEl).forEach(function (o) { o.setAttribute('aria-checked', o.dataset.v === iso); });
    var l = iso && slotLabel(iso);
    pref.value = l ? l.day + ', ' + l.time : '';
    bookBtn.textContent = l ? 'Book my call for ' + l.day + ', ' + l.time : btnLabel;
  }

  if (slotsEl) {
    renderSlots(localSlots());
    slotsEl.addEventListener('click', function (e) {
      var b = e.target.closest('.slot-b');
      if (!b || b.getAttribute('aria-disabled') === 'true') return;
      pick(b.dataset.v);
    });
    if (BOOKING) {
      fetch(BOOKING).then(function (r) { return r.json(); })
        .then(function (d) { if (d && d.slots && d.slots.length) renderSlots(d.slots); })
        .catch(function () {});   // keep the local slots; booking will report any clash
    }
  }

  function say(cls, html) { status.className = 'form-status ' + cls; status.innerHTML = html; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var action = form.getAttribute('action') || '';
      var formspree = action.indexOf('YOUR_FORM_ID') === -1 ? action : '';
      if (BOOKING && !chosen) {
        var first = slotsEl.querySelector('.slot-b:not([aria-disabled])');
        say('err', first ? 'Pick a time above to book your call.' : 'All times this week are taken. Email <a href="mailto:sales@salientco.in">sales@salientco.in</a> and we’ll find one.');
        if (first) first.focus();
        return;
      }
      if (!BOOKING && !formspree) {
        say('err', 'The form isn\u2019t connected yet. Email <a href="mailto:sales@salientco.in">sales@salientco.in</a> and we\u2019ll reply within one business day.');
        return;
      }
      var data = new FormData(form);
      var sendFormspree = function () {
        return formspree ? fetch(formspree, { method: 'POST', body: data, headers: { Accept: 'application/json' } }) : Promise.resolve({ ok: false });
      };
      bookBtn.textContent = BOOKING ? 'Booking\u2026' : 'Sending\u2026'; bookBtn.disabled = true;

      var done;
      if (BOOKING) {
        var body = new URLSearchParams();
        ['name', 'email', 'company', 'stage', '_gotcha'].forEach(function (k) { body.append(k, data.get(k) || ''); });
        body.append('slot', chosen);
        var email = data.get('email'), label = pref.value;
        done = fetch(BOOKING, { method: 'POST', body: body })
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (!d.ok) {
              if (d.slots) renderSlots(d.slots);
              say('err', esc(d.error || 'That didn\u2019t book.') + ' Or email <a href="mailto:sales@salientco.in">sales@salientco.in</a>.');
              return;
            }
            sendFormspree().catch(function () {});   // a copy for your inbox; the booking already succeeded
            var taken = d.start; form.reset(); pick(null);
            $$('.slot-b', slotsEl).forEach(function (o) {
              if (o.dataset.v === taken) { o.setAttribute('aria-disabled', 'true'); o.querySelector('span').textContent = 'Taken'; }
            });
            say('ok', '<b>Booked for ' + esc(label) + '.</b> A Google Meet invite is on its way to ' + esc(email) + '.' +
              (d.meet ? ' <a href="' + esc(d.meet) + '" target="_blank" rel="noopener">Meet link</a>' : ''));
          });
      } else {
        done = sendFormspree().then(function (r) {
          if (!r.ok) throw 0;
          form.reset(); pick(null);
          say('ok', 'Call request sent. We\u2019ll reply within one business day.');
        });
      }
      done.catch(function () { say('err', 'That didn\u2019t go through. Email <a href="mailto:sales@salientco.in">sales@salientco.in</a> directly.'); })
        .then(function () { bookBtn.disabled = false; if (!chosen) bookBtn.textContent = btnLabel; else pick(chosen); });
    });
  }
  var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
})();
