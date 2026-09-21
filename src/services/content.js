import { supabase } from '../lib/supabaseClient';

// Every function here returns articles joined with their translations,
// filtered through the placement flags described in the spec. RLS already
// guarantees the public anon key only ever sees published, due articles —
// these queries add the *placement* filtering on top of that.

const ARTICLE_SELECT = `
  id, slug, status, published_at, timezone, tags, featured_on_home, is_breaking_news,
  categories ( slug, name_en, name_ar ),
  article_translations ( language, title, excerpt, content, seo_title, seo_description ),
  article_placements ( show_on_home, show_in_latest_news, show_in_breaking_news, show_in_transfers, show_in_match_reports, show_in_analysis ),
  cover:cover_media_id ( url, alt_text_en, alt_text_ar, caption_en, caption_ar )
`;

function orderPublished(query) {
  return query.order('published_at', { ascending: false });
}

export async function getFeaturedHome(limit = 5) {
  const { data, error } = await orderPublished(
    supabase.from('articles').select(ARTICLE_SELECT).eq('featured_on_home', true)
  ).limit(limit);
  if (error) throw error;
  return data || [];
}

const ARTICLE_SELECT_INNER_PLACEMENTS = ARTICLE_SELECT.replace(
  'article_placements (',
  'article_placements!inner ('
);

export async function getByPlacement(flag, limit = 8) {
  // `!inner` turns the embedded relation into an inner join, so the
  // .eq() below actually restricts which *articles* come back (not just
  // which nested rows are shown) — this is required for PostgREST to
  // filter parent rows by a child table's column.
  const { data, error } = await orderPublished(
    supabase
      .from('articles')
      .select(ARTICLE_SELECT_INNER_PLACEMENTS)
      .eq(`article_placements.${flag}`, true)
  ).limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getBreakingNews(limit = 5) {
  const { data, error } = await orderPublished(
    supabase.from('articles').select(ARTICLE_SELECT).eq('is_breaking_news', true)
  ).limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getArticleBySlug(slug) {
  const { data, error } = await supabase
    .from('articles')
    .select(`${ARTICLE_SELECT}, article_teams(team_id, teams(slug, name_en, name_ar)), article_players(player_id, players(slug, name_en, name_ar))`)
    .eq('slug', slug)
    .single();
  if (error) throw error;
  return data;
}

export async function getAllPublishedArticles({ categorySlug, limit = 20 } = {}) {
  let query = supabase.from('articles').select(ARTICLE_SELECT);
  if (categorySlug) query = query.eq('categories.slug', categorySlug);
  const { data, error } = await orderPublished(query).limit(limit);
  if (error) throw error;
  return categorySlug ? (data || []).filter((a) => a.categories?.slug === categorySlug) : data || [];
}

export async function getClubBySlug(slug) {
  const { data, error } = await supabase.from('teams').select('*').eq('slug', slug).single();
  if (error) throw error;
  return data;
}

export async function getClubArticles(teamId, limit = 20) {
  const { data, error } = await orderPublished(
    supabase.from('articles').select(`${ARTICLE_SELECT}, article_teams!inner(team_id)`).eq('article_teams.team_id', teamId)
  ).limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getPlayerBySlug(slug) {
  const { data, error } = await supabase.from('players').select('*, teams:current_team_id(slug, name_en, name_ar)').eq('slug', slug).single();
  if (error) throw error;
  return data;
}

export async function getPlayerArticles(playerId, limit = 20) {
  const { data, error } = await orderPublished(
    supabase.from('articles').select(`${ARTICLE_SELECT}, article_players!inner(player_id)`).eq('article_players.player_id', playerId)
  ).limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getClubs() {
  const { data, error } = await supabase.from('teams').select('*').eq('status', 'active').order('name_en');
  if (error) throw error;
  return data || [];
}

export async function getPlayers({ teamId } = {}) {
  let query = supabase.from('players').select('*, teams:current_team_id(name_en, slug)').eq('status', 'active').order('name_en');
  if (teamId) query = query.eq('current_team_id', teamId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getUpcomingMatches(limit = 8) {
  const { data, error } = await supabase
    .from('matches')
    .select('*, home:home_team_id(slug, name_en, name_ar, logo_url), away:away_team_id(slug, name_en, name_ar, logo_url)')
    .in('status', ['scheduled', 'live'])
    .gte('kickoff_at', new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString())
    .order('kickoff_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getRecentResults(limit = 8) {
  const { data, error } = await supabase
    .from('matches')
    .select('*, home:home_team_id(slug, name_en, name_ar, logo_url), away:away_team_id(slug, name_en, name_ar, logo_url)')
    .eq('status', 'finished')
    .order('kickoff_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getMatchesForTeam(teamId) {
  const { data, error } = await supabase
    .from('matches')
    .select('*, home:home_team_id(slug, name_en, name_ar, logo_url), away:away_team_id(slug, name_en, name_ar, logo_url)')
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .order('kickoff_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getTransfers(limit = 20) {
  const { data, error } = await supabase
    .from('transfers')
    .select('*, players:player_id(name_en, name_ar, slug), from_team:from_team_id(name_en, name_ar, logo_url), to_team:to_team_id(name_en, name_ar, logo_url)')
    .order('transfer_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getTransfersForTeam(teamId, limit = 10) {
  const { data, error } = await supabase
    .from('transfers')
    .select('*, players:player_id(name_en, name_ar, slug), from_team:from_team_id(name_en, name_ar, logo_url), to_team:to_team_id(name_en, name_ar, logo_url)')
    .or(`from_team_id.eq.${teamId},to_team_id.eq.${teamId}`)
    .order('transfer_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function searchSite(term, lang = 'en') {
  const like = `%${term}%`;
  const [articles, teams, players] = await Promise.all([
    supabase.from('article_translations').select('article_id, title, excerpt, language, articles!inner(slug, status)').ilike('title', like).eq('language', lang).limit(10),
    supabase.from('teams').select('*').or(`name_en.ilike.${like},name_ar.ilike.${like}`).limit(10),
    supabase.from('players').select('*, teams:current_team_id(name_en)').or(`name_en.ilike.${like},name_ar.ilike.${like}`).limit(10),
  ]);
  return {
    articles: (articles.data || []).filter((a) => a.articles?.status === 'published'),
    teams: teams.data || [],
    players: players.data || [],
  };
}
