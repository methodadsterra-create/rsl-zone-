import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getLeagueTable } from '../services/content';
import LeagueTable from '../components/LeagueTable';
import { LoadingState, EmptyState, ErrorState } from '../components/States';

export default function Table() {
  const { t } = useLanguage();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getLeagueTable().then((d) => { if (!cancelled) setRows(d); }).catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="container">
      <div className="page-header"><h1>{t('home.leagueTable')}</h1></div>
      <div className="section">
        {error && <ErrorState message={error} />}
        {!error && !rows && <LoadingState rows={6} />}
        {!error && rows && rows.length === 0 && <EmptyState />}
        {!error && rows && rows.length > 0 && <LeagueTable rows={rows} />}
      </div>
    </div>
  );
}
