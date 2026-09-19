import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useLangPath } from '../hooks/useLangPath';

const STATUS_KEY = { rumour: 'rumour', reported: 'reported', advanced: 'advanced', completed: 'completed', confirmed: 'confirmed' };

export default function TransferCard({ transfer }) {
  const { language, t } = useLanguage();
  const langPath = useLangPath();
  const playerName = transfer.players ? (language === 'ar' ? transfer.players.name_ar : transfer.players.name_en) : transfer.player_name_fallback;

  return (
    <div className="transfer-card">
      <div className="transfer-card__top">
        <span className="transfer-card__player">
          {transfer.players ? <Link to={langPath(`players/${transfer.players.slug}`)}>{playerName}</Link> : playerName}
        </span>
        <span className={`badge${transfer.status === 'confirmed' ? ' badge-gold' : ''}`}>{t(`transfer.${STATUS_KEY[transfer.status]}`)}</span>
      </div>
      <div className="transfer-card__move">
        <span>{t('transfer.from')}: {transfer.from_team ? (language === 'ar' ? transfer.from_team.name_ar : transfer.from_team.name_en) : '—'}</span>
        <span aria-hidden="true">→</span>
        <span>{t('transfer.to')}: {transfer.to_team ? (language === 'ar' ? transfer.to_team.name_ar : transfer.to_team.name_en) : '—'}</span>
      </div>
      {transfer.fee && <div className="transfer-card__fee">{t('transfer.fee')}: {transfer.fee}</div>}
    </div>
  );
}
