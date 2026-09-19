import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useLangPath } from '../hooks/useLangPath';

export default function Footer() {
  const { t } = useLanguage();
  const langPath = useLangPath();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <div className="site-footer__brand">{t('brand.name')}</div>
          <p className="site-footer__disclaimer">{t('footer.aboutText')}</p>
        </div>
        <nav className="site-footer__nav" aria-label="Footer">
          <Link to={langPath('news')}>{t('nav.news')}</Link>
          <Link to={langPath('transfers')}>{t('nav.transfers')}</Link>
          <Link to={langPath('matches')}>{t('nav.matches')}</Link>
          <Link to={langPath('clubs')}>{t('nav.clubs')}</Link>
          <Link to={langPath('about')}>{t('footer.about')}</Link>
        </nav>
      </div>
      <div className="container site-footer__bottom">
        <span>{t('footer.disclaimer')}</span>
        <span>© {year} {t('brand.name')}. {t('footer.rights')}</span>
      </div>
    </footer>
  );
}
