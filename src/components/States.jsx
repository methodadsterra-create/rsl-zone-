import { useLanguage } from '../contexts/LanguageContext';

export function LoadingState({ rows = 3 }) {
  const { t } = useLanguage();
  return (
    <div aria-live="polite" aria-busy="true">
      <span className="visually-hidden">{t('common.loading')}</span>
      <div className="skeleton-list">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 88, marginBottom: 10 }} />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ message }) {
  const { t } = useLanguage();
  return <p className="empty-state">{message || t('common.noResults')}</p>;
}

export function ErrorState({ message }) {
  const { t } = useLanguage();
  return <p role="alert" className="empty-state empty-state--error">{message || t('errors.loadFailed')}</p>;
}
