-- =============================================================================
-- RSL ZONE — DATABASE SCHEMA
-- Run this file first in the Supabase SQL editor, then 02_rls_policies.sql,
-- then (optionally) 03_seed_data.sql.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- PROFILES (admin/editor accounts)
-- One row per Supabase Auth user who is allowed into /admin.
-- A user with no row here has no admin access at all.
-- -----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  display_name text,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- SITE SETTINGS (single row of global config, editable from /admin/settings)
-- -----------------------------------------------------------------------------
create table site_settings (
  id boolean primary key default true constraint single_row check (id = true),
  site_name text not null default 'RSL Zone',
  site_description text not null default 'Independent Saudi Pro League news, transfers, matches and analysis.',
  logo_url text,
  favicon_url text,
  default_language text not null default 'en',
  default_theme text not null default 'light' check (default_theme in ('light', 'dark')),
  default_seo_title text,
  default_seo_description text,
  social_links jsonb not null default '{}'::jsonb, -- { "x": "...", "facebook": "...", "instagram": "..." }
  ga_measurement_id text,   -- Google Analytics, entered later — no fake tracking ID shipped
  gsc_verification text,    -- Google Search Console verification token
  max_featured_home integer not null default 5,
  updated_at timestamptz not null default now()
);
insert into site_settings (id) values (true);

-- -----------------------------------------------------------------------------
-- CATEGORIES (editable, not hard-coded in the app)
-- -----------------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_ar text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- TEAMS
-- -----------------------------------------------------------------------------
create table teams (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_ar text not null,
  short_name text,
  logo_url text,
  cover_image_url text,
  description_en text,
  description_ar text,
  city text,
  founded_year integer,
  stadium text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_teams_slug on teams (slug);
create index idx_teams_status on teams (status);

-- -----------------------------------------------------------------------------
-- PLAYERS
-- -----------------------------------------------------------------------------
create table players (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_ar text not null,
  photo_url text,
  nationality text,
  position text,
  current_team_id uuid references teams (id) on delete set null,
  bio_en text,
  bio_ar text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_players_slug on players (slug);
create index idx_players_team on players (current_team_id);

-- -----------------------------------------------------------------------------
-- MATCHES
-- -----------------------------------------------------------------------------
create table matches (
  id uuid primary key default gen_random_uuid(),
  home_team_id uuid not null references teams (id) on delete restrict,
  away_team_id uuid not null references teams (id) on delete restrict,
  competition text not null default 'Saudi Pro League',
  kickoff_at timestamptz not null, -- stored in UTC, converted for display
  venue text,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'finished', 'postponed', 'cancelled')),
  home_score integer,
  away_score integer,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint different_teams check (home_team_id <> away_team_id)
);
create index idx_matches_kickoff on matches (kickoff_at);
create index idx_matches_status on matches (status);
create index idx_matches_home_team on matches (home_team_id);
create index idx_matches_away_team on matches (away_team_id);

-- -----------------------------------------------------------------------------
-- TRANSFERS
-- -----------------------------------------------------------------------------
create table transfers (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players (id) on delete set null,
  player_name_fallback text, -- used when the player isn't in `players` yet
  from_team_id uuid references teams (id) on delete set null,
  to_team_id uuid references teams (id) on delete set null,
  transfer_type text not null default 'permanent' check (transfer_type in ('permanent', 'loan', 'free', 'undisclosed')),
  fee text,
  transfer_date date,
  status text not null default 'rumour' check (status in ('rumour', 'reported', 'advanced', 'completed', 'confirmed')),
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_transfers_status on transfers (status);
create index idx_transfers_player on transfers (player_id);

-- -----------------------------------------------------------------------------
-- MEDIA (Supabase Storage references)
-- -----------------------------------------------------------------------------
create table media (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null, -- path inside the `media` storage bucket
  url text not null,
  alt_text_en text,
  alt_text_ar text,
  caption_en text,
  caption_ar text,
  uploaded_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- ARTICLES (language-neutral shell — see article_translations for content)
-- -----------------------------------------------------------------------------
create table articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category_id uuid references categories (id) on delete set null,
  cover_media_id uuid references media (id) on delete set null,
  author_id uuid references profiles (id) on delete set null,
  related_match_id uuid references matches (id) on delete set null,
  tags text[] not null default '{}',

  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'archived')),
  published_at timestamptz, -- UTC instant the article should go/went live
  timezone text not null default 'Africa/Lagos', -- admin's display timezone for the picker

  featured_on_home boolean not null default false,
  is_breaking_news boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_articles_slug on articles (slug);
