alter table profiles enable row level security;
alter table shops enable row level security;
alter table staff enable row level security;
alter table staff_working_hours enable row level security;
alter table staff_time_off enable row level security;
alter table services enable row level security;
alter table service_staff enable row level security;
alter table bookings enable row level security;
alter table reviews enable row level security;
alter table favorites enable row level security;
alter table shop_visits enable row level security;
/* read only your own profile 👤 */
create policy "profiles_self_read" on profiles
  for select using (id = auth.uid());
create policy "profiles_self_update" on profiles
  for update using (id = auth.uid());

create or replace function is_admin()
returns boolean language sql security definer as $$
  select exists (select 1 from profiles where id = auth.uid() and is_admin = true);
$$;

create or replace function is_shop_owner(s_id uuid)
returns boolean language sql security definer as $$
  select exists (select 1 from shops where id = s_id and owner_id = auth.uid());
$$;
/* anyone can read non-hidden shops 🌍 */
create policy "shops_read_public" on shops
  for select using (is_hidden = false);
create policy "shops_read_own" on shops
  for select using (owner_id = auth.uid() or is_admin());
/* create a shop only as yourself */
create policy "shops_insert_self" on shops
  for insert with check (owner_id = auth.uid());
create policy "shops_update_owner" on shops
  for update using (owner_id = auth.uid() or is_admin());
create policy "shops_delete_owner" on shops
  for delete using (owner_id = auth.uid());

/* anyone can read staff information 🕒 */
create policy "staff_read_public" on staff for select using (true);
create policy "staff_owner_mutate" on staff for all
  using (is_shop_owner(shop_id)) with check (is_shop_owner(shop_id));

/* anyone can read staff working hours 🕒 */
create policy "staff_wh_read" on staff_working_hours for select using (true);
create policy "staff_wh_owner_mutate" on staff_working_hours for all
  using (exists (select 1 from staff s where s.id = staff_id and is_shop_owner(s.shop_id)))
  with check (exists (select 1 from staff s where s.id = staff_id and is_shop_owner(s.shop_id)));

/* anyone can read staff time off requests 🕒 */
create policy "staff_to_read" on staff_time_off for select using (true);
create policy "staff_to_owner_mutate" on staff_time_off for all
  using (exists (select 1 from staff s where s.id = staff_id and is_shop_owner(s.shop_id)))
  with check (exists (select 1 from staff s where s.id = staff_id and is_shop_owner(s.shop_id)));

create policy "services_read_public" on services for select using (true);
create policy "services_owner_mutate" on services for all
  using (is_shop_owner(shop_id)) with check (is_shop_owner(shop_id));

create policy "ss_read" on service_staff for select using (true);
create policy "ss_owner_mutate" on service_staff for all
  using (exists (select 1 from services sv where sv.id = service_id and is_shop_owner(sv.shop_id)))
  with check (exists (select 1 from services sv where sv.id = service_id and is_shop_owner(sv.shop_id)));
/*see only your own bookings 📅*/
create policy "bookings_customer_read" on bookings
  for select using (customer_id = auth.uid());
create policy "bookings_owner_read" on bookings
  for select using (is_shop_owner(shop_id));
  /*book only as yourself*/
create policy "bookings_insert_customer" on bookings
  for insert with check (customer_id = auth.uid());
create policy "bookings_cancel_customer" on bookings
  for update using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

create policy "reviews_read_public" on reviews for select using (true);
create policy "reviews_insert_customer" on reviews
  for insert with check (
    customer_id = auth.uid()
    and exists (
      select 1 from bookings
      where customer_id = auth.uid()
        and shop_id = reviews.shop_id
        and status = 'completed'
    )
  );

create policy "favorites_own_read" on favorites
  for select using (user_id = auth.uid());
create policy "favorites_own_insert" on favorites
  for insert with check (user_id = auth.uid());
create policy "favorites_own_delete" on favorites
  for delete using (user_id = auth.uid());

create policy "shop_visits_insert_any" on shop_visits
  for insert with check (true);
