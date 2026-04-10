/* ── SMOOTH SCROLL ───────────────────────────────── */
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
gsap.registerPlugin(ScrollTrigger);

/* ── NAV GLASS ON SCROLL ─────────────────────────── */
const nav = document.getElementById('nav');
ScrollTrigger.create({
  trigger: '#hero',
  start: 'bottom 72px',
  onEnter:     () => nav.classList.add('is-glass'),
  onLeaveBack: () => nav.classList.remove('is-glass'),
});

/* ── NAV DARK-BG SECTIONS ────────────────────────── */
['#skye-tv', 'footer'].forEach(sel => {
  const el = document.querySelector(sel);
  if (!el) return;
  ScrollTrigger.create({
    trigger: el,
    start: 'top 72px',
    end:   'bottom 72px',
    onEnter:     () => nav.classList.add('nav--on-dark'),
    onLeave:     () => nav.classList.remove('nav--on-dark'),
    onEnterBack: () => nav.classList.add('nav--on-dark'),
    onLeaveBack: () => nav.classList.remove('nav--on-dark'),
  });
});

/* ── AURORA FACTORY ──────────────────────────────── */
function makeAurora(id, orbs) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, rafId;

  function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
  resize();
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  }, { passive: true });

  function draw(ts) {
    ctx.clearRect(0, 0, W, H);
    orbs.forEach(o => {
      const x = W * o.cx + Math.cos(ts * o.spd + o.ph) * W * o.rx;
      const y = H * o.cy + Math.sin(ts * o.spd * 1.3 + o.ph) * H * o.ry;
      const r = Math.min(W, H) * o.r;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, o.color + (o.a0 || '28'));
      g.addColorStop(o.a1 ? .5 : 1, o.color + (o.a1 || '00'));
      if (o.a1) g.addColorStop(1, o.color + '00');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    });
    rafId = requestAnimationFrame(draw);
  }

  // Pause when scrolled out of view
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { rafId = requestAnimationFrame(draw); }
    else { cancelAnimationFrame(rafId); }
  }, { threshold: 0 }).observe(canvas);
}

makeAurora('hero-canvas', [
  { color:'#ffffff', cx:.75, cy:.20, rx:.18, ry:.12, r:.55, spd:.00028, ph:0.0, a0:'55', a1:'20' },
  { color:'#ffffff', cx:.20, cy:.65, rx:.14, ry:.14, r:.45, spd:.00022, ph:2.1, a0:'40', a1:'10' },
  { color:'#c0392b', cx:.85, cy:.70, rx:.15, ry:.18, r:.50, spd:.00035, ph:1.4, a0:'50', a1:'18' },
  { color:'#fee290', cx:.45, cy:.12, rx:.10, ry:.10, r:.35, spd:.00044, ph:3.8, a0:'45', a1:'12' },
  { color:'#c0392b', cx:.10, cy:.30, rx:.10, ry:.15, r:.40, spd:.00038, ph:5.0, a0:'45', a1:'10' },
  { color:'#ffffff', cx:.55, cy:.85, rx:.12, ry:.08, r:.30, spd:.00050, ph:4.4, a0:'35', a1:'08' },
]);

makeAurora('cta-canvas', [
  { color:'#f26861', cx:.2, cy:.5, rx:.3, ry:.3, r:.6, spd:.00028, ph:0 },
  { color:'#c39bbd', cx:.8, cy:.5, rx:.3, ry:.3, r:.5, spd:.00022, ph:2 },
]);

/* ── SPLASH → HERO SEQUENCE ──────────────────────── */
const splash      = document.getElementById('splash');
const splashLogo  = document.getElementById('splash-logo');
const strokePaths = splashLogo.querySelectorAll('.sp');
const strokeLayer = document.getElementById('splash-strokes');
const fillLayer   = document.getElementById('splash-fill');

// Measure each path and set up stroke-dasharray
strokePaths.forEach(path => {
  const len = path.getTotalLength();
  gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
});
gsap.set(fillLayer, { autoAlpha: 0 });
gsap.set(['.hero-heading', '.hero-sub', '.hero-actions', nav], { autoAlpha: 0 });

