import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  isSupportedLanguage,
} from '../i18n/config';
import en from '../i18n/locales/en';
import ar from '../i18n/locales/ar';

const locales = { en, ar };

const LanguageContext = createContext(null);

function getByPath(dict, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), dict);
}

// The active language is derived from the `:lang` URL segment, which is the
// single source of truth (see AppRoutes). This provider exposes the
// translation helper, direction, and a `setLanguage` that persists the
// user's manual choice and navigates to the equivalent path in the new
// language. Detection-on-first-visit happens once, in LanguageRedirect.
export function LanguageProvider({ children }) {
  const { lang } = useParams();
  const navigate = useNavigate();

  const language = isSupportedLanguage(lang) ? lang : DEFAULT_LANGUAGE;
  const meta = SUPPORTED_LANGUAGES[language];
  const dict = locales[language] || locales[DEFAULT_LANGUAGE];

  const t = useCallback(
    (path) => {
      const value = getByPath(dict, path);
      if (value === undefined) {
        // eslint-disable-next-line no-console
        console.warn(`Missing translation key "${path}" for language "${language}"`);
        return path;
      }
      return value;
    },
    [dict, language]
  );

  const setLanguage = useCallback(
    (nextLang) => {
      if (!isSupportedLanguage(nextLang) || nextLang === language) return;
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
      document.documentElement.setAttribute('lang', nextLang);
      document.documentElement.setAttribute('dir', SUPPORTED_LANGUAGES[nextLang].dir);

      // Swap only the language segment, preserving the rest of the path so
      // switching language on an article page keeps you on that article.
      const path = window.location.pathname;
      const segments = path.split('/').filter(Boolean);
      segments[0] = nextLang;
      navigate(`/${segments.join('/')}${window.location.search}`, { replace: false });
    },
    [language, navigate]
  );

  // keep <html lang/dir> in step with the language in the URL (also after
  // coming back from the always-English admin)
  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', meta.dir);
  }, [language, meta.dir]);

  const value = useMemo(
    () => ({
      language,
      dir: meta.dir,
      isRtl: meta.dir === 'rtl',
      supportedLanguages: SUPPORTED_LANGUAGES,
      t,
      setLanguage,
    }),
    [language, meta.dir, t, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
