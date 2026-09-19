import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useLangPath } from '../hooks/useLangPath';
import { pickTranslation } from '../utils/translation';

export default function ArticleCard({ article, size = 'default' }) {
  const { language, t } = useLanguage();
  const langPath = useLangPath();
  const tr = pickTranslation(article, language);
  const cover = article.cover;

  return (
    <article className={`article-card article-card--${size}`}>
      <Link to={langPath(`news/${article.slug}`)} className="article-card__media">
        {cover?.url ? (
          <img src={cover.url} alt={(language === 'ar' ? cover.alt_text_ar : cover.alt_text_en) || ''} loading="lazy" />
        ) : (
          <div className="article-card__media-placeholder" aria-hidden="true" />
        )}
        {article.is_breaking_news && <span className="badge badge-live article-card__badge">{t('common.breakingNews')}</span>}
      </Link>
      <div className="article-card__body">
        {article.categories?.name_en && (
          <span className="article-card__category">{language === 'ar' ? article.categories.name_ar : article.categories.name_en}</span>
        )}
        <h3 className="article-card__title">
          <Link to={langPath(`news/${article.slug}`)}>{tr.title}</Link>
        </h3>
        {tr.excerpt && size !== 'compact' && <p className="article-card__excerpt">{tr.excerpt}</p>}
      </div>
    </article>
  );
}
