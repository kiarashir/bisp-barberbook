-- Adds map location to shops: coordinates plus reverse-geocoded place names.
alter table shops add column if not exists lat double precision;
alter table shops add column if not exists lng double precision;
alter table shops add column if not exists country text;
alter table shops add column if not exists region text;
alter table shops add column if not exists district text;
