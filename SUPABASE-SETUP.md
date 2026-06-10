# Easy Italia Hub — Setup Supabase

Guida passo-passo per attivare il database **Supabase** (account reali: autenticazione + dati utente) per Easy Italia Hub.

> **Stato attuale:** questa è una fase **preparatoria**. Lo schema SQL e questa guida esistono gia; tu creerai il progetto Supabase e aggiungerai le chiavi **quando vuoi**. Finche le variabili d'ambiente non sono configurate su Vercel, **l'app continua a funzionare in "modalita demo"** (dati salvati solo nel browser). Vedi il punto **8**.

File coinvolti:
- `supabase/schema.sql` — lo schema completo del database (tabelle, trigger, sicurezza RLS).
- `SUPABASE-SETUP.md` — questa guida.

---

## 1) Crea un progetto su Supabase (piano gratuito)

1. Vai su **https://supabase.com** e accedi (puoi usare GitHub).
2. Clicca **New project**.
3. Compila:
   - **Name:** `easy-italia-hub` (o quello che preferisci)
   - **Database Password:** scegline una **robusta** e **salvala** in un posto sicuro (serve per la connessione diretta al DB; non e la stessa cosa delle chiavi API).
   - **Region:** scegli l'area piu vicina agli utenti (es. **Frankfurt (eu-central-1)** o **Milan**, se disponibile).
   - **Plan:** **Free**.
4. Clicca **Create new project** e attendi 1-2 minuti che il database venga provisionato.

---

## 2) Esegui lo schema SQL

1. Nel progetto Supabase, apri **SQL Editor** (menu a sinistra).
2. Clicca **New query**.
3. Apri il file `supabase/schema.sql` di questo repository, **copia tutto il contenuto** e **incollalo** nell'editor.
4. Clicca **Run** (in alto a destra) — oppure premi `Ctrl/Cmd + Invio`.
5. Dovresti vedere **Success. No rows returned**. Lo script:
   - crea la tabella `profiles` (1:1 con gli utenti) + un trigger che **crea il profilo automaticamente** ad ogni nuova registrazione;
   - crea tutte le tabelle applicative (vedi elenco sotto);
   - **abilita la Row Level Security (RLS) su ogni tabella** e definisce le policy di accesso.

> Lo script e **idempotente**: e sicuro **rieseguirlo** (usa `create table if not exists` e ricrea trigger/policy con `drop ... if exists` + `create`).

**Tabelle create:** `profiles`, `subscriptions`, `deadlines`, `permesso_practices`, `documents`, `ai_chats`, `notifications`, `community_posts`, `marketplace_ads`, `courses`, `jobs`, `certificates`.

---

## 3) Crea il bucket privato `documents` (archivio file)

I metadati dei documenti stanno nella tabella `documents`, ma **i file veri** (PDF/immagini) vanno nello **Storage**.

1. Apri **Storage** (menu a sinistra) -> **New bucket**.
2. **Name:** `documents`
3. **Public bucket:** lascialo **DISATTIVATO** (deve essere **privato**).
4. Clicca **Create bucket**.

**Sicurezza del bucket (owner-only):** in fondo a `supabase/schema.sql` c'e un blocco **commentato** con le policy RLS per lo Storage (accesso ai file consentito **solo al proprietario**). Quando vorrai attivare i caricamenti reali:
- **Opzione A (SQL):** de-commenta quel blocco ed eseguilo nel **SQL Editor**.
- **Opzione B (UI):** crea le stesse policy da **Storage -> Policies**.

> **Convenzione percorso file consigliata:** `<user_id>/<nome-file>`. Cosi la prima cartella coincide con l'ID dell'utente e le policy garantiscono che ognuno veda **solo** i propri file. Salva lo stesso percorso anche in `documents.storage_path`.

---

## 4) Copia le chiavi API (Project URL + anon key)

1. Apri **Settings** (icona ingranaggio in basso) -> **API**.
2. Copia questi due valori:
   - **Project URL** — qualcosa tipo `https://xxxxxxxxxxxx.supabase.co`
   - **Project API keys -> `anon` `public`** — una chiave lunga che inizia con `eyJ...`

> Ti serviranno al passo **5**. **Non** copiare la chiave `service_role` per il frontend (vedi punto **6**).

---

## 5) Aggiungi le variabili d'ambiente su Vercel e ridistribuisci

Il sito e gia collegato a Vercel (ogni push su `main` ridistribuisce). Aggiungi le chiavi cosi:

1. Vai su **https://vercel.com** -> apri il **Project** di Easy Italia Hub.
2. **Settings** -> **Environment Variables**.
3. Aggiungi **due** variabili e seleziona **tutti gli ambienti** (**Production**, **Preview**, **Development**):

   | Name (nome esatto) | Value (valore) |
   |---|---|
   | `SUPABASE_URL` | il **Project URL** del passo 4 |
   | `SUPABASE_ANON_KEY` | la chiave **`anon` `public`** del passo 4 |

