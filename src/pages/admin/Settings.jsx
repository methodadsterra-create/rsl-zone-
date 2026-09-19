import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('site_settings').select('*').single().then(({ data, error: err }) => {
      if (err) setError(err.message);
      setSettings(data);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { error: err } = await supabase
      .from('site_settings')
      .update({
        site_name: settings.site_name,
        site_description: settings.site_description,
        logo_url: settings.logo_url,
        favicon_url: settings.favicon_url,
        default_language: settings.default_language,
        default_theme: settings.default_theme,
        max_featured_home: settings.max_featured_home,
        social_links: settings.social_links,
      })
      .eq('id', true);
    setSaving(false);
    if (err) setError(err.message);
    else setNotice('Saved.');
  }

  if (!settings) return <p>Loading…</p>;

  return (
    <div>
      <h1>Settings</h1>
      <form className="admin-panel" onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
        {error && <p role="alert" style={{ color: 'var(--color-live)' }}>{error}</p>}
        <div className="admin-form-row">
          <label>Site name</label>
          <input value={settings.site_name || ''} onChange={(e) => setSettings({ ...settings, site_name: e.target.value })} />
        </div>
        <div className="admin-form-row">
          <label>Site description</label>
          <textarea rows={2} value={settings.site_description || ''} onChange={(e) => setSettings({ ...settings, site_description: e.target.value })} />
        </div>
        <div className="admin-form-row">
          <label>Logo URL</label>
          <input value={settings.logo_url || ''} onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })} />
        </div>
        <div className="admin-form-row">
          <label>Favicon URL</label>
          <input value={settings.favicon_url || ''} onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value })} />
        </div>
        <div className="admin-form-row">
          <label>Default language (new visitors with unsupported browser language)</label>
          <select value={settings.default_language} onChange={(e) => setSettings({ ...settings, default_language: e.target.value })}>
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </select>
        </div>
        <div className="admin-form-row">
          <label>Default theme</label>
          <select value={settings.default_theme} onChange={(e) => setSettings({ ...settings, default_theme: e.target.value })}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
            Note: per the spec, visitors always land on Light regardless of this setting; this controls other defaults only.
          </span>
        </div>
        <div className="admin-form-row">
          <label>Max featured articles on Home</label>
          <input type="number" min={1} max={12} value={settings.max_featured_home} onChange={(e) => setSettings({ ...settings, max_featured_home: Number(e.target.value) })} />
        </div>
        <div className="admin-form-row">
          <label>X (Twitter) URL</label>
          <input value={settings.social_links?.x || ''} onChange={(e) => setSettings({ ...settings, social_links: { ...settings.social_links, x: e.target.value } })} />
        </div>
        <div className="admin-form-row">
          <label>Facebook URL</label>
          <input value={settings.social_links?.facebook || ''} onChange={(e) => setSettings({ ...settings, social_links: { ...settings.social_links, facebook: e.target.value } })} />
        </div>
        {notice && <p role="status" style={{ color: 'var(--color-primary)' }}>{notice}</p>}
        <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </form>
    </div>
  );
}
