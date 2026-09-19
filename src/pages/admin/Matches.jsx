import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdminTable from '../../components/AdminTable';
import { formatDateTime } from '../../utils/datetime';

const EMPTY = { home_team_id: '', away_team_id: '', competition: 'Saudi Pro League', kickoff_at: '', venue: '', status: 'scheduled', home_score: '', away_score: '', featured: false };

export default function AdminMatches() {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const [m, t] = await Promise.all([
      supabase.from('matches').select('*, home:home_team_id(name_en), away:away_team_id(name_en)').order('kickoff_at', { ascending: false }),
      supabase.from('teams').select('id, name_en').order('name_en'),
    ]);
    if (m.error) setError(m.error.message);
    setMatches(m.data || []);
    setTeams(t.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startEdit(row) {
    setEditingId(row.id);
    setForm({
      ...EMPTY, ...row,
      kickoff_at: row.kickoff_at ? row.kickoff_at.slice(0, 16) : '',
      home_score: row.home_score ?? '', away_score: row.away_score ?? '',
    });
  }
  function startNew() { setEditingId(null); setForm(EMPTY); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.home_team_id === form.away_team_id) { setError('Home and away teams must differ.'); return; }
    const payload = {
      ...form,
      kickoff_at: new Date(form.kickoff_at).toISOString(),
      home_score: form.home_score === '' ? null : Number(form.home_score),
      away_score: form.away_score === '' ? null : Number(form.away_score),
    };
    const { error: err } = editingId
      ? await supabase.from('matches').update(payload).eq('id', editingId)
      : await supabase.from('matches').insert(payload);
    if (err) { setError(err.message); return; }
    startNew();
    load();
  }

  async function remove(id) {
    if (!window.confirm('Delete this match?')) return;
    await supabase.from('matches').delete().eq('id', id);
    load();
  }

  return (
    <div>
      <h1>Matches</h1>
      <div className="editor-grid" style={{ marginTop: 16 }}>
        <div className="admin-panel">
          {loading ? <p>Loading…</p> : (
            <AdminTable
              rows={matches}
              emptyMessage="No matches yet."
              columns={[
                { key: 'fixture', label: 'Fixture', render: (r) => `${r.home?.name_en} vs ${r.away?.name_en}` },
                { key: 'kickoff_at', label: 'Kickoff', render: (r) => formatDateTime(r.kickoff_at) },
                { key: 'status', label: 'Status', render: (r) => <span className="badge">{r.status}</span> },
                { key: 'score', label: 'Score', render: (r) => (r.home_score != null ? `${r.home_score} - ${r.away_score}` : '—') },
                {
                  key: 'actions', label: 'Actions', render: (r) => (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline" style={{ padding: '4px 10px' }} onClick={() => startEdit(r)}>Edit</button>
                      <button className="btn btn-outline" style={{ padding: '4px 10px', color: 'var(--color-live)' }} onClick={() => remove(r.id)}>Delete</button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>

        <form className="admin-panel" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit match' : 'New match'}</h2>
          {error && <p role="alert" style={{ color: 'var(--color-live)' }}>{error}</p>}
          <div className="admin-form-row"><label>Home team</label>
            <select required value={form.home_team_id} onChange={(e) => setForm({ ...form, home_team_id: e.target.value })}>
              <option value="">—</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name_en}</option>)}
            </select>
          </div>
          <div className="admin-form-row"><label>Away team</label>
            <select required value={form.away_team_id} onChange={(e) => setForm({ ...form, away_team_id: e.target.value })}>
              <option value="">—</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name_en}</option>)}
            </select>
          </div>
          <div className="admin-form-row"><label>Kickoff</label><input required type="datetime-local" value={form.kickoff_at} onChange={(e) => setForm({ ...form, kickoff_at: e.target.value })} /></div>
          <div className="admin-form-row"><label>Venue</label><input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
          <div className="admin-form-row"><label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {['scheduled', 'live', 'finished', 'postponed', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="admin-form-row"><label>Home score</label><input type="number" value={form.home_score} onChange={(e) => setForm({ ...form, home_score: e.target.value })} /></div>
          <div className="admin-form-row"><label>Away score</label><input type="number" value={form.away_score} onChange={(e) => setForm({ ...form, away_score: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn">{editingId ? 'Save changes' : 'Create match'}</button>
            {editingId && <button type="button" className="btn btn-outline" onClick={startNew}>Cancel</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
