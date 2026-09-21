import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useLangPath } from '../hooks/useLangPath';
import {
  getFeaturedHome, getByPlacement, getBreakingNews, getUpcomingMatches,
  getRecentResults, getClubs, getAllPublishedArticles,
} from '../services/content';
import ArticleCard from '../components/ArticleCard';
import BreakingNewsBanner from '../components/BreakingNewsBanner';
import MatchCard from '../components/MatchCard';
import { TeamCard } from '../components/TeamPlayerCards';
import { LoadingState, EmptyState, ErrorState } from '../components/States';

export default function Home() {
  const { t } = useLanguage();
  const langPath = useLangPath();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [featured, latest, transfers, breaking, upcoming, results, clubs, allArticles] = await Promise.all([
          getFeaturedHome(5),
          getByPlacement('show_in_latest_news', 6),
          getByPlacement('show_in_transfers', 4),
          getBreakingNews(5),
          getUpcomingMatches(4),
          getRecentResults(4),
          getClubs(),
          getAllPublishedArticles({ limit: 8 }),
        ]);
        if (!cancelled) setData({ featured, latest, transfers, breaking, upcoming, results, clubs, allArticles });
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load homepage content.');
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="container section"><ErrorState message={error} /></div>;
  if (!data) return <div className="container section"><LoadingState rows={5} /></div>;

  const [heroMain, ...heroRest] = data.featured;

  return (
    <>
      <BreakingNewsBanner articles={data.breaking} />

      <div className="container">
        {heroMain ? (
          <section className="hero-section">
            <ArticleCard article={heroMain} size="hero" />
            <div className="hero-secondary">
              {heroRest.slice(0, 3).map((a) => (
                <ArticleCard key={a.id} article={a} size="compact" />
              ))}
            </div>
          </section>
        ) : (
          <div className="section"><EmptyState message={t('empty.noArticles')} /></div>
        )}

        <section className="section">
          <div className="section-head">
            <h2>{t('home.latestNews')}</h2>
            <Link to={langPath('news')} className="view-all">{t('common.viewAll')}</Link>
          </div>
          {data.latest.length === 0 ? <EmptyState message={t('empty.noArticles')} /> : (
            <div className="news-grid">
              {data.latest.map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
          )}
        </section>

        <section className="section">
          <div className="section-head">
            <h2>{t('home.upcomingMatches')}</h2>
            <Link to={langPath('matches/upcoming')} className="view-all">{t('common.viewAll')}</Link>
          </div>
          {data.upcoming.length === 0 ? <EmptyState message={t('empty.noUpcomingMatches')} /> : (
            <div className="match-grid">
              {data.upcoming.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          )}
        </section>

        <section className="section">
          <div className="section-head">
            <h2>{t('home.transfers')}</h2>
            <Link to={langPath('transfers')} className="view-all">{t('common.viewAll')}</Link>
          </div>
          {data.transfers.length === 0 ? <EmptyState message={t('empty.noArticles')} /> : (
            <div className="news-grid">
              {data.transfers.map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
          )}
        </section>

        <section className="section">
          <div className="section-head">
            <h2>{t('home.recentResults')}</h2>
            <Link to={langPath('matches/results')} className="view-all">{t('common.viewAll')}</Link>
          </div>
          {data.results.length === 0 ? <EmptyState message={t('empty.noResults')} /> : (
            <div className="match-grid">
              {data.results.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          )}
        </section>

        <section className="section">
          <div className="section-head"><h2>{t('home.popularClubs')}</h2></div>
          {data.clubs.length === 0 ? <EmptyState /> : (
            <div className="team-grid">
              {data.clubs.slice(0, 8).map((c) => <TeamCard key={c.id} team={c} />)}
            </div>
          )}
        </section>

        <section className="section">
          <div className="section-head">
            <h2>{t('home.latestArticles')}</h2>
            <Link to={langPath('news')} className="view-all">{t('common.viewAll')}</Link>
          </div>
          {data.allArticles.length === 0 ? <EmptyState message={t('empty.noArticles')} /> : (
            <div className="news-grid">
              {data.allArticles.map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
