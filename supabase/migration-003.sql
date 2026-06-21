-- ============================================================================
-- Migration 003 — permesso_practices: colonna data jsonb + DEFAULT user_id
-- ----------------------------------------------------------------------------
-- Problema: eih-auth.js:savePermesso usava upsert({ data: practice }) ma la
-- colonna 'data' non esisteva nel DDL originale (schema.sql aveva colonne
-- discrete). Aggiungiamo la colonna jsonb che preserva il payload completo
-- (inclusi campi come 'history'/'updatedAt' non mappati su colonne discrete).
--
-- Aggiungiamo anche DEFAULT auth.uid() su user_id così il client non deve
-- mandarlo esplicitamente (anche se eih-auth.js ora lo invia sempre).
-- ============================================================================

alter table public.permesso_practices
  add column if not exists data jsonb;

alter table public.permesso_practices
  alter column user_id set default auth.uid();
