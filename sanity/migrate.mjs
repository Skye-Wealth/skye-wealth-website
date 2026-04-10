/**
 * Skye Wealth blog migration — skye.com.au → Sanity
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

const POSTS = [
  { slug: 'income-protection-self-employed-australia',                                                              date: '2026-03-30' },
  { slug: 'worldwide-insurance-cover-what-happens-to-your-insurance-if-you-move-or-travel-overseas',               date: '2026-03-19' },
  { slug: 'insurance-commissions-in-australia-what-you-are-really-paying-for',                                     date: '2026-03-11' },
  { slug: 'insurance-inside-super-feels-like-it-should-be-enough-until-you-actually-run-the-numbers',              date: '2026-03-04' },
  { slug: 'why-we-charge-a-fee-for-insurance-advice-in-australia',                                                 date: '2026-02-27' },
  { slug: 'not-all-trauma-policies-are-created-equal',                                                             date: '2026-02-23' },
  { slug: 'what-underwriters-really-look-for-in-a-life-insurance-application',                                     date: '2026-02-13' },
  { slug: 'the-claims-process-no-one-explains-until-you-need-it',                                                  date: '2026-02-05' },
  { slug: 'before-you-go-on-parental-leave-read-this-about-your-insurance',                                        date: '2026-01-29' },
  { slug: 'can-you-claim-on-multiple-insurance-policies-at-the-same-time',                                         date: '2026-01-26' },
  { slug: 'why-some-insurers-decline-while-others-accept',                                                         date: '2026-01-15' },
  { slug: 'super-beneficiaries-explained-what-really-happens-to-your-money',                                       date: '2026-01-10' },
  { slug: 'injured-over-the-holidays-heres-what-really-helps-you-recover',                                         date: '2026-01-04' },
  { slug: 'what-most-people-get-wrong-about-industry-fund-insurance',                                              date: '2025-12-29' },
  { slug: 'if-mario-and-luigi-were-real-people-could-we-actually-insure-them',                                     date: '2025-12-21' },
  { slug: 'the-cancer-treatment-gap-no-one-talks-about-and-how-trauma-insurance-fills-it',                         date: '2025-12-15' },
  { slug: 'own-the-extras-the-lesser-known-benefits-inside-insurance-policies',                                    date: '2025-12-03' },
  { slug: 'why-your-tpd-definition-matters-more-than-you-think',                                                   date: '2025-11-26' },
  { slug: 'child-critical-illness-cover-how-it-works-and-when-it-matters',                                         date: '2025-11-19' },
  { slug: 'insurance-inside-vs-outside-super-what-you-need-to-know',                                               date: '2025-11-13' },
];

// ─── helpers ────────────────────────────────────────────────────────────────

const uid = () => randomBytes(4).toString('hex');
const sleep = ms => new Promise(r => setTimeout(r, ms));

function parseInline(node) {
  const children = [];
  const markDefs = [];

  for (const child of node.childNodes) {
    const tag = child.tagName?.toLowerCase();

    if (!tag) {
      // text node
      const text = child.text;
      if (text) children.push({ _type: 'span', _key: uid(), text, marks: [] });
      continue;
    }

    const marks = [];
    let innerNode = child;

    if (tag === 'strong' || tag === 'b') marks.push('strong');
    if (tag === 'em' || tag === 'i') marks.push('em');

    if (tag === 'a') {
      const href = child.getAttribute('href') || '';
      const markKey = uid();
      markDefs.push({ _type: 'link', _key: markKey, href });
      marks.push(markKey);
    }

    const text = innerNode.text;
    if (text) children.push({ _type: 'span', _key: uid(), text, marks });
  }

  return { children, markDefs };
}

function htmlToBlocks(contentHtml) {
  const root = parse(contentHtml);
  const blocks = [];

  // Squarespace puts content in .sqs-html-content divs
  const containers = root.querySelectorAll('.sqs-html-content');
  const sources = containers.length ? containers : [root];

  for (const container of sources) {
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

  return blocks;
}

async function scrapePage(slug) {
  const url = `${BASE}/blog/${slug}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SkyeMigration/1.0)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function extractMeta(html) {
  const root = parse(html);

  // Title
  const titleEl = root.querySelector('h1.blog-title, .BlogItem-title, [itemprop="headline"], h1');
  const title = titleEl?.text?.trim() || '';

  // Date from <time datetime="...">
  const timeEl = root.querySelector('time[datetime]');
  const publishedAt = timeEl?.getAttribute('datetime') || null;

  // Author
  const authorEl = root.querySelector('.blog-author-name, .BlogItem-authorName, [itemprop="author"]');
  const author = authorEl?.text?.trim() || 'Skye Wealth';

  // Categories
  const catEls = root.querySelectorAll('.blog-item-category, .BlogItem-tag a');
  const categories = [...new Set(catEls.map(el => el.text.trim()).filter(Boolean))];

  // Excerpt — first non-empty paragraph
  const firstP = root.querySelector('.sqs-html-content p');
  const excerpt = firstP?.text?.trim().slice(0, 200) || '';

  // Featured image — og:image is most reliable on Squarespace
  const ogImg = root.querySelector('meta[property="og:image"]')?.getAttribute('content') || null;

  // Body HTML
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

// ─── main ────────────────────────────────────────────────────────────────────

async function migrate() {
  console.log(`\n🚀  Starting migration of ${POSTS.length} posts...\n`);

  for (const { slug, date } of POSTS) {
    try {
      process.stdout.write(`  ⏳  ${slug} ... `);

      const html = await scrapePage(slug);
      const { title, publishedAt, author, categories, excerpt, ogImg, bodyHtml } = extractMeta(html);
      const body = htmlToBlocks(bodyHtml);

      // Resolve category refs
      const categoryRefs = await Promise.all(
        categories.map(async cat => {
          const id = await getOrCreateCategory(cat);
          return { _type: 'reference', _ref: id, _key: uid() };
        })
      );

      // Resolve author ref
      const authorId = await getOrCreateAuthor(author);

      const doc = {
        _type: 'post',
        _id: `migrated-${slug}`,
        title: title || slug.replace(/-/g, ' '),
        slug: { _type: 'slug', current: slug },
        publishedAt: publishedAt || `${date}T00:00:00.000Z`,
        excerpt,
        author: { _type: 'reference', _ref: authorId },
        categories: categoryRefs,
        body,
        // mainImage handled separately — we store the og:image URL as a note
        ...(ogImg ? { _ogImage: ogImg } : {}),
      };

      await client.createOrReplace(doc);
      console.log(`✅  "${title || slug}"`);

    } catch (err) {
      console.log(`❌  ${err.message}`);
    }

    // Be polite — 800ms between requests
    await sleep(800);
  }

  console.log('\n✅  Migration complete. Check your Studio at https://skye-wealth.sanity.studio/\n');
  console.log('📸  Note: featured images were not auto-uploaded (Squarespace CDN blocks hotlinking).');
  console.log('    Each post has _ogImage field with the original URL so you can upload them manually.\n');
}

migrate();
