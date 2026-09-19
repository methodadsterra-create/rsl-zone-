-- =============================================================================
-- RSL ZONE — ROW LEVEL SECURITY
-- Run this AFTER 01_schema.sql.
--
-- Core rule enforced here, not just in application code: the public (the
-- anon key) can only ever read an article when
--   status = 'published' AND published_at <= now()
-- Draft and future-scheduled articles are invisible to anon no matter what
-- the frontend code does — this is enforced by Postgres itself.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper functions (security definer so they can read `profiles` regardless
-- of the caller's own RLS visibility into that table)
-- -----------------------------------------------------------------------------
create or replace function is_staff()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role in ('admin', 'editor')
  );
$$ language sql security definer stable;

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Auto-create a profile row (role = 'editor') whenever a new Supabase Auth
-- user is created, so nobody is ever left without a profiles row. Promote
-- the first admin manually — see README "Admin account setup".
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'editor');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- -----------------------------------------------------------------------------
-- Enable RLS everywhere
-- -----------------------------------------------------------------------------
alter table profiles enable row level security;
alter table site_settings enable row level security;
alter table categories enable row level security;
alter table teams enable row level security;
alter table players enable row level security;
alter table matches enable row level security;
alter table transfers enable row level security;
alter table media enable row level security;
alter table articles enable row level security;
alter table article_translations enable row level security;
alter table article_placements enable row level security;
alter table article_teams enable row level security;
alter table article_players enable row level security;
alter table article_matches enable row level security;

-- -----------------------------------------------------------------------------
-- PROFILES: users see their own row; staff can see all (for author names /
-- admin user management); only admins can change roles.
-- -----------------------------------------------------------------------------
create policy "profiles_select_own_or_staff" on profiles
  for select using (auth.uid() = id or is_staff());

create policy "profiles_update_own_basic_fields" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_admin_manage" on profiles
  for all using (is_admin()) with check (is_admin());

-- -----------------------------------------------------------------------------
-- SITE_SETTINGS: publicly readable (site name, default SEO, social links,
-- analytics IDs are not secret), only admins can change it.
-- -----------------------------------------------------------------------------
create policy "site_settings_public_read" on site_settings
  for select using (true);

create policy "site_settings_admin_write" on site_settings
  for update using (is_admin()) with check (is_admin());

-- -----------------------------------------------------------------------------
-- CATEGORIES: public read, staff write.
-- -----------------------------------------------------------------------------
create policy "categories_public_read" on categories for select using (true);
create policy "categories_staff_write" on categories for all using (is_staff()) with check (is_staff());

-- -----------------------------------------------------------------------------
-- TEAMS: public read only active teams, staff read/write everything.
-- -----------------------------------------------------------------------------
create policy "teams_public_read_active" on teams
  for select using (status = 'active' or is_staff());
create policy "teams_staff_write" on teams
  for all using (is_staff()) with check (is_staff());

-- -----------------------------------------------------------------------------
-- PLAYERS: same pattern as teams.
-- -----------------------------------------------------------------------------
create policy "players_public_read_active" on players
  for select using (status = 'active' or is_staff());
create policy "players_staff_write" on players
  for all using (is_staff()) with check (is_staff());

-- -----------------------------------------------------------------------------
-- MATCHES: public read (fixtures/results are not sensitive), staff write.
-- -----------------------------------------------------------------------------
create policy "matches_public_read" on matches for select using (true);
create policy "matches_staff_write" on matches for all using (is_staff()) with check (is_staff());

-- -----------------------------------------------------------------------------
-- TRANSFERS: public read, staff write.
-- -----------------------------------------------------------------------------
create policy "transfers_public_read" on transfers for select using (true);
create policy "transfers_staff_write" on transfers for all using (is_staff()) with check (is_staff());

-- -----------------------------------------------------------------------------
-- MEDIA: public read (needed to render images), staff write.
-- -----------------------------------------------------------------------------
create policy "media_public_read" on media for select using (true);
create policy "media_staff_write" on media for all using (is_staff()) with check (is_staff());

-- -----------------------------------------------------------------------------
-- ARTICLES: the core rule.
-- -----------------------------------------------------------------------------
create policy "articles_public_read_published" on articles
  for select using (
    (status = 'published' and published_at is not null and published_at <= now())
    or is_staff()
  );
create policy "articles_staff_write" on articles
  for all using (is_staff()) with check (is_staff());

-- -----------------------------------------------------------------------------
-- ARTICLE_TRANSLATIONS: visible only if the parent article is visible.
-- -----------------------------------------------------------------------------
create policy "article_translations_public_read" on article_translations
  for select using (
    is_staff() or exists (
      select 1 from articles a
      where a.id = article_translations.article_id
        and a.status = 'published'
        and a.published_at is not null
        and a.published_at <= now()
    )
  );
create policy "article_translations_staff_write" on article_translations
  for all using (is_staff()) with check (is_staff());

-- -----------------------------------------------------------------------------
-- ARTICLE_PLACEMENTS: same visibility rule — the public homepage query needs
-- to read these flags to know where to show a (visible) article.
-- -----------------------------------------------------------------------------
create policy "article_placements_public_read" on article_placements
  for select using (
    is_staff() or exists (
      select 1 from articles a
      where a.id = article_placements.article_id
        and a.status = 'published'
        and a.published_at is not null
        and a.published_at <= now()
    )
  );
create policy "article_placements_staff_write" on article_placements
  for all using (is_staff()) with check (is_staff());

-- -----------------------------------------------------------------------------
-- ARTICLE_TEAMS / ARTICLE_PLAYERS / ARTICLE_MATCHES: same pattern.
-- -----------------------------------------------------------------------------
create policy "article_teams_public_read" on article_teams
  for select using (
    is_staff() or exists (
      select 1 from articles a
      where a.id = article_teams.article_id
        and a.status = 'published'
        and a.published_at is not null
        and a.published_at <= now()
    )
  );
create policy "article_teams_staff_write" on article_teams
  for all using (is_staff()) with check (is_staff());

create policy "article_players_public_read" on article_players
  for select using (
    is_staff() or exists (
      select 1 from articles a
      where a.id = article_players.article_id
        and a.status = 'published'
        and a.published_at is not null
        and a.published_at <= now()
    )
  );
create policy "article_players_staff_write" on article_players
  for all using (is_staff()) with check (is_staff());

create policy "article_matches_public_read" on article_matches
  for select using (
    is_staff() or exists (
      select 1 from articles a
      where a.id = article_matches.article_id
        and a.status = 'published'
        and a.published_at is not null
        and a.published_at <= now()
    )
  );
create policy "article_matches_staff_write" on article_matches
  for all using (is_staff()) with check (is_staff());
