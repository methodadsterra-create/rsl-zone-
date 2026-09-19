import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

// Two anonymous signals for the admin dashboard:
//  1. "Live now": the open tab joins a Supabase Realtime presence channel; the
//     entry disappears by itself when the tab is closed or hidden.
//  2. "Visit stats": one tiny counter bump per page view (record_visit), and a
//     new "visit" when the person was away for 30+ minutes. Only totals per
//     day are stored, never who the visitor is.
export const PRESENCE_CHANNEL = 'site-presence';
const VISIT_GAP_MS = 30 * 60 * 1000;
const LOOKS_LIKE_BOT = /bot|crawl|spider|slurp|headless|preview|facebookexternalhit|lighthouse/i;
let visitCountedThisLoad = false; // fallback when browser storage is blocked

function isNewVisit() {
  const now = Date.now();
  try {
    const last = Number(localStorage.getItem('rsl_last_seen') || 0);
    localStorage.setItem('rsl_last_seen', String(now));
    return !last || now - last > VISIT_GAP_MS;
  } catch {
    const first = !visitCountedThisLoad;
    visitCountedThisLoad = true;
    return first;
  }
}

async function recordPageView() {
  try {
    if (navigator.webdriver || LOOKS_LIKE_BOT.test(navigator.userAgent || '')) return;
    // don't count the site's own staff while they are signed in
    const { data } = await supabase.auth.getSession();
    if (data?.session) return;
    await supabase.rpc('record_visit', { p_new_session: isNewVisit() });
  } catch {
    /* stats must never break the page */
  }
}

export default function PresenceTracker() {
  const { pathname } = useLocation();
  const channelRef = useRef(null);
  const readyRef = useRef(false);
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  useEffect(() => {
    let key;
    try { key = crypto.randomUUID(); } catch { key = `v-${Math.random().toString(36).slice(2)}${Date.now()}`; }

    const channel = supabase.channel(PRESENCE_CHANNEL, { config: { presence: { key } } });
    channelRef.current = channel;

    const visible = () => document.visibilityState === 'visible';
    const announce = () => { if (readyRef.current && visible()) channel.track({ path: pathRef.current }); };
    const onVisibility = () => {
      if (!readyRef.current) return;
      if (visible()) announce(); else channel.untrack();
    };

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') { readyRef.current = true; announce(); }
    });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      readyRef.current = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // count the page view, and report page changes while the visitor browses
  useEffect(() => {
    recordPageView();
    if (readyRef.current && document.visibilityState === 'visible') {
      channelRef.current?.track({ path: pathname });
    }
  }, [pathname]);

  return null;
}
