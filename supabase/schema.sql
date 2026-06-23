-- ============================================================================
-- Easy Italia Hub — Supabase / PostgreSQL schema
-- ----------------------------------------------------------------------------
-- IT: Schema completo del database per "Easy Italia Hub" (piattaforma per la
--     comunità srilankese in Italia). Pensato per Supabase (Postgres + Auth +
--     Row Level Security + Storage). Sicuro da eseguire nell'SQL Editor di
--     Supabase: usa "create table if not exists", "gen_random_uuid()", FK ad
--     "auth.users", trigger e policy RLS idempotenti (drop + create).
--
-- EN: Full database schema for "Easy Italia Hub" (platform for the Sri Lankan
--     community in Italy). Targets Supabase (Postgres + Auth + RLS + Storage).
--     Safe to paste & RUN in the Supabase SQL Editor: uses
--     "create table if not exists", "gen_random_uuid()", FKs to "auth.users",
--     and idempotent triggers / RLS policies (drop-then-create).
--
-- Mapped to PRD point 22 (Schema Database) + existing client demo data:
--   * dashboard      localStorage 'eih-deadlines'  {id,date,title,note}
--   * permesso       localStorage 'eih-permesso'   {tipo,presentazione,questura,
--                                                    ricevuta,scadenza,status,...}
--   * documenti      IndexedDB   'eih-docs'        {name,categoria,size,type,
--                                                    createdAt,expiry,blob}
-- ============================================================================


-- ============================================================================
-- 0. EXTENSIONS / ESTENSIONI
-- ----------------------------------------------------------------------------
-- IT: "pgcrypto" fornisce gen_random_uuid(). Su Supabase è già disponibile,
--     ma la creiamo per sicurezza (no-op se già presente).
-- EN: "pgcrypto" provides gen_random_uuid(). Already available on Supabase;
--     we create it defensively (no-op if present).
-- ============================================================================
create extension if not exists "pgcrypto";


-- ============================================================================
-- 1. UTILITY: updated_at trigger function / funzione trigger updated_at
-- ----------------------------------------------------------------------------
-- IT: Aggiorna automaticamente la colonna updated_at ad ogni UPDATE.
-- EN: Automatically bumps the updated_at column on every UPDATE.
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================================
-- 2. PROFILES / PROFILI  (1:1 con auth.users)
-- ----------------------------------------------------------------------------
-- IT: Una riga per ogni utente registrato. La PK "id" punta ad auth.users(id);
--     se l'utente viene eliminato, il profilo cade con lui (on delete cascade).
-- EN: One row per registered user. PK "id" references auth.users(id); profile
--     is removed together with the user (on delete cascade).
-- ============================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  lang        text not null default 'it' check (lang in ('it', 'en', 'si', 'ta')),
  city        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- ----------------------------------------------------------------------------
-- 2b. handle_new_user(): auto-creazione profilo / auto-create profile
-- ----------------------------------------------------------------------------
-- IT: Alla creazione di un utente in auth.users, inserisce automaticamente la
--     riga corrispondente in public.profiles, copiando full_name/lang dai
--     metadati (raw_user_meta_data) se presenti. SECURITY DEFINER perché il
--     trigger gira nel contesto di auth.
-- EN: When a row is inserted into auth.users, automatically inserts the matching
--     row into public.profiles, copying full_name/lang from raw_user_meta_data
--     when available. SECURITY DEFINER because the trigger runs in the auth ctx.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, lang)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'lang', 'it')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from anon, authenticated;


-- ============================================================================
-- 3. SUBSCRIPTIONS / ABBONAMENTI  (modello freemium — PRD §3)
-- ----------------------------------------------------------------------------
-- IT: Stato del piano dell'utente. Stripe (in futuro) aggiornerà status e
--     current_period_end via webhook (service role).
-- EN: User plan state. Stripe (future) will update status & current_period_end
--     through a webhook (service role).
-- ============================================================================
create table if not exists public.subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  plan                text not null default 'free'
                        check (plan in ('free', 'premium', 'premium_plus', 'business')),
  status              text not null default 'active'
                        check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  current_period_end  timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 4. DEADLINES / SCADENZE  (dashboard — 'eih-deadlines')
