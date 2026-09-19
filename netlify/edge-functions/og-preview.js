// Link previews for X (Twitter), WhatsApp, Facebook, Telegram, etc.
//
// RSL Zone is a single-page app: the article title/image are only added to
// <head> by JavaScript AFTER the page loads. Social crawlers don't run
// JavaScript, so they only ever see the generic index.html. This edge
// function runs before the page is served: when a crawler asks for
// /en/news/<slug> (or /ar/...), it looks the article up in Supabase and
// injects the right <title>, description and image tags into the HTML.
// Normal visitors are not affected.

const CRAWLERS =
  /twitterbot|facebookexternalhit|facebot|whatsapp|telegrambot|linkedinbot|slackbot|discordbot|pinterest|redditbot|skypeuripreview|embedly|googlebot|bingbot|applebot/i;

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const clean = (s = '', max = 200) => {
  const t = String(s).replace(/<[^>]*>/g, ' ').replace(/[#*_`>\[\]]/g, '').replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
};

export default async (request, context) => {
  try {
    const ua = request.headers.get('user-agent') || '';
    if (!CRAWLERS.test(ua)) return; // real visitors: continue as normal

    const url = new URL(request.url);
    const m = url.pathname.match(/^\/(en|ar)\/news\/([^/]+)\/?$/);
    if (!m) return;
    const lang = m[1];
    const slug = decodeURIComponent(m[2]);

    const base = Netlify.env.get('VITE_SUPABASE_URL');
    const key = Netlify.env.get('VITE_SUPABASE_ANON_KEY');
    if (!base || !key) return;

    const select =
      'slug,published_at,article_translations(language,title,excerpt,content,seo_title,seo_description),cover:cover_media_id(url,alt_text_en,alt_text_ar)';
    const api = `${base}/rest/v1/articles?slug=eq.${encodeURIComponent(slug)}&select=${encodeURIComponent(select)}&limit=1`;
    const res = await fetch(api, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!res.ok) return;
    const [article] = await res.json();
    if (!article) return;

    const translations = article.article_translations || [];
    const tr = translations.find((t) => t.language === lang) || translations.find((t) => t.language === 'en');
    if (!tr) return;

    const title = tr.seo_title || tr.title;
    const description = clean(tr.seo_description || tr.excerpt || tr.content);
    const image = article.cover?.url || '';
    const imageAlt = (lang === 'ar' ? article.cover?.alt_text_ar : article.cover?.alt_text_en) || title;
    const pageUrl = `${url.origin}/${lang}/news/${article.slug}`;

    const tags = [
      `<meta property="og:site_name" content="RSL Zone" />`,
      `<meta property="og:type" content="article" />`,
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(description)}" />`,
      `<meta property="og:url" content="${esc(pageUrl)}" />`,
      article.published_at ? `<meta property="article:published_time" content="${esc(article.published_at)}" />` : '',
      image ? `<meta property="og:image" content="${esc(image)}" />` : '',
      image ? `<meta property="og:image:alt" content="${esc(imageAlt)}" />` : '',
      `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
      `<meta name="twitter:title" content="${esc(title)}" />`,
      `<meta name="twitter:description" content="${esc(description)}" />`,
      image ? `<meta name="twitter:image" content="${esc(image)}" />` : '',
      image ? `<meta name="twitter:image:alt" content="${esc(imageAlt)}" />` : '',
      `<link rel="canonical" href="${esc(pageUrl)}" />`,
    ].filter(Boolean).join('\n    ');

    const response = await context.next();
    let html = await response.text();
    html = html
      .replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`)
      .replace(/<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${esc(description)}" />`)
      .replace('</head>', `    ${tags}\n  </head>`);

    return new Response(html, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' },
    });
  } catch (_err) {
    return; // never break the page because of a preview problem
  }
};
