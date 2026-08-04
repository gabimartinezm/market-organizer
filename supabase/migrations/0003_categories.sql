-- Per-room aisle taxonomy. Every room starts with the same 10 default
-- categories (seeded in application code, same as stores and items), but each
-- household can rename, recolor, or add its own from there. `id` is a stable
-- string used as the join key from items.category and stores.aisle_order, so
-- it lives in application code rather than being a generated key here.

create table if not exists public.categories (
  id            text not null,
  room_code     text not null references public.rooms (code) on delete cascade,
  name          text not null,
  default_aisle text not null,
  icon_name     text not null default 'Package',
  zone          text not null default 'dry' check (zone in ('fresh', 'bake', 'butcher', 'cold', 'dry')),
  created_at    timestamptz not null default now(),
  primary key (room_code, id)
);

create index if not exists categories_room_code_idx on public.categories (room_code);

alter table public.categories enable row level security;

drop policy if exists "open access" on public.categories;
create policy "open access" on public.categories
  for all to anon, authenticated using (true) with check (true);

alter table public.categories replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'categories'
  ) then
    alter publication supabase_realtime add table public.categories;
  end if;
end $$;
