import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminSeo() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    supabase.from('site_settings').select('*').single().then(({ data }) => setSettings(data));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await supabase
      .from('site_settings')
      .update({
        default_seo_title: settings.default_seo_title,
        default_seo_description: settings.default_seo_description,
        ga_measurement_id: settings.ga_measurement_id,
        gsc_verification: settings.gsc_verification,
      })
      .eq('id', true);
    setSaving(false);
    setNotice('Saved.');
  }

  if (!settings) return <p>Loading…</p>;

  return (
    <div>
      <h1>SEO</h1>
      <div className="admin-panel" style={{ marginBottom: 16 }}>
        <p>
          Per-article SEO (title, description, canonical URL) is set on each article's editor page, per language.
          The fields below are the site-wide defaults used when an article doesn't set its own.
        </p>
      </div>
      <form className="admin-panel" onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
        <div className="admin-form-row">
          <label>Default SEO title</label>
          <input value={settings.default_seo_title || ''} onChange={(e) => setSettings({ ...settings, default_seo_title: e.target.value })} />
        </div>
        <div className="admin-form-row">
          <label>Default SEO description</label>
          <textarea rows={3} value={settings.default_seo_description || ''} onChange={(e) => setSettings({ ...settings, default_seo_description: e.target.value })} />
        </div>
        <div className="admin-form-row">
          <label>Google Analytics measurement ID</label>
          <input placeholder="G-XXXXXXXXXX" value={settings.ga_measurement_id || ''} onChange={(e) => setSettings({ ...settings, ga_measurement_id: e.target.value })} />
        </div>
        <div className="admin-form-row">
          <label>Google Search Console verification token</label>
          <input value={settings.gsc_verification || ''} onChange={(e) => setSettings({ ...settings, gsc_verification: e.target.value })} />
        </div>
        {notice && <p role="status" style={{ color: 'var(--color-primary)' }}>{notice}</p>}
        <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </form>
    </div>
  );
}
