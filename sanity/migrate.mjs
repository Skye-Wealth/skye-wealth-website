/**
 * Skye Wealth blog migration — skye.com.au → Sanity
 *
 * Pulls every blog post from the live Squarespace site, uploads its
 * featured image to Sanity, and creates a `post` document keyed by slug.
 * Existing posts are wiped first so the import is deterministic.
 *
 * Usage:
 *   1. Create an API token in sanity.io/manage → project → API → Tokens (Editor role)
 *   2. cd sanity && npm install
 *   3. SANITY_TOKEN=your_token node migrate.mjs
 */

import { createClient } from '@sanity/client';
import { parse } from 'node-html-parser';
import { randomBytes } from 'crypto';

if (!process.env.SANITY_TOKEN) {
  console.error('❌  Set SANITY_TOKEN environment variable first.');
  console.error('   Get one from: sanity.io/manage → your project → API → Tokens');
  process.exit(1);
}

const client = createClient({
  projectId: 'f0yrya1r',
  dataset: 'production',
  useCdn: false,
  token: process.env.SANITY_TOKEN,
  apiVersion: '2024-01-01',
});

const BASE = 'https://www.skye.com.au';
const UA = { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SkyeMigration/1.0)' } };

// ─── helpers ────────────────────────────────────────────────────────────────

const uid = () => randomBytes(4).toString('hex');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function discoverSlugs() {
  const slugs = new Set();
  const visitedOffsets = new Set();
  let offset = '';

  // Walk paginated blog index until we stop seeing new slugs.
  while (true) {
    const url = `${BASE}/blog${offset ? `?offset=${offset}` : ''}`;
    if (visitedOffsets.has(offset)) break;
    visitedOffsets.add(offset);

    const res = await fetch(url, UA);
    if (!res.ok) {
      console.warn(`  ⚠️  index fetch ${res.status} for ${url}`);
      break;
    }
    const html = await res.text();

    const links = [...html.matchAll(/href="\/blog\/([a-z0-9-]+)"/g)].map(m => m[1]);
    if (!links.length) break;

    const before = slugs.size;
    links.forEach(s => slugs.add(s));
    if (slugs.size === before) break; // no new slugs → stop

    const olderMatch = html.match(/href="\/blog\?offset=(\d+)"[^>]*>\s*Older/i);
    if (!olderMatch) break;
    offset = olderMatch[1];
    await sleep(800);
  }

  // Defence in depth: cross-check sitemap.xml.
  try {
    const smRes = await fetch(`${BASE}/sitemap.xml`, UA);
    if (smRes.ok) {
      const sm = await smRes.text();
      const smSlugs = [...sm.matchAll(/<loc>[^<]*\/blog\/([a-z0-9-]+)<\/loc>/g)].map(m => m[1]);
      const missing = smSlugs.filter(s => !slugs.has(s));
      if (missing.length) {
        console.log(`  ℹ️  sitemap added ${missing.length} slug(s) the index didn't surface`);
        missing.forEach(s => slugs.add(s));
      }
    }
  } catch (err) {
    console.warn(`  ⚠️  sitemap cross-check failed: ${err.message}`);
  }

  return [...slugs];
}

function walkInline(node, parentMarks, children, markDefs) {
  for (const child of node.childNodes) {
    const tag = child.tagName?.toLowerCase();

    if (!tag) {
      const text = child.text;
      if (text) children.push({ _type: 'span', _key: uid(), text, marks: [...parentMarks] });
      continue;
    }

    if (tag === 'br') {
      children.push({ _type: 'span', _key: uid(), text: '\n', marks: [...parentMarks] });
      continue;
    }

    const nodeMarks = [...parentMarks];
    if (tag === 'strong' || tag === 'b') nodeMarks.push('strong');
    if (tag === 'em' || tag === 'i') nodeMarks.push('em');
    if (tag === 'code') nodeMarks.push('code');

    if (tag === 'a') {
      const href = child.getAttribute('href') || '';
      if (href) {
        const markKey = uid();
        markDefs.push({ _type: 'link', _key: markKey, href });
        nodeMarks.push(markKey);
      }
    }

    walkInline(child, nodeMarks, children, markDefs);
  }
}

function parseInline(node) {
  const children = [];
  const markDefs = [];
  walkInline(node, [], children, markDefs);
  return { children, markDefs };
}

