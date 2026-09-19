import { DEFAULT_LANGUAGE } from '../i18n/config';

// Picks the translation for `lang` from an article's article_translations
// array. If that language is missing it falls back to the site's default
// language, then to whatever version exists, so the public site never renders
// empty content (and an article written in only one language still shows).
export function pickTranslation(article, lang) {
  const translations = (article?.article_translations || []).filter((t) => t.title && t.content);
  const exact = translations.find((t) => t.language === lang);
  if (exact) return { ...exact, isFallback: false };
  const fallback = translations.find((t) => t.language === DEFAULT_LANGUAGE) || translations[0];
  if (fallback) return { ...fallback, isFallback: true };
  return { title: '', excerpt: '', content: '', language: lang, isFallback: true };
}
