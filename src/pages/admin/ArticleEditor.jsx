import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { slugify } from '../../utils/slugify';
import { DEFAULT_TIMEZONE } from '../../utils/datetime';
import CoverImagePicker from '../../components/CoverImagePicker';
import RichTextToolbar from '../../components/RichTextToolbar';
import RichContent from '../../components/RichContent';

const EMPTY_TRANSLATION = { title: '', excerpt: '', content: '', seo_title: '', seo_description: '', canonical_url: '' };
const PLACEMENT_FIELDS = [
  { key: 'show_on_home', label: 'Show on Home' },
  { key: 'show_in_latest_news', label: 'Show in Latest News' },
  { key: 'show_in_breaking_news', label: 'Show in Breaking News' },
  { key: 'show_in_transfers', label: 'Show in Transfers' },
  { key: 'show_in_match_reports', label: 'Show in Match Reports' },
  { key: 'show_in_analysis', label: 'Show in Analysis' },
];

export default function ArticleEditor() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeLang, setActiveLang] = useState('ar');

  const [categories, setCategories] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);

  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('draft');
  const [publishDate, setPublishDate] = useState('');
  const [publishTime, setPublishTime] = useState('');
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [featuredOnHome, setFeaturedOnHome] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [placements, setPlacements] = useState(
    Object.fromEntries(PLACEMENT_FIELDS.map((f) => [f.key, false]))
  );
  const [teamIds, setTeamIds] = useState([]);
  const [playerIds, setPlayerIds] = useState([]);
  const [relatedMatchId, setRelatedMatchId] = useState('');
  const [coverMediaId, setCoverMediaId] = useState('');
  const contentRef = useRef(null);
  const [previewBody, setPreviewBody] = useState(false);
  const [translations, setTranslations] = useState({ en: { ...EMPTY_TRANSLATION }, ar: { ...EMPTY_TRANSLATION } });

  // Load reference data (categories/teams/players/matches) once.
  useEffect(() => {
    async function loadRefs() {
      const [c, t, p, m] = await Promise.all([
        supabase.from('categories').select('id, name_en').order('sort_order'),
        supabase.from('teams').select('id, name_en').order('name_en'),
        supabase.from('players').select('id, name_en').order('name_en'),
        supabase.from('matches').select('id, kickoff_at, home_team_id, away_team_id, teams1:home_team_id(name_en), teams2:away_team_id(name_en)').order('kickoff_at', { ascending: false }).limit(50),
      ]);
      setCategories(c.data || []);
      setTeams(t.data || []);
      setPlayers(p.data || []);
      setMatches(m.data || []);
    }
    loadRefs();
  }, []);

  // Load existing article when editing.
  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    async function loadArticle() {
      setLoading(true);
      const [{ data: article, error: aErr }, { data: trans }, { data: placement }, { data: aTeams }, { data: aPlayers }] = await Promise.all([
        supabase.from('articles').select('*').eq('id', id).single(),
        supabase.from('article_translations').select('*').eq('article_id', id),
        supabase.from('article_placements').select('*').eq('article_id', id).maybeSingle(),
        supabase.from('article_teams').select('team_id').eq('article_id', id),
        supabase.from('article_players').select('player_id').eq('article_id', id),
      ]);
      if (cancelled) return;
      if (aErr) {
        setError(aErr.message);
        setLoading(false);
        return;
      }
      setSlug(article.slug);
      setSlugTouched(true);
      setCategoryId(article.category_id || '');
      setTags((article.tags || []).join(', '));
      setStatus(article.status);
      setTimezone(article.timezone || DEFAULT_TIMEZONE);
      setFeaturedOnHome(article.featured_on_home);
      setIsBreaking(article.is_breaking_news);
      setRelatedMatchId(article.related_match_id || '');
      setCoverMediaId(article.cover_media_id || '');
      if (article.published_at) {
        const d = new Date(article.published_at);
        setPublishDate(d.toISOString().slice(0, 10));
        setPublishTime(d.toISOString().slice(11, 16));
      }
      if (placement) {
        setPlacements(Object.fromEntries(PLACEMENT_FIELDS.map((f) => [f.key, !!placement[f.key]])));
      }
      setTeamIds((aTeams || []).map((r) => r.team_id));
      setPlayerIds((aPlayers || []).map((r) => r.player_id));
      const nextTranslations = { en: { ...EMPTY_TRANSLATION }, ar: { ...EMPTY_TRANSLATION } };
      (trans || []).forEach((t) => {
        nextTranslations[t.language] = {
          title: t.title || '', excerpt: t.excerpt || '', content: t.content || '',
          seo_title: t.seo_title || '', seo_description: t.seo_description || '', canonical_url: t.canonical_url || '',
        };
      });
      setTranslations(nextTranslations);
      setLoading(false);
    }
    loadArticle();
    return () => { cancelled = true; };
  }, [id, isNew]);

  useEffect(() => {
    const source = translations.en.title || translations.ar.title;
    if (!slugTouched && source) {
      setSlug(slugify(source));
    }
  }, [translations.en.title, translations.ar.title, slugTouched]);

  const publishedAtIso = useMemo(() => {
    if (!publishDate || !publishTime) return null;
    // Interpreted as local wall-clock time in the selected timezone by
    // constructing an ISO string and letting the browser parse it as local;
    // for a production system you'd convert via the IANA timezone properly
    // (e.g. with Temporal or a small tz-aware helper). Documented in README.
    return new Date(`${publishDate}T${publishTime}:00`).toISOString();
  }, [publishDate, publishTime]);

  function updateTranslation(lang, field, value) {
    setTranslations((prev) => ({ ...prev, [lang]: { ...prev[lang], [field]: value } }));
  }

  function toggleFrom(list, setList, value) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function handleSave(nextStatus) {
    setSaving(true);
    setError('');
    setNotice('');

    // Write in Arabic, English, or both. Each language you fill in needs a
    // title AND content; at least one language is required.
    const complete = { ar: !!(translations.ar.title && translations.ar.content), en: !!(translations.en.title && translations.en.content) };
    const halfDone = ['ar', 'en'].find((l) => !complete[l] && (translations[l].title || translations[l].content));
    if (halfDone) {
      setError(`The ${halfDone === 'ar' ? 'Arabic' : 'English'} version needs both a title and content (or clear both to skip it).`);
      setSaving(false);
      return;
    }
    if (!complete.ar && !complete.en) {
      setError('Add a title and content in Arabic or English.');
      setSaving(false);
      return;
    }
    if (nextStatus === 'scheduled' && !publishedAtIso) {
      setError('Set a publish date and time to schedule this article.');
      setSaving(false);
      return;
    }
    if ((nextStatus === 'published') && !publishedAtIso) {
      // Publishing immediately with no explicit date — use now.
    }

    const articlePayload = {
      slug: slug || slugify(translations.en.title || translations.ar.title) || `post-${Date.now().toString(36)}`,
      category_id: categoryId || null,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      status: nextStatus,
      published_at: nextStatus === 'published' && !publishedAtIso ? new Date().toISOString() : publishedAtIso,
      timezone,
      featured_on_home: featuredOnHome,
      is_breaking_news: isBreaking,
      related_match_id: relatedMatchId || null,
      cover_media_id: coverMediaId || null,
    };

    let articleId = id;
    if (isNew) {
      const { data, error: insErr } = await supabase.from('articles').insert(articlePayload).select().single();
      if (insErr) { setError(insErr.code === '23505' ? 'Another article already uses this link (slug). Change the Slug field and save again.' : insErr.message); setSaving(false); return; }
      articleId = data.id;
    } else {
      const { error: updErr } = await supabase.from('articles').update(articlePayload).eq('id', articleId);
      if (updErr) { setError(updErr.code === '23505' ? 'Another article already uses this link (slug). Change the Slug field and save again.' : updErr.message); setSaving(false); return; }
    }

    // Translations: only languages with BOTH title and content are saved —
    // we never publish an empty translation.
    const translationRows = ['ar', 'en']
      .filter((l) => complete[l])
      .map((l) => ({ article_id: articleId, language: l, ...translations[l] }));
    await supabase.from('article_translations').upsert(translationRows, { onConflict: 'article_id,language' });

    await supabase.from('article_placements').upsert({ article_id: articleId, ...placements }, { onConflict: 'article_id' });

    await supabase.from('article_teams').delete().eq('article_id', articleId);
    if (teamIds.length) {
      await supabase.from('article_teams').insert(teamIds.map((team_id) => ({ article_id: articleId, team_id })));
    }
    await supabase.from('article_players').delete().eq('article_id', articleId);
    if (playerIds.length) {
      await supabase.from('article_players').insert(playerIds.map((player_id) => ({ article_id: articleId, player_id })));
    }

    setSaving(false);
    setNotice('Saved.');
    if (isNew) navigate(`/admin/articles/${articleId}`, { replace: true });
  }

  if (loading) return <p>Loading article…</p>;

  return (
    <div>
      <div className="admin-page-head">
        <h1>{isNew ? 'New Article' : 'Edit Article'}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" disabled={saving} onClick={() => handleSave('draft')}>Save draft</button>
          <button className="btn btn-outline" disabled={saving} onClick={() => handleSave('scheduled')}>Schedule</button>
          <button className="btn" disabled={saving} onClick={() => handleSave('published')}>Publish now</button>
        </div>
      </div>

      {error && <p role="alert" style={{ color: 'var(--color-live)' }}>{error}</p>}
      {notice && <p role="status" style={{ color: 'var(--color-primary)' }}>{notice}</p>}

      <div className="editor-grid">
        <div className="admin-panel">
          <h2>Content</h2>
          <div className="lang-tabs">
            <button type="button" className={activeLang === 'ar' ? 'is-active' : ''} onClick={() => setActiveLang('ar')}>العربية</button>
            <button type="button" className={activeLang === 'en' ? 'is-active' : ''} onClick={() => setActiveLang('en')}>English</button>
          </div>

          <div className="admin-form-row">
            <label>Title ({activeLang})</label>
            <input value={translations[activeLang].title} onChange={(e) => updateTranslation(activeLang, 'title', e.target.value)} />
          </div>
          <div className="admin-form-row">
            <label>Excerpt ({activeLang})</label>
            <textarea rows={2} value={translations[activeLang].excerpt} onChange={(e) => updateTranslation(activeLang, 'excerpt', e.target.value)} />
          </div>
          <div className="admin-form-row">
            <label>
              Content ({activeLang}){' '}
              <button type="button" className="rt-link" onClick={() => setPreviewBody((v) => !v)}>{previewBody ? 'Back to editing' : 'Preview'}</button>
            </label>
            {previewBody ? (
              <div className="article-page__body rt-preview" dir={activeLang === 'ar' ? 'rtl' : 'ltr'}>
                <RichContent text={translations[activeLang].content} />
              </div>
            ) : (
              <>
                <RichTextToolbar
                  textareaRef={contentRef}
                  value={translations[activeLang].content}
                  onChange={(v) => updateTranslation(activeLang, 'content', v)}
                />
                <textarea ref={contentRef} rows={16} dir={activeLang === 'ar' ? 'rtl' : 'ltr'} value={translations[activeLang].content} onChange={(e) => updateTranslation(activeLang, 'content', e.target.value)} />
              </>
            )}
          </div>

          {!translations[activeLang].title && !translations[activeLang].content && (
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
              You can leave this language empty. Readers in this language will see the {activeLang === 'ar' ? 'English' : 'Arabic'} version with a short notice. An empty version is never published.
            </p>
          )}

          <h3 style={{ marginTop: 24 }}>SEO ({activeLang})</h3>
          <div className="admin-form-row">
            <label>SEO title</label>
            <input value={translations[activeLang].seo_title} onChange={(e) => updateTranslation(activeLang, 'seo_title', e.target.value)} />
          </div>
          <div className="admin-form-row">
            <label>SEO description</label>
            <textarea rows={2} value={translations[activeLang].seo_description} onChange={(e) => updateTranslation(activeLang, 'seo_description', e.target.value)} />
          </div>
          <div className="admin-form-row">
            <label>Canonical URL</label>
            <input value={translations[activeLang].canonical_url} onChange={(e) => updateTranslation(activeLang, 'canonical_url', e.target.value)} />
          </div>
        </div>

        <div>
          <div className="admin-panel" style={{ marginBottom: 16 }}>
            <h2>Featured image</h2>
            <CoverImagePicker value={coverMediaId} onChange={setCoverMediaId} />
          </div>

          <div className="admin-panel" style={{ marginBottom: 16 }}>
            <h2>Basic Information</h2>
            <div className="admin-form-row">
              <label>Slug</label>
              <input value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} />
            </div>
            <div className="admin-form-row">
              <label>Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">—</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
              </select>
            </div>
            <div className="admin-form-row">
              <label>Tags (comma separated)</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
          </div>

          <div className="admin-panel" style={{ marginBottom: 16 }}>
            <h2>Publication</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>Current status: <strong>{status}</strong></p>
            <div className="admin-form-row">
              <label>Publish date</label>
              <input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} />
            </div>
            <div className="admin-form-row">
              <label>Publish time</label>
              <input type="time" value={publishTime} onChange={(e) => setPublishTime(e.target.value)} />
            </div>
            <div className="admin-form-row">
              <label>Timezone</label>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option value="Africa/Lagos">Africa/Lagos (default)</option>
                <option value="Asia/Riyadh">Asia/Riyadh</option>
                <option value="Europe/London">Europe/London</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>

          <div className="admin-panel" style={{ marginBottom: 16 }}>
            <h2>Placement</h2>
            {PLACEMENT_FIELDS.map((f) => (
              <label key={f.key} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={placements[f.key]}
                  onChange={(e) => setPlacements((p) => ({ ...p, [f.key]: e.target.checked }))}
                />
                {f.label}
              </label>
            ))}
            <label className="checkbox-row">
              <input type="checkbox" checked={featuredOnHome} onChange={(e) => setFeaturedOnHome(e.target.checked)} />
              Featured on Home
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={isBreaking} onChange={(e) => setIsBreaking(e.target.checked)} />
              Breaking News
            </label>
          </div>

          <div className="admin-panel" style={{ marginBottom: 16 }}>
            <h2>Club targeting</h2>
            <div className="chip-list">
              {teams.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  className={`chip${teamIds.includes(t.id) ? ' is-active' : ''}`}
                  onClick={() => toggleFrom(teamIds, setTeamIds, t.id)}
                >
                  {t.name_en}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-panel" style={{ marginBottom: 16 }}>
            <h2>Player targeting</h2>
            <div className="chip-list">
              {players.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  className={`chip${playerIds.includes(p.id) ? ' is-active' : ''}`}
                  onClick={() => toggleFrom(playerIds, setPlayerIds, p.id)}
                >
                  {p.name_en}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-panel">
            <h2>Related match</h2>
            <select value={relatedMatchId} onChange={(e) => setRelatedMatchId(e.target.value)}>
              <option value="">—</option>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.teams1?.name_en} vs {m.teams2?.name_en}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
