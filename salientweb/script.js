/* Salient — nav, animated pipeline & funnel counters, reveals, form handling */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header: solid background once scrolled ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 20);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var burger = document.querySelector(".nav__burger");
  var menu = document.querySelector(".mobile-menu");
  function setMenu(open) {
    if (!menu || !burger) return;
    menu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    var bars = burger.querySelectorAll("span");
    if (bars.length === 3) {
      bars[0].style.transform = open ? "translateY(8px) rotate(45deg)" : "";
      bars[1].style.opacity = open ? "0" : "";
      bars[2].style.transform = open ? "translateY(-8px) rotate(-45deg)" : "";
    }
  }
  if (burger && menu) {
    burger.setAttribute("aria-expanded", "false");
    burger.addEventListener("click", function () {
      setMenu(!menu.classList.contains("open"));
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 640) setMenu(false);
    });
  }

  /* ---------- Smooth in-page anchors (offset for fixed header) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var offset = header ? header.offsetHeight : 0;
      var top = id === "#top" ? 0 : target.getBoundingClientRect().top + window.scrollY - offset + 1;
      window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
      if (history.replaceState) history.replaceState(null, "", id);
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // small stagger for siblings revealed together
        var siblings = el.parentElement ? el.parentElement.querySelectorAll(":scope > .reveal") : [];
        var idx = Array.prototype.indexOf.call(siblings, el);
        el.style.transitionDelay = (idx > 0 ? Math.min(idx, 6) * 80 : 0) + "ms";
        el.classList.add("in");
        revealObs.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { revealObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Pipeline panel: animated counters ---------- */
  var pipeline = document.getElementById("pipeline");
  var pbar = document.getElementById("pbar");

  function formatNum(n) {
    return Math.round(n).toLocaleString("en-US");
  }

  function countTo(el, target, duration, delay) {
    if (reduceMotion) { el.textContent = formatNum(target); return; }
    setTimeout(function () {
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = formatNum(target * eased);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, delay);
  }

  // The HTML carries the final numbers (for search engines and no-JS visitors);
  // reset them to 0 here only when they are about to be animated.
  if (!reduceMotion && "IntersectionObserver" in window) {
    document.querySelectorAll("[data-count]").forEach(function (el) { el.textContent = "0"; });
  }

  function runPipeline() {
    var rows = pipeline.querySelectorAll(".stage__row");
    var stepDelay = reduceMotion ? 0 : 220;
    rows.forEach(function (row, i) {
      var num = row.querySelector(".stage__num");
      var target = num ? parseInt(num.getAttribute("data-count"), 10) || 0 : 0;
      if (num) countTo(num, target, 1300, i * stepDelay);
      // progress bar advances as each stage resolves
      if (pbar) {
        setTimeout(function () {
          pbar.style.width = Math.round(((i + 1) / rows.length) * 100) + "%";
        }, i * stepDelay);
      }
    });
  }

  if (pipeline) {
    if ("IntersectionObserver" in window) {
      var pipeObs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          runPipeline();
          pipeObs.disconnect();
        }
      }, { threshold: 0.35 });
      pipeObs.observe(pipeline);
    } else {
      runPipeline();
    }
  }

  /* ---------- Funnel: animated stage metrics ---------- */
  var funnel = document.getElementById("funnel");

  function runFunnel() {
    var metrics = funnel.querySelectorAll(".fstage__metric[data-count]");
    var stepDelay = reduceMotion ? 0 : 180;
    metrics.forEach(function (el, i) {
      countTo(el, parseInt(el.getAttribute("data-count"), 10) || 0, 1200, i * stepDelay);
    });
  }

  if (funnel) {
    if ("IntersectionObserver" in window) {
      var funnelObs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          runFunnel();
          funnelObs.disconnect();
        }
      }, { threshold: 0.25 });
      funnelObs.observe(funnel);
    } else {
      runFunnel();
    }
  }

  /* ---------- Contact form (Formspree) ---------- */
  var form = document.getElementById("contact-form");
  var statusEl = document.getElementById("form-status");

  function showStatus(type, msg) {
    if (!statusEl) return;
    statusEl.className = "form-status " + type;
    statusEl.textContent = msg;
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var action = form.getAttribute("action") || "";
      if (action.indexOf("YOUR_FORM_ID") !== -1) {
        showStatus("err", "The contact form isn't connected yet. Please email us at sales@salientco.in and we'll get back to you within one business day.");
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      var btnHTML = btn ? btn.innerHTML : "";
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }

      fetch(action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            showStatus("ok", "Thanks — we've got it. We'll be in touch within one business day.");
            return;
          }
          return res.json().then(function (data) {
            var msg = data && data.errors
              ? data.errors.map(function (er) { return er.message; }).join(", ")
              : "Something went wrong.";
            throw new Error(msg);
          }, function () { throw new Error("Something went wrong."); });
        })
        .catch(function (err) {
          showStatus("err", (err && err.message ? err.message : "Something went wrong.") + " Please try again, or email sales@salientco.in.");
        })
        .then(function () {
          if (btn) { btn.disabled = false; btn.innerHTML = btnHTML; }
        });
    });
  }
})();
