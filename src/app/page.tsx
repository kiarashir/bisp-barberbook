import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ShopCard from '@/components/ShopCard'
import { ScissorsIcon } from '@/components/icons'

const display = 'font-[family-name:var(--font-display)]'

const AREAS = ['Chilanzar', 'Yunusabad', 'Mirzo Ulugbek', 'Yakkasaray']

const SERVICES = [
  { name: 'Classic haircut', desc: 'A clean, timeless cut tailored to you.', price: 'from 40,000 so’m' },
  { name: 'Skin fade', desc: 'Sharp, gradual fade with crisp edges.', price: 'from 55,000 so’m' },
  { name: 'Beard trim & shape', desc: 'Shaped, lined up and conditioned.', price: 'from 30,000 so’m' },
  { name: 'Hot towel shave', desc: 'A close, traditional straight-razor shave.', price: 'from 50,000 so’m' },
  { name: 'Kids haircut', desc: 'Patient, friendly cuts for younger clients.', price: 'from 35,000 so’m' },
  { name: 'Hair & beard combo', desc: 'The full reset — cut, beard and finish.', price: 'from 75,000 so’m' },
]

const REVIEWS = [
  { name: 'Jamshid A.', area: 'Old City Cuts', rating: 5, text: 'I book my barber on the way to work and the chair is ready when I arrive. No more calling around.' },
  { name: 'Otabek R.', area: 'Fade Theory', rating: 5, text: 'The reviews are honest, so I knew exactly what to expect. Found a barber I now go to every month.' },
  { name: 'Sardor K.', area: 'The Grooming Co.', rating: 4, text: 'Booking took under a minute and the confirmation came through instantly. Really simple to use.' },
]

