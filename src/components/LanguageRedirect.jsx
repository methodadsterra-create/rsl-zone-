import { Navigate, useLocation } from 'react-router-dom';
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, detectBrowserLanguage, isSupportedLanguage } from '../i18n/config';

// Resolves the entry language with this priority, per spec:
//   1. Existing manual language preference (localStorage)
//   2. Browser/device language (navigator.language / navigator.languages)
//   3. English fallback
// Renders at "/" and also catches any unprefixed path (e.g. someone linking
// to "/clubs/al-nassr" without a language segment) by preserving the rest
// of the path after redirecting.
export default function LanguageRedirect() {
  const location = useLocation();

  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  let target = isSupportedLanguage(stored) ? stored : null;

  if (!target) {
    target = detectBrowserLanguage() || DEFAULT_LANGUAGE;
    // We do NOT persist auto-detected language as a "manual" choice — only
    // an explicit switcher click writes to localStorage (see
    // LanguageContext.setLanguage). This keeps detection re-evaluating
    // browser language on future visits until the user makes a real choice.
  }

  const rest = location.pathname === '/' ? '' : location.pathname;
  return <Navigate to={`/${target}${rest}${location.search}`} replace />;
}
