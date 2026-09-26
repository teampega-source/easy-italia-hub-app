-- migration-010: hardening tabella "subscriptions" — sola lettura per il client.
-- Scopo: il piano (plan/status) deve essere gestito ESCLUSIVAMENTE dal webhook
-- Stripe (api/stripe-webhook.js) tramite la service role, che bypassa la RLS.
-- Le precedenti policy owner-only di INSERT/UPDATE/DELETE permettevano invece
-- a un utente autenticato di auto-promuoversi a "premium"/"premium_plus" con
-- la sola anon key (escalation di privilegio, latente finché il frontend non
-- legge la tabella). La SELECT owner-only resta: l'utente può vedere il proprio
-- piano; non può crearlo, modificarlo né cancellarlo.
--
-- Da applicare nel SQL Editor del progetto lmbkskjezffizvivnqyc.
-- Idempotente: sicuro da rieseguire.

drop policy if exists "subscriptions_insert_own" on public.subscriptions;
drop policy if exists "subscriptions_update_own" on public.subscriptions;
drop policy if exists "subscriptions_delete_own" on public.subscriptions;
