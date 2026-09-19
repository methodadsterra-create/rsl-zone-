# RSL Zone

An independent, fan-made Saudi Pro League news publication. **Not affiliated with, endorsed by, or an official channel of the Saudi Pro League.**

Stack: React + Vite (JavaScript) · Supabase (Postgres, Auth, Storage) · plain modern CSS.

---

## 1. Project structure

```
rsl-zone/
  src/
    components/     Reusable UI (Header, Footer, cards, admin table, etc.)
    contexts/        ThemeContext, LanguageContext, AuthContext
    hooks/           useLangPath
    i18n/            Language registry + en/ar UI dictionaries
    layouts/         PublicLayout, AdminLayout
    lib/             supabaseClient.js
    pages/           Public pages
      admin/         Admin CMS pages
    services/        content.js — all Supabase content queries live here
    styles/          global.css (design tokens, components)
    utils/           datetime, slugify, translation fallback, SEO helper
  supabase/
    01_schema.sql
    02_rls_policies.sql
    03_storage.sql
    04_seed_data.sql   (optional demo content)
    05_league_table_view.sql
  netlify.toml
  .env.example
```

---

## 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run these files **in order**, each as its own query:
   1. `supabase/01_schema.sql`
   2. `supabase/02_rls_policies.sql`
   3. `supabase/03_storage.sql`
   4. `supabase/05_league_table_view.sql`
   5. *(optional)* `supabase/04_seed_data.sql` — adds real club names plus clearly-labeled fictional demo players/matches/articles so you can see the UI working. Skip it for a clean production database.

### Environment variables

1. Copy `.env.example` to a new file named `.env` in the project root.
2. In Supabase: **Project Settings → API**.
3. Copy **Project URL** → `VITE_SUPABASE_URL`.
4. Copy the **anon public** key (never the `service_role` key) → `VITE_SUPABASE_ANON_KEY`.

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

The `service_role` key must **never** appear in this project. Every table is protected by Row Level Security (`02_rls_policies.sql`), so the anon key alone can never read drafts/scheduled content or write anything as an unauthenticated visitor.

### Admin account setup

1. In Supabase: **Authentication → Users → Add user**, create yourself an account (email + password).
2. A `profiles` row is created for you automatically (role `editor`) by a database trigger.
3. Promote yourself to `admin` in the SQL editor:
   ```sql
   update profiles set role = 'admin' where email = 'you@example.com';
   ```
4. Sign in at `/admin/login`.

To add more staff later, repeat steps 1–3 (leave them as `editor` if they shouldn't manage system settings).

### Scheduled publishing

The public site never trusts the `status` column alone — every public query also checks `published_at <= now()` via RLS, so a scheduled article is provably hidden until its time, regardless of any bug in the frontend.

`publish_due_articles()` (defined in `01_schema.sql`) flips `status` from `scheduled` to `published` once the time has passed, so the *badge* in `/admin/articles` stays accurate too. Run it on a schedule:

- **Recommended:** enable the `pg_cron` extension in Supabase (Database → Extensions), then run once in the SQL editor:
  ```sql
  select cron.schedule('publish-due-articles', '* * * * *', $$select publish_due_articles();$$);
  ```
- Alternatively, call it from a Supabase Edge Function on a cron trigger, or run it manually from the SQL editor.

---

## 3. Local development

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL/key
npm run dev
```

Visit `http://localhost:5173`. First visit auto-detects your browser language (Arabic browser → Arabic site, RTL; otherwise English). Admin is at `/admin/login`.

---

## 4. Deploying to Netlify

1. Push this project to a Git repository.
2. In Netlify: **Add new site → Import an existing project**, connect the repo.
3. Build command: `npm run build`. Publish directory: `dist`. (Already set in `netlify.toml`.)
4. Add environment variables in **Site settings → Environment variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. `netlify.toml` includes the SPA redirect (`/* → /index.html`) so refreshing on any route — `/ar/news/some-article`, `/admin/dashboard`, etc. — works correctly.

---

## 5. How the important systems work

**Language detection & persistence** (`src/i18n/config.js`, `LanguageRedirect.jsx`, `LanguageContext.jsx`): priority is manual choice (localStorage) → browser language → English. Manual choice is only written when the person uses the switcher, so detection keeps re-evaluating on every visit until they do.

**Theme** (`ThemeContext.jsx`): light is always the initial value; dark is opt-in and persisted. An inline script in `index.html` applies the stored theme/language to `<html>` before React mounts, to avoid a flash of the wrong theme.

**Article placement** (`article_placements`, `article_teams`, `article_players` tables): nothing is shown anywhere by default. Every section (Home, Latest News, Breaking News, Transfers, Match Reports, Analysis) and every club/player page is populated only by an explicit flag or link set in the article editor. See `src/services/content.js` for the queries.

**Translations**: `article_translations` stores each language's content independently (`language` is free text, not an enum — adding `fr`/`es`/`pt` needs zero schema changes). The public site falls back to English if a translation is missing, with a visible notice (`pickTranslation()` in `src/utils/translation.js`), and the editor refuses to save an empty Arabic translation — see the note in `ArticleEditor.jsx`.

**RLS**: `articles` (and everything that joins to it) is only readable by the anon key when `status = 'published' AND published_at <= now()`. Staff (`admin`/`editor` role in `profiles`) can read and write everything. See `supabase/02_rls_policies.sql`.

---

## 6. Known simplifications (foundation-stage, worth revisiting before a big launch)

- **Timezone handling in the article scheduler** converts the date/time picker to an ISO timestamp using the browser's local timezone, not a true IANA-timezone conversion. For a newsroom truly spanning timezones, swap in a small helper (or the `Temporal` API once broadly available) so "18:30 Africa/Lagos" is exact regardless of the admin's own device timezone.
- **Rich text**: the article body is currently plain text (line breaks become paragraphs). Swap in a lightweight rich-text editor (e.g. Tiptap) if you need bold/links/embeds in article bodies — kept out for now to avoid an unnecessary dependency.
- **Search** does simple `ilike` matching against titles/names. Fine at small scale; consider Postgres full-text search (`tsvector`) as content grows.
- **Structured data** (Article/Breadcrumb JSON-LD) and the full Open Graph/Twitter meta set are wired for articles (`utils/seo.js`, `NewsArticle.jsx`) but not yet added to club/player/home pages — extend `applySeo()` calls there the same way.
- **Article duplication and Publish Now** are implemented; **Preview** (viewing an unpublished draft as it will look live, in both languages and themes) is not yet built — currently you'd toggle status to check.

None of these affect the core guarantees (RLS-enforced scheduling, explicit placement, real bilingual storage) — they're editor/tooling conveniences to layer on next.
