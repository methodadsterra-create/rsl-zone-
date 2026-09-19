import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useLangPath } from '../hooks/useLangPath';
import { searchSite } from '../services/content';
import { TeamCard, PlayerCard } from '../components/TeamPlayerCards';
import { LoadingState, EmptyState, ErrorState } from '../components/States';

export default function Search() {
  const { language, t } = useLanguage();
  const langPath = useLangPath();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [input, setInput] = useState(q);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!q) { setResults(null); return; }
    let cancelled = false;
    setResults(null);
    searchSite(q, language)
      .then((r) => { if (!cancelled) setResults(r); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [q, language]);

  function handleSubmit(e) {
    e.preventDefault();
    setParams(input ? { q: input } : {});
  }

  const hasAny = results && (results.articles.length || results.teams.length || results.players.length);

  return (
    <div className="container">
      <div className="page-header"><h1>{t('common.search')}</h1></div>
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('common.searchPlaceholder')}
          aria-label={t('common.search')}
        />
        <button type="submit" className="btn">{t('common.search')}</button>
      </form>

      <div className="section">
        {error && <ErrorState message={error} />}
        {!error && q && !results && <LoadingState rows={4} />}
        {!error && q && results && !hasAny && <EmptyState message={t('common.noResults')} />}

        {results?.articles?.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h2>{t('nav.news')}</h2>
            <ul className="search-results-list">
              {results.articles.map((a) => (
                <li key={a.article_id}><Link to={langPath(`news/${a.articles.slug}`)}>{a.title}</Link></li>
              ))}
            </ul>
          </div>
        )}

        {results?.teams?.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h2>{t('nav.clubs')}</h2>
            <div className="team-grid">{results.teams.map((tm) => <TeamCard key={tm.id} team={tm} />)}</div>
          </div>
        )}

        {results?.players?.length > 0 && (
          <div>
            <h2>{t('nav.players')}</h2>
            <div className="player-grid">{results.players.map((p) => <PlayerCard key={p.id} player={p} />)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
