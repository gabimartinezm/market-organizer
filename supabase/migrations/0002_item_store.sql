-- Some items are only sold at one store (e.g. bulk goods at a warehouse club).
-- store_id is optional: null means the item is available everywhere, which is
-- the default for every existing item. Deleting a store clears the restriction
-- on its items rather than deleting them.

alter table public.items
  add column if not exists store_id uuid references public.stores (id) on delete set null;

create index if not exists items_store_id_idx on public.items (store_id);
