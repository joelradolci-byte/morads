-- =============================================================================
-- Mora: límites de uso (cuota mensual + rate limit)
-- Ejecutá este script completo en Supabase → SQL Editor → Run
-- =============================================================================

-- Contadores mensuales por usuario
create table if not exists public.user_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  period text not null,
  audits_count integer not null default 0,
  anuncios_count integer not null default 0,
  pdf_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, period)
);

-- Eventos para rate limit (ventanas cortas)
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null check (action in ('audit', 'anuncios', 'pdf')),
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_action_created_idx
  on public.usage_events (user_id, action, created_at desc);

alter table public.user_usage enable row level security;
alter table public.usage_events enable row level security;

-- El usuario solo puede leer su uso (escritura solo vía service role en API)
drop policy if exists "user_usage_select_own" on public.user_usage;
create policy "user_usage_select_own"
  on public.user_usage for select
  using (auth.uid() = user_id);

drop policy if exists "usage_events_select_own" on public.usage_events;
create policy "usage_events_select_own"
  on public.usage_events for select
  using (auth.uid() = user_id);

-- Incremento atómico mensual (llamado desde API con service role)
create or replace function public.increment_user_usage(
  p_user_id uuid,
  p_action text,
  p_period text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_action not in ('audit', 'anuncios', 'pdf') then
    raise exception 'invalid action';
  end if;

  insert into public.user_usage (user_id, period, audits_count, anuncios_count, pdf_count)
  values (
    p_user_id,
    p_period,
    case when p_action = 'audit' then 1 else 0 end,
    case when p_action = 'anuncios' then 1 else 0 end,
    case when p_action = 'pdf' then 1 else 0 end
  )
  on conflict (user_id, period) do update set
    audits_count = public.user_usage.audits_count + case when p_action = 'audit' then 1 else 0 end,
    anuncios_count = public.user_usage.anuncios_count + case when p_action = 'anuncios' then 1 else 0 end,
    pdf_count = public.user_usage.pdf_count + case when p_action = 'pdf' then 1 else 0 end,
    updated_at = now();
end;
$$;

grant execute on function public.increment_user_usage(uuid, text, text) to service_role;
