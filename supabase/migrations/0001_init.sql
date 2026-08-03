-- Live Shared Grocery List — initial schema
--
-- Access model: OPEN. The room code is the only secret. RLS policies below grant
-- the `anon` role full read/write on every row, which mirrors the behavior of the
-- original WebSocket server (it also had no authentication). Anyone who knows or
-- guesses a room code can read and modify that list. See README.md → Security.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.rooms (
  code            text primary key,
  active_store_id uuid,
  created_at      timestamptz not null default now()
);

create table if not exists public.stores (
  id                  uuid primary key default gen_random_uuid(),
  room_code           text not null references public.rooms (code) on delete cascade,
  name                text not null,
  description         text not null default '',
  aisle_order         jsonb not null default '[]'::jsonb,
  custom_aisle_labels jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists stores_room_code_idx on public.stores (room_code);

create table if not exists public.items (
  id             uuid primary key default gen_random_uuid(),
  room_code      text not null references public.rooms (code) on delete cascade,
  name           text not null,
  category       text not null default 'Pantry',
  default_qty    numeric not null default 1,
  default_unit   text not null default 'pcs',
  notes          text,
  is_favorite    boolean not null default false,
  in_weekly_list boolean not null default false,
  weekly_qty     numeric not null default 1,
  weekly_unit    text not null default 'pcs',
  is_bought      boolean not null default false,
  bought_at      timestamptz,
  times_bought   integer not null default 0,
  last_bought_at timestamptz,
  added_by       text,
  created_at     timestamptz not null default now()
);

create index if not exists items_room_code_idx on public.items (room_code);

create table if not exists public.activity (
  id         uuid primary key default gen_random_uuid(),
  room_code  text not null references public.rooms (code) on delete cascade,
  user_name  text not null,
  action     text not null,
  item_title text,
  details    text,
  created_at timestamptz not null default now()
);

create index if not exists activity_room_created_idx
  on public.activity (room_code, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.rooms    enable row level security;
alter table public.stores   enable row level security;
alter table public.items    enable row level security;
alter table public.activity enable row level security;

drop policy if exists "open access" on public.rooms;
drop policy if exists "open access" on public.stores;
drop policy if exists "open access" on public.items;
drop policy if exists "open access" on public.activity;

create policy "open access" on public.rooms
  for all to anon, authenticated using (true) with check (true);

create policy "open access" on public.stores
  for all to anon, authenticated using (true) with check (true);

create policy "open access" on public.items
  for all to anon, authenticated using (true) with check (true);

create policy "open access" on public.activity
  for all to anon, authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

-- `replica identity full` makes the old row available on UPDATE/DELETE events,
-- which is required for the client's `room_code=eq.<CODE>` realtime filter to
-- match deletions (by default only the primary key is published).
alter table public.rooms    replica identity full;
alter table public.stores   replica identity full;
alter table public.items    replica identity full;
alter table public.activity replica identity full;

do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  foreach t in array array['rooms', 'stores', 'items', 'activity'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
