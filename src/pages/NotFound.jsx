import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useLangPath } from '../hooks/useLangPath';

export default function NotFound() {
  const { t } = useLanguage();
  const langPath = useLangPath();
  return (
    <div className="container section" style={{ textAlign: 'center', padding: '80px 20px' }}>
      <h1>404</h1>
      <p>{t('errors.generic')}</p>
      <Link to={langPath('')} className="btn" style={{ marginTop: 12 }}>{t('nav.home')}</Link>
    </div>
  );
}
