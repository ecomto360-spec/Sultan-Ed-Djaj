-- Tâche C : adresses récentes (max 3) par client, pour présélection au panier.
-- Non destructive : la colonne est ajoutée uniquement si elle n'existe pas.
alter table public.customers
  add column if not exists recent_addresses jsonb not null default '[]'::jsonb;
