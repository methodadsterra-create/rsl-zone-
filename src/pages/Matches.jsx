import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useLangPath } from '../hooks/useLangPath';
import { getUpcomingMatches, getRecentResults } from '../services/content';
import MatchCard from '../components/MatchCard';
import { LoadingState, EmptyState, ErrorState } from '../components/States';

function MatchList({ mode }) {
  const { t } = useLanguage();
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetcher = mode === 'results' ? getRecentResults : getUpcomingMatches;
    fetcher(40).then((d) => { if (!cancelled) setMatches(d); }).catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [mode]);

  if (error) return <ErrorState message={error} />;
  if (!matches) return <LoadingState rows={6} />;
  if (matches.length === 0) return <EmptyState message={mode === 'results' ? t('empty.noResults') : t('empty.noUpcomingMatches')} />;
  return (
    <div className="match-grid">
      {matches.map((m) => <MatchCard key={m.id} match={m} />)}
    </div>
  );
}

export default function Matches() {
  const { t } = useLanguage();
  const langPath = useLangPath();
  const location = useLocation();
  const mode = location.pathname.endsWith('/results') ? 'results' : 'upcoming';

  return (
    <div className="container">
      <div className="page-header"><h1>{t('nav.matches')}</h1></div>
      <div className="lang-tabs" style={{ marginBottom: 20 }}>
        <NavLink to={langPath('matches/upcoming')} className={({ isActive }) => (isActive || location.pathname.endsWith('/matches') ? 'is-active' : '')}>
          {t('match.scheduled')}
        </NavLink>
        <NavLink to={langPath('matches/results')} className={({ isActive }) => (isActive ? 'is-active' : '')}>
          {t('match.finished')}
        </NavLink>
      </div>
      <div className="section" style={{ paddingTop: 0 }}>
        <MatchList mode={mode} />
      </div>
    </div>
  );
}
