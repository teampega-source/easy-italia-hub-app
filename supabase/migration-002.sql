-- ============================================================================
-- Migration 002 — tabella flight_subscribers per avvisi volo settimanali
-- Run ONCE in the Supabase SQL Editor.
-- ============================================================================

create table if not exists public.flight_subscribers (
  id          uuid        primary key default gen_random_uuid(),
  email       text        not null,
  origin      text        not null default 'MXP',
  destination text        not null default 'CMB',
  max_price   integer,
  active      boolean     not null default true,
  created_at  timestamptz not null default now()
);

create unique index if not exists flight_subscribers_route_key
  on public.flight_subscribers(email, origin, destination);

create index if not exists idx_flight_subscribers_active
  on public.flight_subscribers(active) where active = true;

-- Nessun accesso pubblico: solo il service role (webhook cron) può leggere/scrivere.
alter table public.flight_subscribers enable row level security;
