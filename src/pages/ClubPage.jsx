import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getClubBySlug, getClubArticles, getMatchesForTeam, getPlayers, getTransfersForTeam } from '../services/content';
import ArticleCard from '../components/ArticleCard';
import MatchCard from '../components/MatchCard';
import TransferCard from '../components/TransferCard';
import { PlayerCard } from '../components/TeamPlayerCards';
import { LoadingState, EmptyState, ErrorState } from '../components/States';
import { applySeo } from '../utils/seo';
import { useBrandName } from '../contexts/SiteSettingsContext';

export default function ClubPage() {
  const { slug } = useParams();
  const { language, t } = useLanguage();
  const brandName = useBrandName();
  const [club, setClub] = useState(null);
  const [articles, setArticles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setClub(null);
    getClubBySlug(slug)
      .then(async (teamData) => {
        if (cancelled) return;
        setClub(teamData);
        const [a, m, p, tr] = await Promise.all([
          getClubArticles(teamData.id),
          getMatchesForTeam(teamData.id),
          getPlayers({ teamId: teamData.id }),
          getTransfersForTeam(teamData.id),
        ]);
        if (cancelled) return;
        setArticles(a);
        setMatches(m);
        setPlayers(p);
        setTransfers(tr);
      })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!club) return;
    applySeo({
      title: `${language === 'ar' ? club.name_ar : club.name_en} — ${brandName}`,
      description: (language === 'ar' ? club.description_ar : club.description_en) || undefined,
    });
  }, [club, language, brandName]);

  if (error) return <div className="container section"><ErrorState message={error} /></div>;
  if (!club) return <div className="container section"><LoadingState rows={4} /></div>;

  const upcoming = matches.filter((m) => m.status === 'scheduled' || m.status === 'live');
  const recent = matches.filter((m) => m.status === 'finished');

  return (
    <div className="container">
      <div className="club-header">
        {club.logo_url && <img src={club.logo_url} alt="" className="club-header__logo" />}
        <div>
          <h1>{language === 'ar' ? club.name_ar : club.name_en}</h1>
          <p className="club-header__meta">
            {[club.city, club.stadium, club.founded_year ? `${t('common.by') === 'By' ? 'Founded' : ''} ${club.founded_year}`.trim() : null].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      <section className="section">
        <div className="section-head"><h2>{t('nav.news')}</h2></div>
        {articles.length === 0 ? <EmptyState message={t('empty.noArticles')} /> : (
          <div className="news-grid">{articles.map((a) => <ArticleCard key={a.id} article={a} />)}</div>
        )}
      </section>

      <section className="section">
        <div className="section-head"><h2>{t('home.upcomingMatches')}</h2></div>
        {upcoming.length === 0 ? <EmptyState message={t('empty.noUpcomingMatches')} /> : (
          <div className="match-grid">{upcoming.map((m) => <MatchCard key={m.id} match={m} />)}</div>
        )}
      </section>

      <section className="section">
        <div className="section-head"><h2>{t('home.recentResults')}</h2></div>
        {recent.length === 0 ? <EmptyState message={t('empty.noResults')} /> : (
          <div className="match-grid">{recent.map((m) => <MatchCard key={m.id} match={m} />)}</div>
        )}
      </section>

      <section className="section">
        <div className="section-head"><h2>{t('nav.players')}</h2></div>
        {players.length === 0 ? <EmptyState /> : (
          <div className="player-grid">{players.map((p) => <PlayerCard key={p.id} player={p} />)}</div>
        )}
      </section>

      <section className="section">
        <div className="section-head"><h2>{t('nav.transfers')}</h2></div>
        {transfers.length === 0 ? <EmptyState message={t('empty.noTransfers')} /> : (
          <div className="transfer-grid">{transfers.map((tr) => <TransferCard key={tr.id} transfer={tr} />)}</div>
        )}
      </section>
    </div>
  );
}
