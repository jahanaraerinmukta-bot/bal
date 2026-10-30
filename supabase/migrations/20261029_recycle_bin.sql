-- Run this migration in Supabase SQL Editor on an existing Jonotar Kontho project.
alter table public.public_complaints
  add column if not exists updated_at timestamptz not null default now();

alter table public.public_complaints
  add column if not exists deleted_at timestamptz;

-- Soft-deleted posts must not be readable by public/regular authenticated users.
drop policy if exists "Anyone can read published public posts" on public.public_complaints;
create policy "Anyone can read published public posts"
on public.public_complaints
for select
to anon, authenticated
using (deleted_at is null);

-- Keep RLS enabled. Do not add client-side write policies; privileged changes
-- happen only in server actions after Supabase Auth + ADMIN_EMAILS verification.
alter table public.public_complaints enable row level security;

-- Optional image support for anonymous submissions and moderated public posts.
alter table public.complaint_submissions add column if not exists image_path text;
alter table public.public_complaints add column if not exists image_path text;

-- Keep image files private. Only server-side service-role operations access this bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('complaint-images', 'complaint-images', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];
