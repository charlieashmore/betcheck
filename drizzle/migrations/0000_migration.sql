
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  country text not null,
  dob_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare c text := upper(coalesce(new.raw_user_meta_data->>'country',''));
begin
  if coalesce((new.raw_user_meta_data->>'dob_confirmed')::boolean,false) is not true then
    raise exception 'You must confirm you are 18 or over';
  end if;
  if c = '' then raise exception 'Country is required'; end if;
  if c = any(array['FR','BE','SG','AU','CH','IT','PL','TH','TW','CN']) then
    raise exception 'Stakewise is not available in your country';
  end if;
  insert into public.profiles(id,country,dob_confirmed) values (new.id,c,true);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.limits (
  user_id uuid primary key,
  monthly_income_after_essentials numeric not null,
  monthly_stake_limit numeric not null,
  per_bet_max numeric not null,
  monthly_loss_limit numeric not null,
  pending_increase jsonb,
  effective_at timestamptz,
  updated_at timestamptz not null default now()
);
grant select on public.limits to authenticated;
grant all on public.limits to service_role;
alter table public.limits enable row level security;
create policy "own limits read" on public.limits for select to authenticated using (user_id = auth.uid());

create table public.exclusions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  until timestamptz not null,
  created_at timestamptz not null default now()
);
grant select on public.exclusions to authenticated;
grant all on public.exclusions to service_role;
alter table public.exclusions enable row level security;
create policy "own exclusions read" on public.exclusions for select to authenticated using (user_id = auth.uid());

create table public.fixtures (
  id text primary key,
  sport text not null,
  home text not null,
  away text not null,
  start_time timestamptz not null,
  kalshi_ticker text not null unique,
  settlement_rules jsonb not null default '{}'::jsonb
);
grant select on public.fixtures to authenticated;
grant all on public.fixtures to service_role;
alter table public.fixtures enable row level security;
create policy "fixtures read" on public.fixtures for select to authenticated using (true);

create table public.market_mappings (
  id uuid primary key default gen_random_uuid(),
  fixture_id text not null references public.fixtures(id) on delete cascade,
  kalshi_ticker text not null,
  book_market_id text not null,
  source text not null,
  verified boolean not null default false
);
grant select on public.market_mappings to authenticated;
grant all on public.market_mappings to service_role;
alter table public.market_mappings enable row level security;
create policy "mappings read" on public.market_mappings for select to authenticated using (true);

create table public.price_snapshots (
  id bigint generated always as identity primary key,
  source text not null,
  market_id text not null,
  outcome text not null,
  price_or_odds numeric not null,
  fetched_at timestamptz not null default now()
);
create index price_snapshots_lookup on public.price_snapshots(source, market_id, outcome, fetched_at desc);
grant select on public.price_snapshots to authenticated;
grant all on public.price_snapshots to service_role;
alter table public.price_snapshots enable row level security;
create policy "prices read" on public.price_snapshots for select to authenticated using (true);

create table public.checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  fixture_id text not null references public.fixtures(id),
  side text not null check (side in ('YES','NO')),
  stake numeric not null,
  inputs jsonb not null default '{}'::jsonb,
  affordability_result jsonb not null,
  benchmark_result jsonb not null,
  rules_version text not null,
  created_at timestamptz not null default now()
);
grant select, insert on public.checks to authenticated;
grant all on public.checks to service_role;
alter table public.checks enable row level security;
create policy "own checks read" on public.checks for select to authenticated using (user_id = auth.uid());
create policy "own checks insert" on public.checks for insert to authenticated with check (user_id = auth.uid());
create or replace function public.checks_append_only() returns trigger language plpgsql as $$
begin raise exception 'checks is append-only'; end $$;
create trigger checks_no_update before update or delete on public.checks for each row execute function public.checks_append_only();

create table public.placed_trades (
  check_id uuid primary key references public.checks(id),
  user_id uuid not null,
  placed boolean not null default true,
  outcome text check (outcome in ('won','lost')),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.placed_trades to authenticated;
grant all on public.placed_trades to service_role;
alter table public.placed_trades enable row level security;
create policy "own trades read" on public.placed_trades for select to authenticated using (user_id = auth.uid());
create policy "own trades insert" on public.placed_trades for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.checks c where c.id = check_id and c.user_id = auth.uid()));
create policy "own trades update" on public.placed_trades for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into public.fixtures(id,sport,home,away,start_time,kalshi_ticker,settlement_rules) values
('fx01','Football','Arsenal','Chelsea',now()+interval '2 days','KXEPL-ARSCHE-ARS','{"market":"Home team wins in regulation (90 min + stoppage)"}'),
('fx02','Football','Liverpool','Man City',now()+interval '2 days 3 hours','KXEPL-LIVMCI-LIV','{"market":"Home team wins in regulation"}'),
('fx03','Football','Real Madrid','Barcelona',now()+interval '3 days','KXLALIGA-RMABAR-RMA','{"market":"Home team wins in regulation"}'),
('fx04','Football','Bayern Munich','Dortmund',now()+interval '3 days 2 hours','KXBUN-BAYDOR-BAY','{"market":"Home team wins in regulation"}'),
('fx05','Football','Inter','AC Milan',now()+interval '4 days','KXSERIEA-INTMIL-INT','{"market":"Home team wins in regulation"}'),
('fx06','Football','PSG','Marseille',now()+interval '4 days 4 hours','KXL1-PSGMAR-PSG','{"market":"Home team wins in regulation"}'),
('fx07','Football','Tottenham','Newcastle',now()+interval '5 days','KXEPL-TOTNEW-TOT','{"market":"Home team wins in regulation"}'),
('fx08','Football','Atletico Madrid','Sevilla',now()+interval '5 days 3 hours','KXLALIGA-ATMSEV-ATM','{"market":"Home team wins in regulation"}'),
('fx09','Football','Ajax','PSV',now()+interval '6 days','KXERE-AJAPSV-AJA','{"market":"Home team wins in regulation"}'),
('fx10','Football','Celtic','Rangers',now()+interval '6 days 5 hours','KXSPL-CELRAN-CEL','{"market":"Home team wins in regulation"}');

insert into public.market_mappings(fixture_id,kalshi_ticker,book_market_id,source,verified)
select f.id, f.kalshi_ticker, f.id||'-1x2', s.source, true
from public.fixtures f cross join (values ('pinnacle'),('betfair_exchange'),('smarkets')) s(source)
where f.id <> 'fx09' and not (s.source='smarkets' and f.id in ('fx02','fx04','fx06','fx08'));
