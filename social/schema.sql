-- Le tabelle dell'agente social (spec §9), per la fase 2 su Supabase.
--
-- Non sono ancora applicate: la fase 1 scrive su file, che per una persona sola
-- basta e non costa niente. Si applicano quando serve lo storico — cioè quando
-- si vuole rispondere a «questo tema l'abbiamo già pubblicato?» e «cosa ha
-- funzionato».
--
-- Tutte in schema `social`, separate dai dati degli utenti del sito: un agente
-- che sbaglia una query non deve poter toccare le scadenze di nessuno.

create schema if not exists social;

-- Ogni giro dell'agente, con esito e durata: senza questo non si sa se il
-- lavoro delle 8 di mattina è girato o è morto in silenzio.
create table if not exists social.ai_runs (
  id           bigserial primary key,
  avviato      timestamptz not null default now(),
  durata_ms    integer,
  agente       text not null,
  modello      text,
  esito        text not null check (esito in ('ok','vuoto','errore','asciutto')),
  dettaglio    text
);

-- Le opportunità trovate dallo Scout, con il punteggio e la fonte.
create table if not exists social.opportunita (
  id           bigserial primary key,
  trovata      timestamptz not null default now(),
  tipo         text not null,
  titolo       text not null,
  fonte        text,
  fonte_nome   text,
  lingua       text,
  punteggio    smallint not null default 0,
  stato        text not null default 'nuova' check (stato in ('nuova','usata','scartata'))
);

-- I contenuti generati, uno per lingua e formato.
create table if not exists social.contenuti (
  id             bigserial primary key,
  opportunita_id bigint references social.opportunita(id) on delete set null,
  creato         timestamptz not null default now(),
  lingua         text not null,
  formato        text not null,
  testo          text not null,
  hashtag        text[],
  grezzo         boolean not null default false,
  gravita        text,
  problemi       text[],
  modalita       text not null check (modalita in ('auto','revisione','manuale','scartato'))
);

-- Il registro delle approvazioni: chi, quando, cosa, com'è finita (spec §12).
create table if not exists social.approvazioni (
  id           bigserial primary key,
  contenuto_id bigint references social.contenuti(id) on delete cascade,
  quando       timestamptz not null default now(),
  chi          text not null,
  azione       text not null check (azione in ('approva','modifica','rifiuta','programma','pubblica')),
  nota         text,
  esito        text
);

-- Partner e associazioni (spec §8): il CRM minimo che serve davvero.
create table if not exists social.partner (
  id           bigserial primary key,
  nome         text not null,
  tipo         text,
  citta        text,
  contatto     text,
  sito         text,
  stato        text not null default 'da_contattare',
  priorita     smallint default 3,
  ultimo_contatto date,
  prossima_azione text,
  note         text
);

-- Traccia di ogni azione verso l'esterno: è la memoria che impedisce di
-- scrivere due volte alla stessa persona la stessa settimana.
create table if not exists social.interazioni (
  id           bigserial primary key,
  partner_id   bigint references social.partner(id) on delete cascade,
  quando       timestamptz not null default now(),
  canale       text,
  direzione    text check (direzione in ('uscita','entrata')),
  testo        text,
  esito        text
);

-- Nessuna di queste tabelle è pubblica: si leggono solo dal service role.
alter table social.ai_runs      enable row level security;
alter table social.opportunita  enable row level security;
alter table social.contenuti    enable row level security;
alter table social.approvazioni enable row level security;
alter table social.partner      enable row level security;
alter table social.interazioni  enable row level security;
