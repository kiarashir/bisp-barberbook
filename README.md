# BarberBook
1232
BarberBook is a web app for booking barbershop appointments in Tashkent.
Customers can browse local barbershops, see them on a map, read reviews,
save their favourites, pick a barber and a time slot, and book online.
Shop owners get their own dashboard to manage their shop, services, staff,
opening hours, and bookings.

This project was built as a final year project for the BSc Business
Information Systems course at Westminster International University in
Tashkent.

## Features

- Browse and search barbershops, and see them on a map
- Find shops near you, sorted by distance
- View a shop's services, staff, opening hours, and reviews
- Book an appointment with a chosen barber and time slot
- Save favourite shops
- AI hairstyle try-on — upload a photo and see how a haircut would look
- Shop owner dashboard to manage the shop, staff, services, hours, and bookings
- Monthly stats — page visits and bookings shown on each shop page, the owner
  dashboard, and the owner stats page
- Admin can hide or un-hide any shop from the public listing

## Technologies used

- **Next.js 15** (React 19) — the web framework
- **TypeScript** — for typed code
- **Tailwind CSS** — for styling
- **Supabase** — database, authentication, and storage
- **React Query** (TanStack Query) — caching data on the client
- **Leaflet** — interactive maps for shop locations
- **OpenAI** — the AI hairstyle try-on
- **react-easy-crop** — cropping uploaded photos

## How to run

You need [Node.js](https://nodejs.org) installed.

1. Install the dependencies:

   ```
   npm install
   ```

2. Create a file called `.env.local` in the project folder with your
   Supabase keys:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   PG_CONNECTION_STRING=your-database-connection-string
   OPENAI_API_KEY=your-openai-api-key
   ```

   `PG_CONNECTION_STRING` is only needed for database migrations (see the
   "Database setup" section below). `OPENAI_API_KEY` is only needed for the
   AI hairstyle try-on.

3. Start the development server:

   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database setup

The `supabase/` folder has the SQL that builds the database. Run the files
in this order with the migration script:

```
node scripts/run-sql.mjs supabase/schema.sql
node scripts/run-sql.mjs supabase/policies.sql
node scripts/run-sql.mjs supabase/storage.sql
node scripts/run-sql.mjs supabase/seed.sql
```

`schema.sql` creates the tables, `policies.sql` adds the security rules,
`storage.sql` sets up photo uploads, and `seed.sql` adds example data
(optional). This needs a database connection string in `.env.local`.

### Getting the connection string

1. Open your project in the [Supabase dashboard](https://supabase.com/dashboard).
2. Click the **Connect** button at the top of the page.
3. Choose the **Session pooler** option (it works on normal IPv4 internet).
4. Copy the string — it looks like:

   ```
   postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-1-region.pooler.supabase.com:5432/postgres
   ```

5. Replace `[YOUR-PASSWORD]` with your database password. If you don't know
   it, reset it under **Project Settings → Database → Database password**.
6. Add it to `.env.local`:

   ```
   PG_CONNECTION_STRING=postgresql://postgres.xxxx:your-password@aws-1-region.pooler.supabase.com:5432/postgres
   ```

## Making an admin

Admins can hide or un-hide shops. To turn an account into an admin, sign it
up normally first, then run:

```
node scripts/make-admin.mjs the-email@example.com
```

Log out and back in for the change to take effect — an "Admin" link will
appear in the top menu.
