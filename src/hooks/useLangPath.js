import { useLanguage } from '../contexts/LanguageContext';

// Every internal link must be language-prefixed ("/en/clubs/al-nassr", not
// "/clubs/al-nassr"), so this small helper is used everywhere instead of
// hand-building paths, to avoid ever forgetting the prefix.
export function useLangPath() {
  const { language } = useLanguage();
  return (path = '') => {
    const clean = path.startsWith('/') ? path.slice(1) : path;
    return `/${language}${clean ? `/${clean}` : ''}`;
  };
}
