import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useLangPath } from '../hooks/useLangPath';

export function TeamCard({ team }) {
  const { language } = useLanguage();
  const langPath = useLangPath();
  return (
    <Link to={langPath(`clubs/${team.slug}`)} className="team-card">
      {team.logo_url ? <img src={team.logo_url} alt="" className="team-card__logo" /> : <div className="team-card__logo team-card__logo--placeholder" aria-hidden="true" />}
      <span className="team-card__name">{language === 'ar' ? team.name_ar : team.name_en}</span>
      {team.city && <span className="team-card__city">{team.city}</span>}
    </Link>
  );
}

export function PlayerCard({ player }) {
  const { language } = useLanguage();
  const langPath = useLangPath();
  return (
    <Link to={langPath(`players/${player.slug}`)} className="player-card">
      {player.photo_url ? <img src={player.photo_url} alt="" className="player-card__photo" /> : <div className="player-card__photo player-card__photo--placeholder" aria-hidden="true" />}
      <span className="player-card__name">{language === 'ar' ? player.name_ar : player.name_en}</span>
      <span className="player-card__meta">{player.position}{player.teams?.name_en ? ` · ${player.teams.name_en}` : ''}</span>
    </Link>
  );
}
