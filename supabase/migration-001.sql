-- ============================================================================
-- Migration 001 — fix schema/code mismatches found during code audit
-- Run ONCE in the Supabase SQL Editor.
-- ============================================================================

-- 1. deadlines: rename due_date → date (matches eih-auth.js and localStorage shape)
alter table public.deadlines rename column due_date to date;

drop index if exists idx_deadlines_due_date;
create index if not exists idx_deadlines_date on public.deadlines(date);


-- 2. permesso_practices:
--    a) add "data" JSONB column so eih-auth.js savePermesso can store the full object
--    b) add UNIQUE(user_id) so upsert onConflict:"user_id" works
alter table public.permesso_practices add column if not exists data jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.permesso_practices'::regclass
      and contype = 'u'
      and conname = 'permesso_practices_user_id_key'
  ) then
    alter table public.permesso_practices add constraint permesso_practices_user_id_key unique (user_id);
  end if;
end $$;


-- 3. subscriptions: add Stripe tracking columns used by stripe-webhook.js
alter table public.subscriptions add column if not exists stripe_subscription_id text;
alter table public.subscriptions add column if not exists stripe_customer_id text;

create index if not exists idx_subscriptions_stripe_sub  on public.subscriptions(stripe_subscription_id);
create index if not exists idx_subscriptions_stripe_cust on public.subscriptions(stripe_customer_id);

-- profiles: allow Tamil language (schema CHECK was missing 'ta')
alter table public.profiles drop constraint if exists profiles_lang_check;
alter table public.profiles add constraint profiles_lang_check
  check (lang in ('it', 'en', 'si', 'ta'));
