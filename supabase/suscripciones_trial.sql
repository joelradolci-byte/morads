-- =============================================================================
-- Mora: suscripciones, trial por ventana (14 días desde 1er customer_id Ads)
-- Proyecto NUEVO: ejecutá este script (después de usage_limits.sql).
-- Si ya tenías tabla suscripciones (plan, actualizado_en): usá suscripciones_upgrade
-- o la migración MCP suscripciones_trial_lemon_upgrade.
-- =============================================================================

create table if not exists public.suscripciones (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  plan text not null default 'free',
  estado text not null default 'trial_not_started',
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  trial_audits_used integer not null default 0,
  trial_anuncios_used integer not null default 0,
  trial_pdf_used boolean not null default false,
  trial_pdf_audit_id uuid,
  trial_consumed boolean not null default false,
  lemon_customer_id text,
  lemon_subscription_id text,
  lemon_variant_id text,
  lemon_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists suscripciones_email_unique on public.suscripciones (lower(email));

alter table public.suscripciones enable row level security;

drop policy if exists "suscripciones_select_own" on public.suscripciones;
create policy "suscripciones_select_own"
  on public.suscripciones for select
  using (auth.uid() = user_id);

-- Escritura solo vía service role (API / webhooks)

create or replace function public.touch_suscripciones_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists suscripciones_updated_at on public.suscripciones;
create trigger suscripciones_updated_at
  before update on public.suscripciones
  for each row execute function public.touch_suscripciones_updated_at();

-- Marca email como trial consumido (1 trial por email de por vida)
create or replace function public.mark_trial_email_consumed(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.suscripciones
  set trial_consumed = true, updated_at = now()
  where lower(email) = lower(trim(p_email));
end;
$$;

grant execute on function public.mark_trial_email_consumed(text) to service_role;
