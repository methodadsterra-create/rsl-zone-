import { SUPPORTED_LANGUAGES } from '../../i18n/config';

export default function AdminLanguages() {
  return (
    <div>
      <h1>Languages</h1>
      <div className="admin-panel">
        <p>
          RSL Zone currently supports the languages below. Article content for each language lives in the
          <code> article_translations</code> table; UI labels (navigation, buttons, etc.) live in
          <code> src/i18n/locales/</code>.
        </p>
        <table className="admin-table">
          <thead>
            <tr><th>Code</th><th>Name</th><th>Direction</th></tr>
          </thead>
          <tbody>
            {Object.values(SUPPORTED_LANGUAGES).map((l) => (
              <tr key={l.code}>
                <td>{l.code}</td>
                <td>{l.label} ({l.nativeLabel})</td>
                <td>{l.dir.toUpperCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 16, color: 'var(--color-ink-muted)' }}>
          To add a new language (French, Spanish, Portuguese, etc.), a developer adds one entry to
          <code> src/i18n/config.js</code> and a matching dictionary file — no database changes needed, since
          <code> language</code> is free text on <code>article_translations</code>. This is a code change, not
          something toggled from here, so it isn't editable in this screen.
        </p>
      </div>
    </div>
  );
}
