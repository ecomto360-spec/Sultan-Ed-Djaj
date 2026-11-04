-- Sultan Ed-Djaj — shared product catalog + product image storage
-- Run once in Supabase Dashboard → SQL Editor → New query.
-- Safe to re-run: it does not delete an already-published catalog.

begin;

create table if not exists public.catalog_state (
  singleton boolean primary key default true,
  products jsonb not null default '[]'::jsonb,
  categories jsonb not null default '[]'::jsonb,
  version integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_state_singleton_only check (singleton = true),
  constraint catalog_state_products_array check (jsonb_typeof(products) = 'array'),
  constraint catalog_state_categories_array check (jsonb_typeof(categories) = 'array'),
  constraint catalog_state_version_non_negative check (version >= 0)
);

insert into public.catalog_state (singleton, products, categories, version)
values (true, '[]'::jsonb, '[]'::jsonb, 0)
on conflict (singleton) do nothing;

alter table public.catalog_state enable row level security;

-- Browsers never query this table directly. The Vercel API reads it with the
-- server-only Supabase secret key and exposes only the product catalog.
revoke all on table public.catalog_state from anon, authenticated;
grant select, insert, update on table public.catalog_state to service_role;

-- Reuse the updated_at helper created by the orders migration when present.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

grant execute on function public.set_updated_at() to service_role;

drop trigger if exists catalog_state_set_updated_at on public.catalog_state;
create trigger catalog_state_set_updated_at
before update on public.catalog_state
for each row
execute function public.set_updated_at();

-- Public bucket used only for product photos. Reads use public object URLs;
-- writes are performed by the Vercel API with the server-only secret key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

commit;

-- Ask PostgREST to expose the new table immediately.
notify pgrst, 'reload schema';
