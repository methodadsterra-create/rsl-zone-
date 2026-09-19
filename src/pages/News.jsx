import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getAllPublishedArticles } from '../services/content';
import ArticleCard from '../components/ArticleCard';
import { LoadingState, EmptyState, ErrorState } from '../components/States';

export default function News() {
  const { t } = useLanguage();
  const [articles, setArticles] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getAllPublishedArticles({ limit: 40 })
      .then((data) => { if (!cancelled) setArticles(data); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="container">
      <div className="page-header">
        <h1>{t('nav.news')}</h1>
      </div>
      <div className="section">
        {error && <ErrorState message={error} />}
        {!error && !articles && <LoadingState rows={6} />}
        {!error && articles && articles.length === 0 && <EmptyState message={t('empty.noArticles')} />}
        {!error && articles && articles.length > 0 && (
          <div className="news-grid">
            {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
          </div>
        )}
      </div>
    </div>
  );
}
