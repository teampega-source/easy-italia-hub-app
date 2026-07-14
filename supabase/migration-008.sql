-- Migration 008 — app_secrets: segreti applicativi letti solo dal backend.
-- RLS attiva senza policy = accesso solo via service role.
-- I VALORI (vapid_public, vapid_private) sono inseriti direttamente sul
-- database e NON sono in questo repository.
create table if not exists public.app_secrets (
  key   text primary key,
  value text not null
);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;
