import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminMedia() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  async function load() {
    setLoading(true);
    const { data, error: err } = await supabase.from('media').select('*').order('created_at', { ascending: false });
    if (err) setError(err.message);
    setItems(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const path = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { error: upErr } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      const { error: insErr } = await supabase.from('media').insert({
        storage_path: path,
        url: urlData.publicUrl,
        uploaded_by: user?.id || null,
      });
      if (insErr) throw insErr;
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function updateCaption(id, field, value) {
    await supabase.from('media').update({ [field]: value }).eq('id', id);
  }

  async function remove(item) {
    if (!window.confirm('Delete this media file?')) return;
    await supabase.storage.from('media').remove([item.storage_path]);
    await supabase.from('media').delete().eq('id', item.id);
    load();
  }

  return (
    <div>
      <div className="admin-page-head">
        <h1>Media</h1>
        <label className="btn" style={{ cursor: 'pointer' }}>
          {uploading ? 'Uploading…' : 'Upload image'}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
        </label>
      </div>
      {error && <p role="alert" style={{ color: 'var(--color-live)' }}>{error}</p>}

      {loading ? <p>Loading…</p> : items.length === 0 ? (
        <p>No media uploaded yet.</p>
      ) : (
        <div className="media-grid">
          {items.map((item) => (
            <div key={item.id} className="admin-panel media-grid__item">
              <img src={item.url} alt={item.alt_text_en || ''} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 4 }} />
              <div className="admin-form-row">
                <label>Alt text (EN)</label>
                <input defaultValue={item.alt_text_en || ''} onBlur={(e) => updateCaption(item.id, 'alt_text_en', e.target.value)} />
              </div>
              <div className="admin-form-row">
                <label>Caption (AR)</label>
                <input dir="rtl" defaultValue={item.caption_ar || ''} onBlur={(e) => updateCaption(item.id, 'caption_ar', e.target.value)} />
              </div>
              <button className="btn btn-outline" style={{ color: 'var(--color-live)' }} onClick={() => remove(item)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