gsap.timeline()
  // Fade in logo at normal scale
  .from(splashLogo, { autoAlpha: 0, duration: .4, ease: 'power2.out' })
  // Draw each path's stroke sequentially
  .to(strokePaths, {
    strokeDashoffset: 0,
    duration: 1.6,
    ease: 'power2.inOut',
    stagger: .18,
  })
  // Crossfade: fill floods in, strokes fade out
  .to(fillLayer,   { autoAlpha: 1, duration: .45, ease: 'power2.out' }, '-=.2')
  .to(strokeLayer, { autoAlpha: 0, duration: .35, ease: 'power1.in'  }, '<')
  // Hold, then exit
  .to({}, { duration: .55 })
  .to(splashLogo, { scale: 1.08, autoAlpha: 0, duration: .6, ease: 'power2.in' })
  .to(splash, { autoAlpha: 0, duration: .5, ease: 'power2.inOut',
    onComplete: () => splash.style.display = 'none' }, '-=0.3')
  .fromTo(nav, { autoAlpha: 0, y: -50 }, { autoAlpha: 1, y: 0, duration: .7, ease: 'power3.out' }, '-=0.1')
  .to('.hero-heading', { autoAlpha: 1, duration: .01 }, '-=0.3')
  .from('.hero-heading .inner', { y: '105%', duration: 1, ease: 'power4.out', stagger: .14 }, '<')
  .to('.hero-word-reveal', { color: '#fee290', duration: 2.6, ease: 'power2.inOut' }, '-=0.2')
  .fromTo('.hero-sub', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .7, ease: 'power3.out' }, '-=2.1')
  .to('.hero-actions', { autoAlpha: 1, duration: .01 }, '-=0.4')
  .from('.hero-actions .btn', { y: 16, scale: .95, duration: .6, ease: 'back.out(1.8)', stagger: .1 }, '<');

/* ── HERO BG SCROLL BLEND ────────────────────────── */
gsap.to('#hero', {
  backgroundColor: '#ffffff', ease: 'none',
  scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.2 },
});

/* ── REVEAL LINES ────────────────────────────────── */
document.querySelectorAll('.reveal-line .inner').forEach(el => {
  if (el.closest('.hero-heading') || el.closest('.cta-heading')) return;
  gsap.from(el, {
    y: '105%', duration: .9, ease: 'power4.out',
    scrollTrigger: { trigger: el.closest('.reveal-line'), start: 'top 82%' },
  });
});

/* ── SCROLL POPS ─────────────────────────────────── */
gsap.utils.toArray('.pop').forEach((el, i) => {
  gsap.from(el, {
    scale: .9, y: 28, autoAlpha: 0, duration: .65, ease: 'back.out(2)',
    scrollTrigger: { trigger: el, start: 'top 85%' },
    delay: (i % 4) * 0.08,
  });
});

/* ── WHY CARDS — tilt follow ─────────────────────── */
document.querySelectorAll('.why-card').forEach(card => {
  card.addEventListener('mouseenter', () => card.classList.add('is-hovered'));
  card.addEventListener('mouseleave', () => {
    card.classList.remove('is-hovered');
    gsap.to(card, {
      rotateX: 0, rotateY: 0, scale: 1,
      duration: .7, ease: 'elastic.out(1, .55)',
      transformPerspective: 1200,
    });
  });
  card.addEventListener('mousemove', e => {
    const r   = card.getBoundingClientRect();
    const px  = (e.clientX - r.left) / r.width  - .5;  // -0.5 → 0.5
    const py  = (e.clientY - r.top)  / r.height - .5;
    gsap.to(card, {
      rotateY:  px * 14,
      rotateX: -py * 10,
      scale:    1.035,
      duration: .45,
      ease:     'power2.out',
      transformPerspective: 1200,
    });
  });
});

/* ── MAGNETIC BUTTONS ────────────────────────────── */
document.querySelectorAll('.mag').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    gsap.to(btn, { x: x * .35, y: y * .35, duration: .4, ease: 'power2.out' });
  });
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,0.5)' });
  });
});

/* ── SERVICES — pure CSS sticky stack, no JS needed ─ */

/* ── STATEMENT POPS ──────────────────────────────── */
gsap.from('.stat-box', {
  scrollTrigger: { trigger: '.statement-stats', start: 'top 82%' },
  scale: .88, opacity: 0, y: 20, duration: .65, ease: 'back.out(2)', stagger: .09,
});

/* ── SKYE TV TABS ────────────────────────────────── */
document.querySelectorAll('.tv-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tv-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});
