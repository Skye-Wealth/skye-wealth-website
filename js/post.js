const PROJECT = 'f0yrya1r';
const DATASET = 'production';
const API     = `/api/sanity/v2024-01-01/data/query/${DATASET}`;

function sanityImg(ref, w = 1200) {
  if (!ref) return null;
  const [, id, dims, fmt] = ref.split('-');
  return `https://cdn.sanity.io/images/${PROJECT}/${DATASET}/${id}-${dims}.${fmt}?w=${w}&auto=format&fit=crop`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' });
}

function renderBody(blocks) {
  if (!blocks) return '';
  return blocks.map(block => {
    if (block._type === 'image') {
      const src = sanityImg(block.asset._ref, 1200);
      return `<figure><img src="${src}" alt="${block.alt || ''}"><figcaption>${block.caption || ''}</figcaption></figure>`;
    }
    if (block._type !== 'block') return '';

    const text = block.children.map(span => {
      let t = span.text
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      if (!span.marks?.length) return t;
      span.marks.forEach(mark => {
        if (mark === 'strong') t = `<strong>${t}</strong>`;
        else if (mark === 'em') t = `<em>${t}</em>`;
        else if (mark === 'code') t = `<code>${t}</code>`;
        else {
          const def = block.markDefs?.find(d => d._key === mark);
          if (def?._type === 'link') {
            const target = def.blank ? ' target="_blank" rel="noopener"' : '';
            t = `<a href="${def.href}"${target}>${t}</a>`;
          }
        }
      });
      return t;
    }).join('');

    const tags = {
      h2: `<h2>${text}</h2>`,
      h3: `<h3>${text}</h3>`,
      h4: `<h4>${text}</h4>`,
      blockquote: `<blockquote>${text}</blockquote>`,
      normal: `<p>${text}</p>`,
    };
    return tags[block.style] || `<p>${text}</p>`;
  }).join('');
}

async function init() {
  const slug = new URLSearchParams(location.search).get('slug');
  if (!slug) { location.href = 'blog.html'; return; }

  const query = encodeURIComponent(
    `*[_type == "post" && slug.current == $slug][0]{
      title, slug, publishedAt, excerpt, mainImage, body,
      "author": author->{name, role, image},
      "categories": categories[]->title
    }`
  );
  const res  = await fetch(`${API}?query=${query}&%24slug=%22${encodeURIComponent(slug)}%22`);
  const data = await res.json();
  const post = data.result;

  if (!post) {
    document.getElementById('post-root').innerHTML =
      `<div style="padding:200px 48px;text-align:center;color:#aaa;font-size:18px">Post not found. <a href="blog.html" style="color:var(--coral)">Back to blog →</a></div>`;
    return;
  }

  document.title = `${post.title} — Skye Wealth`;

  const authorInitial = (post.author?.name || 'S')[0].toUpperCase();
  const authorImg = post.author?.image?.asset?._ref
    ? `<img src="${sanityImg(post.author.image.asset._ref, 80)}" class="post-author-img" alt="${post.author.name}">`
    : `<div class="post-author-img">${authorInitial}</div>`;

  const coverImg = post.mainImage?.asset?._ref
    ? `<div class="post-cover"><img src="${sanityImg(post.mainImage.asset._ref, 1400)}" alt="${post.mainImage.alt || post.title}"></div>`
    : '';

  const cats = (post.categories || []).map(c => `<span class="post-cat">${c}</span>`).join('');

  document.getElementById('post-root').innerHTML = `
    <a href="blog.html" class="post-back">← Back to blog</a>

    <div class="post-hero">
      ${cats ? `<div class="post-cats">${cats}</div>` : ''}
      <h1 class="post-title">${post.title}</h1>
      <div class="post-meta">
        ${authorImg}
        <div>
          <div class="post-author-name">${post.author?.name || 'Skye Wealth'}</div>
          <div>${post.author?.role || 'Skye Wealth'}${post.publishedAt ? ` · ${formatDate(post.publishedAt)}` : ''}</div>
        </div>
      </div>
    </div>

    ${coverImg}

    <div class="post-body">${renderBody(post.body)}</div>

    <div class="post-cta">
      <div class="post-cta-inner">
        <div>
          <div class="post-cta-heading">Ready to get your cover sorted?</div>
          <div class="post-cta-sub">A free 15-minute call. No pressure, no jargon — just clarity.</div>
        </div>
        <div class="post-cta-btns">
          <a href="https://www.skye.com.au/phone-call" class="btn btn--coral">Book a free call</a>
          <a href="https://www.skye.com.au/life-insurance-advice" class="btn btn--outline-dark" style="color:#fff;border-color:rgba(255,255,255,.25)">Learn more →</a>
        </div>
      </div>
    </div>
  `;
}

init();
