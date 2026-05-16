-- Per-barber price/duration override. Run this whole file in the Supabase SQL Editor.
-- NULL means "use the service's default price/duration".

alter table service_staff
  add column if not exists duration_min smallint check (duration_min in (15,30,45,60,90,120)),
  add column if not exists price_uzs integer check (price_uzs >= 0);

-- Force the API to refresh its schema cache (fixes "Could not find the column ... in the schema cache").
notify pgrst, 'reload schema';

-- Verify: this should return two rows (duration_min, price_uzs).
select column_name
from information_schema.columns
where table_name = 'service_staff'
  and column_name in ('duration_min', 'price_uzs');
