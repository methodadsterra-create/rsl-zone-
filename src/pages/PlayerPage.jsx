import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useLangPath } from '../hooks/useLangPath';
import { getPlayerBySlug, getPlayerArticles } from '../services/content';
import ArticleCard from '../components/ArticleCard';
import { LoadingState, EmptyState, ErrorState } from '../components/States';
import { applySeo } from '../utils/seo';
import { useBrandName } from '../contexts/SiteSettingsContext';

export default function PlayerPage() {
  const { slug } = useParams();
  const { language, t } = useLanguage();
  const brandName = useBrandName();
  const langPath = useLangPath();
  const [player, setPlayer] = useState(null);
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setPlayer(null);
    getPlayerBySlug(slug)
      .then(async (data) => {
        if (cancelled) return;
        setPlayer(data);
        const a = await getPlayerArticles(data.id);
        if (!cancelled) setArticles(a);
      })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!player) return;
    applySeo({
      title: `${language === 'ar' ? player.name_ar : player.name_en} — ${brandName}`,
      description: (language === 'ar' ? player.bio_ar : player.bio_en) || undefined,
    });
  }, [player, language, brandName]);

  if (error) return <div className="container section"><ErrorState message={error} /></div>;
  if (!player) return <div className="container section"><LoadingState rows={3} /></div>;

  const bio = language === 'ar' ? player.bio_ar : player.bio_en;

  return (
    <div className="container">
      <div className="player-header">
        {player.photo_url ? <img src={player.photo_url} alt="" className="player-header__photo" /> : null}
        <div>
          <h1>{language === 'ar' ? player.name_ar : player.name_en}</h1>
          <p className="player-header__meta">
            {[player.position, player.nationality, player.teams?.name_en].filter(Boolean).join(' · ')}
          </p>
          {player.teams?.slug && (
            <Link to={langPath(`clubs/${player.teams.slug}`)} className="chip" style={{ marginTop: 6, display: 'inline-block' }}>
              {language === 'ar' ? player.teams.name_ar : player.teams.name_en}
            </Link>
          )}
        </div>
      </div>

      {bio && <p style={{ maxWidth: '68ch', marginTop: 16 }}>{bio}</p>}

      <section className="section">
        <div className="section-head"><h2>{t('nav.news')}</h2></div>
        {articles.length === 0 ? <EmptyState message={t('empty.noArticles')} /> : (
          <div className="news-grid">{articles.map((a) => <ArticleCard key={a.id} article={a} />)}</div>
        )}
      </section>
    </div>
  );
}
