import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const fmt = (n) => Number(n || 0).toLocaleString();

// Admin dashboard: visits today / this week / this month / all time.
// "Visits" = people arriving (new after 30 min away). "Page views" = pages opened.
export default function VisitStats() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data: d, error: err } = await supabase.rpc('get_visit_stats');
    if (err) { setError(err.message); return; }
    setError('');
    setData(d);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  if (error) {
    return (
      <section className="admin-panel" style={{ marginBottom: 16 }}>
        <h2 style={{ marginBottom: 8 }}>Visits</h2>
        <p role="alert" style={{ color: 'var(--color-live)', fontSize: '0.9rem' }}>
          Couldn't load visit stats: {error}. (Have you run supabase/07_visit_stats.sql?)
        </p>
      </section>
    );
  }
  if (!data) return <section className="admin-panel" style={{ marginBottom: 16 }}><p>Loading visits…</p></section>;

  const periods = [
    ['Today', data.today],
    ['This week', data.week],
    ['This month', data.month],
    ['All time', data.total],
  ];
  const daily = data.daily || [];
  const max = Math.max(1, ...daily.map((d) => d.visits));

  return (
    <section className="admin-panel" style={{ marginBottom: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Visits</h2>
      <div className="visit-grid">
        {periods.map(([label, v]) => (
          <div key={label} className="visit-card">
            <div className="visit-card__label">{label}</div>
            <div className="visit-card__value">{fmt(v.visits)}</div>
            <div className="visit-card__sub">{fmt(v.views)} page views</div>
          </div>
        ))}
      </div>

      {daily.length > 0 && (
        <>
          <p className="visit-chart__title">Last 14 days (visits)</p>
          <div className="visit-chart" role="img" aria-label="Visits per day for the last 14 days">
            {daily.map((d) => (
              <div key={d.day} className="visit-chart__col" title={`${d.day}: ${fmt(d.visits)} visits, ${fmt(d.views)} page views`}>
                <div className="visit-chart__bar" style={{ height: `${Math.max(3, (d.visits / max) * 100)}%` }} />
                <span>{Number(d.day.slice(8, 10))}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
