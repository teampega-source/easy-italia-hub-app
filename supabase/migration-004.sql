-- migration-004: newsletter subscribers (double opt-in)

create table if not exists public.newsletter_subscribers (
  id                uuid        primary key default gen_random_uuid(),
  email             text        not null unique,
  name              text,
  confirmed         boolean     not null default false,
  confirmed_at      timestamptz,
  token             text        unique,
  token_expires_at  timestamptz,
  created_at        timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

-- Solo service role può leggere/scrivere (nessun accesso client-side diretto)
create policy "service only" on public.newsletter_subscribers
  using (false) with check (false);
