import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdminTable from '../../components/AdminTable';
import { slugify } from '../../utils/slugify';

const EMPTY = { name_en: '', name_ar: '', nationality: '', position: '', current_team_id: '', photo_url: '', bio_en: '', bio_ar: '', status: 'active' };

export default function AdminPlayers() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const [p, t] = await Promise.all([
      supabase.from('players').select('*, teams:current_team_id(name_en)').order('name_en'),
      supabase.from('teams').select('id, name_en').order('name_en'),
    ]);
    if (p.error) setError(p.error.message);
    setPlayers(p.data || []);
    setTeams(t.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startEdit(row) { setEditingId(row.id); setForm({ ...EMPTY, ...row, current_team_id: row.current_team_id || '' }); }
  function startNew() { setEditingId(null); setForm(EMPTY); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const payload = { ...form, slug: slugify(form.name_en), current_team_id: form.current_team_id || null };
    const { error: err } = editingId
      ? await supabase.from('players').update(payload).eq('id', editingId)
      : await supabase.from('players').insert(payload);
    if (err) { setError(err.message); return; }
    startNew();
    load();
  }

  async function remove(id) {
    if (!window.confirm('Delete this player?')) return;
    await supabase.from('players').delete().eq('id', id);
    load();
  }

  return (
    <div>
      <h1>Players</h1>
      <div className="editor-grid" style={{ marginTop: 16 }}>
        <div className="admin-panel">
          {loading ? <p>Loading…</p> : (
            <AdminTable
              rows={players}
              emptyMessage="No players yet."
              columns={[
                { key: 'name_en', label: 'Name' },
                { key: 'position', label: 'Position' },
                { key: 'team', label: 'Club', render: (r) => r.teams?.name_en || '—' },
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
          <h2>{editingId ? 'Edit player' : 'New player'}</h2>
          {error && <p role="alert" style={{ color: 'var(--color-live)' }}>{error}</p>}
          <div className="admin-form-row"><label>Name (English)</label><input required value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
          <div className="admin-form-row"><label>Name (Arabic)</label><input required dir="rtl" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
          <div className="admin-form-row"><label>Nationality</label><input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></div>
          <div className="admin-form-row"><label>Position</label><input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
          <div className="admin-form-row"><label>Current club</label>
            <select value={form.current_team_id} onChange={(e) => setForm({ ...form, current_team_id: e.target.value })}>
              <option value="">—</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name_en}</option>)}
            </select>
          </div>
          <div className="admin-form-row"><label>Photo URL</label><input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn">{editingId ? 'Save changes' : 'Create player'}</button>
            {editingId && <button type="button" className="btn btn-outline" onClick={startNew}>Cancel</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
