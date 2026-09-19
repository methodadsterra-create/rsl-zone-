import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getClubs } from '../services/content';
import { TeamCard } from '../components/TeamPlayerCards';
import { LoadingState, EmptyState, ErrorState } from '../components/States';

export default function Clubs() {
  const { t } = useLanguage();
  const [clubs, setClubs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getClubs().then((d) => { if (!cancelled) setClubs(d); }).catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="container">
      <div className="page-header"><h1>{t('nav.clubs')}</h1></div>
      <div className="section">
        {error && <ErrorState message={error} />}
        {!error && !clubs && <LoadingState rows={4} />}
        {!error && clubs && clubs.length === 0 && <EmptyState />}
        {!error && clubs && clubs.length > 0 && (
          <div className="team-grid">
            {clubs.map((c) => <TeamCard key={c.id} team={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}
