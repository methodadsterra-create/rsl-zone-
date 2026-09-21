import { Navigate, useLocation } from 'react-router-dom';
import { DEFAULT_LANGUAGE, AUTO_DETECT_BROWSER_LANGUAGE, LANGUAGE_STORAGE_KEY, detectBrowserLanguage, isSupportedLanguage } from '../i18n/config';

// Resolves the entry language with this priority:
//   1. The visitor's own choice (language switcher, saved in localStorage)
//   2. Browser/device language, only if AUTO_DETECT_BROWSER_LANGUAGE is on (it is off)
//   3. DEFAULT_LANGUAGE = Arabic
// Also catches unprefixed paths (e.g. "/clubs/al-nassr") and keeps the rest
// of the path after redirecting.
export default function LanguageRedirect() {
  const location = useLocation();

  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  let target = isSupportedLanguage(stored) ? stored : null;

  if (!target) {
    target = (AUTO_DETECT_BROWSER_LANGUAGE && detectBrowserLanguage()) || DEFAULT_LANGUAGE;
  }

  const rest = location.pathname === '/' ? '' : location.pathname;
  return <Navigate to={`/${target}${rest}${location.search}${location.hash}`} replace />;
}
