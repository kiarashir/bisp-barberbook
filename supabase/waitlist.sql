-- Waitlist: customers join when their desired time isn't free, and we email
-- them if a matching slot opens (e.g. someone cancels).
--
-- Run this once against your Supabase project (SQL editor, or
-- `node scripts/run-sql.mjs supabase/waitlist.sql`). It is safe to re-run.

create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  -- Captured at join time so the notify route can email without touching auth.users.
  customer_email text not null,
  customer_name text,
  shop_id uuid not null references shops(id) on delete cascade,
  staff_id uuid not null references staff(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  -- The day the customer wants (for display / grouping).
  preferred_date date not null,
  -- The exact desired instant. Stored as timestamptz so matching a freed
  -- booking's start_time is a simple, timezone-safe comparison.
  preferred_at timestamptz not null,
  status text not null check (status in ('waiting','notified','cancelled')) default 'waiting',
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  -- A customer can only sit on the waitlist once per barber + desired time.
  unique (customer_id, staff_id, preferred_at)
);

-- The notify route looks up "waiting" rows for a barber, so index that.
create index if not exists waitlist_match_idx on waitlist (staff_id, status);
create index if not exists waitlist_customer_idx on waitlist (customer_id);

alter table waitlist enable row level security;

-- Customers manage only their own waitlist rows. The server's notify route
-- uses the service-role key, which bypasses RLS, so no broad read policy here.
drop policy if exists "waitlist_own_read" on waitlist;
create policy "waitlist_own_read" on waitlist
  for select using (customer_id = auth.uid());

drop policy if exists "waitlist_owner_read" on waitlist;
create policy "waitlist_owner_read" on waitlist
  for select using (is_shop_owner(shop_id));

drop policy if exists "waitlist_own_insert" on waitlist;
create policy "waitlist_own_insert" on waitlist
  for insert with check (customer_id = auth.uid());

drop policy if exists "waitlist_own_delete" on waitlist;
create policy "waitlist_own_delete" on waitlist
  for delete using (customer_id = auth.uid());
