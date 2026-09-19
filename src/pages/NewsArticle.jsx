import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useLangPath } from '../hooks/useLangPath';
import { getArticleBySlug } from '../services/content';
import { pickTranslation } from '../utils/translation';
import { formatDateTime } from '../utils/datetime';
import { applySeo } from '../utils/seo';
import { LoadingState, ErrorState } from '../components/States';

export default function NewsArticle() {
  const { slug } = useParams();
  const { language, t } = useLanguage();
  const langPath = useLangPath();
  const [article, setArticle] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setArticle(null);
    getArticleBySlug(slug)
      .then((data) => { if (!cancelled) setArticle(data); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [slug]);

  const tr = article ? pickTranslation(article, language) : null;

  useEffect(() => {
    if (!article || !tr) return;
    const base = window.location.origin;
    applySeo({
      title: tr.seo_title || tr.title,
      description: tr.seo_description || tr.excerpt,
      canonical: `${base}/${language}/news/${article.slug}`,
      ogImage: article.cover?.url,
      hreflangs: [
        { hreflang: 'en', href: `${base}/en/news/${article.slug}` },
        { hreflang: 'ar', href: `${base}/ar/news/${article.slug}` },
        { hreflang: 'x-default', href: `${base}/en/news/${article.slug}` },
      ],
    });
  }, [article, tr, language]);

  if (error) return <div className="container section"><ErrorState message={error} /></div>;
  if (!article) return <div className="container section"><LoadingState rows={4} /></div>;

  const shareUrl = `${window.location.origin}${langPath(`news/${article.slug}`)}`;

  function copyLink() {
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <article className="container article-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to={langPath('')}>{t('nav.home')}</Link>
        <span aria-hidden="true">/</span>
        <Link to={langPath('news')}>{t('nav.news')}</Link>
      </nav>

      {tr.isFallback && language !== 'en' && (
        <p className="fallback-notice">{t('empty.arabicUnavailable')}</p>
      )}

      {article.categories?.name_en && (
        <span className="article-card__category">{language === 'ar' ? article.categories.name_ar : article.categories.name_en}</span>
      )}
      <h1>{tr.title}</h1>
      <p className="article-page__meta">{formatDateTime(article.published_at, article.timezone, language)}</p>

      {article.cover?.url && (
        <img
          className="article-page__cover"
          src={article.cover.url}
          alt={(language === 'ar' ? article.cover.caption_ar : article.cover.caption_en) || ''}
        />
      )}

      <div className="article-page__body">
        {tr.content.split('\n').filter(Boolean).map((para, i) => <p key={i}>{para}</p>)}
      </div>

      <div className="share-row">
        <span>{t('common.share')}:</span>
        <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(tr.title)}`} target="_blank" rel="noopener noreferrer">X</a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
        <a href={`https://wa.me/?text=${encodeURIComponent(`${tr.title} ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <button type="button" onClick={copyLink}>{copied ? t('common.linkCopied') : t('common.copyLink')}</button>
      </div>

      {(article.article_teams?.length > 0 || article.article_players?.length > 0) && (
        <div className="related-tags">
          {article.article_teams?.map(({ teams }) => teams && (
            <Link key={teams.slug} to={langPath(`clubs/${teams.slug}`)} className="chip">{language === 'ar' ? teams.name_ar : teams.name_en}</Link>
          ))}
          {article.article_players?.map(({ players }) => players && (
            <Link key={players.slug} to={langPath(`players/${players.slug}`)} className="chip">{language === 'ar' ? players.name_ar : players.name_en}</Link>
          ))}
        </div>
      )}
    </article>
  );
}
