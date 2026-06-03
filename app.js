/* ============================================================
   The Local Builders — app.js
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- smooth scroll for in-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#' || id === '#top') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        return;
      }
      var target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
  });

  /* ---------- header scrolled state ---------- */
  var header = document.querySelector('[data-header]');
  function onScrollHeader() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 20);
  }
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------- scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- animated stat counters ---------- */
  var counters = document.querySelectorAll('[data-count]');
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCount(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(function (el) { el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || ''); });
  }

  /* ---------- gallery filter + show more ---------- */
  var chips = document.querySelectorAll('.chip');
  var items = Array.prototype.slice.call(document.querySelectorAll('.gallery__item'));
  var moreBtn = document.getElementById('galMore');
  var COLLAPSE_LIMIT = 24;
  var currentFilter = 'all';
  var collapsed = true;
  function applyView() {
    var shown = 0;
    items.forEach(function (item) {
      var matches = currentFilter === 'all' || item.getAttribute('data-cat') === currentFilter;
      var hide = !matches;
      if (matches && currentFilter === 'all' && collapsed) {
        shown++;
        if (shown > COLLAPSE_LIMIT) hide = true;
      }
      item.classList.toggle('is-hidden', hide);
    });
    if (moreBtn) {
      var relevant = currentFilter === 'all' && items.length > COLLAPSE_LIMIT;
      moreBtn.hidden = !relevant;
      moreBtn.textContent = collapsed ? ('Show all ' + items.length + ' projects') : 'Show fewer';
    }
  }
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('is-active'); c.setAttribute('aria-selected', 'false'); });
      chip.classList.add('is-active'); chip.setAttribute('aria-selected', 'true');
      currentFilter = chip.getAttribute('data-filter');
      collapsed = true;
      applyView();
    });
  });
  if (moreBtn) moreBtn.addEventListener('click', function () { collapsed = !collapsed; applyView(); });
  applyView();

  /* ---------- lightbox ---------- */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');
  var lbClose = document.getElementById('lbClose');
  var lbPrev = document.getElementById('lbPrev');
  var lbNext = document.getElementById('lbNext');
  var current = 0;
  var lastFocus = null;

  function visibleItems() { return items.filter(function (i) { return !i.classList.contains('is-hidden'); }); }
  function openLB(item) {
    var vis = visibleItems();
    current = vis.indexOf(item);
    showLB();
    lastFocus = document.activeElement;
    lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }
  function showLB() {
    var vis = visibleItems();
    if (!vis.length) return;
    if (current < 0) current = vis.length - 1;
    if (current >= vis.length) current = 0;
    var img = vis[current].querySelector('img');
    var cap = vis[current].querySelector('figcaption');
    lbImg.src = img.getAttribute('data-full') || img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = cap ? cap.textContent : '';
  }
  function closeLB() {
    lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  items.forEach(function (item) {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.addEventListener('click', function () { openLB(item); });
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLB(item); }
    });
  });
  if (lbClose) lbClose.addEventListener('click', closeLB);
  if (lbPrev) lbPrev.addEventListener('click', function () { current--; showLB(); });
  if (lbNext) lbNext.addEventListener('click', function () { current++; showLB(); });
  if (lb) lb.addEventListener('click', function (e) { if (e.target === lb) closeLB(); });
  document.addEventListener('keydown', function (e) {
    if (!lb || !lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLB();
    else if (e.key === 'ArrowLeft') { current--; showLB(); }
    else if (e.key === 'ArrowRight') { current++; showLB(); }
  });

  /* ---------- sticky action bar + fab reveal ---------- */
  var actionbar = document.querySelector('[data-actionbar]');
  var fab = document.querySelector('[data-fab]');
  var quoteSection = document.getElementById('quote');
  function toggleStickies() {
    var show = window.scrollY > 520;
    // hide them while the quote form itself is in view (avoid covering the CTA)
    var overForm = false;
    if (quoteSection) {
      var r = quoteSection.getBoundingClientRect();
      overForm = r.top < window.innerHeight && r.bottom > 0;
    }
    var visible = show && !overForm;
    if (actionbar) actionbar.classList.toggle('is-show', visible);
    if (fab) fab.classList.toggle('is-show', visible);
  }
  toggleStickies();
  window.addEventListener('scroll', toggleStickies, { passive: true });

  /* ---------- lead form (Web3Forms + guaranteed fallback) ---------- */
  var form = document.getElementById('quoteForm');
  if (form) {
    var note = document.getElementById('quoteNote');
    var submit = document.getElementById('quoteSubmit');
    var FALLBACK_EMAIL = 'gary@lfbuilders.ca';

    function setNote(msg, cls) {
      note.textContent = msg;
      note.classList.remove('is-error', 'is-success');
      if (cls) note.classList.add(cls);
    }
    function markInvalid() {
      var firstBad = null;
      ['q-name', 'q-phone', 'q-service'].forEach(function (id) {
        var el = document.getElementById(id);
        var bad = !el.value.trim();
        el.classList.toggle('invalid', bad);
        if (bad && !firstBad) firstBad = el;
      });
      return firstBad;
    }
    function buildMailto() {
      var v = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; };
      var body = 'Name: ' + v('q-name') + '\nPhone: ' + v('q-phone') + '\nEmail: ' + v('q-email') +
                 '\nService: ' + v('q-service') + '\n\nDetails:\n' + v('q-msg');
      return 'mailto:' + FALLBACK_EMAIL + '?subject=' + encodeURIComponent('Quote request from website') +
             '&body=' + encodeURIComponent(body);
    }
    function showSuccess() {
      form.classList.add('is-sent');
      var box = document.createElement('div');
      box.className = 'quote__success';
      box.innerHTML = '<svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" fill="none" stroke="#1d7a4d" stroke-width="3"/><path fill="none" stroke="#1d7a4d" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M15 27l8 8 15-16"/></svg>' +
        '<h3>Thanks &mdash; we got it!</h3>' +
        '<p>We&rsquo;ll be in touch shortly. Need us sooner? Call <a href="tel:+16475078853" style="color:var(--gold-dark);font-weight:700">647-507-8853</a>.</p>';
      form.appendChild(box);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // honeypot
      if (form.querySelector('[name="botcheck"]').checked) return;

      var firstBad = markInvalid();
      if (firstBad) { firstBad.focus(); setNote('Please add your name, phone, and the service you need.', 'is-error'); return; }

      var key = form.querySelector('[name="access_key"]').value;
      // If the Web3Forms key hasn't been set up yet, fall back to the visitor's email app
      // so a lead is never lost.
      if (!key || key.indexOf('YOUR_WEB3FORMS') === 0) {
        window.location.href = buildMailto();
        setNote('Opening your email app so you can send this to us directly…', 'is-success');
        return;
      }

      submit.disabled = true;
      var original = submit.textContent;
      submit.textContent = 'Sending…';
      setNote('Sending your request…');

      var data = new FormData(form);
      fetch('https://api.web3forms.com/submit', { method: 'POST', body: data })
        .then(function (r) { return r.json(); })
        .then(function (json) {
          if (json.success) {
            showSuccess();
            if (window.gtag) window.gtag('event', 'generate_lead');
          } else {
            throw new Error(json.message || 'failed');
          }
        })
        .catch(function () {
          submit.disabled = false;
          submit.textContent = original;
          setNote('Hmm, that didn’t go through. Please call 647-507-8853 or ', 'is-error');
          var link = document.createElement('a');
          link.href = buildMailto(); link.textContent = 'email us directly.';
          link.style.color = '#d4564a'; link.style.textDecoration = 'underline';
          note.appendChild(link);
        });
    });

    // clear invalid styling as the user types
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.addEventListener('input', function () { el.classList.remove('invalid'); });
    });
  }
})();
