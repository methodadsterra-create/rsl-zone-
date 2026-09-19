import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdminTable from '../../components/AdminTable';
import { slugify } from '../../utils/slugify';

const EMPTY = { name_en: '', name_ar: '', short_name: '', city: '', founded_year: '', stadium: '', status: 'active', logo_url: '', cover_image_url: '', description_en: '', description_ar: '' };

export default function AdminTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const { data, error: err } = await supabase.from('teams').select('*').order('name_en');
    if (err) setError(err.message);
    setTeams(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startEdit(team) {
    setEditingId(team.id);
    setForm({ ...EMPTY, ...team, founded_year: team.founded_year || '' });
  }

  function startNew() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = { ...form, slug: slugify(form.name_en), founded_year: form.founded_year ? Number(form.founded_year) : null };
    const { error: err } = editingId
      ? await supabase.from('teams').update(payload).eq('id', editingId)
      : await supabase.from('teams').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    startNew();
    load();
  }

  async function remove(id) {
    if (!window.confirm('Delete this team? Articles linked to it will keep their other targeting.')) return;
    await supabase.from('teams').delete().eq('id', id);
    load();
  }

  return (
    <div>
      <h1>Teams</h1>
      <div className="editor-grid" style={{ marginTop: 16 }}>
        <div className="admin-panel">
          {loading ? <p>Loading…</p> : (
            <AdminTable
              rows={teams}
              emptyMessage="No teams yet — add your first club using the form."
              columns={[
                { key: 'name_en', label: 'Name' },
                { key: 'city', label: 'City' },
                { key: 'status', label: 'Status', render: (r) => <span className="badge">{r.status}</span> },
                { key: 'slug', label: 'URL', render: (r) => `/clubs/${r.slug}` },
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
          <h2>{editingId ? 'Edit team' : 'New team'}</h2>
          {error && <p role="alert" style={{ color: 'var(--color-live)' }}>{error}</p>}
          <div className="admin-form-row"><label>Name (English)</label><input required value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
          <div className="admin-form-row"><label>Name (Arabic)</label><input required dir="rtl" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
          <div className="admin-form-row"><label>Short name</label><input value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })} /></div>
          <div className="admin-form-row"><label>City</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div className="admin-form-row"><label>Founded year</label><input type="number" value={form.founded_year} onChange={(e) => setForm({ ...form, founded_year: e.target.value })} /></div>
          <div className="admin-form-row"><label>Stadium</label><input value={form.stadium} onChange={(e) => setForm({ ...form, stadium: e.target.value })} /></div>
          <div className="admin-form-row"><label>Logo URL</label><input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></div>
          <div className="admin-form-row"><label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" disabled={saving}>{editingId ? 'Save changes' : 'Create team'}</button>
            {editingId && <button type="button" className="btn btn-outline" onClick={startNew}>Cancel</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
