(function () {
  const nav = document.getElementById('nav');
  if (!nav) return;

  /* ── Hamburger button ─────────────────────────── */
  const btn = document.createElement('button');
  btn.id = 'mob-btn';
  btn.className = 'mob-btn';
  btn.setAttribute('aria-label', 'Open menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span class="mob-line l1"></span><span class="mob-line l2"></span>';
  nav.appendChild(btn);

  /* ── Overlay ──────────────────────────────────── */
  const LINKS = [
    { href: 'life-insurance.html',   label: 'Life Insurance'   },
    { href: 'insurance-review.html', label: 'Insurance Review' },
    { href: 'claims.html',           label: 'Claims'           },
    { href: 'index.html#skye-tv',    label: 'Skye TV'          },
    { href: 'about.html',            label: 'About'            },
    { href: 'blog.html',             label: 'Blog'             },
  ];

  const page = window.location.pathname.split('/').pop() || 'index.html';

  const overlay = document.createElement('div');
  overlay.id = 'mob-menu';
  overlay.className = 'mob-menu';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Navigation menu');

  overlay.innerHTML =
    '<div class="mob-inner">' +
      '<ul class="mob-links">' +
        LINKS.map(function (l, i) {
          var active = (page && l.href.split('#')[0] === page) ? ' is-active' : '';
          return '<li class="mob-item">' +
            '<a href="' + l.href + '" class="mob-link' + active + '">' +
              '<span class="mob-num">0' + (i + 1) + '</span>' +
              '<span class="mob-name">' + l.label + '</span>' +
            '</a>' +
          '</li>';
        }).join('') +
      '</ul>' +
      '<div class="mob-footer">' +
        '<a href="https://www.skye.com.au/phone-call" class="mob-cta-btn">Book a free call →</a>' +
        '<p class="mob-tagline">Life Insurance, Simplified.</p>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);

  /* ── State ────────────────────────────────────── */
  var isOpen = false;
  var focusable = 'a[href], button:not([disabled])';
  var firstFocus, lastFocus;

  function cacheFocus() {
    var els = overlay.querySelectorAll(focusable);
    firstFocus = els[0];
    lastFocus  = els[els.length - 1];
  }

  function openMenu() {
    isOpen = true;
    btn.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Close menu');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    cacheFocus();
    setTimeout(function () { if (firstFocus) firstFocus.focus(); }, 300);
  }

  function closeMenu() {
    isOpen = false;
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Open menu');
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    btn.focus();
  }

  /* ── Events ───────────────────────────────────── */
  btn.addEventListener('click', function () { isOpen ? closeMenu() : openMenu(); });

  overlay.querySelectorAll('.mob-link, .mob-cta-btn').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { closeMenu(); return; }
    // Trap focus inside menu
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocus) { e.preventDefault(); lastFocus.focus(); }
      } else {
        if (document.activeElement === lastFocus)  { e.preventDefault(); firstFocus.focus(); }
      }
    }
  });
})();
