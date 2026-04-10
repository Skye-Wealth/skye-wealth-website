const PROJECT = 'f0yrya1r';
const DATASET = 'production';
const API     = `/api/sanity/v2024-01-01/data/query/${DATASET}`;

function sanityImg(ref, w = 800) {
  if (!ref) return null;
  const [, id, dims, fmt] = ref.split('-');
  return `https://cdn.sanity.io/images/${PROJECT}/${DATASET}/${id}-${dims}.${fmt}?w=${w}&auto=format&fit=crop`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' });
}

async function fetchPosts(cat = 'all') {
  const filter = cat === 'all'
    ? `*[_type == "post" && defined(slug.current)]`
    : `*[_type == "post" && defined(slug.current) && $cat in categories[]->title]`;
  const proj = `{ _id, title, slug, publishedAt, excerpt, mainImage, "author": author->name, "categories": categories[]->title }`;
  const query = encodeURIComponent(`${filter} | order(publishedAt desc) ${proj}`);
  const params = cat !== 'all' ? `&%24cat=%22${encodeURIComponent(cat)}%22` : '';
  const res = await fetch(`${API}?query=${query}${params}`);
  const data = await res.json();
  return data.result || [];
}

async function fetchCategories() {
  const query = encodeURIComponent(`*[_type == "category"] | order(title asc) { title }`);
  const res = await fetch(`${API}?query=${query}`);
  const data = await res.json();
  return (data.result || []).map(c => c.title);
}

function renderCard(post) {
  const img = post.mainImage?.asset?._ref
    ? `<img src="${sanityImg(post.mainImage.asset._ref, 600)}" alt="${post.mainImage.alt || post.title}">`
    : `<div class="post-card-img-placeholder">📝</div>`;
  const cats = (post.categories || []).map(c => `<span class="post-card-cat">${c}</span>`).join('');
  return `
    <a href="post.html?slug=${post.slug.current}" class="post-card">
      <div class="post-card-img">${img}</div>
      <div class="post-card-body">
        ${cats ? `<div class="post-card-cats">${cats}</div>` : ''}
        <div class="post-card-title">${post.title}</div>
        <div class="post-card-excerpt">${post.excerpt || ''}</div>
        <div class="post-card-meta">
          <span>${post.author || 'Skye Wealth'}</span>
          ${post.publishedAt ? `<span class="post-card-meta-dot"></span><span>${formatDate(post.publishedAt)}</span>` : ''}
        </div>
      </div>
    </a>`;
}

async function init() {
  const grid    = document.getElementById('blog-grid');
  const filters = document.getElementById('filters');

  let cats = [];
  try { cats = await fetchCategories(); } catch(e) { console.warn('Categories unavailable:', e); }
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.cat = cat;
    btn.textContent = cat;
    filters.appendChild(btn);
  });

  async function load(cat = 'all') {
    grid.innerHTML = `<div class="blog-loading"><div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div></div>`;
    try {
      const posts = await fetchPosts(cat);
      grid.innerHTML = posts.length
        ? posts.map(renderCard).join('')
        : `<div class="blog-empty">No posts yet — check back soon.</div>`;
    } catch(e) {
      console.error('Blog fetch failed:', e);
      grid.innerHTML = `<div class="blog-empty">Could not load posts. Please try again shortly.</div>`;
    }
  }

  filters.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    filters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    load(btn.dataset.cat);
  });

  load();
}

init();
