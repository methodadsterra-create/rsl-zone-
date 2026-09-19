// ---------------------------------------------------------------------------
// Language registry.
//
// To add a new language later (e.g. French):
//   1. Add an entry to SUPPORTED_LANGUAGES below.
//   2. Create src/i18n/locales/fr.js modeled on en.js.
//   3. Register it in the `locales` map in LanguageContext.jsx.
//   4. Add 'fr' translations to the article_translations table (no schema
//      change needed — `language` is a free-text code, not an enum).
// Nothing else in the app needs to change: routing, RTL/LTR, the language
// switcher, and content queries are all driven off this registry.
// ---------------------------------------------------------------------------

export const SUPPORTED_LANGUAGES = {
  en: { code: 'en', label: 'English', nativeLabel: 'English', dir: 'ltr' },
  ar: { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl' },
  // fr: { code: 'fr', label: 'French', nativeLabel: 'Français', dir: 'ltr' },
  // es: { code: 'es', label: 'Spanish', nativeLabel: 'Español', dir: 'ltr' },
  // pt: { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', dir: 'ltr' },
};

// The language visitors get when they have not chosen one themselves.
export const DEFAULT_LANGUAGE = 'ar';
// false = everyone starts in DEFAULT_LANGUAGE (until they pick another with
// the language switcher). true = use the visitor's browser language first.
export const AUTO_DETECT_BROWSER_LANGUAGE = false;
export const LANGUAGE_STORAGE_KEY = 'rslzone_lang';

export const isSupportedLanguage = (code) => Object.prototype.hasOwnProperty.call(SUPPORTED_LANGUAGES, code);

// Maps a raw browser tag ("ar-SA", "en-GB", "fr-CA"...) to one of our
// supported language codes, or null if nothing matches.
export function detectBrowserLanguage(navigatorLike = navigator) {
  const candidates = navigatorLike.languages && navigatorLike.languages.length
    ? navigatorLike.languages
    : [navigatorLike.language].filter(Boolean);

  for (const tag of candidates) {
    const base = tag.toLowerCase().split('-')[0];
    if (isSupportedLanguage(base)) return base;
  }
  return null;
}
