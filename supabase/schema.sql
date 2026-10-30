create extension if not exists pgcrypto;

-- Private intake: never expose this table to public users.
create table if not exists public.complaint_submissions (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique default upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 10)),
  category text not null check (category in ('extortion','threat','harassment','corruption','public_service','other')),
  district text,
  incident_date date,
  narrative text not null check (char_length(narrative) between 30 and 5000),
  image_path text,
  contact_info text, -- optional; treat as sensitive and never publish
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  published_post_id uuid
);

-- Public-only, moderated copy. Never copy contact_info or private evidence here.
create table if not exists public.public_complaints (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.complaint_submissions(id) on delete restrict,
  reference_code text not null unique,
  category text not null,
  district text,
  incident_month text,
  public_summary text not null check (char_length(public_summary) between 30 and 2000),
  image_path text,
  disclaimer text not null default 'এটি একজন ব্যবহারকারীর জমা দেওয়া অভিযোগ; স্বাধীনভাবে সত্যতা প্রমাণিত হয়েছে—এমন অর্থ নয়।',
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Safe migration for projects that already created the starter schema.
alter table public.public_complaints add column if not exists updated_at timestamptz not null default now();
alter table public.public_complaints add column if not exists deleted_at timestamptz;

alter table public.complaint_submissions enable row level security;
alter table public.public_complaints enable row level security;

-- No anon/authenticated policies on private submissions. Server-only service role handles intake/review.
-- Public may read only the separate moderated-public table.
drop policy if exists "Anyone can read published public posts" on public.public_complaints;
create policy "Anyone can read published public posts"
on public.public_complaints for select
to anon, authenticated
using (deleted_at is null);

-- No client insert/update/delete policies for either table.
-- Keep service-role key exclusively on server.

-- Private image bucket: only server-side service-role code can upload/read files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('complaint-images', 'complaint-images', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];
