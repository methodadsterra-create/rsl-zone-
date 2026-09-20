-- =============================================================================
-- SPL ZONE — rename to SPL, connect Settings, add all Saudi Pro League clubs
-- Run once in the Supabase SQL Editor. Safe to run again (nothing is duplicated).
-- =============================================================================

-- 1) Site settings: SPL name (English + Arabic) and Arabic as default language
alter table site_settings add column if not exists site_name_ar text;
insert into site_settings (id) values (true) on conflict (id) do nothing;
update site_settings
set site_name = 'SPL Zone',
    site_name_ar = 'إس بي إل زون',
    site_description = 'Independent Saudi Pro League news, transfers, matches and analysis.',
    default_language = 'ar'
where id = true;

-- 2) The 18 clubs of the 2026/27 Saudi Pro League (logos/stadiums can be added
--    later in Admin -> Teams)
insert into teams (slug, name_en, name_ar, short_name, city, status) values
  ('al-hilal',   'Al Hilal',   'الهلال',    'Al Hilal',   'Riyadh',   'active'),
  ('al-nassr',   'Al Nassr',   'النصر',     'Al Nassr',   'Riyadh',   'active'),
  ('al-ahli',    'Al Ahli',    'الأهلي',    'Al Ahli',    'Jeddah',   'active'),
  ('al-ittihad', 'Al Ittihad', 'الاتحاد',   'Al Ittihad', 'Jeddah',   'active'),
  ('al-qadsiah', 'Al Qadsiah', 'القادسية',  'Al Qadsiah', 'Khobar',   'active'),
  ('al-taawoun', 'Al Taawoun', 'التعاون',   'Al Taawoun', 'Buraidah', 'active'),
  ('al-ettifaq', 'Al Ettifaq', 'الاتفاق',   'Al Ettifaq', 'Dammam',   'active'),
  ('neom',       'NEOM',       'نيوم',      'NEOM',       null,       'active'),
  ('al-fateh',   'Al Fateh',   'الفتح',     'Al Fateh',   'Al-Ahsa',  'active'),
  ('al-fayha',   'Al Fayha',   'الفيحاء',   'Al Fayha',   'Al Majma''ah', 'active'),
  ('al-khaleej', 'Al Khaleej', 'الخليج',    'Al Khaleej', 'Saihat',   'active'),
  ('al-riyadh',  'Al Riyadh',  'الرياض',    'Al Riyadh',  'Riyadh',   'active'),
  ('al-kholood', 'Al Kholood', 'الخلود',    'Al Kholood', 'Ar Rass',  'active'),
  ('al-shabab',  'Al Shabab',  'الشباب',    'Al Shabab',  'Riyadh',   'active'),
  ('al-hazem',   'Al Hazem',   'الحزم',     'Al Hazem',   'Ar Rass',  'active'),
  ('abha',       'Abha',       'أبها',      'Abha',       'Abha',     'active'),
  ('al-faisaly', 'Al Faisaly', 'الفيصلي',   'Al Faisaly', 'Harmah',   'active'),
  ('al-diriyah', 'Al Diriyah', 'الدرعية',   'Al Diriyah', 'Diriyah',  'active')
on conflict (slug) do nothing;

-- 3) Article categories (so the Category list in the editor isn't empty)
insert into categories (slug, name_en, name_ar, sort_order) values
  ('news',          'News',          'الأخبار',         1),
  ('transfers',     'Transfers',     'الانتقالات',      2),
  ('match-reports', 'Match Reports', 'تقارير المباريات', 3),
  ('club-news',     'Club News',     'أخبار الأندية',   4),
  ('player-news',   'Player News',   'أخبار اللاعبين',  5),
  ('analysis',      'Analysis',      'تحليل',           6),
  ('features',      'Features',      'تقارير خاصة',     7),
  ('opinion',       'Opinion',       'رأي',             8)
on conflict (slug) do nothing;
