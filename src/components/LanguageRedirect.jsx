import { Navigate, useLocation } from 'react-router-dom';
import { DEFAULT_LANGUAGE, AUTO_DETECT_BROWSER_LANGUAGE, LANGUAGE_STORAGE_KEY, detectBrowserLanguage, isSupportedLanguage } from '../i18n/config';
import { useSiteSettings } from '../contexts/SiteSettingsContext';

// Resolves the entry language with this priority:
//   1. The visitor's own choice (language switcher, saved in localStorage)
//   2. Browser/device language, only if AUTO_DETECT_BROWSER_LANGUAGE is on
//   3. The default language set in Admin -> Settings (Arabic if none)
// Also catches unprefixed paths (e.g. "/clubs/al-nassr") and keeps the rest
// of the path after redirecting.
export default function LanguageRedirect() {
  const location = useLocation();
  const { settings, ready } = useSiteSettings();

  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  let target = isSupportedLanguage(stored) ? stored : null;

  // wait (briefly) for the Settings row so its default language can apply
  if (!target && !ready) return null;

  if (!target) {
    const fromSettings = isSupportedLanguage(settings?.default_language) ? settings.default_language : null;
    target = (AUTO_DETECT_BROWSER_LANGUAGE && detectBrowserLanguage()) || fromSettings || DEFAULT_LANGUAGE;
  }

  const rest = location.pathname === '/' ? '' : location.pathname;
  return <Navigate to={`/${target}${rest}${location.search}${location.hash}`} replace />;
}
