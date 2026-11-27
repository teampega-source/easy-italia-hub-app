-- migration-012 — hardening + tabelle per newsletter/n8n.
-- Idempotente per quanto possibile. Da applicare nel SQL Editor del progetto
-- lmbkskjezffizvivnqyc PRIMA di attivare il digest e i workflow n8n 05/07.
--
-- Perché serve:
--   • newsletter: lingua, token di disiscrizione e data di disiscrizione;
--   • permesso_practices: upsert per user_id richiede UNIQUE(user_id);
--   • subscriptions: upsert Stripe per user_id richiede UNIQUE(user_id);
--   • content_calendar e news_items: tabelle usate dai workflow n8n;
--   • storage: limite di 10 MB e MIME consentiti per il bucket documents.
--
-- Le tabelle nuove sono service-only: RLS attiva senza policy e revoca dei
-- grant ad anon/authenticated. Il browser non le legge e non le scrive.

-- ── 1. Newsletter ──────────────────────────────────────────────────────────
alter table public.newsletter_subscribers
  add column if not exists lang text not null default 'it'
    check (lang in ('it', 'en', 'si', 'ta'));
alter table public.newsletter_subscribers
  add column if not exists unsubscribed_at timestamptz;
alter table public.newsletter_subscribers
  add column if not exists unsub_token uuid not null default gen_random_uuid();

create unique index if not exists idx_newsletter_unsub_token
  on public.newsletter_subscribers(unsub_token);
create index if not exists idx_newsletter_confirmed_lang
  on public.newsletter_subscribers(confirmed, lang);

-- Nessun accesso diretto dal browser: solo service role.
revoke all on public.newsletter_subscribers from anon, authenticated;

-- ── 2. Unicità per gli upsert ──────────────────────────────────────────────
-- Se una migrazione fallisce qui, ci sono righe doppie da riconciliare a mano:
-- non cancelliamo dati automaticamente.
create unique index if not exists uq_permesso_practices_user
  on public.permesso_practices(user_id);
create unique index if not exists uq_subscriptions_user
  on public.subscriptions(user_id);

-- Il piano non si tocca dal client: lo aggiorna solo il webhook Stripe con la
-- service role. La RLS di migration-010 già toglie le policy; qui togliamo
-- anche i grant, così non resta una via alternativa.
revoke insert, update, delete on public.subscriptions from anon, authenticated;

-- ── 3. Tabelle operative n8n ───────────────────────────────────────────────
create table if not exists public.content_calendar (
  id          uuid primary key default gen_random_uuid(),
  week_of     date not null,
  giorno      text,
  tipo        text,
  tema        text,
  caption_it  text,
  caption_si  text,
  hook        text,
  cta         text,
  status      text not null default 'draft'
                check (status in ('draft', 'approved', 'published', 'rejected')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_content_calendar_week on public.content_calendar(week_of);
create index if not exists idx_content_calendar_status on public.content_calendar(status);

create table if not exists public.news_items (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  link         text not null unique,
  description  text,
  source       text,
  title_si     text,
  published_at date,
  created_at   timestamptz not null default now()
);

create index if not exists idx_news_items_created on public.news_items(created_at desc);

alter table public.content_calendar enable row level security;
alter table public.news_items enable row level security;
-- Nessuna policy = solo service role (n8n e backend).
revoke all on public.content_calendar from anon, authenticated;
revoke all on public.news_items from anon, authenticated;

-- ── 4. Limiti upload documenti ─────────────────────────────────────────────
-- 10 MB, solo formati che l'archivio documenti può mostrare in sicurezza.
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
where id = 'documents';

-- ── 5. Promemoria: stato di invio ──────────────────────────────────────────
-- Il cron Vercel (_digest.js) resta la fonte di verità per le email; questa
-- colonna serve solo se in futuro si attiva anche il workflow n8n 02.
alter table public.permesso_practices
  add column if not exists reminder_sent boolean not null default false;

-- ── Verifica rapida (facoltativa) ──────────────────────────────────────────
-- select tablename, rowsecurity from pg_tables
--   where schemaname = 'public' order by tablename;
-- select id, file_size_limit, allowed_mime_types from storage.buckets where id = 'documents';
