import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTransfers } from '../services/content';
import TransferCard from '../components/TransferCard';
import { LoadingState, EmptyState, ErrorState } from '../components/States';

export default function Transfers() {
  const { t } = useLanguage();
  const [transfers, setTransfers] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getTransfers(40).then((d) => { if (!cancelled) setTransfers(d); }).catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="container">
      <div className="page-header"><h1>{t('nav.transfers')}</h1></div>
      <div className="section">
        {error && <ErrorState message={error} />}
        {!error && !transfers && <LoadingState rows={6} />}
        {!error && transfers && transfers.length === 0 && <EmptyState message={t('empty.noTransfers')} />}
        {!error && transfers && transfers.length > 0 && (
          <div className="transfer-grid">
            {transfers.map((tr) => <TransferCard key={tr.id} transfer={tr} />)}
          </div>
        )}
      </div>
    </div>
  );
}
