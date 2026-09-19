-- =============================================================================
-- RSL ZONE — LEAGUE TABLE VIEW
-- Run AFTER 01_schema.sql. The league table is not admin-entered data — it's
-- computed automatically from finished matches, so it can never drift out of
-- sync with results recorded in /admin/matches.
-- =============================================================================

create or replace view league_table
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
  t.id as team_id,
  t.slug,
  t.name_en,
  t.name_ar,
  t.logo_url,
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

grant select on league_table to anon, authenticated;
