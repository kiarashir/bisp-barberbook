-- Example data: 1 demo shop owner + 10 barbershops (each with staff, services, hours).
-- Run once in the Supabase SQL Editor. Safe to re-run: it skips shops that already exist.

-- 1. Demo shop owner account (login: owner@example.com / password123)
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('00000000-0000-0000-0000-000000000000',
   '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'owner@example.com',
   crypt('password123', gen_salt('bf')), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Demo Owner","role":"shop_owner"}',
   now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into auth.identities
  (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   '{"sub":"11111111-1111-1111-1111-111111111111","email":"owner@example.com"}',
   'email', '11111111-1111-1111-1111-111111111111', now(), now(), now())
on conflict do nothing;

insert into public.profiles (id, full_name, role)
values ('11111111-1111-1111-1111-111111111111', 'Demo Owner', 'shop_owner')
on conflict (id) do update set role = 'shop_owner', full_name = 'Demo Owner';

-- 2. Ten barbershops owned by the demo owner
insert into public.shops (owner_id, name, address, description, photo_url, opening_hours)
select '11111111-1111-1111-1111-111111111111',
       v.name, v.address, v.descr, v.photo, v.hours::jsonb
from (values
  ('Old Town Barbers', 'Amir Temur Ave 12, Tashkent', 'Classic cuts and hot-towel shaves in a relaxed setting.', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800', '{"mon-sat":"09:00-19:00","sun":"closed"}'),
  ('The Sharp Edge', 'Mustaqillik St 45, Tashkent', 'Modern fades and beard styling by award-winning barbers.', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800', '{"mon-sat":"10:00-20:00","sun":"closed"}'),
  ('Gentlemen''s Lounge', 'Shota Rustaveli St 8, Tashkent', 'Premium grooming experience with complimentary coffee.', 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800', '{"mon-sat":"09:00-18:00","sun":"closed"}'),
  ('Fade Factory', 'Bobur St 23, Tashkent', 'Specialists in skin fades, line-ups and kids cuts.', 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800', '{"mon-sat":"09:00-19:00","sun":"closed"}'),
  ('Royal Cuts', 'Navoi St 60, Tashkent', 'Traditional barbering with a touch of luxury.', 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800', '{"mon-sat":"08:00-18:00","sun":"closed"}'),
  ('Urban Blades', 'Chilonzor St 14, Tashkent', 'Trend-driven styles for the modern city man.', 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800', '{"mon-sat":"10:00-21:00","sun":"closed"}'),
  ('Classic Clippers', 'Yunusabad St 5, Tashkent', 'No-fuss quality haircuts at a fair price.', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800', '{"mon-sat":"09:00-19:00","sun":"closed"}'),
  ('Barber & Co.', 'Sergeli St 31, Tashkent', 'Friendly neighbourhood barbershop for all ages.', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800', '{"mon-sat":"09:00-18:00","sun":"closed"}'),
  ('The Groom Room', 'Mirzo Ulugbek St 77, Tashkent', 'Full grooming menu: cuts, shaves, beard care.', 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800', '{"mon-sat":"10:00-20:00","sun":"closed"}'),
  ('Precision Parlour', 'Olmazor St 19, Tashkent', 'Detail-focused cuts with sharp, clean finishes.', 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800', '{"mon-sat":"09:00-19:00","sun":"closed"}')
) as v(name, address, descr, photo, hours)
where not exists (
  select 1 from public.shops where owner_id = '11111111-1111-1111-1111-111111111111'
);

-- 3. One barber per shop
insert into public.staff (shop_id, full_name, bio, is_active)
select sh.id, 'Lead Barber', 'Experienced barber with 10+ years cutting hair.', true
from public.shops sh
where sh.owner_id = '11111111-1111-1111-1111-111111111111'
  and not exists (select 1 from public.staff where shop_id = sh.id);

-- 4. Working hours: Monday-Saturday for every barber (weekday 0 = Sunday, closed)
insert into public.staff_working_hours (staff_id, weekday, start_time, end_time)
select st.id, d.weekday, '09:00', '19:00'
from public.staff st
join public.shops sh on sh.id = st.shop_id
cross join (values (1),(2),(3),(4),(5),(6)) as d(weekday)
where sh.owner_id = '11111111-1111-1111-1111-111111111111'
  and not exists (select 1 from public.staff_working_hours where staff_id = st.id);

-- 5. Three services per shop
insert into public.services (shop_id, name, duration_min, price_uzs)
select sh.id, v.name, v.dur, v.price
from public.shops sh
cross join (values
  ('Classic Haircut', 30, 80000),
  ('Haircut & Beard', 45, 120000),
  ('Beard Trim', 15, 50000)
) as v(name, dur, price)
where sh.owner_id = '11111111-1111-1111-1111-111111111111'
  and not exists (select 1 from public.services where shop_id = sh.id);

-- 6. Link every service to its shop's barber so bookings work
insert into public.service_staff (service_id, staff_id)
select sv.id, st.id
from public.services sv
join public.staff st on st.shop_id = sv.shop_id
join public.shops sh on sh.id = sv.shop_id
where sh.owner_id = '11111111-1111-1111-1111-111111111111'
on conflict do nothing;

-- 7. Five demo customers (login: customer1@example.com ... customer5@example.com / password123)
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, email_change, email_change_token_new, recovery_token)
select '00000000-0000-0000-0000-000000000000',
       c.id, 'authenticated', 'authenticated', c.email,
       crypt('password123', gen_salt('bf')), now(), now(),
       '{"provider":"email","providers":["email"]}',
       ('{"full_name":"' || c.name || '","role":"customer"}')::jsonb,
       now(), now(), '', '', '', ''
from (values
  ('22222222-2222-2222-2222-222222222221'::uuid, 'customer1@example.com', 'Aziz Karimov'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'customer2@example.com', 'Dilshod Rakhimov'),
  ('22222222-2222-2222-2222-222222222223'::uuid, 'customer3@example.com', 'Bekzod Tursunov'),
  ('22222222-2222-2222-2222-222222222224'::uuid, 'customer4@example.com', 'Sardor Yusupov'),
  ('22222222-2222-2222-2222-222222222225'::uuid, 'customer5@example.com', 'Jasur Aliev')
) as c(id, email, name)
on conflict (id) do nothing;

insert into auth.identities
  (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), c.id,
       ('{"sub":"' || c.id || '","email":"' || c.email || '"}')::jsonb,
       'email', c.id::text, now(), now(), now()
from (values
  ('22222222-2222-2222-2222-222222222221'::uuid, 'customer1@example.com'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'customer2@example.com'),
  ('22222222-2222-2222-2222-222222222223'::uuid, 'customer3@example.com'),
  ('22222222-2222-2222-2222-222222222224'::uuid, 'customer4@example.com'),
  ('22222222-2222-2222-2222-222222222225'::uuid, 'customer5@example.com')
) as c(id, email)
on conflict do nothing;

insert into public.profiles (id, full_name, role)
values
  ('22222222-2222-2222-2222-222222222221', 'Aziz Karimov', 'customer'),
  ('22222222-2222-2222-2222-222222222222', 'Dilshod Rakhimov', 'customer'),
  ('22222222-2222-2222-2222-222222222223', 'Bekzod Tursunov', 'customer'),
  ('22222222-2222-2222-2222-222222222224', 'Sardor Yusupov', 'customer'),
  ('22222222-2222-2222-2222-222222222225', 'Jasur Aliev', 'customer')
on conflict (id) do update set role = 'customer';

-- 8. Customer reviews (3 per shop, varied ratings so star averages differ)
insert into public.reviews (customer_id, shop_id, rating, comment)
select r.customer_id::uuid, sh.id, r.rating, r.comment
from (values
  ('Old Town Barbers',  '22222222-2222-2222-2222-222222222221', 5, 'Great cut and a relaxed vibe — will return.'),
  ('Old Town Barbers',  '22222222-2222-2222-2222-222222222222', 4, 'Solid haircut and a short wait.'),
  ('Old Town Barbers',  '22222222-2222-2222-2222-222222222223', 5, 'Best hot-towel shave in town.'),
  ('The Sharp Edge',    '22222222-2222-2222-2222-222222222221', 5, 'Fade was absolutely perfect.'),
  ('The Sharp Edge',    '22222222-2222-2222-2222-222222222224', 5, 'These barbers really know their craft.'),
  ('The Sharp Edge',    '22222222-2222-2222-2222-222222222222', 4, 'Good cut, a little pricey.'),
  ('Gentlemen''s Lounge','22222222-2222-2222-2222-222222222223', 5, 'Premium experience, loved the coffee.'),
  ('Gentlemen''s Lounge','22222222-2222-2222-2222-222222222225', 5, 'Top-class grooming, highly recommend.'),
  ('Gentlemen''s Lounge','22222222-2222-2222-2222-222222222221', 5, 'Worth every som.'),
  ('Fade Factory',      '22222222-2222-2222-2222-222222222222', 4, 'Nice skin fade, clean work.'),
  ('Fade Factory',      '22222222-2222-2222-2222-222222222224', 4, 'Good with my kids haircuts.'),
  ('Fade Factory',      '22222222-2222-2222-2222-222222222223', 5, 'Sharp line-up, very happy.'),
  ('Royal Cuts',        '22222222-2222-2222-2222-222222222221', 5, 'Felt like royalty, great service.'),
  ('Royal Cuts',        '22222222-2222-2222-2222-222222222225', 4, 'Traditional and very clean.'),
  ('Royal Cuts',        '22222222-2222-2222-2222-222222222222', 4, 'Reliable barber, consistent results.'),
  ('Urban Blades',      '22222222-2222-2222-2222-222222222223', 4, 'Trendy style, good result.'),
  ('Urban Blades',      '22222222-2222-2222-2222-222222222224', 3, 'Decent cut but it was very busy.'),
  ('Urban Blades',      '22222222-2222-2222-2222-222222222225', 4, 'Modern cut and friendly staff.'),
  ('Classic Clippers',  '22222222-2222-2222-2222-222222222221', 5, 'Quick and good quality.'),
  ('Classic Clippers',  '22222222-2222-2222-2222-222222222222', 4, 'Fair price, good cut.'),
  ('Classic Clippers',  '22222222-2222-2222-2222-222222222224', 5, 'No fuss, great job.'),
  ('Barber & Co.',      '22222222-2222-2222-2222-222222222223', 4, 'Friendly neighbourhood spot.'),
  ('Barber & Co.',      '22222222-2222-2222-2222-222222222225', 5, 'Great with my son''s haircut.'),
  ('Barber & Co.',      '22222222-2222-2222-2222-222222222222', 4, 'Comfortable and clean.'),
  ('The Groom Room',    '22222222-2222-2222-2222-222222222221', 5, 'Full grooming done right.'),
  ('The Groom Room',    '22222222-2222-2222-2222-222222222224', 5, 'Excellent beard care.'),
  ('The Groom Room',    '22222222-2222-2222-2222-222222222223', 4, 'Good service overall.'),
  ('Precision Parlour', '22222222-2222-2222-2222-222222222222', 3, 'Okay cut, nothing special.'),
  ('Precision Parlour', '22222222-2222-2222-2222-222222222225', 4, 'Clean finish, tidy work.'),
  ('Precision Parlour', '22222222-2222-2222-2222-222222222224', 4, 'Detailed and precise.')
) as r(shop_name, customer_id, rating, comment)
join public.shops sh
  on sh.name = r.shop_name
 and sh.owner_id = '11111111-1111-1111-1111-111111111111'
on conflict (customer_id, shop_id) do nothing;
