import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdminTable from '../../components/AdminTable';

const EMPTY = { player_id: '', player_name_fallback: '', from_team_id: '', to_team_id: '', transfer_type: 'permanent', fee: '', transfer_date: '', status: 'rumour', source: '', notes: '' };

export default function AdminTransfers() {
  const [transfers, setTransfers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const [tr, t, p] = await Promise.all([
      supabase.from('transfers').select('*, players:player_id(name_en), from_team:from_team_id(name_en), to_team:to_team_id(name_en)').order('transfer_date', { ascending: false }),
      supabase.from('teams').select('id, name_en').order('name_en'),
      supabase.from('players').select('id, name_en').order('name_en'),
    ]);
    if (tr.error) setError(tr.error.message);
    setTransfers(tr.data || []);
    setTeams(t.data || []);
    setPlayers(p.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startEdit(row) {
    setEditingId(row.id);
    setForm({ ...EMPTY, ...row, player_id: row.player_id || '', from_team_id: row.from_team_id || '', to_team_id: row.to_team_id || '', transfer_date: row.transfer_date || '' });
  }
  function startNew() { setEditingId(null); setForm(EMPTY); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      player_id: form.player_id || null,
      from_team_id: form.from_team_id || null,
      to_team_id: form.to_team_id || null,
      transfer_date: form.transfer_date || null,
    };
    const { error: err } = editingId
      ? await supabase.from('transfers').update(payload).eq('id', editingId)
      : await supabase.from('transfers').insert(payload);
    if (err) { setError(err.message); return; }
    startNew();
    load();
  }

  async function remove(id) {
    if (!window.confirm('Delete this transfer record?')) return;
    await supabase.from('transfers').delete().eq('id', id);
    load();
  }

  return (
    <div>
      <h1>Transfers</h1>
      <div className="editor-grid" style={{ marginTop: 16 }}>
        <div className="admin-panel">
          {loading ? <p>Loading…</p> : (
            <AdminTable
              rows={transfers}
              emptyMessage="No transfers yet."
              columns={[
                { key: 'player', label: 'Player', render: (r) => r.players?.name_en || r.player_name_fallback || '—' },
                { key: 'move', label: 'Move', render: (r) => `${r.from_team?.name_en || '—'} → ${r.to_team?.name_en || '—'}` },
                { key: 'status', label: 'Status', render: (r) => <span className="badge">{r.status}</span> },
                { key: 'fee', label: 'Fee' },
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
          <h2>{editingId ? 'Edit transfer' : 'New transfer'}</h2>
          {error && <p role="alert" style={{ color: 'var(--color-live)' }}>{error}</p>}
          <div className="admin-form-row"><label>Player</label>
            <select value={form.player_id} onChange={(e) => setForm({ ...form, player_id: e.target.value })}>
              <option value="">— not in Players CMS yet —</option>
              {players.map((p) => <option key={p.id} value={p.id}>{p.name_en}</option>)}
            </select>
          </div>
          {!form.player_id && (
            <div className="admin-form-row"><label>Player name (if not listed above)</label>
              <input value={form.player_name_fallback} onChange={(e) => setForm({ ...form, player_name_fallback: e.target.value })} />
            </div>
          )}
          <div className="admin-form-row"><label>From club</label>
            <select value={form.from_team_id} onChange={(e) => setForm({ ...form, from_team_id: e.target.value })}>
              <option value="">—</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name_en}</option>)}
            </select>
          </div>
          <div className="admin-form-row"><label>To club</label>
            <select value={form.to_team_id} onChange={(e) => setForm({ ...form, to_team_id: e.target.value })}>
              <option value="">—</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name_en}</option>)}
            </select>
          </div>
          <div className="admin-form-row"><label>Type</label>
            <select value={form.transfer_type} onChange={(e) => setForm({ ...form, transfer_type: e.target.value })}>
              {['permanent', 'loan', 'free', 'undisclosed'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="admin-form-row"><label>Fee</label><input value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} /></div>
          <div className="admin-form-row"><label>Date</label><input type="date" value={form.transfer_date} onChange={(e) => setForm({ ...form, transfer_date: e.target.value })} /></div>
          <div className="admin-form-row"><label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {['rumour', 'reported', 'advanced', 'completed', 'confirmed'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="admin-form-row"><label>Source</label><input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn">{editingId ? 'Save changes' : 'Create transfer'}</button>
            {editingId && <button type="button" className="btn btn-outline" onClick={startNew}>Cancel</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
