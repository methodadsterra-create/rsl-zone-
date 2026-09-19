import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getPlayers } from '../services/content';
import { PlayerCard } from '../components/TeamPlayerCards';
import { LoadingState, EmptyState, ErrorState } from '../components/States';

export default function Players() {
  const { t } = useLanguage();
  const [players, setPlayers] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getPlayers().then((d) => { if (!cancelled) setPlayers(d); }).catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="container">
      <div className="page-header"><h1>{t('nav.players')}</h1></div>
      <div className="section">
        {error && <ErrorState message={error} />}
        {!error && !players && <LoadingState rows={4} />}
        {!error && players && players.length === 0 && <EmptyState />}
        {!error && players && players.length > 0 && (
          <div className="player-grid">
            {players.map((p) => <PlayerCard key={p.id} player={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
