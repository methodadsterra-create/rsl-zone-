import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from './LanguageContext';

// Loads the single row of global settings edited in Admin -> Settings and
// makes it available to the whole site (name, logo, favicon, social links,
// default language). If the row can't be read, the site falls back to the
// built-in defaults, so a settings problem never breaks the page.
const SiteSettingsContext = createContext({ settings: null, ready: false });

export function SiteSettingsProvider({ children }) {
  const [state, setState] = useState({ settings: null, ready: false });

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('site_settings')
      .select('*')
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setState({ settings: data || null, ready: true }); })
      .catch(() => { if (!cancelled) setState({ settings: null, ready: true }); });
    return () => { cancelled = true; };
  }, []);

  // custom favicon from Settings (the built-in one stays if none is set)
  useEffect(() => {
    const url = state.settings?.favicon_url;
    if (!url) return;
    let link = document.head.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'icon');
      document.head.appendChild(link);
    }
    link.removeAttribute('type');
    link.setAttribute('href', url);
  }, [state.settings?.favicon_url]);

  return <SiteSettingsContext.Provider value={state}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

// The site name for the visitor's language: the English name in English, the
// Arabic name in Arabic, falling back to the built-in translations.
export function useBrandName() {
  const { settings } = useSiteSettings();
  const { language, t } = useLanguage();
  const custom = language === 'ar' ? settings?.site_name_ar : settings?.site_name;
  return (custom && custom.trim()) || t('brand.name');
}
