# BarberBook

BarberBook is a web app for booking barbershop appointments in Tashkent.
Customers can browse local barbershops, see them on a map, read reviews,
save their favourites, pick a barber and a time slot, and book online.
Shop owners get their own dashboard to manage their shop, services, staff,
opening hours, and bookings.

This project was built as a final year project for the BSc Business
Information Systems course at Westminster International University in
Tashkent.

## Technologies used

- **Next.js 15** (React 19) — the web framework
- **TypeScript** — for typed code
- **Tailwind CSS** — for styling
- **Supabase** — database, authentication, and storage
- **React Query** (TanStack Query) — caching data on the client
- **Leaflet** — interactive maps for shop locations

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
   ```

3. Start the development server:

   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database migrations

The SQL files in the `supabase/` folder define the database. To apply one,
use the migration script:

```
node scripts/run-sql.mjs supabase/your-file.sql
```

This needs a database connection string in `.env.local`.

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
