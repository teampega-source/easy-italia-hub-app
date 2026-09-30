-- ═══════════════════════════════════════════════════════════════
-- migration-011.sql — Contatore visite del footer
--
-- Cosa fa:
--   • `visite_giornaliere`: una riga al giorno con le visite reali.
--     Le visite sono deduplicate per sessione dall'API serverless
--     (cookie tecnico di 30 minuti): nessun dato personale tocca il DB.
--   • `visite_registra(conta)`: RPC chiamata SOLO dall'API serverless
--     con la service key. Incrementa (se `conta`) e restituisce
--     { base, giorni, reali } — il totale mostrato all'utente è:
--         824 (base) + giorni×5 (crescita dal lancio) + reali (somma).
--
-- Sicurezza:
--   • RLS attivo, NESSUNA policy: anon/authenticated non vedono nulla.
--   • EXECUTE revocato a public/anon/authenticated, concesso a service_role.
--   • Il client non parla mai con questa tabella: riceve solo il numero
--     già sommato da /api/visite.
--
-- Nota: la base (824) e il ritmo (+5/giorno dal 26/09/2026) sono deliberatamente
-- nella funzione, unici punto di verità condivisi da API e fallback client.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.visite_giornaliere (
  giorno     date primary key,
  reali      integer    not null default 0 check (reali >= 0),
  updated_at timestamptz not null default now()
);

alter table public.visite_giornaliere enable row level security;

-- Nessuna policy creata di proposito: deny-all per i ruoli client.
-- service_role bypassa RLS e ha il grant sulla funzione qui sotto.

create or replace function public.visite_registra(conta boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  g      date := (now() at time zone 'asia/colombo')::date;  -- fuso della community
  tot    integer;
begin
  if conta then
    insert into visite_giornaliere (giorno, reali)
    values (g, 1)
    on conflict (giorno) do update
      set reali      = visite_giornaliere.reali + 1,
          updated_at = now();
  end if;

  select coalesce(sum(reali), 0) into tot from visite_giornaliere;

  return jsonb_build_object(
    'base',   824,
    'giorni', greatest(0, g - date '2026-09-26'),
    'reali',  tot
  );
end;
$$;

revoke all on function public.visite_registra(boolean) from public, anon, authenticated;
grant execute on function public.visite_registra(boolean) to service_role;