4. Clicca **Save**.
5. Vai su **Deployments** -> apri l'ultimo deployment -> menu **...** -> **Redeploy** (le nuove variabili vengono applicate **solo** dopo un nuovo deploy).

> **Nomi esatti da impostare:** `SUPABASE_URL` e `SUPABASE_ANON_KEY`.
> Nota: se in futuro userai il client Supabase **direttamente nel browser** con un bundler che espone solo variabili con prefisso (es. Vite -> `VITE_`, Next.js -> `NEXT_PUBLIC_`), dovrai aggiungere anche le versioni con prefisso (es. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) con gli **stessi valori**. Per l'uso lato server / funzioni `api/` bastano i due nomi della tabella qui sopra.

---

## 6) Perche la `anon key` e pubblica (e la `service_role` NO)

- La chiave **`anon` `public`** e **pubblica per design**: e pensata per stare nel frontend. Da sola **non da accesso ai dati**, perche ogni tabella e protetta dalla **Row Level Security (RLS)**: un utente puo leggere/scrivere **solo le proprie righe** (`user_id = auth.uid()`), tranne i contenuti pensati per la lettura pubblica (corsi, offerte di lavoro, post/annunci con `status = 'published'`).
- La chiave **`service_role`** **NON** va **mai** messa nel frontend ne in variabili esposte al browser (niente prefissi `NEXT_PUBLIC_` / `VITE_` / `PUBLIC_`). Questa chiave **bypassa la RLS** e ha accesso completo al database: usala **solo** lato server (funzioni serverless / backend), come **secret**, mai nel codice client e mai committata nel repository.

---

## 7) Note per dopo (NON ora) — Email e Pagamenti

Da configurare in una fase successiva. Sono solo **promemoria/placeholder**: **non** servono adesso e **non** vanno aggiunti ora.

- **Email transazionali — Resend** (https://resend.com)
  - Variabile d'ambiente (futura): `RESEND_API_KEY` (secret, **solo lato server**).
  - Uso previsto: promemoria scadenze documenti/permesso (tabelle `deadlines`, `notifications`).

- **Pagamenti — Stripe** (https://stripe.com)
  - Variabili d'ambiente (futura): `STRIPE_SECRET_KEY` (secret, **solo lato server**) + un **webhook** Stripe con il suo `STRIPE_WEBHOOK_SECRET`.
  - Uso previsto: gestione abbonamenti freemium (`free` / `premium` / `premium_plus` / `business`) -> il webhook aggiorna la tabella `subscriptions` tramite la chiave `service_role`.

> Questi valori **non** esistono ancora: lasciali per quando attiverai email e pagamenti reali.

---

## 8) Modalita demo automatica (finche le env non ci sono)

Finche `SUPABASE_URL` e `SUPABASE_ANON_KEY` **non** sono presenti nell'ambiente, **l'app resta automaticamente in "modalita demo"**:

- I dati restano **locali nel browser** dell'utente:
  - **Dashboard** -> scadenze in `localStorage` (chiave `eih-deadlines`).
  - **Tracker Permesso** -> pratica in `localStorage` (chiave `eih-permesso`).
  - **Archivio Documenti** -> file e metadati in **IndexedDB** (database `eih-docs`).
- **Nessuna** registrazione/login reale, **nessuna** chiamata di rete verso Supabase.

Quando aggiungerai le due variabili e farai il **Redeploy** (passi 4-5), l'app potra passare ad **account reali** (autenticazione + dati salvati su Supabase) **senza perdere** la modalita demo come fallback. Lo schema e progettato apposta per **rispecchiare** le strutture dati gia usate in locale (vedi mappatura in cima a `supabase/schema.sql`), così la migrazione e diretta.

---

## Riepilogo rapido (checklist)

- [ ] **1.** Progetto Supabase creato (Free) + password DB salvata
- [ ] **2.** `supabase/schema.sql` eseguito nel SQL Editor -> *Success*
- [ ] **3.** Bucket **privato** `documents` creato (policy RLS de-commentate quando servira)
- [ ] **4.** Copiati **Project URL** + **anon public key** (Settings -> API)
- [ ] **5.** Su Vercel: aggiunte `SUPABASE_URL` e `SUPABASE_ANON_KEY` (tutti gli ambienti) + **Redeploy**
- [ ] **6.** Confermato: `anon` pubblica OK (protetta da RLS), `service_role` **mai** nel frontend
- [ ] **7.** (Dopo) Resend `RESEND_API_KEY`, Stripe `STRIPE_SECRET_KEY` + webhook — solo placeholder
- [ ] **8.** Verificato che senza env l'app resta in **modalita demo** (dati locali)

**Variabili d'ambiente da impostare ORA:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
**Da impostare DOPO (placeholder):** `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
