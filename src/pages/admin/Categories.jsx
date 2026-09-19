import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdminTable from '../../components/AdminTable';
import { slugify } from '../../utils/slugify';

const EMPTY = { name_en: '', name_ar: '', sort_order: 0 };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const { data, error: err } = await supabase.from('categories').select('*').order('sort_order');
    if (err) setError(err.message);
    setCategories(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function startEdit(row) { setEditingId(row.id); setForm(row); }
  function startNew() { setEditingId(null); setForm(EMPTY); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const payload = { ...form, slug: slugify(form.name_en), sort_order: Number(form.sort_order) || 0 };
    const { error: err } = editingId
      ? await supabase.from('categories').update(payload).eq('id', editingId)
      : await supabase.from('categories').insert(payload);
    if (err) { setError(err.message); return; }
    startNew();
    load();
  }

  async function remove(id) {
    if (!window.confirm('Delete this category? Articles using it will show no category.')) return;
    await supabase.from('categories').delete().eq('id', id);
    load();
  }

  return (
    <div>
      <h1>Categories</h1>
      <div className="editor-grid" style={{ marginTop: 16 }}>
        <div className="admin-panel">
          {loading ? <p>Loading…</p> : (
            <AdminTable
              rows={categories}
              emptyMessage="No categories yet."
              columns={[
                { key: 'name_en', label: 'English name' },
                { key: 'name_ar', label: 'Arabic name' },
                { key: 'sort_order', label: 'Order' },
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
          <h2>{editingId ? 'Edit category' : 'New category'}</h2>
          {error && <p role="alert" style={{ color: 'var(--color-live)' }}>{error}</p>}
          <div className="admin-form-row"><label>Name (English)</label><input required value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
          <div className="admin-form-row"><label>Name (Arabic)</label><input required dir="rtl" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
          <div className="admin-form-row"><label>Sort order</label><input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn">{editingId ? 'Save changes' : 'Create category'}</button>
            {editingId && <button type="button" className="btn btn-outline" onClick={startNew}>Cancel</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
