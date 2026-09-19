import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';

const TEXT = {
  en: { vote: 'Vote', showResults: 'Show results', votes: 'votes', total: 'total votes', closed: 'Poll closed', thanks: 'Thanks for voting', gone: 'This poll is no longer available.' },
  ar: { vote: 'صوّت', showResults: 'عرض النتائج', votes: 'أصوات', total: 'إجمالي الأصوات', closed: 'التصويت مغلق', thanks: 'شكراً لتصويتك', gone: 'هذا الاستطلاع لم يعد متاحاً.' },
};

function voterToken() {
  try {
    let t = localStorage.getItem('rsl_voter');
    if (!t) { t = crypto.randomUUID(); localStorage.setItem('rsl_voter', t); }
    return t;
  } catch {
    return `anon-${Math.random().toString(36).slice(2)}${Date.now()}`;
  }
}

function readVote(pollId) {
  try { return localStorage.getItem(`rsl_poll_${pollId}`) || ''; } catch { return ''; }
}

export default function Poll({ id }) {
  const { language } = useLanguage();
  const tx = TEXT[language] || TEXT.en;
  const [poll, setPoll] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | gone
  const [voted, setVoted] = useState(() => readVote(id));
  const [showResults, setShowResults] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('polls')
      .select('id,question,is_open,poll_options(id,label,position,votes)')
      .eq('id', id)
      .maybeSingle();
    if (!data) { setState('gone'); return; }
    data.poll_options.sort((a, b) => a.position - b.position);
    setPoll(data);
    setState('ready');
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function vote(optionId) {
    setBusy(true);
    setError('');
    const { error: err } = await supabase.rpc('cast_vote', { p_poll: id, p_option: optionId, p_token: voterToken() });
    setBusy(false);
    if (err) { setError(err.message); return; }
    try { localStorage.setItem(`rsl_poll_${id}`, optionId); } catch { /* ignore */ }
    setVoted(optionId);
    load();
  }

  if (state === 'loading') return <div className="poll poll--loading" aria-busy="true" />;
  if (state === 'gone') return <div className="poll"><p>{tx.gone}</p></div>;

  const total = poll.poll_options.reduce((n, o) => n + o.votes, 0);
  const results = voted || !poll.is_open || showResults;

  return (
    <div className="poll">
      <p className="poll__question">{poll.question}</p>
      {results ? (
        <ul className="poll__results">
          {poll.poll_options.map((o) => {
            const pct = total ? Math.round((o.votes / total) * 100) : 0;
            return (
              <li key={o.id} className={o.id === voted ? 'is-mine' : ''}>
                <div className="poll__bar" style={{ width: `${pct}%` }} />
                <span className="poll__label">{o.label}</span>
                <span className="poll__pct">{pct}% · {o.votes} {tx.votes}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="poll__options">
          {poll.poll_options.map((o) => (
            <button key={o.id} type="button" className="btn btn-outline" disabled={busy} onClick={() => vote(o.id)}>{o.label}</button>
          ))}
        </div>
      )}
      {error && <p role="alert" style={{ color: 'var(--color-live)', fontSize: '0.85rem' }}>{error}</p>}
      <p className="poll__foot">
        {results ? `${total} ${tx.total}${!poll.is_open ? ` · ${tx.closed}` : voted ? ` · ${tx.thanks}` : ''}` : (
          <button type="button" className="poll__link" onClick={() => setShowResults(true)}>{tx.showResults}</button>
        )}
      </p>
    </div>
  );
}
