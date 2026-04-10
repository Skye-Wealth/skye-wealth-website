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

/* ── HERO AURORA ─────────────────────────────────── */
(function() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);
  const orbs = [
    { color:'#ffffff', cx:.75, cy:.20, rx:.18, ry:.12, r:.55, spd:.00028, ph:0.0, a0:'55', a1:'20' },
    { color:'#ffffff', cx:.20, cy:.65, rx:.14, ry:.14, r:.45, spd:.00022, ph:2.1, a0:'40', a1:'10' },
    { color:'#c0392b', cx:.85, cy:.70, rx:.15, ry:.18, r:.50, spd:.00035, ph:1.4, a0:'50', a1:'18' },
    { color:'#fee290', cx:.45, cy:.12, rx:.10, ry:.10, r:.35, spd:.00044, ph:3.8, a0:'45', a1:'12' },
    { color:'#c0392b', cx:.10, cy:.30, rx:.10, ry:.15, r:.40, spd:.00038, ph:5.0, a0:'45', a1:'10' },
    { color:'#ffffff', cx:.55, cy:.85, rx:.12, ry:.08, r:.30, spd:.00050, ph:4.4, a0:'35', a1:'08' },
  ];
  let t = 0;
  function draw() {
    t += 16; ctx.clearRect(0, 0, W, H);
    orbs.forEach(o => {
      const x = W * o.cx + Math.cos(t * o.spd + o.ph) * W * o.rx;
      const y = H * o.cy + Math.sin(t * o.spd * 1.3 + o.ph) * H * o.ry;
      const r = Math.min(W, H) * o.r;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, o.color + o.a0); g.addColorStop(.5, o.color + o.a1); g.addColorStop(1, o.color + '00');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ── CTA AURORA ──────────────────────────────────── */
(function() {
  const canvas = document.getElementById('cta-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);
  const orbs = [
    { color:'#f26861', cx:.2, cy:.5, rx:.3, ry:.3, r:.6, spd:.00028, ph:0 },
    { color:'#c39bbd', cx:.8, cy:.5, rx:.3, ry:.3, r:.5, spd:.00022, ph:2 },
  ];
  let t = 0;
  function draw() {
    t += 16; ctx.clearRect(0, 0, W, H);
    orbs.forEach(o => {
      const x = W * o.cx + Math.cos(t * o.spd + o.ph) * W * o.rx;
      const y = H * o.cy + Math.sin(t * o.spd + o.ph) * H * o.ry;
      const r = Math.min(W, H) * o.r;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, o.color + '28'); g.addColorStop(1, o.color + '00');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ── SPLASH → HERO SEQUENCE ──────────────────────── */
const splash     = document.getElementById('splash');
const splashLogo = document.getElementById('splash-logo');
gsap.set(['.hero-heading', '.hero-sub', '.hero-actions', nav], { autoAlpha: 0 });

gsap.timeline()
  .from(splashLogo, { scale: .88, autoAlpha: 0, duration: .75, ease: 'power3.out' })
  .to({}, { duration: .75 })
  .to(splashLogo, { scale: 1.1, autoAlpha: 0, duration: .65, ease: 'power2.in' })
  .to(splash, { autoAlpha: 0, duration: .55, ease: 'power2.inOut',
    onComplete: () => splash.style.display = 'none' }, '-=0.35')
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

/* ── SKYE TV ENTRANCE ────────────────────────────── */
(function () {
  // Wrap each heading word in a clip container so text rises from nothing
  document.querySelectorAll('.tv-heading .t-skye, .tv-heading .t-tv').forEach(el => {
    el.style.display = 'block';
    el.style.overflow = 'hidden';
    el.innerHTML = `<span class="tv-word-inner" style="display:block">${el.innerHTML}</span>`;
  });

  const tl = gsap.timeline({
    scrollTrigger: { trigger: '.skye-tv', start: 'top 82%', once: true },
  });

  tl.from('.tv-heading .t-skye .tv-word-inner', {
    yPercent: 110, duration: .9, ease: 'power4.out',
  })
  .from('.tv-heading .t-tv .tv-word-inner', {
    yPercent: 110, duration: .95, ease: 'power4.out',
  }, '-=.65')
  .from('.tv-sub', {
    y: 20, opacity: 0, duration: .7, ease: 'power2.out',
  }, '-=.5')
  .from('.tv-header .btn', {
    y: 16, opacity: 0, duration: .6, ease: 'power2.out',
  }, '-=.5')
  .from('.tv-tabs .tv-tab', {
    y: 16, opacity: 0, duration: .5, ease: 'power2.out', stagger: .05,
  }, '-=.4')
  .from('.skye-tv .pop', {
    y: 32, opacity: 0, scale: .97, duration: .65, ease: 'power2.out', stagger: .07,
    transformOrigin: 'center bottom',
  }, '-=.25');
})();

/* ── SKYE TV TABS ────────────────────────────────── */
document.querySelectorAll('.tv-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tv-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});
