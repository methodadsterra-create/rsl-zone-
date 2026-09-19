import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useLangPath } from '../hooks/useLangPath';
import { pickTranslation } from '../utils/translation';

export default function BreakingNewsBanner({ articles }) {
  const { language, t } = useLanguage();
  const langPath = useLangPath();

  if (!articles || articles.length === 0) return null;

  return (
    <div className="breaking-banner">
      <div className="container breaking-banner__inner">
        <span className="breaking-banner__label">{t('common.breakingNews')}</span>
        <div className="breaking-banner__items">
          {articles.map((a) => (
            <Link key={a.id} to={langPath(`news/${a.slug}`)}>{pickTranslation(a, language).title}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
