import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import AdminTable from '../../components/AdminTable';
import { formatDateTime } from '../../utils/datetime';

const STATUS_LABEL = { draft: 'Draft', scheduled: 'Scheduled', published: 'Published', archived: 'Archived' };

export default function AdminArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('articles')
      .select('id, slug, status, published_at, timezone, updated_at, categories(name_en), article_translations(title, language)')
      .order('updated_at', { ascending: false });
    if (err) setError(err.message);
    else setArticles(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function titleOf(row) {
    const list = row.article_translations || [];
    const pick = list.find((t) => t.language === 'ar' && t.title) || list.find((t) => t.language === 'en' && t.title) || list.find((t) => t.title);
    return pick?.title || '(untitled)';
  }

  async function publishNow(id) {
    setBusyId(id);
    await supabase.from('articles').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', id);
    await load();
    setBusyId(null);
  }

  async function archive(id) {
    setBusyId(id);
    await supabase.from('articles').update({ status: 'archived' }).eq('id', id);
    await load();
    setBusyId(null);
  }

  async function duplicate(row) {
    setBusyId(row.id);
    const { data: article } = await supabase.from('articles').select('*').eq('id', row.id).single();
    const { data: translations } = await supabase.from('article_translations').select('*').eq('article_id', row.id);
    if (article) {
      const { id: _oldId, created_at, updated_at, ...articleRest } = article;
      const { data: newArticle } = await supabase
        .from('articles')
        .insert({ ...articleRest, slug: `${article.slug}-copy-${Date.now()}`, status: 'draft', published_at: null })
        .select()
        .single();
      if (newArticle && translations) {
        await supabase.from('article_translations').insert(
          translations.map(({ id: _tid, article_id, ...t }) => ({ ...t, article_id: newArticle.id }))
        );
      }
    }
    await load();
    setBusyId(null);
  }

  async function remove(id) {
    if (!window.confirm('Delete this article permanently? This cannot be undone.')) return;
    setBusyId(id);
    await supabase.from('articles').delete().eq('id', id);
    await load();
    setBusyId(null);
  }

  return (
    <div>
      <div className="admin-page-head">
        <h1>Articles</h1>
        <Link to="/admin/articles/new" className="btn">+ New Article</Link>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && (
        <AdminTable
          emptyMessage="No articles yet. Click “New Article” to create your first one."
          rows={articles}
          columns={[
            { key: 'title', label: 'Title', render: (r) => <Link to={`/admin/articles/${r.id}`}>{titleOf(r)}</Link> },
            { key: 'category', label: 'Category', render: (r) => r.categories?.name_en || '—' },
            {
              key: 'status',
              label: 'Status',
              render: (r) => <span className={`badge${r.status === 'published' ? ' badge-gold' : ''}`}>{STATUS_LABEL[r.status]}</span>,
            },
            {
              key: 'publish',
              label: 'Publication',
              render: (r) => (r.published_at ? formatDateTime(r.published_at, r.timezone) : '—'),
            },
            { key: 'updated_at', label: 'Updated', render: (r) => formatDateTime(r.updated_at, r.timezone) },
            {
              key: 'actions',
              label: 'Actions',
              render: (r) => (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link to={`/admin/articles/${r.id}`} className="btn btn-outline" style={{ padding: '4px 10px' }}>Edit</Link>
                  {r.status !== 'published' && (
                    <button className="btn btn-outline" style={{ padding: '4px 10px' }} disabled={busyId === r.id} onClick={() => publishNow(r.id)}>
                      Publish now
                    </button>
                  )}
                  <button className="btn btn-outline" style={{ padding: '4px 10px' }} disabled={busyId === r.id} onClick={() => duplicate(r)}>
                    Duplicate
                  </button>
                  {r.status !== 'archived' && (
                    <button className="btn btn-outline" style={{ padding: '4px 10px' }} disabled={busyId === r.id} onClick={() => archive(r.id)}>
                      Archive
                    </button>
                  )}
                  <button className="btn btn-outline" style={{ padding: '4px 10px', color: 'var(--color-live)' }} disabled={busyId === r.id} onClick={() => remove(r.id)}>
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
