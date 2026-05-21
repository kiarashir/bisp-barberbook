-- Lets customers save shops they like.
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, shop_id)
);
create index if not exists favorites_user_id_idx on favorites(user_id);

alter table favorites enable row level security;

create policy "favorites_own_read" on favorites
  for select using (user_id = auth.uid());
create policy "favorites_own_insert" on favorites
  for insert with check (user_id = auth.uid());
create policy "favorites_own_delete" on favorites
  for delete using (user_id = auth.uid());
