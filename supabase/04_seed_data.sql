-- =============================================================================
-- RSL ZONE — OPTIONAL SEED / DEMO DATA
-- Run this only if you want sample content to see the UI working locally.
-- Skip it entirely for a clean production database.
--
-- Team names are real Saudi Pro League clubs (basic facts like city are
-- stable), but stadium/founded-year values here are placeholders — verify
-- and correct them in /admin/teams before publishing anything live.
-- Players, matches, and articles below are entirely FICTIONAL demo content,
-- clearly labeled as such, for layout/UI testing only. Do not present them
-- as real news.
-- =============================================================================

-- Categories
insert into categories (slug, name_en, name_ar, sort_order) values
  ('news', 'News', 'الأخبار', 1),
  ('transfers', 'Transfers', 'الانتقالات', 2),
  ('match-reports', 'Match Reports', 'تقارير المباريات', 3),
  ('club-news', 'Club News', 'أخبار الأندية', 4),
  ('player-news', 'Player News', 'أخبار اللاعبين', 5),
  ('analysis', 'Analysis', 'تحليل', 6),
  ('features', 'Features', 'تقارير خاصة', 7),
  ('opinion', 'Opinion', 'رأي', 8);

-- Teams (real clubs — verify stadium/founded_year before publishing)
insert into teams (slug, name_en, name_ar, short_name, city, founded_year, stadium, status) values
  ('al-nassr', 'Al Nassr', 'النصر', 'Al Nassr', 'Riyadh', 1955, 'Al-Awwal Park', 'active'),
  ('al-hilal', 'Al Hilal', 'الهلال', 'Al Hilal', 'Riyadh', 1957, 'Kingdom Arena', 'active'),
  ('al-ittihad', 'Al Ittihad', 'الاتحاد', 'Al Ittihad', 'Jeddah', 1927, 'King Abdullah Sports City', 'active'),
  ('al-ahli', 'Al Ahli', 'الأهلي', 'Al Ahli', 'Jeddah', 1937, 'King Abdullah Sports City', 'active');

-- Demo players (fictional — for layout testing only)
insert into players (slug, name_en, name_ar, nationality, position, current_team_id, bio_en, bio_ar, status)
select 'demo-player-one', '(Demo) Sample Forward', '(تجريبي) لاعب هجوم تجريبي', 'Demo', 'Forward', id,
  'This is placeholder demo content used to test player page layout. Not a real player.',
  'هذا محتوى تجريبي لاختبار تصميم صفحة اللاعب، وليس لاعباً حقيقياً.', 'active'
from teams where slug = 'al-nassr';

insert into players (slug, name_en, name_ar, nationality, position, current_team_id, bio_en, bio_ar, status)
select 'demo-player-two', '(Demo) Sample Midfielder', '(تجريبي) لاعب وسط تجريبي', 'Demo', 'Midfielder', id,
  'This is placeholder demo content used to test player page layout. Not a real player.',
  'هذا محتوى تجريبي لاختبار تصميم صفحة اللاعب، وليس لاعباً حقيقياً.', 'active'
from teams where slug = 'al-hilal';

-- Demo match (fictional fixture, near-future, for layout testing)
insert into matches (home_team_id, away_team_id, competition, kickoff_at, venue, status, featured)
select h.id, a.id, 'Saudi Pro League', now() + interval '5 days', h.stadium, 'scheduled', true
from teams h, teams a where h.slug = 'al-nassr' and a.slug = 'al-hilal';

insert into matches (home_team_id, away_team_id, competition, kickoff_at, venue, status, home_score, away_score)
select h.id, a.id, 'Saudi Pro League', now() - interval '4 days', h.stadium, 'finished', 2, 1
from teams h, teams a where h.slug = 'al-ittihad' and a.slug = 'al-ahli';

-- Demo transfer (fictional)
insert into transfers (player_id, from_team_id, to_team_id, transfer_type, fee, transfer_date, status, source, notes)
select p.id, t1.id, t2.id, 'permanent', 'Undisclosed', current_date, 'reported', '(Demo source)',
  'Fictional demo transfer record for UI testing.'
from players p, teams t1, teams t2
where p.slug = 'demo-player-two' and t1.slug = 'al-hilal' and t2.slug = 'al-ittihad';

-- Demo article, published, placed on Home + Latest News + its club page
do $$
declare
  v_article_id uuid;
  v_category_id uuid;
  v_team_id uuid;
begin
  select id into v_category_id from categories where slug = 'club-news';
  select id into v_team_id from teams where slug = 'al-nassr';

  insert into articles (slug, category_id, status, published_at, featured_on_home, is_breaking_news, tags)
  values ('demo-al-nassr-preview', v_category_id, 'published', now() - interval '1 hour', true, false, array['demo'])
  returning id into v_article_id;

  insert into article_translations (article_id, language, title, excerpt, content, seo_title, seo_description) values
    (v_article_id, 'en', '(Demo) Al Nassr prepare for upcoming league fixture',
     'Placeholder demo article used to preview the homepage, article page and club page layout.',
     'This is fictional demo content generated to test the RSL Zone layout. It is not real football news and should be removed or replaced before the site goes live.',
     '(Demo) Al Nassr prepare for upcoming league fixture — RSL Zone',
     'Placeholder demo article for layout testing on RSL Zone.'),
    (v_article_id, 'ar', '(تجريبي) النصر يستعد لمواجهة الدوري المقبلة',
     'مقال تجريبي تم إنشاؤه لمعاينة تصميم الصفحة الرئيسية وصفحة المقال وصفحة النادي.',
     'هذا محتوى تجريبي وهمي تم إنشاؤه لاختبار تصميم موقع آر إس إل زون. هذا ليس خبراً رياضياً حقيقياً ويجب حذفه أو استبداله قبل إطلاق الموقع.',
     '(تجريبي) النصر يستعد لمواجهة الدوري المقبلة — آر إس إل زون',
     'مقال تجريبي لاختبار تصميم موقع آر إس إل زون.');

  insert into article_placements (article_id, show_on_home, show_in_latest_news, show_in_breaking_news, show_in_transfers, show_in_match_reports, show_in_analysis)
  values (v_article_id, true, true, false, false, false, false);

  insert into article_teams (article_id, team_id) values (v_article_id, v_team_id);
end $$;
