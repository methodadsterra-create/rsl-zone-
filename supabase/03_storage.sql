-- =============================================================================
-- RSL ZONE — STORAGE SETUP
-- Run AFTER 01_schema.sql and 02_rls_policies.sql.
-- Creates the `media` bucket used for article cover images, team logos,
-- player photos, etc., and its access policies.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Anyone can view files (they're public images used on public pages).
create policy "media_bucket_public_read"
  on storage.objects for select
  using (bucket_id = 'media');

-- Only signed-in staff (admin/editor) can upload.
create policy "media_bucket_staff_insert"
  on storage.objects for insert
  with check (bucket_id = 'media' and is_staff());

-- Only staff can update/replace files.
create policy "media_bucket_staff_update"
  on storage.objects for update
  using (bucket_id = 'media' and is_staff())
  with check (bucket_id = 'media' and is_staff());

-- Only staff can delete files.
create policy "media_bucket_staff_delete"
  on storage.objects for delete
  using (bucket_id = 'media' and is_staff());