-- ----------------------------------------------------------------------------
-- IT: Calendario scadenze e promemoria della dashboard. "kind" categorizza la
--     scadenza (documento, appuntamento, pagamento, ...).
-- EN: Dashboard deadlines & reminders. "kind" categorizes the deadline
--     (document, appointment, payment, ...).
-- ============================================================================
create table if not exists public.deadlines (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  note        text,
  due_date    date not null,
  kind        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_deadlines_user_id  on public.deadlines(user_id);
create index if not exists idx_deadlines_due_date on public.deadlines(due_date);

drop trigger if exists trg_deadlines_updated_at on public.deadlines;
create trigger trg_deadlines_updated_at
  before update on public.deadlines
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 5. PERMESSO_PRACTICES / PRATICHE PERMESSO  (tracker — 'eih-permesso')
-- ----------------------------------------------------------------------------
-- IT: Tracker del Permesso di Soggiorno (PRD §5). status: stato della pratica
--     (presentata / in lavorazione / pronto per il ritiro / ritirato).
-- EN: Residence permit ("Permesso di Soggiorno") tracker. status: practice
--     state (submitted / processing / ready / collected).
-- ============================================================================
create table if not exists public.permesso_practices (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo                text,
  data_presentazione  date,
  questura            text,
  ricevuta            text,
  scadenza            date,
  status              text not null default 'presentata'
                        check (status in ('presentata', 'in_lavorazione', 'pronto_ritiro', 'ritirato')),
  data                jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_permesso_user_id  on public.permesso_practices(user_id);
create index if not exists idx_permesso_scadenza on public.permesso_practices(scadenza);

drop trigger if exists trg_permesso_updated_at on public.permesso_practices;
create trigger trg_permesso_updated_at
  before update on public.permesso_practices
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 6. DOCUMENTS / DOCUMENTI  (archivio — 'eih-docs')
-- ----------------------------------------------------------------------------
-- IT: SOLO METADATI. I file (Blob) NON stanno nel database: vanno nel bucket
--     privato Supabase Storage "documents" (vedi nota in fondo). "storage_path"
--     è il percorso dell'oggetto nel bucket.
-- EN: METADATA ONLY. Files (Blobs) do NOT live in the database: they go to the
--     private Supabase Storage bucket "documents" (see note at the bottom).
--     "storage_path" is the object path inside the bucket.
-- ============================================================================
create table if not exists public.documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  categoria     text,
  mime          text,
  size_bytes    bigint,
  storage_path  text,
  expiry        date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_documents_user_id on public.documents(user_id);
create index if not exists idx_documents_expiry  on public.documents(expiry);

drop trigger if exists trg_documents_updated_at on public.documents;
create trigger trg_documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 7. AI_CHATS / CHAT AI  (cronologia Easy Italia Advisor — PRD §7)
-- ----------------------------------------------------------------------------
-- IT: Storico dei messaggi con l'assistente AI. role: chi ha scritto il
--     messaggio (utente / assistente / sistema). lang: lingua del messaggio.
-- EN: AI assistant chat history. role: who wrote the message
--     (user / assistant / system). lang: message language.
-- ============================================================================
create table if not exists public.ai_chats (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'user' check (role in ('user', 'assistant', 'system')),
  content     text not null,
  lang        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_ai_chats_user_id on public.ai_chats(user_id);

drop trigger if exists trg_ai_chats_updated_at on public.ai_chats;
create trigger trg_ai_chats_updated_at
  before update on public.ai_chats
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 8. NOTIFICATIONS / NOTIFICHE  (email/push futuri — PRD §21)
-- ----------------------------------------------------------------------------
-- IT: Notifiche in-app e coda per invii futuri (email via Resend, push mobile).
--     send_at: quando inviare (null = già/da mostrare subito). read: letta?
-- EN: In-app notifications and queue for future delivery (email via Resend,
--     mobile push). send_at: when to send (null = immediate). read: read flag.
-- ============================================================================
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  body        text,
  read        boolean not null default false,
  send_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_send_at on public.notifications(send_at);

drop trigger if exists trg_notifications_updated_at on public.notifications;
create trigger trg_notifications_updated_at
  before update on public.notifications
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 9. COMMUNITY_POSTS / POST COMMUNITY  (forum — PRD §10)
-- ----------------------------------------------------------------------------
-- IT: Post del forum/community. status: 'draft' (privato) o 'published'
--     (visibile a tutti — vedi policy di lettura pubblica).
-- EN: Forum/community posts. status: 'draft' (private) or 'published'
--     (visible to everyone — see the public-read policy).
-- ============================================================================
create table if not exists public.community_posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  body        text,
  city        text,
  status      text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_community_posts_user_id on public.community_posts(user_id);
create index if not exists idx_community_posts_status  on public.community_posts(status);

drop trigger if exists trg_community_posts_updated_at on public.community_posts;
create trigger trg_community_posts_updated_at
  before update on public.community_posts
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 10. MARKETPLACE_ADS / ANNUNCI MARKETPLACE  (PRD §11)
-- ----------------------------------------------------------------------------
-- IT: Annunci (lavoro, affitto stanze, auto usate, servizi). price_cents: prezzo
--     in centesimi per evitare problemi di arrotondamento. status come sopra.
-- EN: Classified ads (jobs, room rentals, used cars, services). price_cents:
--     price in cents to avoid float rounding. status as above.
-- ============================================================================
create table if not exists public.marketplace_ads (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  category     text,
  title        text not null,
  body         text,
  price_cents  bigint,
  city         text,
  status       text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_marketplace_ads_user_id  on public.marketplace_ads(user_id);
create index if not exists idx_marketplace_ads_status   on public.marketplace_ads(status);
create index if not exists idx_marketplace_ads_category on public.marketplace_ads(category);

drop trigger if exists trg_marketplace_ads_updated_at on public.marketplace_ads;
create trigger trg_marketplace_ads_updated_at
  before update on public.marketplace_ads
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 11. COURSES / CORSI  (Academy — PRD §12)  [contenuto pubblico]
-- ----------------------------------------------------------------------------
-- IT: Catalogo corsi. CONTENUTO gestito dallo staff (service role). "user_id"
--     indica l'autore/owner del contenuto. is_public: visibile a tutti in sola
--     lettura. NB: la lettura pubblica è "select using (true)" più sotto.
-- EN: Course catalog. CONTENT managed by staff (service role). "user_id" marks
--     the content author/owner. is_public: world-readable. NB: public read is a
--     "select using (true)" policy below.
-- ============================================================================
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  slug        text unique,
  level       text,
  summary     text,
  is_public   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_courses_user_id on public.courses(user_id);
create index if not exists idx_courses_slug    on public.courses(slug);

drop trigger if exists trg_courses_updated_at on public.courses;
create trigger trg_courses_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 12. JOBS / OFFERTE DI LAVORO  (PRD §14)  [contenuto pubblico]
-- ----------------------------------------------------------------------------
-- IT: Offerte di lavoro aggregate/curate. Lettura pubblica, scrittura riservata
--     allo staff (service role). "source" = provenienza dell'annuncio.
-- EN: Curated/aggregated job listings. Public read, staff-only writes
--     (service role). "source" = listing origin.
-- ============================================================================
create table if not exists public.jobs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  company     text,
  city        text,
  url         text,
  source      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_jobs_user_id on public.jobs(user_id);
create index if not exists idx_jobs_city    on public.jobs(city);

drop trigger if exists trg_jobs_updated_at on public.jobs;
create trigger trg_jobs_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 13. CERTIFICATES / CERTIFICATI  (PDF a fine corso — PRD §18)
-- ----------------------------------------------------------------------------
-- IT: Certificati digitali emessi al completamento di un corso. course_id punta
--     a courses(id); se il corso viene eliminato, course_id diventa null
--     (on delete set null) ma il certificato resta valido per l'utente.
--     pdf_path: percorso del PDF in Storage.
-- EN: Digital certificates issued on course completion. course_id references
--     courses(id); if the course is deleted, course_id becomes null
--     (on delete set null) but the certificate stays valid for the user.
--     pdf_path: certificate PDF path in Storage.
-- ============================================================================
create table if not exists public.certificates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  course_id   uuid references public.courses(id) on delete set null,
  title       text not null,
  issued_at   timestamptz not null default now(),
  pdf_path    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_certificates_user_id   on public.certificates(user_id);
create index if not exists idx_certificates_course_id on public.certificates(course_id);

drop trigger if exists trg_certificates_updated_at on public.certificates;
create trigger trg_certificates_updated_at
  before update on public.certificates
  for each row execute function public.set_updated_at();


-- ============================================================================
-- ============================================================================
-- ROW LEVEL SECURITY / SICUREZZA A LIVELLO DI RIGA
-- ----------------------------------------------------------------------------
-- IT: Abilitiamo RLS su OGNI tabella. Senza policy, RLS abilitata = nessun
--     accesso (deny-all) per i client anon/authenticated; il service role
--     bypassa SEMPRE la RLS (usato solo dal backend, mai dal frontend).
--     Regola generale tabelle "user-owned": l'utente vede/modifica SOLO le
--     proprie righe (user_id = (select auth.uid())); per profiles è id = (select auth.uid()).
--     Lettura pubblica SOLO dove ha senso (post/annunci pubblicati; corsi/jobs).
-- EN: We enable RLS on EVERY table. With RLS on and no policy, anon/authenticated
--     clients get deny-all; the service role ALWAYS bypasses RLS (backend only,
--     never the frontend). General rule for user-owned tables: a user can
--     read/write ONLY their own rows (user_id = (select auth.uid())); for profiles it is
--     id = (select auth.uid()). Public read ONLY where it makes sense (published
--     posts/ads; courses/jobs).
-- ============================================================================
-- ============================================================================

alter table public.profiles           enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.deadlines          enable row level security;
alter table public.permesso_practices enable row level security;
alter table public.documents          enable row level security;
alter table public.ai_chats           enable row level security;
alter table public.notifications      enable row level security;
alter table public.community_posts    enable row level security;
alter table public.marketplace_ads    enable row level security;
alter table public.courses            enable row level security;
alter table public.jobs               enable row level security;
alter table public.certificates       enable row level security;


-- ----------------------------------------------------------------------------
-- 14a. PROFILES — owner-only (chiave: id = (select auth.uid()))
-- ----------------------------------------------------------------------------
-- IT: Nessuna policy DELETE: il profilo si elimina solo via cascade da
--     auth.users (cancellazione account). Ogni utente legge/aggiorna SOLO il
--     proprio profilo; INSERT consentito per sé (di norma lo crea il trigger).
-- EN: No DELETE policy: the profile is removed only via cascade from auth.users
--     (account deletion). Each user reads/updates ONLY their own profile;
--     INSERT allowed for self (normally created by the trigger).
-- ----------------------------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = (select auth.uid()));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = (select auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));


-- ----------------------------------------------------------------------------
-- 14b. SUBSCRIPTIONS — owner-only
-- ----------------------------------------------------------------------------
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (user_id = (select auth.uid()));

drop policy if exists "subscriptions_insert_own" on public.subscriptions;
create policy "subscriptions_insert_own" on public.subscriptions
  for insert with check (user_id = (select auth.uid()));

drop policy if exists "subscriptions_update_own" on public.subscriptions;
create policy "subscriptions_update_own" on public.subscriptions
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "subscriptions_delete_own" on public.subscriptions;
create policy "subscriptions_delete_own" on public.subscriptions
  for delete using (user_id = (select auth.uid()));


-- ----------------------------------------------------------------------------
-- 14c. DEADLINES — owner-only
-- ----------------------------------------------------------------------------
drop policy if exists "deadlines_select_own" on public.deadlines;
create policy "deadlines_select_own" on public.deadlines
  for select using (user_id = (select auth.uid()));

drop policy if exists "deadlines_insert_own" on public.deadlines;
create policy "deadlines_insert_own" on public.deadlines
  for insert with check (user_id = (select auth.uid()));

drop policy if exists "deadlines_update_own" on public.deadlines;
create policy "deadlines_update_own" on public.deadlines
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "deadlines_delete_own" on public.deadlines;
create policy "deadlines_delete_own" on public.deadlines
  for delete using (user_id = (select auth.uid()));


-- ----------------------------------------------------------------------------
-- 14d. PERMESSO_PRACTICES — owner-only
-- ----------------------------------------------------------------------------
drop policy if exists "permesso_select_own" on public.permesso_practices;
create policy "permesso_select_own" on public.permesso_practices
  for select using (user_id = (select auth.uid()));

drop policy if exists "permesso_insert_own" on public.permesso_practices;
create policy "permesso_insert_own" on public.permesso_practices
  for insert with check (user_id = (select auth.uid()));

drop policy if exists "permesso_update_own" on public.permesso_practices;
create policy "permesso_update_own" on public.permesso_practices
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "permesso_delete_own" on public.permesso_practices;
create policy "permesso_delete_own" on public.permesso_practices
  for delete using (user_id = (select auth.uid()));


-- ----------------------------------------------------------------------------
-- 14e. DOCUMENTS — owner-only (i FILE sono protetti separatamente in Storage)
-- ----------------------------------------------------------------------------
drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own" on public.documents
  for select using (user_id = (select auth.uid()));

drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own" on public.documents
  for insert with check (user_id = (select auth.uid()));

drop policy if exists "documents_update_own" on public.documents;
create policy "documents_update_own" on public.documents
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_delete_own" on public.documents
  for delete using (user_id = (select auth.uid()));


-- ----------------------------------------------------------------------------
-- 14f. AI_CHATS — owner-only
-- ----------------------------------------------------------------------------
drop policy if exists "ai_chats_select_own" on public.ai_chats;
create policy "ai_chats_select_own" on public.ai_chats
  for select using (user_id = (select auth.uid()));

drop policy if exists "ai_chats_insert_own" on public.ai_chats;
create policy "ai_chats_insert_own" on public.ai_chats
  for insert with check (user_id = (select auth.uid()));

drop policy if exists "ai_chats_update_own" on public.ai_chats;
create policy "ai_chats_update_own" on public.ai_chats
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "ai_chats_delete_own" on public.ai_chats;
create policy "ai_chats_delete_own" on public.ai_chats
  for delete using (user_id = (select auth.uid()));


-- ----------------------------------------------------------------------------
-- 14g. NOTIFICATIONS — owner-only
-- ----------------------------------------------------------------------------
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (user_id = (select auth.uid()));

drop policy if exists "notifications_insert_own" on public.notifications;
create policy "notifications_insert_own" on public.notifications
  for insert with check (user_id = (select auth.uid()));

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
  for delete using (user_id = (select auth.uid()));


-- ----------------------------------------------------------------------------
-- 14h. COMMUNITY_POSTS — owner-only + lettura pubblica dei post pubblicati
-- ----------------------------------------------------------------------------
-- IT: Due policy di SELECT: l'autore vede sempre i propri post (qualsiasi
--     status); chiunque (anche anon) vede i post con status = 'published'.
-- EN: Two SELECT policies: the author always sees their own posts (any status);
--     anyone (incl. anon) sees posts with status = 'published'.
-- ----------------------------------------------------------------------------
drop policy if exists "community_posts_select_own" on public.community_posts;
drop policy if exists "community_posts_select_published" on public.community_posts;
drop policy if exists "community_posts_select" on public.community_posts;
create policy "community_posts_select" on public.community_posts
  for select using (status = 'published' or user_id = (select auth.uid()));

drop policy if exists "community_posts_insert_own" on public.community_posts;
create policy "community_posts_insert_own" on public.community_posts
  for insert with check (user_id = (select auth.uid()));

drop policy if exists "community_posts_update_own" on public.community_posts;
create policy "community_posts_update_own" on public.community_posts
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "community_posts_delete_own" on public.community_posts;
create policy "community_posts_delete_own" on public.community_posts
  for delete using (user_id = (select auth.uid()));


-- ----------------------------------------------------------------------------
-- 14i. MARKETPLACE_ADS — owner-only + lettura pubblica degli annunci pubblicati
-- ----------------------------------------------------------------------------
drop policy if exists "marketplace_ads_select_own" on public.marketplace_ads;
drop policy if exists "marketplace_ads_select_published" on public.marketplace_ads;
drop policy if exists "marketplace_ads_select" on public.marketplace_ads;
create policy "marketplace_ads_select" on public.marketplace_ads
  for select using (status = 'published' or user_id = (select auth.uid()));

drop policy if exists "marketplace_ads_insert_own" on public.marketplace_ads;
create policy "marketplace_ads_insert_own" on public.marketplace_ads
  for insert with check (user_id = (select auth.uid()));

drop policy if exists "marketplace_ads_update_own" on public.marketplace_ads;
create policy "marketplace_ads_update_own" on public.marketplace_ads
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "marketplace_ads_delete_own" on public.marketplace_ads;
create policy "marketplace_ads_delete_own" on public.marketplace_ads
  for delete using (user_id = (select auth.uid()));


-- ----------------------------------------------------------------------------
-- 14j. CERTIFICATES — owner-only (sola lettura per l'utente; emessi dal backend)
-- ----------------------------------------------------------------------------
-- IT: L'utente legge i propri certificati. Niente INSERT/UPDATE/DELETE dal
--     client: i certificati vengono emessi dal backend (service role), che
--     bypassa la RLS. Aggiungiamo comunque una policy DELETE owner-only nel caso
--     l'utente voglia rimuovere un proprio certificato dall'archivio personale.
-- EN: The user reads their own certificates. No client INSERT/UPDATE: issued by
--     the backend (service role), which bypasses RLS. We still add an owner-only
--     DELETE policy in case the user wants to remove their own certificate from
--     their personal archive.
-- ----------------------------------------------------------------------------
drop policy if exists "certificates_select_own" on public.certificates;
create policy "certificates_select_own" on public.certificates
  for select using (user_id = (select auth.uid()));

drop policy if exists "certificates_delete_own" on public.certificates;
create policy "certificates_delete_own" on public.certificates
  for delete using (user_id = (select auth.uid()));


-- ----------------------------------------------------------------------------
-- 14k. COURSES — lettura pubblica, scrittura riservata (service role)
-- ----------------------------------------------------------------------------
-- IT: Chiunque può leggere i corsi (select using true). Nessuna policy di
--     scrittura: INSERT/UPDATE/DELETE sono possibili SOLO dal service role
--     (backend/staff), che bypassa la RLS.
-- EN: Anyone can read courses (select using true). No write policy: INSERT/
--     UPDATE/DELETE are possible ONLY from the service role (backend/staff),
--     which bypasses RLS.
-- ----------------------------------------------------------------------------
drop policy if exists "courses_select_public" on public.courses;
create policy "courses_select_public" on public.courses
  for select using (true);


-- ----------------------------------------------------------------------------
-- 14l. JOBS — lettura pubblica, scrittura riservata (service role)
-- ----------------------------------------------------------------------------
drop policy if exists "jobs_select_public" on public.jobs;
create policy "jobs_select_public" on public.jobs
  for select using (true);


-- ============================================================================
-- FLIGHT SUBSCRIBERS — iscrizioni avvisi volo settimanali
-- Nessuna RLS pubblica: accesso esclusivo tramite service role.
-- unsubscribe_token è un UUID separato dall'id primario, incluso
-- nel link di disiscrizione nelle email. Rotazione possibile senza
-- esporre l'id del record.
-- ============================================================================
create table if not exists public.flight_subscribers (
  id                uuid primary key default gen_random_uuid(),
  email             text not null,
  origin            text not null check (origin in ('MXP','FCO','TRN','VCE','NAP','BGY','LIN','PMO')),
  destination       text not null default 'CMB',
  max_price         integer check (max_price between 50 and 5000),
  active            boolean not null default true,
  unsubscribe_token uuid not null default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (email, origin, destination)
);
alter table public.flight_subscribers enable row level security;
create trigger set_flight_subscribers_updated_at
  before update on public.flight_subscribers
  for each row execute function public.set_updated_at();


-- ============================================================================
-- ============================================================================
-- STORAGE / ARCHIVIAZIONE FILE  —  bucket privato "documents"
-- ----------------------------------------------------------------------------
-- IT: I file caricati (PDF/immagini) NON vanno nel database, ma in un bucket
--     privato di Supabase Storage chiamato "documents". Crea il bucket
--     dall'interfaccia (Storage -> New bucket -> Name: documents, Public: OFF)
--     OPPURE de-commenta lo snippet qui sotto ed eseguilo.
--
--     Convenzione percorso file CONSIGLIATA:  <auth.uid()>/<nome-file>
--     così la prima cartella coincide con l'ID utente e le policy RLS sotto
--     garantiscono accesso SOLO al proprietario (owner-only). Salva lo stesso
--     percorso anche in documents.storage_path.
--
-- EN: Uploaded files (PDFs/images) do NOT go to the database, but to a PRIVATE
--     Supabase Storage bucket named "documents". Create it from the dashboard
--     (Storage -> New bucket -> Name: documents, Public: OFF) OR uncomment the
--     snippet below and run it.
--
--     RECOMMENDED file path convention:  <auth.uid()>/<file-name>
--     so the first folder equals the user ID and the RLS policies below grant
--     access ONLY to the owner. Store the same path in documents.storage_path.
--
-- ----------------------------------------------------------------------------
-- IT/EN: De-commenta TUTTO il blocco seguente per creare bucket + policy via SQL.
--        Uncomment the WHOLE block below to create the bucket + policies via SQL.
-- ----------------------------------------------------------------------------
--
-- Crea il bucket privato / Create the private bucket
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- RLS owner-only su storage.objects per il bucket 'documents'.
-- La RLS su storage.objects è già abilitata da Supabase.
-- Owner = prima cartella del percorso == (select auth.uid())
-- (storage.foldername(name))[1] è il primo segmento del path.

drop policy if exists "documents_storage_select_own" on storage.objects;
create policy "documents_storage_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "documents_storage_insert_own" on storage.objects;
create policy "documents_storage_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "documents_storage_update_own" on storage.objects;
create policy "documents_storage_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "documents_storage_delete_own" on storage.objects;
create policy "documents_storage_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
--
-- ============================================================================
-- FINE / END — Easy Italia Hub schema
-- ============================================================================
