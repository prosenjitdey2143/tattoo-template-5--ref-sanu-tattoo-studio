/* ============================================================
   MIDNIGHT MOON — main.js v3
   Video on slide 0 (waits for video to end), image slides use
   fixed AUTO_MS timer. Optimized with RAF cursor, no reflow jank.
   ============================================================ */
(function () {
  'use strict';

  if (typeof gsap === 'undefined') { console.error('GSAP missing'); return; }

  /* ── CONFIG ─────────────────────────────── */
  var TOTAL    = 3;
  var AUTO_MS  = 7000;   // fallback timer for image slides
  var EO       = 'power3.out';
  var EIO      = 'power2.inOut';

  /* ── STATE ──────────────────────────────── */
  var cur      = 0;
  var prev     = 0;
  var busy     = false;
  var timer    = null;
  var progRaf  = null;   // requestAnimationFrame id for progress bar

  /* ── DOM (cached once) ──────────────────── */
  var bgs       = document.querySelectorAll('.bg-slide');
  var slots     = document.querySelectorAll('.text-slot');
  var dots      = document.querySelectorAll('.dn-dot');
  var vtags     = document.querySelectorAll('.vtag-item');
  var cards     = document.querySelectorAll('.track-card');
  var numRail   = document.getElementById('numRail');
  var numVP     = numRail ? numRail.parentElement : null;
  var numItems  = numRail ? numRail.querySelectorAll('.num-item') : [];
  var prevBtn   = document.getElementById('prevBtn');
  var nextBtn   = document.getElementById('nextBtn');
  var scrollHint= document.getElementById('scrollHint');
  var ctaHead   = document.getElementById('ctaHead');
  var ctaPara   = document.getElementById('ctaPara');
  var cursor    = document.getElementById('cursor');
  var cursorRing= document.getElementById('cursorRing');
  var heroVideo = document.getElementById('heroVideo');
  var progFill  = document.getElementById('progressFill');

  /* ── CTA DATA ──────────────────────────── */
  var ctaData = [
    { h: 'A New Beginning',      p: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod labore et dolore in aliqua.' },
    { h: 'Your Story in Ink',    p: 'Every tattoo tells a tale. Let our artists craft something that speaks forever in your skin.' },
    { h: 'Art Becomes Identity', p: 'Premium tattooing where design meets precision. Built for those who seek the extraordinary.' }
  ];

  /* ══════════════════════════════════════════
     CURSOR (RAF loop — zero layout thrash)
  ══════════════════════════════════════════ */
  var mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX; my = e.clientY;
    if (cursor) {
      cursor.style.transform = 'translate(' + (mx - 7) + 'px,' + (my - 7) + 'px)';
    }
  }, { passive: true });

  (function ringLoop() {
    rx += (mx - rx) * 0.11;
    ry += (my - ry) * 0.11;
    if (cursorRing) {
      cursorRing.style.transform = 'translate(' + (rx - 21) + 'px,' + (ry - 21) + 'px)';
    }
    requestAnimationFrame(ringLoop);
  })();

  // Interaction fallback for video
  document.addEventListener('click', function() {
    if (heroVideo && heroVideo.paused) {
      heroVideo.play().catch(function(){});
    }
  }, { once: true });


  // Hover enlargement
  document.querySelectorAll('a,button,.track-card,.dn-dot').forEach(function (el) {
    el.addEventListener('mouseenter', function () {
      gsap.to(cursorRing, { scale: 1.85, duration: .28, ease: EO });
    });
    el.addEventListener('mouseleave', function () {
      gsap.to(cursorRing, { scale: 1, duration: .28, ease: EO });
    });
  });

  /* ══════════════════════════════════════════
     SCROLL HINT BOUNCE
  ══════════════════════════════════════════ */
  if (scrollHint) {
    gsap.to(scrollHint, { y: -8, duration: 1.3, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }

  /* ══════════════════════════════════════════
     PROGRESS BAR
  ══════════════════════════════════════════ */
  function startProgress(durationMs) {
    stopProgress();
    if (!progFill) return;
    progFill.style.width = '0%';
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var pct = Math.min(((ts - start) / durationMs) * 100, 100);
      progFill.style.width = pct + '%';
      if (pct < 100) progRaf = requestAnimationFrame(step);
    }
    progRaf = requestAnimationFrame(step);
  }

  function stopProgress() {
    if (progRaf) { cancelAnimationFrame(progRaf); progRaf = null; }
    if (progFill) progFill.style.width = '0%';
  }

  /* ══════════════════════════════════════════
     NUMBER RAIL
  ══════════════════════════════════════════ */
  function setupNumRail() {
    if (!numVP || numItems.length === 0) return;
    var h = numVP.offsetHeight;
    numItems.forEach(function (item) { item.style.height = h + 'px'; });
  }

  function scrollNum(index) {
    if (!numRail || !numVP) return;
    var h = numVP.offsetHeight;
    gsap.to(numRail, { y: -index * h, duration: 0.72, ease: EIO });
  }

  /* ══════════════════════════════════════════
     TEXT REVEAL
  ══════════════════════════════════════════ */
  function revealSlot(index) {
    var slot = document.getElementById('ts' + index);
    if (!slot) return;
    var eye   = slot.querySelector('.ts-eye');
    var title = slot.querySelector('.ts-title');
    var sub   = slot.querySelector('.ts-sub');

    gsap.set([eye, title, sub], { opacity: 0, y: 0 });
    gsap.set(eye,   { y: 20 });
    gsap.set(title, { y: 38 });
    gsap.set(sub,   { y: 14 });

    gsap.timeline()
      .to(eye,   { y: 0, opacity: 1, duration: .65, ease: EO })
      .to(title, { y: 0, opacity: 1, duration: .9,  ease: EO }, '-=.42')
      .to(sub,   { y: 0, opacity: 1, duration: .65, ease: EO }, '-=.52');
  }

  /* ══════════════════════════════════════════
     TEXT HIDE
  ══════════════════════════════════════════ */
  function hideSlot(index, cb) {
    var slot = document.getElementById('ts' + index);
    if (!slot) { cb && cb(); return; }
    gsap.to(slot.querySelectorAll('.ts-eye,.ts-title,.ts-sub'), {
      opacity: 0, y: -18,
      duration: .35, stagger: .04, ease: 'power2.in',
      onComplete: cb
    });
  }

  /* ══════════════════════════════════════════
     CTA UPDATE
  ══════════════════════════════════════════ */
  function updateCTA(index) {
    if (!ctaHead || !ctaPara) return;
    var d = ctaData[index];
    gsap.to([ctaHead, ctaPara], {
      opacity: 0, y: 8, duration: .28, ease: 'power2.in',
      onComplete: function () {
        ctaHead.textContent = d.h;
        ctaPara.textContent = d.p;
        gsap.to([ctaHead, ctaPara], { opacity: 1, y: 0, duration: .5, stagger: .07, ease: EO });
      }
    });
  }

  /* ══════════════════════════════════════════
     SYNC UI
  ══════════════════════════════════════════ */
  function syncUI(index) {
    dots.forEach(function  (d, i) { d.classList.toggle('is-active', i === index); });
    cards.forEach(function (c, i) { c.classList.toggle('is-active', i === index); });
    scrollNum(index);
    updateCTA(index);
  }

  /* ══════════════════════════════════════════
     VIDEO HELPERS
  ══════════════════════════════════════════ */
  function startVideo() {
    if (!heroVideo) return;
    heroVideo.currentTime = 0;
    heroVideo.play().catch(function () {
      // Autoplay blocked — fall back to timed advance
      scheduleNext();
    });
  }

  function stopVideo() {
    if (!heroVideo) return;
    heroVideo.pause();
    heroVideo.currentTime = 0;
  }

  /* ══════════════════════════════════════════
     SCHEDULE NEXT SLIDE (image slides)
  ══════════════════════════════════════════ */
  function scheduleNext() {
    clearTimer();
    timer = setTimeout(function () {
      goTo((cur + 1) % TOTAL);
    }, AUTO_MS);
    startProgress(AUTO_MS);
  }

  function clearTimer() {
    if (timer) { clearTimeout(timer); timer = null; }
    stopProgress();
  }

  /* ══════════════════════════════════════════
     CORE SLIDE CHANGE
  ══════════════════════════════════════════ */
  function goTo(next) {
    if (busy || next === cur) return;
    busy = true;
    prev = cur;
    cur  = next;

    clearTimer();

    // Stop video if leaving slide 0
    if (prev === 0) stopVideo();

    // Hide current text then swap
    hideSlot(prev, function () {
      // Deactivate old slot
      var pSlot = document.getElementById('ts' + prev);
      if (pSlot) { pSlot.classList.remove('is-active'); pSlot.style.display = 'none'; }

      // Activate new slot
      var nSlot = document.getElementById('ts' + cur);
      if (nSlot) { nSlot.style.display = 'flex'; nSlot.classList.add('is-active'); }

      revealSlot(cur);
      busy = false;
    });

    // Swap backgrounds
    bgs[prev].classList.remove('is-active');
    bgs[cur].classList.add('is-active');

    // Restart ken-burns on image slides
    if (bgs[cur].dataset.type === 'image') {
      var inner = bgs[cur].querySelector('.bg-inner');
      if (inner) {
        inner.style.animation = 'none';
        inner.offsetWidth; // reflow trigger
        inner.style.animation = '';
      }
      scheduleNext();
    } else if (bgs[cur].dataset.type === 'video') {
      startVideo();
      // Progress driven by video timeupdate
    }

    syncUI(cur);
  }

  /* ══════════════════════════════════════════
     VIDEO EVENTS
  ══════════════════════════════════════════ */
  if (heroVideo) {
    // Video progress bar
    heroVideo.addEventListener('timeupdate', function () {
      if (!progFill || !heroVideo.duration) return;
      var pct = (heroVideo.currentTime / heroVideo.duration) * 100;
      progFill.style.width = pct + '%';
    });

    // When video ends → advance to next slide
    heroVideo.addEventListener('ended', function () {
      progFill && (progFill.style.width = '100%');
      setTimeout(function () { goTo(1); }, 400);
    });

    // Error fallback
    heroVideo.addEventListener('error', function () {
      scheduleNext();
    });
  }

  /* ══════════════════════════════════════════
     EVENTS
  ══════════════════════════════════════════ */
  function manualGoTo(index) {
    goTo(index);
    // If going back to video slide, video events handle auto-advance
    // If image slide, scheduleNext is called inside goTo
  }

  dots.forEach(function (d) {
    d.addEventListener('click', function () { manualGoTo(parseInt(d.dataset.go)); });
  });
  /* vtag-item now handle regular anchor navigation */
  cards.forEach(function (c) {
    c.addEventListener('click', function () { manualGoTo(parseInt(c.dataset.go)); });
  });
  if (prevBtn) prevBtn.addEventListener('click', function () { manualGoTo((cur - 1 + TOTAL) % TOTAL); });
  if (nextBtn) nextBtn.addEventListener('click', function () { manualGoTo((cur + 1) % TOTAL); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') manualGoTo((cur + 1) % TOTAL);
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   manualGoTo((cur - 1 + TOTAL) % TOTAL);
  });

  var txStart = 0;
  document.addEventListener('touchstart', function (e) { txStart = e.changedTouches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - txStart;
    if (Math.abs(dx) > 50) manualGoTo(dx < 0 ? (cur + 1) % TOTAL : (cur - 1 + TOTAL) % TOTAL);
  });

  /* ══════════════════════════════════════════
     INTRO + INIT
  ══════════════════════════════════════════ */
  function intro() {
    var tl = gsap.timeline({ delay: 0.15 });

    gsap.set(['.navbar', '.left-panel', '.vtag', '.num-block', '.dot-nav', '.cta-block', '.scroll-hint'], { opacity: 0 });
    gsap.set('#ringWrap', { opacity: 0 });  /* opacity only — no transform so CSS spin is unaffected */
    gsap.set('.navbar',     { y: -65 });
    gsap.set('.left-panel', { x: -50 });
    gsap.set('.num-block',  { x: 55 });
    gsap.set('.dot-nav',    { x: 22 });
    gsap.set('.cta-block',  { y: 24 });

    tl.to('.navbar',     { y: 0, opacity: 1, duration: .9, ease: EO })
      .to('.left-panel', { x: 0, opacity: 1, duration: .9, ease: EO }, '-=.65')
      .to('.vtag',       { opacity: 1, duration: .9, ease: EO }, '-=.9')
      .to('#ringWrap',   { opacity: 1, duration: 1.4, ease: EO }, '-=.72')  /* fade in only */
      .to('.num-block',  { x: 0, opacity: 1, duration: .9, ease: EO }, '-=.8')
      .to('.dot-nav',    { x: 0, opacity: 1, duration: .7, ease: EO }, '-=.65')
      .to('.cta-block',  { y: 0, opacity: 1, duration: .7, ease: EO }, '-=.5')
      .to('.scroll-hint',{ opacity: 1, duration: .6, ease: EO }, '-=.4')
      .add(function () { revealSlot(0); }, '-=.3');
  }

  function init() {
    // Hide non-active slots
    slots.forEach(function (s, i) { if (i !== 0) s.style.display = 'none'; });

    // Number rail heights
    setupNumRail();

    // Start video on slide 0
    if (heroVideo) {
      heroVideo.muted = true; 
      heroVideo.loop  = false; // Ensure it doesn't loop so 'ended' fires
      startVideo();
      // video 'ended' event handles auto-advance
    } else {
      scheduleNext(); // fallback
    }

    // Run intro animation
    intro();

    // Sync Navigation (Scroll Spy)
    var navLinks = document.querySelectorAll('.nav-links a, .vtag-item');
    var sections = document.querySelectorAll('section');

    function updateActiveLink() {
      var fromTop = window.scrollY + 100;
      var currentSection = 'hero';

      sections.forEach(function(sec) {
        if (sec.offsetTop <= fromTop && sec.offsetTop + sec.offsetHeight > fromTop) {
          currentSection = sec.getAttribute('id');
        }
      });

      navLinks.forEach(function(link) {
        var href = link.getAttribute('href');
        if (href === '#' + currentSection) {
          link.classList.add('active');
          link.classList.add('is-active'); // for vtag-item
        } else {
          link.classList.remove('active');
          link.classList.remove('is-active');
        }
      });
    }

    window.addEventListener('scroll', updateActiveLink);
    updateActiveLink(); // Initial call

    // Click handler for smooth sync (immediate active state)
    navLinks.forEach(function(link) {
      link.addEventListener('click', function(e) {
        navLinks.forEach(function(l) { 
          l.classList.remove('active'); 
          l.classList.remove('is-active');
        });
        this.classList.add('active');
        this.classList.add('is-active');

        // Close mobile menu if open
        var navbar = document.getElementById('navbar');
        if (navbar && navbar.classList.contains('nav-open')) {
          navbar.classList.remove('nav-open');
        }
      });
    });

    // Mobile Burger Toggle
    var burger = document.getElementById('burger');
    var navbar = document.getElementById('navbar');
    if (burger && navbar) {
      burger.addEventListener('click', function() {
        navbar.classList.toggle('nav-open');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

/* ============================================================
   ABOUT SECTION — GSAP SCROLL ANIMATIONS
   Runs after main IIFE so ScrollTrigger is registered separately.
   ============================================================ */
(function () {
  'use strict';

  function initAbout() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('GSAP / ScrollTrigger not ready for About section');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    var EO  = 'power3.out';
    var EIO = 'power2.inOut';

    var section   = document.getElementById('about');
    var abImg     = document.getElementById('abImg');
    var abBtn     = document.getElementById('abBtn');
    if (!section) return;

    /* ─── Shared ScrollTrigger config ─── */
    var ST_BASE = {
      trigger:  section,
      start:    'top 75%',
      end:      'bottom 20%',
      toggleActions: 'play none none reverse'
    };

    /* ─── 1. Section number + line ─── */
    gsap.from('.ab-num', {
      opacity: 0, y: 20, duration: .7, ease: EO,
      scrollTrigger: ST_BASE
    });
    gsap.from('.ab-num-line', {
      scaleX: 0, duration: .8, ease: EO, delay: .15,
      scrollTrigger: ST_BASE
    });

    /* ─── 2. ABOUT US label ─── */
    gsap.from('.ab-label', {
      opacity: 0, y: 16, duration: .65, ease: EO, delay: .2,
      scrollTrigger: ST_BASE
    });

    /* ─── 3. Heading — staggered line reveal (mask-up) ─── */
    gsap.from('.ab-line', {
      y: '105%',
      opacity: 0,
      duration: .9,
      stagger: .12,
      ease: EO,
      delay: .3,
      scrollTrigger: ST_BASE
    });

    /* ─── 4. Divider ─── */
    gsap.from('.ab-divider', {
      scaleX: 0, duration: .7, ease: EIO, delay: .6,
      scrollTrigger: ST_BASE
    });

    /* ─── 5. Paragraph ─── */
    gsap.from('.ab-para', {
      opacity: 0, y: 18, duration: .75, ease: EO, delay: .7,
      scrollTrigger: ST_BASE
    });

    /* ─── 6. CTA button ─── */
    gsap.from('#abBtn', {
      opacity: 0, y: 14, duration: .7, ease: EO, delay: .85,
      scrollTrigger: ST_BASE
    });

    /* ─── 7. Image — fade + subtle zoom in ─── */
    if (abImg) {
      gsap.from(abImg, {
        opacity: 0,
        scale: 1.06,
        duration: 1.4,
        ease: EIO,
        delay: .2,
        scrollTrigger: Object.assign({}, ST_BASE, { start: 'top 80%' }),
        onComplete: function () {
          abImg.classList.add('revealed');
        }
      });
    }

    /* ─── 8. Brand ring — fade in from right ─── */
    gsap.from('#abBrandRing', {
      opacity: 0,
      x: 40,
      duration: 1.1,
      ease: EO,
      delay: .5,
      scrollTrigger: Object.assign({}, ST_BASE, { start: 'top 70%' })
    });

    /* ─── 9. Ghost circle — fade in ─── */
    gsap.from('.ab-ghost-circle', {
      opacity: 0,
      scale: .9,
      duration: 1.4,
      ease: EIO,
      scrollTrigger: Object.assign({}, ST_BASE, { start: 'top 80%' })
    });

    /* ─── 10. Arc — fade in ─── */
    gsap.from('.ab-arc', {
      opacity: 0,
      x: -30,
      duration: 1.1,
      ease: EO,
      delay: .3,
      scrollTrigger: ST_BASE
    });

    /* ─── 11. CTA hover cursor enlargement ─── */
    if (abBtn) {
      var cursorRing = document.getElementById('cursorRing');
      if (cursorRing) {
        abBtn.addEventListener('mouseenter', function () {
          gsap.to(cursorRing, { scale: 2.2, duration: .3, ease: EO });
        });
        abBtn.addEventListener('mouseleave', function () {
          gsap.to(cursorRing, { scale: 1, duration: .3, ease: EO });
        });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAbout);
  } else {
    initAbout();
  }

})();

/* ============================================================
   SERVICES SECTION — GSAP SCROLL ANIMATIONS
   ============================================================ */
(function () {
  'use strict';

  function initServices() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    var EO  = 'power3.out';
    var EIO = 'power2.inOut';
    var section = document.getElementById('services');
    if (!section) return;

    var ST = {
      trigger: section,
      start: 'top 78%',
      toggleActions: 'play none none reverse'
    };

    /* ─── Meta: 02 number + label ─── */
    gsap.from('.sv-num', {
      opacity: 0, y: 18, duration: .7, ease: EO,
      scrollTrigger: ST
    });
    gsap.from('.sv-meta-line', {
      scaleX: 0, duration: .6, ease: EO, delay: .15,
      scrollTrigger: ST
    });
    gsap.from('.sv-label', {
      opacity: 0, x: -12, duration: .65, ease: EO, delay: .22,
      scrollTrigger: ST
    });

    /* ─── Horizontal rule ─── */
    gsap.from('.sv-rule', {
      scaleX: 0,
      transformOrigin: 'left',
      duration: 1.1,
      ease: EIO,
      delay: .3,
      scrollTrigger: ST
    });

    /* ─── Separators ─── */
    gsap.from('.sv-sep', {
      scaleY: 0,
      transformOrigin: 'top',
      duration: .9,
      stagger: .15,
      ease: EIO,
      delay: .6,
      scrollTrigger: ST
    });

    /* ─── Service items: staggered slide-up ─── */
    gsap.from('.sv-item', {
      opacity: 0,
      y: 55,
      duration: .85,
      stagger: .18,
      ease: EO,
      delay: .35,
      scrollTrigger: ST
    });

    /* ─── Icon circles: scale in ─── */
    gsap.from('.sv-icon-circle', {
      scale: 0.72,
      opacity: 0,
      duration: .9,
      stagger: .18,
      ease: 'back.out(1.4)',
      delay: .55,
      scrollTrigger: ST
    });

    /* ─── CTA circles: scale in ─── */
    gsap.from('.sv-cta', {
      scale: 0,
      opacity: 0,
      duration: .6,
      stagger: .18,
      ease: 'back.out(2)',
      delay: .75,
      scrollTrigger: ST
    });

    /* ─── Cursor enlargement on hover ─── */
    var cursorRing = document.getElementById('cursorRing');
    if (cursorRing) {
      document.querySelectorAll('.sv-item').forEach(function (item) {
        item.addEventListener('mouseenter', function () {
          gsap.to(cursorRing, { scale: 2.0, duration: .3, ease: EO });
        });
        item.addEventListener('mouseleave', function () {
          gsap.to(cursorRing, { scale: 1, duration: .3, ease: EO });
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initServices);
  } else {
    initServices();
  }

})();

/* ============================================================
   PORTFOLIO — Infinite marquee + Swiper reels
   ============================================================ */
(function () {
  'use strict';

  /* ── GSAP infinite marquee ── */
  function initPortfolio() {
    if (typeof gsap === 'undefined') return;

    var track   = document.getElementById('pfTrack');
    var mask    = document.getElementById('pfMask');
    var pfPrev  = document.getElementById('pfPrev');
    var pfNext  = document.getElementById('pfNext');
    if (!track) return;

    /* ── Speed state ── */
    var BASE_SPEED = 0.55;   // px per frame (normal)
    var SLOW_SPEED = 0.14;   // px per frame (hover)
    var speed      = BASE_SPEED;
    var targetSpeed= BASE_SPEED;
    var xPos       = 0;
    var halfW      = 0;      // half of total track width (one set)
    var nudge      = 0;      // manual arrow nudge px
    var rafId;

    /* Wait for images to load so scrollWidth is accurate */
    function startMarquee() {
      halfW = track.scrollWidth / 2;

      function tick() {
        /* Smooth speed transition */
        speed += (targetSpeed - speed) * 0.08;

        xPos -= (speed + nudge);
        nudge *= 0.88; /* decay manual nudge */

        /* Seamless reset — when first set scrolled out, jump back */
        if (Math.abs(xPos) >= halfW) {
          xPos += halfW;
        }

        gsap.set(track, { x: xPos });
        rafId = requestAnimationFrame(tick);
      }

      rafId = requestAnimationFrame(tick);
    }

    /* Start after short delay to ensure layout is done */
    setTimeout(startMarquee, 120);

    /* ── Hover: slow down ── */
    if (mask) {
      mask.addEventListener('mouseenter', function () { targetSpeed = SLOW_SPEED; });
      mask.addEventListener('mouseleave', function () { targetSpeed = BASE_SPEED; });
    }

    /* ── Arrow buttons: nudge ── */
    if (pfPrev) pfPrev.addEventListener('click', function () { nudge -= 8; });
    if (pfNext) pfNext.addEventListener('click', function () { nudge += 8; });

    /* ── ScrollTrigger: left column entrance ── */
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      var section = document.getElementById('portfolio');
      var ST = {
        trigger: section,
        start: 'top 78%',
        toggleActions: 'play none none reverse'
      };
      var EO = 'power3.out';

      gsap.from('.pf-num',     { opacity:0, y:18, duration:.7, ease:EO, scrollTrigger:ST });
      gsap.from('.pf-num-bar', { scaleX:0, duration:.7, ease:EO, delay:.12, scrollTrigger:ST });
      gsap.from('.pf-label',   { opacity:0, x:-14, duration:.65, ease:EO, delay:.2, scrollTrigger:ST });
      gsap.from('.pf-heading', { opacity:0, y:28, duration:.9, ease:EO, delay:.28, scrollTrigger:ST });
      gsap.from('.pf-divider', { scaleX:0, duration:.7, ease:'power2.inOut', delay:.5, scrollTrigger:ST });
      gsap.from('#pfCta',      { opacity:0, y:14, duration:.7, ease:EO, delay:.6, scrollTrigger:ST });
      gsap.from('.pf-arrows',  { opacity:0, y:10, duration:.6, ease:EO, delay:.72, scrollTrigger:ST });

      /* Track fades in from right */
      gsap.from('.pf-right', {
        opacity:0, x:60, duration:1.1, ease:EO, delay:.2,
        scrollTrigger:ST
      });

      /* Reels section */
      var rlSection = document.getElementById('reels');
      if (rlSection) {
        gsap.from('.rl-head', {
          opacity:0, y:20, duration:.7, ease:EO,
          scrollTrigger:{ trigger:rlSection, start:'top 82%', toggleActions:'play none none reverse' }
        });
        gsap.from('.rl-card', {
          opacity:0, y:30, duration:.7, stagger:.1, ease:EO, delay:.2,
          scrollTrigger:{ trigger:rlSection, start:'top 80%', toggleActions:'play none none reverse' }
        });
      }
    }

    /* ── Cursor enlargement on card hover ── */
    var cursorRing = document.getElementById('cursorRing');
    if (cursorRing) {
      document.querySelectorAll('.pf-card').forEach(function (c) {
        c.addEventListener('mouseenter', function () {
          gsap.to(cursorRing, { scale: 2.4, duration:.3, ease:'power3.out' });
        });
        c.addEventListener('mouseleave', function () {
          gsap.to(cursorRing, { scale: 1, duration:.3, ease:'power3.out' });
        });
      });
    }
  }

  /* ── Swiper reels ── */
  function initReels() {
    if (typeof Swiper === 'undefined') return;
    var swiper = new Swiper('#rlSwiper', {
      slidesPerView: 'auto',
      spaceBetween: 14,
      freeMode: true,
      grabCursor: false,
      touchEventsTarget: 'wrapper',
      navigation: {
        prevEl: '#rlPrev',
        nextEl: '#rlNext'
      },
      breakpoints: {
        560: { spaceBetween: 16 },
        900: { spaceBetween: 18 }
      }
    });

    // Custom Video Player Logic
    document.querySelectorAll('.rl-card').forEach(function (card) {
      card.addEventListener('click', function () {
        if (!this.classList.contains('playing')) {
          activateCustomPlayer(this);
        }
      });

      // Cursor enlargement on hover
      var cursorRing = document.getElementById('cursorRing');
      if (cursorRing) {
        card.addEventListener('mouseenter', function () {
          if (!this.classList.contains('playing')) {
            gsap.to(cursorRing, { scale: 2.2, duration: 0.3, ease: 'power3.out' });
          }
        });
        card.addEventListener('mouseleave', function () {
          gsap.to(cursorRing, { scale: 1, duration: 0.3, ease: 'power3.out' });
        });
      }
    });

    function activateCustomPlayer(card) {
      var video = card.querySelector('.rl-main-video');
      if (!video) return;

      card.classList.add('playing');

      // 1. Create Controls UI Overlay
      var controlsOverlay = document.createElement('div');
      controlsOverlay.className = 'rl-video-container';
      controlsOverlay.innerHTML = `
        <button class="rl-close-reel" aria-label="Close Reel">&times;</button>
        <div class="rl-center-play">
          <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
        </div>
        <div class="rl-controls">
          <div class="rl-bottom-ctrl">
             <div class="rl-ctrl-row">
                <div style="display:flex; align-items:center; gap:10px;">
                  <button class="rl-play-pause-btn" aria-label="Play/Pause">
                    <svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  </button>
                  <button class="rl-mute-btn" aria-label="Mute/Unmute">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                  </button>
                </div>
                <div class="rl-time-display">0:00 / 0:00</div>
             </div>
            <div class="rl-progress-wrap">
              <div class="rl-progress-bar">
                <div class="rl-progress-thumb"></div>
              </div>
            </div>
          </div>
        </div>
      `;

      card.appendChild(controlsOverlay);

      // Start Playback
      video.muted = false;
      video.play();
      video.style.filter = 'none';
      video.style.zIndex = '15';

      var playPauseBtn = controlsOverlay.querySelector('.rl-play-pause-btn');
      var muteBtn = controlsOverlay.querySelector('.rl-mute-btn');
      var progBar = controlsOverlay.querySelector('.rl-progress-bar');
      var progWrap = controlsOverlay.querySelector('.rl-progress-wrap');
      var closeBtn = controlsOverlay.querySelector('.rl-close-reel');
      var timeDisplay = controlsOverlay.querySelector('.rl-time-display');

      function formatTime(seconds) {
        var min = Math.floor(seconds / 60);
        var sec = Math.floor(seconds % 60);
        return min + ":" + (sec < 10 ? "0" + sec : sec);
      }

      // Play/Pause Toggle
      function togglePlay() {
        if (video.paused) {
          video.play();
          controlsOverlay.classList.remove('paused');
          playPauseBtn.innerHTML = '<svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
        } else {
          video.pause();
          controlsOverlay.classList.add('paused');
          playPauseBtn.innerHTML = '<svg class="icon-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        }
      }

      playPauseBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        togglePlay();
      });

      // Mute Toggle
      muteBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        video.muted = !video.muted;
        muteBtn.style.opacity = video.muted ? '0.4' : '1';
        muteBtn.style.color = video.muted ? '#fff' : '#FF5A1F';
      });

      // Progress & Time Update
      var updateProgress = function () {
        var pct = (video.currentTime / video.duration) * 100;
        progBar.style.width = pct + '%';
        timeDisplay.innerText = formatTime(video.currentTime) + " / " + formatTime(video.duration || 0);
      };
      video.addEventListener('timeupdate', updateProgress);

      // --- Scrubbing (Drag to seek) logic ---
      var isDragging = false;
      function scrub(e) {
        var rect = progWrap.getBoundingClientRect();
        var pos = (e.clientX - rect.left) / rect.width;
        pos = Math.max(0, Math.min(1, pos));
        video.currentTime = pos * video.duration;
      }

      var onMouseDown = function (e) {
        isDragging = true;
        progWrap.classList.add('dragging');
        scrub(e);
      };
      var onMouseMove = function (e) {
        if (isDragging) scrub(e);
      };
      var onMouseUp = function () {
        if (isDragging) {
          isDragging = false;
          progWrap.classList.remove('dragging');
        }
      };

      progWrap.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);

      // Toggle Play/Pause on Card Click
      controlsOverlay.addEventListener('click', function (e) {
        if (e.target.closest('.rl-close-reel') || e.target.closest('.rl-mute-btn') || e.target.closest('.rl-progress-wrap') || e.target.closest('.rl-play-pause-btn')) return;
        togglePlay();
      });

      // Close Player
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        video.pause();
        video.currentTime = 0;
        video.style.filter = '';
        video.style.zIndex = '';
        
        // Cleanup listeners
        video.removeEventListener('timeupdate', updateProgress);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        gsap.to(controlsOverlay, {
          opacity: 0, duration: 0.3, onComplete: function () {
            controlsOverlay.remove();
            card.classList.remove('playing');
          }
        });
      });
    }
  }

  function init() {
    initPortfolio();
    initReels();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

/* ============================================================
   TESTIMONIAL SECTION — Auto-slider + Video play
   ============================================================ */
(function () {
  'use strict';

  function initTestimonial() {
    if (typeof gsap === 'undefined') return;

    var EO  = 'power3.out';
    var EI  = 'power2.in';
    var INTERVAL_MS = 5000;

    var slides   = document.querySelectorAll('.tm-slide');
    var dots     = document.querySelectorAll('.tm-dot');
    var playBtn  = document.getElementById('tmPlayBtn');
    var ringWrap = document.getElementById('tmRingWrap');
    var poster   = document.getElementById('tmPoster');
    var video    = document.getElementById('tmVideo');
    var section  = document.getElementById('testimonial');

    if (!slides.length) return;

    /* ── Init: show slide 0 ── */
    var cur   = 0;
    var total = slides.length;
    var timer = null;
    var busy  = false;

    slides[0].classList.add('is-active');
    gsap.set(slides[0], { opacity: 1, y: 0 });
    for (var i = 1; i < total; i++) {
      gsap.set(slides[i], { opacity: 0, y: 30 });
    }

    /* ── Transition ── */
    function goTo(next) {
      if (busy || next === cur) return;
      busy = true;
      var prev   = cur; cur = next;
      var prevEl = slides[prev];
      var nextEl = slides[next];

      gsap.to(prevEl, {
        opacity: 0, y: -22, duration: .42, ease: EI,
        onComplete: function () {
          prevEl.classList.remove('is-active');
          gsap.set(prevEl, { y: 30 });
          nextEl.classList.add('is-active');
          gsap.fromTo(nextEl,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: .65, ease: EO,
              onComplete: function () { busy = false; }
            }
          );
        }
      });

      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === next);
      });
    }

    /* ── Auto cycle ── */
    function startTimer() {
      clearInterval(timer);
      timer = setInterval(function () { goTo((cur + 1) % total); }, INTERVAL_MS);
    }
    startTimer();

    /* ── Dot click ── */
    dots.forEach(function (d) {
      d.addEventListener('click', function () {
        goTo(parseInt(d.dataset.idx));
        startTimer();
      });
    });

    /* ── VIDEO PLAY ── */
    if (playBtn && video && poster && ringWrap) {
      playBtn.addEventListener('click', function () {
        gsap.timeline()
          .to(ringWrap, { opacity: 0, scale: .85, duration: .4, ease: EI,
              onComplete: function () { ringWrap.classList.add('hidden'); }
            })
          .to(poster, { opacity: 0, duration: .5, ease: 'power2.inOut' }, '-=.15')
          .add(function () {
            poster.classList.add('hidden');
            video.classList.add('playing');
            video.play();
          });
      });

      video.addEventListener('ended', function () {
        video.classList.remove('playing');
        poster.classList.remove('hidden');
        gsap.set(poster, { opacity: 0 });
        ringWrap.classList.remove('hidden');
        gsap.set(ringWrap, { opacity: 0, scale: .85 });
        gsap.timeline()
          .to(poster,   { opacity: 1, duration: .6, ease: EO })
          .to(ringWrap, { opacity: 1, scale: 1, duration: .6, ease: EO }, '-=.3');
      });
    }

    /* ── ScrollTrigger entry ── */
    if (typeof ScrollTrigger !== 'undefined' && section) {
      gsap.registerPlugin(ScrollTrigger);
      var ST = { trigger: section, start: 'top 78%', toggleActions: 'play none none reverse' };
      gsap.from('.tm-num',        { opacity:0, y:18, duration:.7,  ease:EO, scrollTrigger:ST });
      gsap.from('.tm-meta-bar',   { scaleX:0,        duration:.6,  ease:EO, delay:.12, scrollTrigger:ST });
      gsap.from('.tm-label',      { opacity:0, x:-12, duration:.6,  ease:EO, delay:.2,  scrollTrigger:ST });
      gsap.from('.tm-quote-icon', { opacity:0, y:20,  duration:.7,  ease:EO, delay:.3,  scrollTrigger:ST });
      gsap.from('#tmSlides',      { opacity:0, y:28,  duration:.8,  ease:EO, delay:.4,  scrollTrigger:ST });
      gsap.from('.tm-dots',       { opacity:0, y:12,  duration:.6,  ease:EO, delay:.6,  scrollTrigger:ST });
      gsap.from('#tmRight',  { opacity:0, x:50,   duration:1.1, ease:EO, delay:.25, scrollTrigger:ST });
      gsap.from('#tmRingWrap',{ opacity:0, scale:.8, duration:1.1, ease:'back.out(1.3)', delay:.5, scrollTrigger:ST });
    }

    /* ── Cursor ── */
    var cursorRing = document.getElementById('cursorRing');
    if (playBtn && cursorRing) {
      playBtn.addEventListener('mouseenter', function () { gsap.to(cursorRing, { scale:2.4, duration:.3, ease:EO }); });
      playBtn.addEventListener('mouseleave', function () { gsap.to(cursorRing, { scale:1,   duration:.3, ease:EO }); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTestimonial);
  } else {
    initTestimonial();
  }

})();

/* ============================================================
   FINAL CTA SECTION (06) — GSAP SCROLL ANIMATIONS
   ============================================================ */
(function () {
  'use strict';

  function initCtaFinal() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    var EO  = 'power3.out';
    var EIO = 'power2.inOut';

    var section    = document.getElementById('ctaFinal');
    var cfImg      = document.getElementById('cfImg');
    var cfBtn      = document.getElementById('cfBtn');
    var cursorRing = document.getElementById('cursorRing');

    if (!section) return;

    /* ── Shared ScrollTrigger base ── */
    var ST = {
      trigger: section,
      start: 'top 72%',
      end: 'bottom 15%',
      toggleActions: 'play none none reverse'
    };

    /* ─── 1. Section number ─── */
    gsap.from('#cfNum', {
      opacity: 0, y: 20, duration: .7, ease: EO,
      scrollTrigger: ST
    });
    gsap.from('.cf-num-line', {
      scaleX: 0, duration: .8, ease: EO, delay: .15,
      scrollTrigger: ST
    });

    /* ─── 2. Heading lines — staggered mask-up reveal ─── */
    gsap.from('.cf-line', {
      y: '110%',
      opacity: 0,
      duration: 1.0,
      stagger: .16,
      ease: EO,
      delay: .2,
      scrollTrigger: ST
    });

    /* ─── 3. Subtext fade ─── */
    gsap.from('#cfSub', {
      opacity: 0, y: 20, duration: .75, ease: EO, delay: .55,
      scrollTrigger: ST
    });

    /* ─── 4. Button scale + fade ─── */
    gsap.from('#cfBtn', {
      opacity: 0, scale: .92, y: 14, duration: .72, ease: 'back.out(1.6)', delay: .72,
      scrollTrigger: ST
    });

    /* ─── 5. Image — fade in + slight zoom ─── */
    if (cfImg) {
      gsap.from(cfImg, {
        opacity: 0,
        scale: 1.08,
        duration: 1.6,
        ease: EIO,
        delay: .15,
        scrollTrigger: Object.assign({}, ST, { start: 'top 80%' }),
        onComplete: function () { cfImg.classList.add('cf-revealed'); }
      });
    }

    /* ─── 6. Circle — fade in then rotate (CSS handles ongoing rotation) ─── */
    gsap.from('#cfCircleWrap', {
      opacity: 0,
      scale: .85,
      duration: 1.4,
      ease: EIO,
      delay: .3,
      scrollTrigger: Object.assign({}, ST, { start: 'top 78%' })
    });

    /* ─── 7. Cursor enlargement on button hover ─── */
    if (cfBtn && cursorRing) {
      cfBtn.addEventListener('mouseenter', function () {
        gsap.to(cursorRing, { scale: 2.4, duration: .3, ease: EO });
      });
      cfBtn.addEventListener('mouseleave', function () {
        gsap.to(cursorRing, { scale: 1, duration: .3, ease: EO });
      });
    }

    /* ─── 8. Right panel hover — cursor expand ─── */
    var cfRight = document.getElementById('cfRight');
    if (cfRight && cursorRing) {
      cfRight.addEventListener('mouseenter', function () {
        gsap.to(cursorRing, { scale: 1.6, duration: .3, ease: EO });
      });
      cfRight.addEventListener('mouseleave', function () {
        gsap.to(cursorRing, { scale: 1, duration: .3, ease: EO });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCtaFinal);
  } else {
    initCtaFinal();
  }

})();


/* ============================================================
   FOOTER SECTION — GSAP SCROLL ANIMATIONS
   ============================================================ */
(function () {
  'use strict';

  function initFooter() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    var footer = document.getElementById('footer');
    if (!footer) return;

    var ST = {
      trigger: footer,
      start: 'top 85%',
      toggleActions: 'play none none reverse'
    };

    var tl = gsap.timeline({ scrollTrigger: ST });

    /* 1. Background image subtle fade + scale */
    tl.from('.footer-img', {
      opacity: 0,
      scale: 1.2,
      duration: 1.5,
      ease: 'power2.out'
    });

    /* 2. Staggered column entrance */
    tl.from('.footer-col', {
      opacity: 0,
      y: 40,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    }, '-=1.2');

    /* 3. Bottom bar fade in */
    tl.from('.f-bottom', {
      opacity: 0,
      duration: 1,
      ease: 'power2.out'
    }, '-=0.4');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFooter);
  } else {
    initFooter();
  }

})();


