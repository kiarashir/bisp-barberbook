-- Run this once in the Supabase SQL Editor to enable shop photo uploads.

-- 1. Create a public bucket for shop photos.
insert into storage.buckets (id, name, public)
values ('shop-photos', 'shop-photos', true)
on conflict (id) do nothing;

-- 2. Anyone can read shop photos (they show on the public shop pages).
create policy "shop_photos_read"
  on storage.objects for select
  using (bucket_id = 'shop-photos');

-- 3. Shop owners can upload photos to their own shop's folder.
--    Files must be stored under <shop_id>/<filename>.
create policy "shop_photos_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'shop-photos'
    and exists (
      select 1 from shops
      where shops.id::text = (storage.foldername(name))[1]
        and shops.owner_id = auth.uid()
    )
  );

-- 4. Shop owners can update photos in their own folder.
create policy "shop_photos_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'shop-photos'
    and exists (
      select 1 from shops
      where shops.id::text = (storage.foldername(name))[1]
        and shops.owner_id = auth.uid()
    )
  );

-- 5. Shop owners can delete photos in their own folder.
create policy "shop_photos_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'shop-photos'
    and exists (
      select 1 from shops
      where shops.id::text = (storage.foldername(name))[1]
        and shops.owner_id = auth.uid()
    )
  );