function processTextBlocks(container, blocks) {
  for (const node of container.childNodes) {
    const tag = node.tagName?.toLowerCase();
    if (!tag) continue;

    if (tag === 'p') {
      const text = node.text.trim();
      if (!text) continue;
      const { children, markDefs } = parseInline(node);
      blocks.push({ _type: 'block', _key: uid(), style: 'normal', children, markDefs });
    }

    if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
      const text = node.text.trim();
      if (!text) continue;
      blocks.push({
        _type: 'block', _key: uid(),
        style: tag,
        children: [{ _type: 'span', _key: uid(), text, marks: [] }],
        markDefs: [],
      });
    }

    if (tag === 'ul' || tag === 'ol') {
      const listItem = tag === 'ul' ? 'bullet' : 'number';
      for (const li of node.querySelectorAll('li')) {
        const { children, markDefs } = parseInline(li);
        blocks.push({
          _type: 'block', _key: uid(),
          style: 'normal', listItem, level: 1,
          children, markDefs,
        });
      }
    }

    if (tag === 'blockquote') {
      const text = node.text.trim();
      if (text) {
        blocks.push({
          _type: 'block', _key: uid(),
          style: 'blockquote',
          children: [{ _type: 'span', _key: uid(), text, marks: [] }],
          markDefs: [],
        });
      }
    }
  }
}

