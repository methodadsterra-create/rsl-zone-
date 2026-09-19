import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useLangPath } from '../hooks/useLangPath';

export default function LeagueTable({ rows }) {
  const { language, t } = useLanguage();
  const langPath = useLangPath();

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="league-table">
        <thead>
          <tr>
            <th>#</th>
            <th style={{ textAlign: 'start' }}>{t('nav.clubs')}</th>
            <th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.team_id}>
              <td>{i + 1}</td>
              <td className="league-table__team">
                <Link to={langPath(`clubs/${row.slug}`)}>
                  {row.logo_url && <img src={row.logo_url} alt="" />}
                  {language === 'ar' ? row.name_ar : row.name_en}
                </Link>
              </td>
              <td>{row.played}</td>
              <td>{row.won}</td>
              <td>{row.drawn}</td>
              <td>{row.lost}</td>
              <td>{row.goal_difference}</td>
              <td><strong>{row.points}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
