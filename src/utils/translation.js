// Picks the translation for `lang` from an article's article_translations
// array, falling back to English (never to a blank object) so the public
// site never renders empty content — this is the "clear fallback behavior"
// the spec requires for missing Arabic translations.
export function pickTranslation(article, lang) {
  const translations = article?.article_translations || [];
  const exact = translations.find((t) => t.language === lang);
  if (exact) return { ...exact, isFallback: false };
  const en = translations.find((t) => t.language === 'en');
  if (en) return { ...en, isFallback: true };
  return { title: '', excerpt: '', content: '', isFallback: true };
}
