(function () {
  'use strict';

  /* Map playlist name keywords → accent colour (matches existing CSS vars) */
  var COLORS = {
    'deep dive':        'var(--yellow)',
    'claims corner':    'var(--teal)',
    'tell us more':     'var(--coral)',
    'skye simplifies':  'var(--mauve)',
    'industry updates': 'rgba(255,255,255,.5)',
  };

  function accentFor(title) {
    var t = (title || '').toLowerCase();
    for (var key in COLORS) {
      if (t.indexOf(key) !== -1) return COLORS[key];
    }
    return 'rgba(255,255,255,.5)';
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function apiFetch(params) {
    return fetch('/api/youtube?' + new URLSearchParams(params))
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      });
  }

  /* ── Renderers ─────────────────────────────────────────────────────────── */

  function renderFeatured(v) {
    return '<a href="https://www.youtube.com/watch?v=' + esc(v.id) + '" target="_blank" rel="noopener noreferrer" class="vid-main pop">' +
      '<div class="vid-thumb">' +
        '<img src="' + esc(v.thumbnail) + '" alt="' + esc(v.title) + '" loading="eager">' +
        '<div class="play-btn"><div class="play-tri"></div></div>' +
      '</div>' +
      '<div class="vid-info">' +
        '<div class="vid-title">' + esc(v.title) + '</div>' +
        (v.description ? '<div class="vid-meta">' + esc(v.description) + '</div>' : '') +
      '</div>' +
    '</a>';
  }

  function renderSide(v) {
    return '<a href="https://www.youtube.com/watch?v=' + esc(v.id) + '" target="_blank" rel="noopener noreferrer" class="vid-side pop">' +
      '<div class="vid-side-thumb">' +
        '<img src="' + esc(v.thumbnail) + '" alt="' + esc(v.title) + '" loading="lazy">' +
        '<div class="play-xs"><div class="play-tri-xs"></div></div>' +
      '</div>' +
      '<div><div class="vid-side-title">' + esc(v.title) + '</div></div>' +
    '</a>';
  }

  function renderCard(v) {
    return '<a href="https://www.youtube.com/watch?v=' + esc(v.id) + '" target="_blank" rel="noopener noreferrer" class="vid-card pop">' +
      '<div class="vid-card-thumb">' +
        '<img src="' + esc(v.thumbnail) + '" alt="' + esc(v.title) + '" loading="lazy">' +
        '<div class="play-xs"><div class="play-tri-xs"></div></div>' +
      '</div>' +
      '<div class="vid-card-info"><div class="vid-card-title">' + esc(v.title) + '</div></div>' +
    '</a>';
  }

  /* ── Layout ────────────────────────────────────────────────────────────── */

  function renderVideos(videos, featuredGrid, grid) {
    if (!videos.length) {
      featuredGrid.innerHTML = '<p class="tv-empty">Videos coming soon.</p>';
      grid.innerHTML = '';
      return;
    }
    var featured = videos[0];
    var sides    = videos.slice(1, 4);
    var cards    = videos.slice(4, 8);

    featuredGrid.innerHTML =
      renderFeatured(featured) +
      '<div class="tv-side-list">' + sides.map(renderSide).join('') + '</div>';

    grid.innerHTML = cards.map(renderCard).join('');
  }

  var SKELETON_MAIN = '<div class="tv-skel tv-skel--main"></div>';
  var SKELETON_SIDE = '<div class="tv-skel tv-skel--side"></div>';
  var SKELETON_CARD = '<div class="tv-skel tv-skel--card"></div>';

  function setLoading(featuredGrid, grid, on) {
    if (on) {
      featuredGrid.innerHTML =
        SKELETON_MAIN +
        '<div class="tv-side-list">' + SKELETON_SIDE.repeat(3) + '</div>';
      grid.innerHTML = SKELETON_CARD.repeat(4);
    }
  }

  /* ── Init ──────────────────────────────────────────────────────────────── */

  function init() {
    var tabsEl      = document.getElementById('tv-tabs');
    var featuredGrid = document.getElementById('tv-featured-grid');
    var grid        = document.getElementById('tv-grid');
    if (!tabsEl || !featuredGrid || !grid) return;

    var allVideos = [];

    Promise.allSettled([
      apiFetch({ type: 'videos',    maxResults: 12 }),
      apiFetch({ type: 'playlists' }),
    ]).then(function (results) {
      var videosRes    = results[0];
      var playlistsRes = results[1];

      allVideos = videosRes.status === 'fulfilled'
        ? (videosRes.value.videos || []) : [];

      var playlists = playlistsRes.status === 'fulfilled'
        ? (playlistsRes.value.playlists || []) : [];

      /* Add playlist tabs (skip auto-generated "Uploads from …" playlist) */
      playlists
        .filter(function (p) {
          return p.title.toLowerCase().indexOf('uploads from') !== 0;
        })
        .forEach(function (p) {
          var btn = document.createElement('button');
          btn.className         = 'tv-tab';
          btn.dataset.playlist  = p.id;
          btn.textContent       = p.title;
          btn.style.setProperty('--accent', accentFor(p.title));
          tabsEl.appendChild(btn);
        });

      /* Only replace placeholder content if real videos came back */
      if (allVideos.length) renderVideos(allVideos, featuredGrid, grid);
    });

    /* Tab switching */
    tabsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.tv-tab');
      if (!btn) return;

      tabsEl.querySelectorAll('.tv-tab').forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');

      var pid = btn.dataset.playlist;
      if (!pid) {
        if (allVideos.length) renderVideos(allVideos, featuredGrid, grid);
        return;
      }

      setLoading(featuredGrid, grid, true);
      apiFetch({ type: 'playlist', playlistId: pid, maxResults: 12 })
        .then(function (data) {
          renderVideos(data.videos || [], featuredGrid, grid);
        })
        .catch(function (err) {
          console.warn('[skye-tv] playlist fetch failed', err);
          renderVideos([], featuredGrid, grid);
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
