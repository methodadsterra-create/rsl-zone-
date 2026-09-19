import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, supportedLanguages, setLanguage, t } = useLanguage();

  return (
    <div className="lang-switcher" role="group" aria-label={t('language.switch')}>
      {Object.values(supportedLanguages).map((l, i) => (
        <span key={l.code} style={{ display: 'contents' }}>
          {i > 0 && <span className="lang-switcher__sep" aria-hidden="true">|</span>}
          <button
            type="button"
            className="lang-switcher__btn"
            aria-current={language === l.code ? 'true' : undefined}
            onClick={() => setLanguage(l.code)}
          >
            {l.code === 'en' ? 'EN' : l.nativeLabel}
          </button>
        </span>
      ))}
    </div>
  );
}
