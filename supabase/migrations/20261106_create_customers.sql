-- Sultan Ed-Djaj — profils clients par appareil + suivi de commande
-- À exécuter une fois dans Supabase Dashboard → SQL Editor → New query.
-- Non destructive : les commandes existantes sont conservées, device_id nul toléré.

begin;

-- ══════════════════════════════════════════════════════════
-- 1. Table des profils clients (identité anonyme par appareil)
-- ══════════════════════════════════════════════════════════
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  -- Appareil actuellement rattaché au profil. Null = profil détaché
  -- (après qu'un autre appareil a récupéré le profil via le code).
  device_id uuid,
  phone text not null,
  name text not null,
  wilaya text not null default 'Alger',
  commune text not null default 'Birkhadem',
  address text not null default '',
  landmark text,
  map_url text,
  latitude double precision,
  longitude double precision,
  -- Code de récupération optionnel (4 chiffres), jamais renvoyé au client.
  recovery_code_hash text,
  recovery_attempts integer not null default 0,
  recovery_locked_until timestamptz,
  order_count integer not null default 0,
  total_spent numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un seul profil actif par appareil ; plusieurs profils détachés coexistent
-- car Postgres autorise plusieurs NULL dans un index unique.
create unique index if not exists customers_device_id_key
  on public.customers (device_id);

-- Un même numéro peut correspondre à plusieurs profils séparés (choix produit).
create index if not exists customers_phone_idx on public.customers (phone);

alter table public.customers enable row level security;

-- Les navigateurs ne touchent jamais cette table directement : l'API Vercel
-- lit/écrit avec la clé service_role et ne renvoie que le profil du device_id
-- fourni (jamais de liste publique, jamais le hash du code de récupération).
revoke all on table public.customers from anon, authenticated;
grant select, insert, update, delete on table public.customers to service_role;

-- Réutilise le trigger updated_at créé par les migrations précédentes.
grant execute on function public.set_updated_at() to service_role;

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

-- ══════════════════════════════════════════════════════════
-- 2. Commandes : colonne device_id (nullable, rétro-compatible)
-- ══════════════════════════════════════════════════════════
alter table public.orders add column if not exists device_id uuid;
create index if not exists orders_device_id_idx on public.orders (device_id);

-- ══════════════════════════════════════════════════════════
-- 3. Réglages clients (sons, textes d'étape FR/AR) dans catalog_state
-- ══════════════════════════════════════════════════════════
alter table public.catalog_state add column if not exists client_settings jsonb not null default '{}'::jsonb;

commit;

-- Demander à PostgREST d'exposer les changements immédiatement.
notify pgrst, 'reload schema';