export default async function HomePage() {
  const supabase = await createClient()

  // Send shop owners and admins to their own dashboards.
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (profile?.role === 'shop_owner') redirect('/owner')
    if (profile?.role === 'admin') redirect('/admin/shops')
  }

  // Fetch a few real shops to feature on the landing page.
  const { data: shopRows } = await supabase
    .from('shops')
    .select('id,name,address,description,photo_url')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(6)
  const shops = shopRows ?? []

  const shopIds = shops.map(s => s.id)
  let reviews: { shop_id: string; rating: number }[] = []
  if (shopIds.length > 0) {
    const { data } = await supabase
      .from('reviews')
      .select('shop_id,rating')
      .in('shop_id', shopIds)
    reviews = data ?? []
  }

  const featured = shops.map(s => {
    const rs = reviews.filter(r => r.shop_id === s.id)
    const avg = rs.length > 0 ? rs.reduce((t, r) => t + r.rating, 0) / rs.length : null
    return { ...s, avg_rating: avg }
  })

  return (
    <div className="bg-[#f4f1ea] text-stone-900">
      {/* 1 — Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-orange-200/50 blur-3xl" />
        <div className="absolute -bottom-48 -left-32 h-[26rem] w-[26rem] rounded-full bg-amber-100/60 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
          <div>
            <p className="fade-up text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
              Barbershop booking · Tashkent
            </p>

            <h1 className={`${display} fade-up mt-5 text-[2.8rem] sm:text-6xl leading-[1.02] tracking-tight`} style={{ animationDelay: '80ms' }}>
              Find your next{' '}
              <span className="italic text-orange-700">haircut</span> in
              Tashkent
            </h1>

            <p className="fade-up mt-6 text-lg text-stone-600 max-w-md leading-relaxed" style={{ animationDelay: '160ms' }}>
              Browse the city&rsquo;s best barbershops, compare real reviews,
              and lock in your chair in under a minute. No calls, no waiting.
            </p>

            <div className="fade-up mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: '240ms' }}>
              <Link
                href="/shops"
                className="inline-flex items-center rounded-full bg-stone-900 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                Browse barbershops
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center rounded-full border border-stone-300 px-7 py-3.5 text-sm font-semibold text-stone-900 transition hover:border-stone-900"
              >
                Create an account
              </Link>
            </div>

            <div className="fade-up mt-10 flex items-center gap-4" style={{ animationDelay: '320ms' }}>
              <div className="flex -space-x-2.5">
                {AVATARS.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="h-9 w-9 rounded-full border-2 border-[#f4f1ea] object-cover"
                  />
                ))}
              </div>
              <p className="text-sm text-stone-600">
                <span className="font-semibold text-stone-900">4.8 ★</span>{' '}
                rated · 1,200+ bookings made
              </p>
            </div>
          </div>

          {/* Hero image + floating card */}
          <div className="fade-up relative" style={{ animationDelay: '200ms' }}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-stone-900/10 shadow-2xl shadow-stone-900/15">
              <img
                src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&q=80"
                alt="Barber at work"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="absolute -bottom-6 -left-5 sm:-left-8 w-60 rounded-2xl border border-stone-900/10 bg-white p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
                  Next available
                </span>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                  Today
                </span>
              </div>
              <p className={`${display} mt-2 text-lg`}>Fade &amp; Beard Trim</p>
              <p className="text-sm text-stone-500">14:30 · Old City Cuts</p>
            </div>

            <div className="absolute -top-4 -right-3 rounded-full border border-stone-900/10 bg-white px-4 py-2 text-sm font-semibold shadow-lg">
              ★ 4.9 <span className="font-normal text-stone-500">· 86 reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2 — Search */}
      <section className="relative">
        <div className="max-w-5xl mx-auto px-6 pb-16">
          <div className="rounded-3xl border border-stone-900/10 bg-white p-7 sm:p-9 shadow-xl shadow-stone-900/5">
            <h2 className={`${display} text-2xl sm:text-3xl tracking-tight`}>
              Search barbershops across Tashkent
            </h2>
            <p className="mt-1.5 text-sm text-stone-500">
              Find a shop by name or by the area you&rsquo;re in.
            </p>

            <form action="/shops" method="get" className="mt-5 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  name="q"
                  placeholder="Try “fade”, “Chilanzar”, or a shop name"
                  className="w-full rounded-full border border-stone-200 bg-stone-50 py-3.5 pl-12 pr-4 text-sm focus:border-stone-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-orange-600 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                Search shops
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
                Popular areas
              </span>
              {AREAS.map((area) => (
                <Link
                  key={area}
                  href={`/shops?q=${encodeURIComponent(area)}`}
                  className="rounded-full border border-stone-200 px-3 py-1 text-sm text-stone-600 transition hover:border-stone-900 hover:text-stone-900"
                >
                  {area}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3 — Shops */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-20 lg:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
                Featured
              </p>
              <h2 className={`${display} mt-3 text-3xl sm:text-4xl tracking-tight`}>
                Barbershops people are booking
              </h2>
            </div>
            <Link
              href="/shops"
              className="text-sm font-semibold text-stone-900 underline-offset-4 hover:underline"
            >
              View all shops →
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((s) => (
                <ShopCard key={s.id} shop={s} />
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-16 text-center">
              <p className="text-stone-500">
                New barbershops are joining BarberBook every week.
              </p>
              <Link
                href="/shops"
                className="mt-4 inline-flex items-center rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                Browse shops
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 4 — Services */}
      <section className="max-w-6xl mx-auto px-6 py-20 lg:py-24">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
            Services
          </p>
          <h2 className={`${display} mt-3 text-3xl sm:text-4xl tracking-tight`}>
            Whatever look you&rsquo;re after
          </h2>
          <p className="mt-4 text-stone-600 leading-relaxed">
            From a quick tidy-up to the full treatment — here&rsquo;s what
            barbershops on BarberBook typically offer.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((svc) => (
            <div
              key={svc.name}
              className="group rounded-2xl border border-stone-900/10 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-stone-900/5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                <ScissorsIcon />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-stone-900">
                {svc.name}
              </h3>
              <p className="mt-1.5 text-sm text-stone-500 leading-relaxed">
                {svc.desc}
              </p>
              <p className="mt-4 text-sm font-semibold text-orange-700">
                {svc.price}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-stone-400">
          Prices are indicative — each barbershop sets its own.
        </p>
      </section>

      {/* 5 — How it works */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-20 lg:py-24">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
              How it works
            </p>
            <h2 className={`${display} mt-3 text-3xl sm:text-4xl tracking-tight`}>
              Three steps to a sharper look
            </h2>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 sm:grid-cols-3">
            <Step n="01" title="Find a shop" body="Browse barbershops near you with photos, prices, and honest reviews from real customers." />
            <Step n="02" title="Pick a time" body="Choose your barber and a slot that fits your day. Your booking is confirmed instantly." />
            <Step n="03" title="Get your cut" body="Turn up, get groomed, and leave a review afterwards to help the next person decide." />
          </div>
        </div>
      </section>

      {/* 6 — Reviews */}
      <section className="bg-[#211b16] text-stone-100">
        <div className="max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
              Reviews
            </p>
            <h2 className={`${display} mt-3 text-3xl sm:text-4xl tracking-tight`}>
              Loved by people across the city
            </h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {REVIEWS.map((r) => (
              <div
                key={r.name}
                className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-7"
              >
                <Stars rating={r.rating} />
                <p className={`${display} mt-4 flex-1 text-lg leading-snug text-stone-100`}>
                  &ldquo;{r.text}&rdquo;
                </p>
                <div className="mt-6 border-t border-white/10 pt-4">
                  <p className="text-sm font-semibold text-white">{r.name}</p>
                  <p className="text-sm text-stone-400">Booked at {r.area}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <Link
              href="/shops"
              className="inline-flex items-center rounded-full bg-orange-600 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              Book your barbershop
            </Link>
          </div>
        </div>
      </section>

      {/* 7 — Footer */}
      <footer className="bg-[#1a1511] text-stone-300">
        <div className="max-w-6xl mx-auto px-6 py-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <span className={`${display} text-xl text-white`}>BarberBook</span>
            <p className="mt-3 max-w-xs text-sm text-stone-400 leading-relaxed">
              The simple way to discover and book barbershops across Tashkent.
            </p>
          </div>
          <FooterCol
            title="For customers"
            links={[
              ['Browse shops', '/shops'],
              ['Create account', '/signup'],
              ['Log in', '/login'],
            ]}
          />
          <FooterCol
            title="For barbershops"
            links={[
              ['List your shop', '/owner/signup'],
              ['Owner login', '/login'],
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              ['About', '/'],
              ['Contact', '/'],
            ]}
          />
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-stone-500">
            <p>© {new Date().getFullYear()} BarberBook. All rights reserved.</p>
            <p>Final year project · WIUT</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const AVATARS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
]

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="bg-white p-8">
      <span className={`${display} text-4xl text-orange-600`}>{n}</span>
      <h3 className="mt-4 text-lg font-semibold text-stone-900">{title}</h3>
      <p className="mt-2 text-sm text-stone-500 leading-relaxed">{body}</p>
    </div>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-orange-400">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rating ? '' : 'text-white/20'}>
          ★
        </span>
      ))}
    </div>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-sm text-stone-300 transition hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