create index idx_articles_status on articles (status);
create index idx_articles_published_at on articles (published_at);
create index idx_articles_category on articles (category_id);
-- The single most important index: this is exactly the WHERE clause every
-- public query uses to decide if an article is visible.
create index idx_articles_public_visibility on articles (status, published_at) where status = 'published';

-- -----------------------------------------------------------------------------
-- ARTICLE_TRANSLATIONS (one row per article per language — the actual content)
-- `language` is free text, not an enum, so adding fr/es/pt needs zero schema
-- changes: just insert rows with language = 'fr', etc.
-- -----------------------------------------------------------------------------
create table article_translations (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles (id) on delete cascade,
  language text not null,
  title text not null,
  excerpt text,
  content text not null,
  seo_title text,
  seo_description text,
  canonical_url text,
  updated_at timestamptz not null default now(),
  unique (article_id, language)
);
create index idx_article_translations_language on article_translations (language);
create index idx_article_translations_article on article_translations (article_id);

-- -----------------------------------------------------------------------------
-- ARTICLE_PLACEMENTS (explicit publishing destinations — the placement system)
-- One row per article. Nothing here defaults to "everywhere": every flag is
-- opt-in, set explicitly in the editor's PLACEMENT section.
-- -----------------------------------------------------------------------------
create table article_placements (
  article_id uuid primary key references articles (id) on delete cascade,
  show_on_home boolean not null default false,
  show_in_latest_news boolean not null default false,
  show_in_breaking_news boolean not null default false,
  show_in_transfers boolean not null default false,
  show_in_match_reports boolean not null default false,
  show_in_analysis boolean not null default false
);

-- -----------------------------------------------------------------------------
-- ARTICLE_TEAMS (many-to-many — explicit club targeting)
-- An article only appears on a club page if a row exists here for that club.
-- -----------------------------------------------------------------------------
create table article_teams (
  article_id uuid not null references articles (id) on delete cascade,
  team_id uuid not null references teams (id) on delete cascade,
  primary key (article_id, team_id)
);
create index idx_article_teams_team on article_teams (team_id);

-- -----------------------------------------------------------------------------
-- ARTICLE_PLAYERS (many-to-many — explicit player targeting)
-- -----------------------------------------------------------------------------
create table article_players (
  article_id uuid not null references articles (id) on delete cascade,
  player_id uuid not null references players (id) on delete cascade,
  primary key (article_id, player_id)
);
create index idx_article_players_player on article_players (player_id);

-- -----------------------------------------------------------------------------
-- ARTICLE_MATCHES (many-to-many, in case a report touches more than one match;
-- articles.related_match_id covers the common single-match case cheaply, this
-- table is here for completeness/future use)
-- -----------------------------------------------------------------------------
create table article_matches (
  article_id uuid not null references articles (id) on delete cascade,
  match_id uuid not null references matches (id) on delete cascade,
  primary key (article_id, match_id)
);

-- -----------------------------------------------------------------------------
-- updated_at maintenance
-- -----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_articles_updated_at before update on articles
  for each row execute function set_updated_at();
create trigger trg_teams_updated_at before update on teams
  for each row execute function set_updated_at();
create trigger trg_players_updated_at before update on players
  for each row execute function set_updated_at();
create trigger trg_matches_updated_at before update on matches
  for each row execute function set_updated_at();
create trigger trg_transfers_updated_at before update on transfers
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- SCHEDULED PUBLISHING
-- The public site NEVER trusts `status` alone — every public query also
-- checks published_at <= now() (see 02_rls_policies.sql). This function is a
-- convenience for the admin dashboard / a periodic job to flip the stored
-- status from 'scheduled' to 'published' once the time arrives, so the
-- admin UI's status badges stay accurate without anyone needing to open
-- the app at that exact moment.
--
-- Call it from: a Supabase Cron job (recommended, e.g. every minute), or
-- manually from the SQL editor, or via an Edge Function on a schedule.
-- -----------------------------------------------------------------------------
create or replace function publish_due_articles()
returns integer as $$
declare
  updated_count integer;
begin
  update articles
  set status = 'published'
  where status = 'scheduled'
    and published_at is not null
    and published_at <= now();

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$ language plpgsql security definer;

-- Optional: if pg_cron is enabled on your Supabase project, schedule it:
-- select cron.schedule('publish-due-articles', '* * * * *', $$select publish_due_articles();$$);
