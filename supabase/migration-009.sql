-- migration-009: Badge (esami) e progressi corsi. RLS owner-only.
-- Applicata al progetto lmbkskjezffizvivnqyc.

-- Badge ottenuti dagli esami (un record per tentativo; l'app legge il migliore).
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  level text not null,
  score integer not null check (score >= 0 and score <= 100),
  created_at timestamptz not null default now()
);
alter table public.user_badges enable row level security;
create policy user_badges_sel on public.user_badges for select to authenticated using (user_id = auth.uid());
create policy user_badges_ins on public.user_badges for insert to authenticated with check (user_id = auth.uid());
create policy user_badges_del on public.user_badges for delete to authenticated using (user_id = auth.uid());
create index if not exists user_badges_user_idx on public.user_badges(user_id);

-- Progressi corsi (lezioni completate) usati da corsi.html via EIH_DB.table('course-progress').
create table if not exists public."course-progress" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lesson text not null,
  course text not null,
  created_at timestamptz not null default now()
);
alter table public."course-progress" enable row level security;
create policy cp_sel on public."course-progress" for select to authenticated using (user_id = auth.uid());
create policy cp_ins on public."course-progress" for insert to authenticated with check (user_id = auth.uid());
create policy cp_del on public."course-progress" for delete to authenticated using (user_id = auth.uid());
create index if not exists course_progress_user_idx on public."course-progress"(user_id);
