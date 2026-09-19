import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PRESENCE_CHANNEL } from './PresenceTracker';

// Admin dashboard card: how many people have the public site open right now.
// This page only listens; it does not add itself to the count.
export default function LiveVisitors() {
  const [count, setCount] = useState(0);
  const [pages, setPages] = useState([]);
  const [status, setStatus] = useState('connecting'); // connecting | live | error

  useEffect(() => {
    const channel = supabase.channel(PRESENCE_CHANNEL);

    const sync = () => {
      const state = channel.presenceState();
      const keys = Object.keys(state);
      setCount(keys.length);
      const tally = {};
      keys.forEach((k) => {
        const metas = state[k];
        const path = (metas[metas.length - 1]?.path || '/').replace(/^\/(en|ar)(?=\/|$)/, '') || '/';
        tally[path] = (tally[path] || 0) + 1;
      });
      setPages(Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 5));
    };

    channel
      .on('presence', { event: 'sync' }, sync)
      .on('presence', { event: 'join' }, sync)
      .on('presence', { event: 'leave' }, sync)
      .subscribe((s) => {
        if (s === 'SUBSCRIBED') setStatus('live');
        else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') setStatus('error');
      });

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <section className="admin-panel live-card" style={{ marginBottom: 16 }}>
      <div className="live-card__top">
        <div>
          <div className="live-card__label">
            <span className={`live-dot${status === 'live' && count > 0 ? ' is-on' : ''}`} aria-hidden="true" />
            Live visitors now
          </div>
          <div className="live-card__count">{count}</div>
        </div>
        <span className="live-card__status">
          {status === 'live' ? 'Live' : status === 'error' ? 'Not connected' : 'Connecting…'}
        </span>
      </div>
      {status === 'error' && (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-live)' }}>
          Couldn't connect to Supabase Realtime. Check that Realtime is enabled for your project.
        </p>
      )}
      {pages.length > 0 && (
        <ul className="live-card__pages">
          {pages.map(([path, n]) => (
            <li key={path}><span>{path}</span><strong>{n}</strong></li>
          ))}
        </ul>
      )}
    </section>
  );
}
