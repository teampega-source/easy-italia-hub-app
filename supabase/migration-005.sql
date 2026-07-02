-- migration-005: revoca EXECUTE a PUBLIC sulle funzioni trigger
-- Fix definitivo advisor: la revoca su anon/authenticated era inefficace
-- perché EXECUTE restava concesso a PUBLIC (ereditato da tutti i ruoli).
-- I trigger continuano a funzionare: non richiedono EXECUTE al ruolo chiamante.
-- Applicata il 2026-07-02 come "revoke_public_execute_trigger_functions".

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
