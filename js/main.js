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

/* ── CARD STACK ──────────────────────────────────── */
(function() {
  const COVERS = [
    {
      icon: '🛡️', tag: 'Income Protection', title: 'Income Protection',
      lead: 'Your income is your single greatest financial asset. Income protection replaces up to 70% of your salary if illness or injury stops you working — so your mortgage, your lifestyle and your family stay intact.',
      points: ['Up to 70% of pre-tax income replaced','Benefit periods from 2 years to age 65','Covers illness, injury and mental health','Waiting periods tailored to your situation','Premiums can be tax-deductible'],
      cta: 'Know your income is protected.',
    },
    {
      icon: '⚓', tag: 'TPD Cover', title: 'Total & Permanent Disablement',
      lead: 'If you\'re permanently unable to work, TPD cover pays a lump sum to clear debts, cover ongoing care costs and rebuild your financial foundation — without draining your super.',
      points: ['Lump sum — no repayments ever','Covers mortgage, debts and care costs','Own vs any occupation definitions','Can be held inside or outside super','Tailored to your occupation risk'],
      cta: 'Understand your TPD options.',
    },
    {
      icon: '🏠', tag: 'Death Cover', title: 'Death Cover',
      lead: 'Death cover pays a tax-free lump sum to the people who depend on you. It clears your mortgage, funds your children\'s education and gives your family time to grieve — not worry about money.',
      points: ['Tax-free lump sum to beneficiaries','Clears mortgage and outstanding debts','Funds children\'s education and future','Includes terminal illness benefit','Structured to minimise estate complications'],
      cta: 'Make sure your family is covered.',
    },
    {
      icon: '❤️', tag: 'Trauma Cover', title: 'Trauma Cover',
      lead: 'A cancer diagnosis, heart attack or stroke shouldn\'t also be a financial crisis. Trauma cover pays an immediate lump sum so you can focus entirely on recovery — not bills.',
      points: ['Immediate cash payment on diagnosis','Covers 40+ critical illness conditions','Funds treatment beyond Medicare','Independent from income or super','Combinable with life or TPD cover'],
      cta: 'Know where you stand on trauma.',
    },
  ];

  const stage     = document.getElementById('stack-stage');
  const container = document.getElementById('card-stack');
  const cards     = [...container.querySelectorAll('.stack-card')];
  const counter   = document.getElementById('stack-current');
  const panel     = document.getElementById('cover-panel');

  let current = 0, isDragging = false, startX = 0, dragX = 0;

  function pad(n) { return String(n + 1).padStart(2, '0'); }

  function layout(animate) {
    cards.forEach((card, i) => {
      const pos = (i - current + cards.length) % cards.length;
      const props = { x: pos * 18, y: pos * 14, rotation: pos * 3.5, scale: 1 - pos * .05, zIndex: cards.length - pos,
        opacity: pos === 0 ? 1 : pos === 1 ? .8 : pos === 2 ? .55 : .3 };
      animate ? gsap.to(card, { ...props, duration: .55, ease: 'back.out(1.5)' }) : gsap.set(card, props);
    });
    counter.textContent = pad(current);
  }

  function advance(dir) {
    const top = cards[current];
    const flyX = dir === 'next' ? -560 : 560;
    gsap.to(top, { x: flyX, rotation: flyX > 0 ? -28 : 28, opacity: 0, duration: .42, ease: 'power2.in',
      onComplete: () => {
        gsap.set(top, { x: 0, y: 0, rotation: 0, opacity: 1 });
        current = dir === 'next' ? (current + 1) % cards.length : (current - 1 + cards.length) % cards.length;
        layout(true);
        if (panelOpen) renderPanel(current);
      }
    });
  }

  let panelOpen = false;

  function renderPanel(idx) {
    const d = COVERS[idx];
    document.getElementById('panel-icon').textContent  = d.icon;
    document.getElementById('panel-tag').textContent   = d.tag;
    document.getElementById('panel-title').textContent = d.title;
    document.getElementById('panel-lead').textContent  = d.lead;
    document.getElementById('panel-points').innerHTML  = d.points.map(p => `<li>${p}</li>`).join('');
  }

  function openPanel(idx) {
    renderPanel(idx);
    panel.classList.add('is-open');
    gsap.fromTo(panel,
      { width: 0, opacity: 0, x: 32 },
      { width: 500, opacity: 1, x: 0, duration: .55, ease: 'power3.out' }
    );
    panelOpen = true;
  }

  function closePanel() {
    gsap.to(panel, { width: 0, opacity: 0, x: 32, duration: .4, ease: 'power2.in',
      onComplete: () => panel.classList.remove('is-open')
    });
    panelOpen = false;
  }

  document.getElementById('stack-next').addEventListener('click', () => advance('next'));
  document.getElementById('stack-prev').addEventListener('click', () => advance('prev'));
  document.getElementById('panel-close').addEventListener('click', closePanel);

  container.querySelectorAll('.card-cta').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openPanel(current); });
  });

  container.addEventListener('pointerdown', e => {
    if (e.target.closest('.card-cta')) return;
    isDragging = true; startX = e.clientX; dragX = 0;
    container.setPointerCapture(e.pointerId);
  });
  container.addEventListener('pointermove', e => {
    if (!isDragging) return;
    dragX = e.clientX - startX;
    gsap.set(cards[current], { x: dragX, rotation: dragX * .06 });
  });
  container.addEventListener('pointerup', () => {
    if (!isDragging) return;
    isDragging = false;
    Math.abs(dragX) > 90 ? advance(dragX < 0 ? 'next' : 'prev')
      : gsap.to(cards[current], { x: 0, rotation: 0, duration: .45, ease: 'back.out(1.7)' });
    dragX = 0;
  });

  layout(false);
})();

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
