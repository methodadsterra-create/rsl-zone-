import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// Formatting toolbar that sits above the article textarea. It edits the text
// around the current selection (select words, then tap a button).
export default function RichTextToolbar({ textareaRef, value, onChange }) {
  const { user } = useAuth();
  const [panel, setPanel] = useState(null); // null | 'image' | 'poll'
  const [error, setError] = useState('');

  // image panel
  const [library, setLibrary] = useState([]);
  const [uploading, setUploading] = useState(false);

  // poll panel
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [creating, setCreating] = useState(false);

  function selection() {
    const ta = textareaRef.current;
    const start = ta ? ta.selectionStart : value.length;
    const end = ta ? ta.selectionEnd : value.length;
    return { start, end };
  }

  function apply(newValue, selStart, selEnd) {
    onChange(newValue);
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(selStart, selEnd);
    });
  }

  function wrap(before, after, placeholder) {
    const { start, end } = selection();
    const chosen = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + chosen + after + value.slice(end);
    apply(next, start + before.length, start + before.length + chosen.length);
  }

  function prefixLines(prefix) {
    const { start, end } = selection();
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const block = value.slice(lineStart, end);
    const prefixed = block.split('\n').map((l) => (l.startsWith(prefix) ? l : prefix + l)).join('\n');
    apply(value.slice(0, lineStart) + prefixed + value.slice(end), lineStart, lineStart + prefixed.length);
  }

  function addLink() {
    const { start, end } = selection();
    const url = window.prompt('Paste the link (starting with https://)', 'https://');
    if (!url || url === 'https://') return;
    const chosen = value.slice(start, end) || 'link text';
    const md = `[${chosen}](${url.trim()})`;
    apply(value.slice(0, start) + md + value.slice(end), start, start + md.length);
  }

  function insertBlock(md) {
    const { end } = selection();
    const before = value.slice(0, end);
    const after = value.slice(end);
    const lead = before && !before.endsWith('\n') ? '\n' : '';
    const text = `${lead}${md}\n`;
    const pos = before.length + text.length;
    apply(before + text + after, pos, pos);
  }

  async function openImages() {
    setPanel(panel === 'image' ? null : 'image');
    setError('');
    if (panel !== 'image') {
      const { data, error: err } = await supabase.from('media').select('*').order('created_at', { ascending: false }).limit(40);
      if (err) setError(err.message);
      setLibrary(data || []);
    }
  }

  function pickImage(row) {
    const alt = (row.alt_text_en || '').replace(/[\[\]()]/g, '');
    insertBlock(`![${alt}](${row.url})`);
    setPanel(null);
  }

  async function uploadImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, '-')}`;
      const { error: upErr } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      const { data: row, error: insErr } = await supabase
        .from('media').insert({ storage_path: path, url: urlData.publicUrl, uploaded_by: user?.id || null }).select().single();
      if (insErr) throw insErr;
      pickImage(row);
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function createPoll() {
    const labels = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || labels.length < 2) {
      setError('Add a question and at least two options.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const { data: poll, error: pErr } = await supabase
        .from('polls').insert({ question: question.trim(), created_by: user?.id || null }).select().single();
      if (pErr) throw pErr;
      const { error: oErr } = await supabase
        .from('poll_options').insert(labels.map((label, position) => ({ poll_id: poll.id, label, position })));
      if (oErr) throw oErr;
      insertBlock(`[poll:${poll.id}]`);
      setPanel(null);
      setQuestion('');
      setOptions(['', '']);
    } catch (err) {
      setError(`${err.message || 'Could not create poll.'} (Have you run supabase/06_polls.sql?)`);
    } finally {
      setCreating(false);
    }
  }

  // keep the text selection when tapping toolbar buttons on desktop
  const keep = (e) => e.preventDefault();
  const Btn = ({ label, title, onClick, active }) => (
    <button type="button" className={`rt-btn${active ? ' is-active' : ''}`} title={title} aria-label={title} onMouseDown={keep} onClick={onClick}>{label}</button>
  );

  return (
    <div className="rt-toolbar">
      <div className="rt-toolbar__row">
        <Btn label={<b>B</b>} title="Bold" onClick={() => wrap('**', '**', 'bold text')} />
        <Btn label={<i>I</i>} title="Italic" onClick={() => wrap('*', '*', 'italic text')} />
        <Btn label="Link" title="Add link to selected text" onClick={addLink} />
        <Btn label="H2" title="Heading" onClick={() => prefixLines('## ')} />
        <Btn label="H3" title="Sub-heading" onClick={() => prefixLines('### ')} />
        <Btn label="❝" title="Quote" onClick={() => prefixLines('> ')} />
        <Btn label="•" title="Bullet list" onClick={() => prefixLines('- ')} />
        <Btn label="Image" title="Insert image" onClick={openImages} active={panel === 'image'} />
        <Btn label="Poll" title="Create a poll" onClick={() => { setPanel(panel === 'poll' ? null : 'poll'); setError(''); }} active={panel === 'poll'} />
      </div>

      {error && <p role="alert" className="rt-error">{error}</p>}

      {panel === 'image' && (
        <div className="rt-panel">
          <label className="btn" style={{ cursor: 'pointer' }}>
            {uploading ? 'Uploading…' : 'Upload new image'}
            <input type="file" accept="image/*" onChange={uploadImage} disabled={uploading} style={{ display: 'none' }} />
          </label>
          <div className="cover-picker__library">
            {library.length === 0 ? <p style={{ fontSize: '0.85rem' }}>No images in the library yet.</p> : library.map((row) => (
              <button type="button" key={row.id} className="cover-picker__thumb" onClick={() => pickImage(row)}>
                <img src={row.url} alt={row.alt_text_en || ''} loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}

      {panel === 'poll' && (
        <div className="rt-panel">
          <div className="admin-form-row">
            <label>Poll question</label>
            <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Who will win the league?" />
          </div>
          {options.map((opt, i) => (
            <div className="admin-form-row" key={i}>
              <label>Option {i + 1}</label>
              <input value={opt} onChange={(e) => setOptions(options.map((o, j) => (j === i ? e.target.value : o)))} />
            </div>
          ))}
          <div className="cover-picker__actions">
            {options.length < 6 && <button type="button" className="btn btn-outline" onClick={() => setOptions([...options, ''])}>+ Add option</button>}
            <button type="button" className="btn" disabled={creating} onClick={createPoll}>{creating ? 'Creating…' : 'Create poll & insert'}</button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
            Write the poll in the language you're editing. For the Arabic version, create a separate poll in Arabic.
          </p>
        </div>
      )}
    </div>
  );
}