async function htmlToBlocks(contentHtml) {
  const root = parse(contentHtml);
  const blocks = [];

  // Walk Squarespace block-level structure in document order so inline images
  // appear between the right paragraphs.
  const sqsBlocks = root.querySelectorAll('.sqs-block');

  if (sqsBlocks.length) {
    for (const sqsBlock of sqsBlocks) {
      const cls = sqsBlock.getAttribute('class') || '';

      if (cls.includes('sqs-block-image')) {
        const img = sqsBlock.querySelector('img');
        if (!img) continue;
        const src = img.getAttribute('data-image') || img.getAttribute('src') || img.getAttribute('data-src');
        if (!src) continue;
        const alt = img.getAttribute('alt') || '';
        const captionEl = sqsBlock.querySelector('.image-caption, figcaption');
        const caption = captionEl?.text?.trim() || '';
        const imageBlock = await uploadInlineImage(src, alt, caption);
        if (imageBlock) blocks.push(imageBlock);
        continue;
      }

      if (cls.includes('sqs-block-html')) {
        const htmlContent = sqsBlock.querySelector('.sqs-html-content');
        if (htmlContent) processTextBlocks(htmlContent, blocks);
        continue;
      }

      if (cls.includes('sqs-block-quote')) {
        const bq = sqsBlock.querySelector('blockquote');
        if (!bq) continue;
        // Squarespace wraps decorative “ ” glyphs in <span> tags around the quote text — strip them.
        const text = bq.text.replace(/[“”„""]/g, '').trim();
        if (text) {
          blocks.push({
            _type: 'block', _key: uid(),
            style: 'blockquote',
            children: [{ _type: 'span', _key: uid(), text, marks: [] }],
            markDefs: [],
          });
        }
        continue;
      }

      if (cls.includes('sqs-block-video')) {
        const wrapper = sqsBlock.querySelector('.sqs-video-wrapper');
        const dataHtml = wrapper?.getAttribute('data-html') || '';
        // YouTube embed URL formats: youtube.com/embed/<id>, youtu.be/<id>, youtube.com/watch?v=<id>
        const ytMatch = dataHtml.match(/(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([\w-]{6,})/);
        if (ytMatch) {
          blocks.push({
            _type: 'youtube',
            _key: uid(),
            videoId: ytMatch[1],
          });
        } else {
          console.warn(`    ⚠️  video block found but no YouTube ID extracted`);
        }
        continue;
      }

      // Other block types (button, code, social links, horizontal rule, etc.)
      // are ignored — schema doesn't represent them. Add cases here if needed.
    }
    return blocks;
  }

  // Fallback for posts that don't use the .sqs-block structure.
  const containers = root.querySelectorAll('.sqs-html-content');
  const sources = containers.length ? containers : [root];
  for (const container of sources) processTextBlocks(container, blocks);
  return blocks;
}

async function scrapePage(slug) {
  const url = `${BASE}/blog/${slug}`;
  const res = await fetch(url, UA);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function extractJsonLd(root) {
  // Squarespace embeds an article schema in <script type="application/ld+json">.
  // It has clean canonical title, ISO date, and author — preferred over DOM scraping.
  for (const script of root.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const data = JSON.parse(script.text);
      const node = Array.isArray(data) ? data.find(d => d['@type'] === 'BlogPosting' || d['@type'] === 'Article') : data;
      if (!node) continue;
      if (node['@type'] === 'BlogPosting' || node['@type'] === 'Article' || node.headline) {
        return node;
      }
    } catch { /* ignore malformed */ }
  }
  return null;
}

function extractMeta(html) {
  const root = parse(html);
  const ld = extractJsonLd(root) || {};

  // Title: prefer JSON-LD headline; fall back to og:title (strip " — Skye Wealth"); then H1 text.
  let title = ld.headline?.trim() || '';
  if (!title) {
    const ogTitle = root.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
    title = ogTitle.replace(/\s*[—-]\s*Skye Wealth\s*$/i, '').trim();
  }
  if (!title) {
    // [itemprop="headline"] also matches <meta> in <head> — scope to body H1.
    const h1 = root.querySelector('article h1, main h1, h1.entry-title, h1');
    title = h1?.text?.trim() || '';
  }

  // Date: prefer JSON-LD ISO; fall back to <meta itemprop="datePublished">; then article:published_time.
  // NEVER use <time datetime="..."> on Squarespace — recent posts use relative format like "17 Apr"
  // which JS parses to year 2001.
  let publishedAt = ld.datePublished || null;
  if (!publishedAt) {
    publishedAt = root.querySelector('meta[itemprop="datePublished"]')?.getAttribute('content') || null;
  }
  if (!publishedAt) {
    publishedAt = root.querySelector('meta[property="article:published_time"]')?.getAttribute('content') || null;
  }

  // All posts attribute to "Skye Wealth" — individual authors are kept private.
  const author = 'Skye Wealth';

  const catEls = root.querySelectorAll('.blog-item-category, .BlogItem-tag a');
  const categories = [...new Set(catEls.map(el => el.text.trim()).filter(Boolean))];

  const firstP = root.querySelector('.sqs-html-content p');
  const excerpt = firstP?.text?.trim().slice(0, 200) || '';

  // Featured image — og:image is most reliable on Squarespace.
  let ogImg = root.querySelector('meta[property="og:image"]')?.getAttribute('content') || null;

  // Fallback: first image inside a Squarespace image block on the page.
  if (!ogImg) {
    const fallbackImg = root.querySelector('.sqs-block-image img, article img');
    ogImg = fallbackImg?.getAttribute('src') || fallbackImg?.getAttribute('data-src') || null;
  }

  const bodyHtml = root.querySelector('article, .blog-item-content, main')?.innerHTML || html;

  return { title, publishedAt, author, categories, excerpt, ogImg, bodyHtml };
}

// ─── Sanity helpers ──────────────────────────────────────────────────────────

const categoryCache = {};

async function getOrCreateCategory(name) {
  if (categoryCache[name]) return categoryCache[name];

  const existing = await client.fetch(
    `*[_type == "category" && title == $name][0]._id`,
    { name }
  );

  if (existing) {
    categoryCache[name] = existing;
    return existing;
  }

  const doc = await client.create({ _type: 'category', title: name });
  categoryCache[name] = doc._id;
  return doc._id;
}

async function getOrCreateAuthor(name) {
  const existing = await client.fetch(
    `*[_type == "author" && name == $name][0]._id`,
    { name }
  );
  if (existing) return existing;
  const doc = await client.create({ _type: 'author', name });
  return doc._id;
}

async function uploadImageToSanity(imageUrl, alt) {
  if (!imageUrl) return null;
  try {
    const res = await fetch(imageUrl, UA);
    if (!res.ok) {
      console.warn(`    ⚠️  image fetch ${res.status} for ${imageUrl}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const filename = (imageUrl.split('/').pop() || 'cover.jpg').split('?')[0];
    const asset = await client.assets.upload('image', buf, { filename });
    return {
      _type: 'image',
      asset: { _type: 'reference', _ref: asset._id },
      alt: alt || '',
    };
  } catch (err) {
    console.warn(`    ⚠️  image upload failed: ${err.message}`);
    return null;
  }
}

async function uploadInlineImage(imageUrl, alt, caption) {
  if (!imageUrl) return null;
  try {
    const res = await fetch(imageUrl, UA);
    if (!res.ok) {
      console.warn(`    ⚠️  inline image fetch ${res.status} for ${imageUrl}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const filename = (imageUrl.split('/').pop() || 'inline.jpg').split('?')[0];
    const asset = await client.assets.upload('image', buf, { filename });
    return {
      _type: 'image',
      _key: uid(),
      asset: { _type: 'reference', _ref: asset._id },
      alt: alt || '',
      caption: caption || '',
    };
  } catch (err) {
    console.warn(`    ⚠️  inline image upload failed: ${err.message}`);
    return null;
  }
}

async function wipeExisting() {
  const postIds = await client.fetch(`*[_type == "post"]._id`);
  const authorIds = await client.fetch(`*[_type == "author"]._id`);
  const total = postIds.length + authorIds.length;
  if (!total) {
    console.log('🧹  Nothing to wipe.');
    return;
  }
  console.log(`🧹  Deleting ${postIds.length} posts and ${authorIds.length} authors...`);
  const tx = client.transaction();
  // Posts must be deleted before authors (posts reference authors).
  postIds.forEach(id => tx.delete(id));
  authorIds.forEach(id => tx.delete(id));
  await tx.commit();
}

// ─── per-post processing ────────────────────────────────────────────────────

async function processPost(slug) {
  process.stdout.write(`  ⏳  ${slug} ... `);
  try {
    const html = await scrapePage(slug);
    const { title, publishedAt, author, categories, excerpt, ogImg, bodyHtml } = extractMeta(html);
    const body = await htmlToBlocks(bodyHtml);

    const inlineImageCount = body.filter(b => b._type === 'image').length;

    const categoryRefs = await Promise.all(
      categories.map(async cat => {
        const id = await getOrCreateCategory(cat);
        return { _type: 'reference', _ref: id, _key: uid() };
      })
    );

    const authorId = await getOrCreateAuthor(author);
    const mainImage = await uploadImageToSanity(ogImg, title);

    const doc = {
      _type: 'post',
      _id: `migrated-${slug}`,
      title: title || slug.replace(/-/g, ' '),
      slug: { _type: 'slug', current: slug },
      publishedAt: publishedAt || new Date().toISOString(),
      excerpt,
      author: { _type: 'reference', _ref: authorId },
      categories: categoryRefs,
      body,
      ...(mainImage ? { mainImage } : {}),
    };

    await client.createOrReplace(doc);
    const inlineNote = inlineImageCount ? ` +${inlineImageCount} inline img` : '';
    console.log(`✅  "${title || slug}"${mainImage ? '' : ' (no cover)'}${inlineNote}`);
    return { ok: true };
  } catch (err) {
    console.log(`❌  ${err.message}`);
    return { ok: false, error: err.message };
  }
}

// ─── main ────────────────────────────────────────────────────────────────────

async function migrate() {
  // Single-post mode: skip discovery and wipe, just re-import the one slug.
  const singleSlug = process.argv.slice(2)
    .find(a => a.startsWith('--slug='))?.slice('--slug='.length);

  if (singleSlug) {
    console.log(`\n🎯  Single-post mode: ${singleSlug}\n`);
    const result = await processPost(singleSlug);
    console.log(result.ok
      ? '\n✅  Done.\n   Studio: https://skye-wealth.sanity.studio/\n'
      : `\n❌  Failed: ${result.error}\n`);
    process.exit(result.ok ? 0 : 1);
  }

  console.log('\n🔍  Discovering blog posts on skye.com.au...');
  const slugs = await discoverSlugs();
  console.log(`    Found ${slugs.length} posts.\n`);

  if (!slugs.length) {
    console.error('❌  No slugs discovered — aborting.');
    process.exit(1);
  }

  await wipeExisting();

  console.log(`\n🚀  Importing ${slugs.length} posts...\n`);

  let ok = 0;
  let fail = 0;
  const failures = [];

  for (const slug of slugs) {
    const result = await processPost(slug);
    if (result.ok) ok++;
    else { fail++; failures.push({ slug, error: result.error }); }
    await sleep(800);
  }

  console.log(`\n✅  ${ok} succeeded, ${fail} failed.`);
  if (fail) {
    console.log('\nFailed posts:');
    failures.forEach(f => console.log(`  - ${f.slug}: ${f.error}`));
  }
  console.log('\n   Studio: https://skye-wealth.sanity.studio/\n');
}

migrate();
