-- X Watch v0.1.1: only server-side service role may access these tables.
create table if not exists public.accounts(
 id text primary key,
 username text not null unique,
 name text not null,
 created_at timestamptz not null default now(),
 last_checked_at timestamptz
);
create table if not exists public.posts(
 id text primary key,
 account_id text not null references public.accounts(id) on delete cascade,
 text text,
 posted_at timestamptz,
 status text not null default 'visible' check(status in ('visible','suspected','unavailable')),
 missing_checks integer not null default 0,
 last_checked_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.events(
 id bigint generated always as identity primary key,
 account_id text not null references public.accounts(id) on delete cascade,
 post_id text not null references public.posts(id) on delete cascade,
 type text not null check(type in ('new','unavailable','restored')),
 created_at timestamptz not null default now()
);
create index if not exists posts_account_checked on public.posts(account_id,last_checked_at);
create index if not exists events_created_idx on public.events(created_at desc);
create table if not exists public.add_slots(ip_hash text primary key, last_added_at timestamptz not null default now());
alter table public.accounts enable row level security;
alter table public.posts enable row level security;
alter table public.events enable row level security;
alter table public.add_slots enable row level security;
create or replace function public.claim_add_slot(p_ip_hash text) returns boolean language plpgsql security definer set search_path = public as $$
declare affected_rows integer;
begin
 insert into public.add_slots(ip_hash,last_added_at) values(p_ip_hash,now())
 on conflict(ip_hash) do update set last_added_at=excluded.last_added_at
 where public.add_slots.last_added_at < now()-interval '1 hour';
 get diagnostics affected_rows = row_count;
 return affected_rows > 0;
end; $$;
revoke all on function public.claim_add_slot(text) from public,anon,authenticated;
grant execute on function public.claim_add_slot(text) to service_role;
