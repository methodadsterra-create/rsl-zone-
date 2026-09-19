import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// Featured-image picker for the article editor.
// - `value` is a row id from the `media` table (articles.cover_media_id).
// - Upload sends the file to the `media` storage bucket, adds a `media` row,
//   and selects it. "Choose from library" lists existing media rows.
export default function CoverImagePicker({ value, onChange }) {
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [selected, setSelected] = useState(null); // full media row
  const [library, setLibrary] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Load the currently selected media row (when editing an existing article).
  useEffect(() => {
    let cancelled = false;
    async function loadSelected() {
      if (!value) { setSelected(null); return; }
      if (selected?.id === value) return;
      const { data } = await supabase.from('media').select('*').eq('id', value).maybeSingle();
      if (!cancelled) setSelected(data || null);
    }
    loadSelected();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  async function openLibrary() {
    setShowLibrary((v) => !v);
    if (!showLibrary) {
      const { data, error: err } = await supabase
        .from('media').select('*').order('created_at', { ascending: false }).limit(60);
      if (err) setError(err.message);
      setLibrary(data || []);
    }
  }

  function choose(row) {
    setSelected(row);
    onChange(row.id);
    setShowLibrary(false);
  }

  function clear() {
    setSelected(null);
    onChange('');
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-');
      const path = `${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      const { data: row, error: insErr } = await supabase
        .from('media')
        .insert({ storage_path: path, url: urlData.publicUrl, uploaded_by: user?.id || null })
        .select()
        .single();
      if (insErr) throw insErr;
      choose(row);
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function saveAlt(field, val) {
    if (!selected) return;
    setSelected({ ...selected, [field]: val });
    await supabase.from('media').update({ [field]: val }).eq('id', selected.id);
  }

  return (
    <div className="cover-picker">
      {selected ? (
        <img className="cover-picker__preview" src={selected.url} alt={selected.alt_text_en || ''} />
      ) : (
        <div className="cover-picker__empty">No image selected</div>
      )}

      <div className="cover-picker__actions">
        <label className="btn" style={{ cursor: 'pointer' }}>
          {uploading ? 'Uploading…' : selected ? 'Upload new' : 'Upload image'}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
        </label>
        <button type="button" className="btn btn-outline" onClick={openLibrary}>
          {showLibrary ? 'Close library' : 'Choose from library'}
        </button>
        {selected && <button type="button" className="btn btn-outline" onClick={clear}>Remove</button>}
      </div>

      {error && <p role="alert" style={{ color: 'var(--color-live)', fontSize: '0.85rem' }}>{error}</p>}

      {showLibrary && (
        <div className="cover-picker__library">
          {library.length === 0 ? (
            <p style={{ fontSize: '0.85rem' }}>No images in the library yet.</p>
          ) : library.map((row) => (
            <button type="button" key={row.id} className={`cover-picker__thumb${row.id === value ? ' is-active' : ''}`} onClick={() => choose(row)}>
              <img src={row.url} alt={row.alt_text_en || ''} loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {selected && (
        <>
          <div className="admin-form-row" style={{ marginTop: 12 }}>
            <label>Alt text (EN)</label>
            <input value={selected.alt_text_en || ''} onChange={(e) => setSelected({ ...selected, alt_text_en: e.target.value })} onBlur={(e) => saveAlt('alt_text_en', e.target.value)} />
          </div>
          <div className="admin-form-row">
            <label>Alt text (AR)</label>
            <input dir="rtl" value={selected.alt_text_ar || ''} onChange={(e) => setSelected({ ...selected, alt_text_ar: e.target.value })} onBlur={(e) => saveAlt('alt_text_ar', e.target.value)} />
          </div>
        </>
      )}
    </div>
  );
}
