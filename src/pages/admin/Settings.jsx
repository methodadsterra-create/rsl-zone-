import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const hint = { fontSize: '0.8rem', color: 'var(--color-ink-muted)' };

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('site_settings').select('*').maybeSingle().then(({ data, error: err }) => {
      if (err) setError(err.message);
      else if (!data) setError('No settings row found. Run the SQL update that creates it (see the setup notes).');
      setSettings(data);
    });
  }, []);

  const set = (patch) => setSettings((s) => ({ ...s, ...patch }));
  const hasArabicName = settings && 'site_name_ar' in settings;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    const payload = {
      site_name: settings.site_name,
      site_description: settings.site_description,
      logo_url: settings.logo_url || null,
      favicon_url: settings.favicon_url || null,
      social_links: settings.social_links || {},
    };
    if (hasArabicName) payload.site_name_ar = settings.site_name_ar || null;

    // .select() tells us how many rows were really changed, so a blocked
    // save can't look like a successful one.
    const { data, error: err } = await supabase
      .from('site_settings')
      .update(payload)
      .eq('id', true)
      .select();
    setSaving(false);
    if (err) setError(err.message);
    else if (!data || data.length === 0) setError('Nothing was saved. Only users with the admin role can change settings.');
    else setNotice('Saved. Reload the public site to see the changes.');
  }

  if (!settings) return error ? <p role="alert" style={{ color: 'var(--color-live)' }}>{error}</p> : <p>Loading…</p>;

  return (
    <div>
      <h1>Settings</h1>
      <form className="admin-panel" onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
        {error && <p role="alert" style={{ color: 'var(--color-live)' }}>{error}</p>}

        <div className="admin-form-row">
          <label>Site name (English)</label>
          <input value={settings.site_name || ''} onChange={(e) => set({ site_name: e.target.value })} />
        </div>
        {hasArabicName && (
          <div className="admin-form-row">
            <label>Site name (Arabic)</label>
            <input dir="rtl" value={settings.site_name_ar || ''} onChange={(e) => set({ site_name_ar: e.target.value })} />
          </div>
        )}
        <div className="admin-form-row">
          <label>Site description</label>
          <textarea rows={2} value={settings.site_description || ''} onChange={(e) => set({ site_description: e.target.value })} />
        </div>

        <div className="admin-form-row">
          <label>Logo image URL</label>
          <input value={settings.logo_url || ''} onChange={(e) => set({ logo_url: e.target.value })} placeholder="Leave empty to use the built-in SPL logo" />
          <span style={hint}>To use your own: upload a PNG in Media, copy its link, and paste it here.</span>
        </div>
        <div className="admin-form-row">
          <label>Favicon URL</label>
          <input value={settings.favicon_url || ''} onChange={(e) => set({ favicon_url: e.target.value })} placeholder="Leave empty to use the built-in icon" />
        </div>

        <div className="admin-form-row">
          <label>X (Twitter) URL</label>
          <input value={settings.social_links?.x || ''} onChange={(e) => set({ social_links: { ...settings.social_links, x: e.target.value } })} />
        </div>
        <div className="admin-form-row">
          <label>Facebook URL</label>
          <input value={settings.social_links?.facebook || ''} onChange={(e) => set({ social_links: { ...settings.social_links, facebook: e.target.value } })} />
        </div>

        {notice && <p role="status" style={{ color: 'var(--color-primary)' }}>{notice}</p>}
        <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </form>
    </div>
  );
}
