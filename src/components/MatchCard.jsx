import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useLangPath } from '../hooks/useLangPath';
import { formatDateTime } from '../utils/datetime';

export default function MatchCard({ match }) {
  const { language, t } = useLanguage();
  const langPath = useLangPath();
  const home = match.home;
  const away = match.away;
  const finished = match.status === 'finished';
  const live = match.status === 'live';

  return (
    <div className="match-card">
      <div className="match-card__meta">
        <span>{formatDateTime(match.kickoff_at, undefined, language)}</span>
        {live && <span className="badge badge-live">{t('match.live')}</span>}
        {match.status === 'postponed' && <span className="badge">{t('match.postponed')}</span>}
      </div>
      <div className="match-card__teams">
        <Link to={langPath(`clubs/${home?.slug}`)} className="match-card__team">
          {home?.logo_url && <img src={home.logo_url} alt="" className="match-card__crest" />}
          <span>{language === 'ar' ? home?.name_ar : home?.name_en}</span>
        </Link>
        <span className="match-card__score">
          {finished || live ? `${match.home_score ?? 0} – ${match.away_score ?? 0}` : t('common.vs')}
        </span>
        <Link to={langPath(`clubs/${away?.slug}`)} className="match-card__team">
          {away?.logo_url && <img src={away.logo_url} alt="" className="match-card__crest" />}
          <span>{language === 'ar' ? away?.name_ar : away?.name_en}</span>
        </Link>
      </div>
      {match.venue && <div className="match-card__venue">{match.venue}</div>}
    </div>
  );
}
