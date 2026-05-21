# BarberBook

BarberBook is a web app for booking barbershop appointments in Tashkent.
Customers can browse local barbershops, read reviews, pick a barber and a
time slot, and book online. Shop owners get their own dashboard to manage
their shop, services, staff, and bookings.

This project was built as a final year project for the BSc Business
Information Systems course at Westminster International University in
Tashkent.

## Technologies used

- **Next.js 15** (React 19) — the web framework
- **TypeScript** — for typed code
- **Tailwind CSS** — for styling
- **Supabase** — database, authentication, and storage

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
