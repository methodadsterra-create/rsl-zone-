import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { formatDateTime, formatCountdown } from '../../utils/datetime';
import LiveVisitors from '../../components/LiveVisitors';
import VisitStats from '../../components/VisitStats';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [scheduled, setScheduled] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [, forceTick] = useState(0);

  // Re-render every minute so the countdowns stay accurate without a reload.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [
          totalArticles,
          published,
          draft,
          scheduledCount,
          totalTeams,
          totalPlayers,
          upcomingMatches,
          scheduledList,
          recentList,
        ] = await Promise.all([
          supabase.from('articles').select('id', { count: 'exact', head: true }),
          supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
          supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
          supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
          supabase.from('teams').select('id', { count: 'exact', head: true }),
          supabase.from('players').select('id', { count: 'exact', head: true }),
          supabase.from('matches').select('id', { count: 'exact', head: true }).gte('kickoff_at', new Date().toISOString()),
          supabase
            .from('articles')
            .select('id, slug, published_at, timezone, article_translations(title, language)')
            .eq('status', 'scheduled')
            .order('published_at', { ascending: true })
            .limit(8),
          supabase
            .from('articles')
            .select('id, slug, status, updated_at, article_translations(title, language)')
            .order('updated_at', { ascending: false })
            .limit(8),
        ]);

        if (cancelled) return;

        const firstError = [
          totalArticles, published, draft, scheduledCount, totalTeams, totalPlayers, upcomingMatches, scheduledList, recentList,
        ].find((r) => r.error);
        if (firstError) throw firstError.error;

        setStats({
          totalArticles: totalArticles.count ?? 0,
          published: published.count ?? 0,
          draft: draft.count ?? 0,
          scheduled: scheduledCount.count ?? 0,
          totalTeams: totalTeams.count ?? 0,
          totalPlayers: totalPlayers.count ?? 0,
          upcomingMatches: upcomingMatches.count ?? 0,
        });
        setScheduled(scheduledList.data || []);
        setRecent(recentList.data || []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load dashboard data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function titleFor(translations, lang = 'en') {
    const match = translations?.find((t) => t.language === lang) || translations?.[0];
    return match?.title || '(untitled)';
  }

  if (loading) return <p>Loading dashboard…</p>;
  if (error) return <p role="alert">Couldn't load the dashboard: {error}</p>;

  return (
    <div>
      <h1>Dashboard</h1>

      <LiveVisitors />

      <VisitStats />

      <div className="admin-stat-grid">
        <StatCard label="Total articles" value={stats.totalArticles} />
        <StatCard label="Published" value={stats.published} />
        <StatCard label="Drafts" value={stats.draft} />
        <StatCard label="Scheduled" value={stats.scheduled} />
        <StatCard label="Total teams" value={stats.totalTeams} />
        <StatCard label="Total players" value={stats.totalPlayers} />
        <StatCard label="Upcoming matches" value={stats.upcomingMatches} />
        <StatCard label="Recent articles" value={recent.length} />
      </div>

      <section className="admin-panel" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 12 }}>Scheduled Publications</h2>
        {scheduled.length === 0 ? (
          <p>No articles are currently scheduled.</p>
        ) : (
          <ul className="scheduled-list">
            {scheduled.map((a) => (
              <li key={a.id} className="scheduled-list__item">
                <div>
                  <Link to={`/admin/articles/${a.id}`}>{titleFor(a.article_translations)}</Link>
                  <div className="scheduled-list__meta">
                    Scheduled: {formatDateTime(a.published_at, a.timezone)} ({a.timezone})
                  </div>
                </div>
                <div className="scheduled-list__right">
                  <span className="badge badge-gold">Scheduled</span>
                  <span className="scheduled-list__countdown">{formatCountdown(a.published_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-panel">
        <h2 style={{ marginBottom: 12 }}>Recent Articles</h2>
        {recent.length === 0 ? (
          <p>No articles yet. <Link to="/admin/articles/new">Create your first article</Link>.</p>
        ) : (
          <ul className="scheduled-list">
            {recent.map((a) => (
              <li key={a.id} className="scheduled-list__item">
                <div>
                  <Link to={`/admin/articles/${a.id}`}>{titleFor(a.article_translations)}</Link>
                </div>
                <span className={`badge${a.status === 'published' ? ' badge-gold' : ''}`}>{a.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-card__value">{value}</div>
      <div className="admin-stat-card__label">{label}</div>
    </div>
  );
}
