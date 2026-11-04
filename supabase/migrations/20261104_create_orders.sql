-- Sultan Ed-Djaj — commandes partagées temps réel
-- À exécuter une seule fois dans Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

-- Numérotation atomique #SD-0001, #SD-0002, ...
create sequence if not exists public.orders_numero_seq
  as bigint
  start with 1
  increment by 1
  no maxvalue
  cache 1;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique default ('#SD-' || lpad(nextval('public.orders_numero_seq')::text, 4, '0')),
  client_request_id uuid not null unique,

  type text not null check (type in ('livraison', 'comptoir')),
  source text not null default 'App' check (source in ('App', 'Tél', 'Comptoir', 'WhatsApp')),
  statut text not null default 'en_attente'
    check (statut in ('en_attente', 'en_preparation', 'prete', 'livree', 'annulee')),

  client text not null check (char_length(client) between 1 and 120),
  telephone text not null check (char_length(telephone) between 6 and 32),
  customer_id text,
  adresse jsonb not null default '{}'::jsonb check (jsonb_typeof(adresse) = 'object'),
  articles jsonb not null check (jsonb_typeof(articles) = 'array' and jsonb_array_length(articles) > 0),
  note text check (note is null or char_length(note) <= 1000),
  creneau text check (creneau is null or char_length(creneau) <= 120),

  sous_total numeric(12,2) not null default 0 check (sous_total >= 0),
  frais_livraison numeric(12,2) not null default 0 check (frais_livraison >= 0),
  total numeric(12,2) not null check (total >= 0),

  day_id text,
  payment_method text not null default 'cash' check (payment_method in ('cash', 'card', 'other')),
  driver_name text,
  driver_fee numeric(12,2) check (driver_fee is null or driver_fee >= 0),
  cancellation_reason text,
  stock_deducted boolean not null default false,
  is_new_alert boolean not null default true,
  sent_to_whatsapp boolean not null default false,
  sent_at timestamptz,
  status_history jsonb not null default '[]'::jsonb check (jsonb_typeof(status_history) = 'array'),

  -- SHA-256 du jeton privé permettant au client de suivre uniquement sa commande.
  access_token_hash text not null check (char_length(access_token_hash) = 64),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_at_desc_idx
  on public.orders (created_at desc);
create index if not exists orders_updated_at_desc_idx
  on public.orders (updated_at desc);
create index if not exists orders_statut_created_idx
  on public.orders (statut, created_at desc);
create index if not exists orders_telephone_idx
  on public.orders (telephone);

create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_orders_updated_at();

-- Toutes les écritures passent par les fonctions Vercel avec la clé service_role.
-- Aucune policy INSERT/UPDATE/DELETE n'est accordée à anon/authenticated.
alter table public.orders enable row level security;

revoke all on table public.orders from anon, authenticated;
grant select on table public.orders to authenticated;
grant select, insert, update on table public.orders to service_role;
grant usage, select, update on sequence public.orders_numero_seq to service_role;
grant execute on function public.set_orders_updated_at() to service_role;

drop policy if exists orders_staff_realtime_select on public.orders;
create policy orders_staff_realtime_select
on public.orders
for select
to authenticated
using (
  coalesce(auth.jwt() ->> 'app_role', auth.jwt() -> 'app_metadata' ->> 'app_role')
  in ('gerant', 'cuisinier', 'caissier')
);

drop policy if exists orders_customer_realtime_select_own on public.orders;
create policy orders_customer_realtime_select_own
on public.orders
for select
to authenticated
using (id::text = (auth.jwt() ->> 'order_id'));

-- Nécessaire pour recevoir les anciens et nouveaux enregistrements en UPDATE.
alter table public.orders replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'orders'
     ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end;
$$;
