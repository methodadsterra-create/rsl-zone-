// Fetches the real Saudi Pro League table from API-Football and stores it in
// Supabase (via the update_standings() function), so the site's league table
// shows real, current data. Run automatically by .github/workflows/update-standings.yml
//
// Needs these environment variables (GitHub repository secrets):
//   API_FOOTBALL_KEY   your API-Football key
//   SUPABASE_URL       https://xxxx.supabase.co
//   SUPABASE_ANON_KEY  the public "anon" key
//   STANDINGS_TOKEN    the token created by supabase/09_live_standings.sql

const { API_FOOTBALL_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, STANDINGS_TOKEN } = process.env;
const LEAGUE_ID = 307; // Saudi Pro League on API-Football

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

for (const [name, value] of Object.entries({ API_FOOTBALL_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, STANDINGS_TOKEN })) {
  if (!value) fail(`missing secret ${name}`);
}

// The season is named after the year it starts: 2026/27 is season 2026.
// New seasons start in August, so from July onwards use this year.
const now = new Date();
const season = Number(process.env.SEASON) || (now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1);

// club slug (in our database) -> words that identify it in the API's team name
const CLUBS = [
  ['al-hilal', /hilal/], ['al-nassr', /nassr|nasr/], ['al-ahli', /ahli|ahly/], ['al-ittihad', /ittihad|itthad|ittehad/],
  ['al-qadsiah', /qadsiah|qadisiyah|qadsiyah|qadisiah|qadsia/], ['al-taawoun', /taawoun|taawon|taawun|taaoun/],
  ['al-ettifaq', /ettifaq|ittifaq|etifaq/], ['neom', /neom/], ['al-fateh', /fateh/], ['al-fayha', /fayha|feiha|faiha/],
  ['al-khaleej', /khaleej|khalij|khaliji/], ['al-kholood', /kholood|khulood|kholoud|kholod/], ['al-shabab', /shabab/],
  ['al-hazem', /hazem|hazm/], ['abha', /abha/], ['al-faisaly', /faisaly|faisali|faysali|feisaly/],
  ['al-diriyah', /diriyah|diriyyah|dhiriyah|diriya/], ['al-riyadh', /riyadh/],
];

function slugFor(apiName) {
  const plain = apiName.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
  const hit = CLUBS.find(([, re]) => re.test(plain));
  return hit ? hit[0] : null;
}

const sb = (path, init = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });

// 1) real table from the API
const apiRes = await fetch(`https://v3.football.api-sports.io/standings?league=${LEAGUE_ID}&season=${season}`, {
  headers: { 'x-apisports-key': API_FOOTBALL_KEY },
});
if (!apiRes.ok) fail(`API-Football answered HTTP ${apiRes.status}`);
const api = await apiRes.json();
const errors = api.errors && (Array.isArray(api.errors) ? api.errors : Object.values(api.errors));
if (errors && errors.length) fail(`API-Football refused the request: ${JSON.stringify(api.errors)}`);
const table = api.response?.[0]?.league?.standings?.[0];
if (!table || table.length === 0) fail(`API-Football returned no standings for season ${season}`);
console.log(`Season ${season}: API returned ${table.length} teams`);

// 2) our clubs
const teamsRes = await sb('teams?select=id,slug');
if (!teamsRes.ok) fail(`could not read teams from Supabase (HTTP ${teamsRes.status})`);
const idBySlug = new Map((await teamsRes.json()).map((t) => [t.slug, t.id]));

// 3) match API teams to our clubs
const rows = [];
const unmatched = [];
for (const r of table) {
  const slug = slugFor(r.team?.name || '');
  const teamId = slug && idBySlug.get(slug);
  if (!teamId) { unmatched.push(r.team?.name); continue; }
  rows.push({
    team_id: teamId,
    rank: r.rank,
    played: r.all.played,
    won: r.all.win,
    drawn: r.all.draw,
    lost: r.all.lose,
    goals_for: r.all.goals.for,
    goals_against: r.all.goals.against,
    goal_diff: r.goalsDiff,
    points: r.points,
    form: r.form || null,
  });
}
if (unmatched.length) console.warn(`Not matched to a club in the database: ${unmatched.join(', ')}`);
// safety: never replace the table with a badly matched one
if (rows.length < 12) fail(`only ${rows.length} clubs matched, so nothing was saved. Check the Teams list in admin.`);

// 4) save
const saveRes = await sb('rpc/update_standings', { method: 'POST', body: JSON.stringify({ p_token: STANDINGS_TOKEN, p_rows: rows }) });
if (!saveRes.ok) fail(`saving to Supabase failed (HTTP ${saveRes.status}): ${await saveRes.text()}`);
console.log(`Saved standings for ${rows.length} clubs.`);
