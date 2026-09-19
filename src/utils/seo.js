// Minimal, dependency-free SEO helper. Sets <title>, meta description, OG/
// Twitter tags, canonical, and hreflang alternates directly on <head>. Kept
// deliberately small rather than pulling in react-helmet for this.

function setMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel, href, extraAttrs = {}) {
  if (!href) return;
  const selector = extraAttrs.hreflang
    ? `link[rel="${rel}"][hreflang="${extraAttrs.hreflang}"]`
    : `link[rel="${rel}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    Object.entries(extraAttrs).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function applySeo({ title, description, canonical, ogImage, hreflangs = [] }) {
  if (title) document.title = title;
  setMeta('name', 'description', description);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:type', 'article');
  if (ogImage) setMeta('property', 'og:image', ogImage);
  setMeta('name', 'twitter:card', ogImage ? 'summary_large_image' : 'summary');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  if (canonical) setLink('canonical', canonical);
  hreflangs.forEach(({ hreflang, href }) => setLink('alternate', href, { hreflang }));
}
