-- Migration 006 — Mercatino community: campi annuncio + protezione contatto.
-- Applicata su Supabase il 2026-07-13. Idempotente.

alter table public.marketplace_ads
  add column if not exists price_text     text,
  add column if not exists contact        text,
  add column if not exists expires_at     timestamptz,
  add column if not exists featured_until timestamptz;

create index if not exists idx_marketplace_ads_expires  on public.marketplace_ads(expires_at);
create index if not exists idx_marketplace_ads_featured on public.marketplace_ads(featured_until);

-- Contatto = dato personale: MAI leggibile dai visitatori anonimi.
-- anon riceve il select su tutte le colonne TRANNE "contact"; authenticated
-- mantiene il select pieno (RLS limita comunque le righe a published-o-proprie).
revoke select on public.marketplace_ads from anon;
grant select (id, user_id, category, title, body, price_cents, price_text,
              city, status, created_at, updated_at, expires_at, featured_until)
  on public.marketplace_ads to anon;
