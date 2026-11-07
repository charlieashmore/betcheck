comment on table public.profiles is 'DEPRECATED: replaced by bc_profiles';
comment on table public.limits is 'DEPRECATED: replaced by bc_limits';
comment on table public.checks is 'DEPRECATED: replaced by bc_checks';
comment on table public.fixtures is 'DEPRECATED: no longer used by the app';
comment on table public.market_mappings is 'DEPRECATED: no longer used by the app';
comment on table public.price_snapshots is 'DEPRECATED: no longer used by the app';
comment on table public.placed_trades is 'DEPRECATED: no longer used by the app';
comment on table public.exclusions is 'DEPRECATED: no longer used by the app';

create table public.bc_profiles (
  id uuid primary key,
  first_name text,
  language text not null default 'English',
  plain_language boolean not null default true,
  current_balance numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
create table public.bc_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.bc_profiles(id) on delete cascade,
  posted_at timestamptz not null,
  amount numeric(12,2) not null,
  description text not null,
  mcc text,
  created_at timestamptz not null default now()
);
create index bc_transactions_user_time on public.bc_transactions(user_id, posted_at);
create table public.bc_classifications (
  transaction_id uuid primary key references public.bc_transactions(id) on delete cascade,
  user_id uuid not null references public.bc_profiles(id) on delete cascade,
  label text not null check (label in ('gambling','ask_user','not_gambling')),
  category text not null,
  confidence numeric(4,3) not null,
  reasons jsonb not null default '[]',
  source text not null check (source in ('rules','llm','user')),
  updated_at timestamptz not null default now()
);
create table public.bc_merchant_feedback (
  user_id uuid not null references public.bc_profiles(id) on delete cascade,
  merchant_key text not null,
  is_gambling boolean not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, merchant_key)
);
create table public.bc_limits (
  user_id uuid primary key references public.bc_profiles(id) on delete cascade,
  weekly_gambling_limit numeric(10,2),
  per_bet_max numeric(10,2),
  self_exclusion_until timestamptz,
  pending_increase jsonb,
  pending_effective_at timestamptz,
  updated_at timestamptz not null default now()
);
create table public.bc_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.bc_profiles(id) on delete cascade,
  platform text,
  market_title text,
  inputs jsonb not null,
  result jsonb not null,
  rules_version text not null,
  created_at timestamptz not null default now()
);
create or replace function public.bc_prevent_audit_changes() returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'checks is append-only';
end $$;
create trigger bc_checks_append_only before update or delete on public.bc_checks
  for each row execute function public.bc_prevent_audit_changes();
create table public.bc_coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.bc_profiles(id) on delete cascade,
  facts jsonb not null,
  message jsonb not null,
  created_at timestamptz not null default now()
);

grant all on public.bc_profiles, public.bc_transactions, public.bc_classifications, public.bc_merchant_feedback, public.bc_limits, public.bc_checks, public.bc_coach_messages to service_role;
grant select on public.bc_profiles, public.bc_transactions, public.bc_classifications, public.bc_merchant_feedback, public.bc_limits, public.bc_checks, public.bc_coach_messages to authenticated;

alter table public.bc_profiles enable row level security;
alter table public.bc_transactions enable row level security;
alter table public.bc_classifications enable row level security;
alter table public.bc_merchant_feedback enable row level security;
alter table public.bc_limits enable row level security;
alter table public.bc_checks enable row level security;
alter table public.bc_coach_messages enable row level security;

create policy "own profile" on public.bc_profiles for select to authenticated using (id = auth.uid());
create policy "own transactions" on public.bc_transactions for select to authenticated using (user_id = auth.uid());
create policy "own classifications" on public.bc_classifications for select to authenticated using (user_id = auth.uid());
create policy "own feedback" on public.bc_merchant_feedback for select to authenticated using (user_id = auth.uid());
create policy "own limits" on public.bc_limits for select to authenticated using (user_id = auth.uid());
create policy "own checks" on public.bc_checks for select to authenticated using (user_id = auth.uid());
create policy "own coach messages" on public.bc_coach_messages for select to authenticated using (user_id = auth.uid());