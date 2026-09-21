-- =============================================================================
-- SPL ZONE — LIVE LEAGUE TABLE (run once in the Supabase SQL Editor)
-- Real standings are fetched automatically (see scripts/update-standings.mjs)
-- and stored here. The site's existing table keeps working: it shows the real
-- standings when they exist, and otherwise falls back to the table computed
-- from matches entered in Admin.
-- =============================================================================

-- 1) Where the real standings are stored
create table if not exists league_standings (
  team_id uuid primary key references teams (id) on delete cascade,
  rank int not null,
  played int not null default 0,
  won int not null default 0,
  drawn int not null default 0,
  lost int not null default 0,
  goals_for int not null default 0,
  goals_against int not null default 0,
  goal_diff int not null default 0,
  points int not null default 0,
  form text,
  updated_at timestamptz not null default now()
);

alter table league_standings enable row level security;
drop policy if exists "standings_public_read" on league_standings;
create policy "standings_public_read" on league_standings for select using (true);
grant select on league_standings to anon, authenticated;

-- 2) A private token so only your update job can save standings
create table if not exists standings_secret (token text primary key);
alter table standings_secret enable row level security; -- no policies: nobody can read it directly

insert into standings_secret (token)
select gen_random_uuid()::text || gen_random_uuid()::text
where not exists (select 1 from standings_secret);

create or replace function update_standings(p_token text, p_rows jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if not exists (select 1 from standings_secret where token = p_token) then
    raise exception 'not allowed';
  end if;

  insert into league_standings (team_id, rank, played, won, drawn, lost, goals_for, goals_against, goal_diff, points, form, updated_at)
  select (r->>'team_id')::uuid, (r->>'rank')::int, (r->>'played')::int, (r->>'won')::int, (r->>'drawn')::int,
         (r->>'lost')::int, (r->>'goals_for')::int, (r->>'goals_against')::int, (r->>'goal_diff')::int,
         (r->>'points')::int, r->>'form', now()
  from jsonb_array_elements(p_rows) as r
  on conflict (team_id) do update set
    rank = excluded.rank, played = excluded.played, won = excluded.won, drawn = excluded.drawn,
    lost = excluded.lost, goals_for = excluded.goals_for, goals_against = excluded.goals_against,
    goal_diff = excluded.goal_diff, points = excluded.points, form = excluded.form, updated_at = now();
  get diagnostics n = row_count;

  -- clubs that are no longer in the table (for example relegated) are removed
  delete from league_standings
  where team_id not in (select (r->>'team_id')::uuid from jsonb_array_elements(p_rows) as r);

  return n;
end;
$$;

grant execute on function update_standings(text, jsonb) to anon, authenticated;

-- 3) The table the site reads: real standings if present, otherwise computed from matches
create or replace view league_table_computed
with (security_invoker = true)
as
with results as (
  select home_team_id as team_id, home_score as gf, away_score as ga,
         case when home_score > away_score then 1 else 0 end as won,
         case when home_score = away_score then 1 else 0 end as drawn,
         case when home_score < away_score then 1 else 0 end as lost
  from matches
  where status = 'finished' and home_score is not null and away_score is not null
  union all
  select away_team_id as team_id, away_score as gf, home_score as ga,
         case when away_score > home_score then 1 else 0 end as won,
         case when away_score = home_score then 1 else 0 end as drawn,
         case when away_score < home_score then 1 else 0 end as lost
  from matches
  where status = 'finished' and home_score is not null and away_score is not null
)
select
  t.id as team_id, t.slug, t.name_en, t.name_ar, t.logo_url,
  coalesce(count(r.team_id), 0) as played,
  coalesce(sum(r.won), 0) as won,
  coalesce(sum(r.drawn), 0) as drawn,
  coalesce(sum(r.lost), 0) as lost,
  coalesce(sum(r.gf), 0) as goals_for,
  coalesce(sum(r.ga), 0) as goals_against,
  coalesce(sum(r.gf), 0) - coalesce(sum(r.ga), 0) as goal_difference,
  coalesce(sum(r.won), 0) * 3 + coalesce(sum(r.drawn), 0) as points
from teams t
left join results r on r.team_id = t.id
where t.status = 'active'
group by t.id, t.slug, t.name_en, t.name_ar, t.logo_url
order by points desc, goal_difference desc, goals_for desc;

create or replace view league_table
with (security_invoker = true)
as
with live as (
  select t.id as team_id, t.slug, t.name_en, t.name_ar, t.logo_url,
         s.played::bigint as played, s.won::bigint as won, s.drawn::bigint as drawn, s.lost::bigint as lost,
         s.goals_for::bigint as goals_for, s.goals_against::bigint as goals_against,
         s.goal_diff::bigint as goal_difference, s.points::bigint as points, s.rank
  from league_standings s
  join teams t on t.id = s.team_id
  where t.status = 'active'
),
computed as (
  select c.*, (row_number() over (order by c.points desc, c.goal_difference desc, c.goals_for desc))::int as rank
  from league_table_computed c
)
select * from live
union all
select * from computed where not exists (select 1 from live)
order by rank;

grant select on league_table, league_table_computed to anon, authenticated;

-- 4) Shows your private token once. Copy it into the GitHub secret STANDINGS_TOKEN.
select token as "COPY THIS INTO GITHUB AS STANDINGS_TOKEN" from standings_secret;
