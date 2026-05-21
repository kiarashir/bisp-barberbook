create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null check (role in ('customer','shop_owner','admin')),
  created_at timestamptz not null default now()
);

create table shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  address text not null,
  description text,
  photo_url text,
  opening_hours jsonb,
  lat double precision,
  lng double precision,
  country text,
  region text,
  district text,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index shops_owner_id_idx on shops(owner_id);

create table staff (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  full_name text not null,
  photo_url text,
  bio text,
  is_active boolean not null default true
);
create index staff_shop_id_idx on staff(shop_id);

create table staff_working_hours (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  unique (staff_id, weekday)
);

create table staff_time_off (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  off_date date not null,
  reason text,
  unique (staff_id, off_date)
);

create table services (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  name text not null,
  duration_min smallint not null check (duration_min in (15,30,45,60,90,120)),
  price_uzs integer not null check (price_uzs >= 0)
);
create index services_shop_id_idx on services(shop_id);

create table service_staff (
  service_id uuid not null references services(id) on delete cascade,
  staff_id uuid not null references staff(id) on delete cascade,
  duration_min smallint check (duration_min in (15,30,45,60,90,120)),
  price_uzs integer check (price_uzs >= 0),
  primary key (service_id, staff_id)
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  staff_id uuid not null references staff(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  price_uzs integer not null,
  status text not null check (status in ('confirmed','cancelled','completed')) default 'confirmed',
  created_at timestamptz not null default now(),
  unique (staff_id, start_time)
);
create index bookings_customer_id_idx on bookings(customer_id);
create index bookings_staff_start_idx on bookings(staff_id, start_time);
create index bookings_shop_id_idx on bookings(shop_id);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (customer_id, shop_id)
);
create index reviews_shop_id_idx on reviews(shop_id);

create table favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, shop_id)
);
create index favorites_user_id_idx on favorites(user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name','User'),
    coalesce(new.raw_user_meta_data->>'role','customer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
