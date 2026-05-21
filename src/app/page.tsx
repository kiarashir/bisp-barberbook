import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ShopCard from '@/components/ShopCard'
import { ScissorsIcon } from '@/components/icons'

const AREAS = ['Chilanzar', 'Yunusabad', 'Mirzo Ulugbek', 'Yakkasaray']

const SERVICES = [
  { name: 'Classic haircut', desc: 'A clean, timeless cut tailored to you.', price: 'from 40,000 soʼm' },
  { name: 'Skin fade', desc: 'Sharp, gradual fade with crisp edges.', price: 'from 55,000 soʼm' },
  { name: 'Beard trim & shape', desc: 'Shaped, lined up and conditioned.', price: 'from 30,000 soʼm' },
  { name: 'Hot towel shave', desc: 'A close, traditional straight-razor shave.', price: 'from 50,000 soʼm' },
  { name: 'Kids haircut', desc: 'Patient, friendly cuts for younger clients.', price: 'from 35,000 soʼm' },
  { name: 'Hair & beard combo', desc: 'The full reset - cut, beard and finish.', price: 'from 75,000 soʼm' },
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

  // Get a few shops to show on the landing page.
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
    <div className="bg-white text-gray-900">
      {/* hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-medium text-orange-600 mb-3">
              Barbershop booking in Tashkent
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              Find your next haircut in Tashkent
            </h1>
            <p className="mt-5 text-lg text-gray-600 max-w-md">
              Browse local barbershops, compare real reviews, and book your
              appointment in seconds. No calls, no waiting.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/shops"
                className="inline-block bg-gray-900 text-white text-sm font-medium rounded-lg px-6 py-3 hover:bg-gray-800"
              >
                Browse barbershops
              </Link>
              <Link
                href="/signup"
                className="inline-block border border-gray-300 text-gray-900 text-sm font-medium rounded-lg px-6 py-3 hover:bg-gray-50"
              >
                Create an account
              </Link>
            </div>
            <div className="mt-9 flex items-center gap-3">
              <div className="flex -space-x-2">
                {AVATARS.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="h-8 w-8 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">4.8 ★</span> from
                1,200+ bookings
              </p>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&q=80"
              alt="Barber giving a haircut"
              className="rounded-xl w-full aspect-[4/5] object-cover shadow-md"
            />
            <div className="absolute -bottom-5 -left-4 w-56 rounded-lg bg-white border border-gray-200 p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Next available</span>
                <span className="text-xs font-medium text-orange-600 bg-orange-50 rounded px-2 py-0.5">
                  Today
                </span>
              </div>
              <p className="font-semibold mt-1">Fade & Beard Trim</p>
              <p className="text-sm text-gray-500">14:30 · Old City Cuts</p>
            </div>
          </div>
        </div>
      </section>

      {/* search */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8">
          <h2 className="text-2xl font-bold">Search barbershops in Tashkent</h2>
          <p className="text-sm text-gray-500 mt-1 mb-5">
            Find a shop by name or by the area you are in.
          </p>
          <form action="/shops" method="get" className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              name="q"
              placeholder="Search by name or address"
              className="flex-1 border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-gray-500"
            />
            <button
              type="submit"
              className="bg-orange-600 text-white text-sm font-medium rounded-md px-6 py-3 hover:bg-orange-700"
            >
              Search
            </button>
          </form>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-sm text-gray-400 mr-1">Popular areas:</span>
            {AREAS.map((area) => (
              <Link
                key={area}
                href={`/shops?q=${encodeURIComponent(area)}`}
                className="text-sm text-gray-600 border border-gray-300 rounded-full px-3 py-1 hover:bg-white"
              >
                {area}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* featured shops */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            Barbershops people are booking
          </h2>
          <Link href="/shops" className="text-sm font-medium text-orange-600 hover:underline">
            View all shops
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((s) => (
              <ShopCard key={s.id} shop={s} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 rounded-xl py-16 text-center">
            <p className="text-gray-500">
              New barbershops are joining BarberBook every week.
            </p>
            <Link
              href="/shops"
              className="inline-block mt-4 bg-gray-900 text-white text-sm font-medium rounded-lg px-6 py-2.5 hover:bg-gray-800"
            >
              Browse shops
            </Link>
          </div>
        )}
      </section>

      {/* services */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Whatever look you are after
          </h2>
          <p className="text-gray-600 mt-3 max-w-lg">
            From a quick tidy-up to the full treatment, here is what
            barbershops on BarberBook usually offer.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {SERVICES.map((svc) => (
              <div key={svc.name} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <ScissorsIcon />
                </div>
                <h3 className="font-semibold text-lg mt-4">{svc.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{svc.desc}</p>
                <p className="text-sm font-semibold text-orange-600 mt-4">{svc.price}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-5">
            Prices are indicative - each barbershop sets its own.
          </p>
        </div>
      </section>

      {/* how it works */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-12">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          <Step n="1" title="Find a shop" body="Browse barbershops near you with photos, prices, and reviews." />
          <Step n="2" title="Pick a time" body="Choose your barber and a slot that fits your day. Instant confirmation." />
          <Step n="3" title="Get your cut" body="Show up, get groomed, and leave a review to help others." />
        </div>
      </section>

      {/* reviews */}
      <section className="bg-gray-900 text-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold tracking-tight mb-10">
            What customers say
          </h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {REVIEWS.map((r) => (
              <div key={r.name} className="bg-gray-800 rounded-xl p-6">
                <div className="text-orange-400 mb-3">
                  {'★'.repeat(r.rating)}
                  <span className="text-gray-600">{'★'.repeat(5 - r.rating)}</span>
                </div>
                <p className="text-gray-200">"{r.text}"</p>
                <div className="mt-5 pt-4 border-t border-gray-700">
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-sm text-gray-400">Booked at {r.area}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/shops"
            className="inline-block mt-10 bg-orange-600 text-white text-sm font-medium rounded-lg px-6 py-3 hover:bg-orange-700"
          >
            Book your barbershop
          </Link>
        </div>
      </section>

      {/* footer */}
      <footer className="bg-gray-900 border-t border-gray-800 text-gray-300">
        <div className="max-w-6xl mx-auto px-6 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-bold text-white text-lg">BarberBook</p>
            <p className="text-sm text-gray-400 mt-3 max-w-xs">
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
        <div className="border-t border-gray-800 py-6">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between gap-2 text-sm text-gray-500">
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
    <div className="text-center">
      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 font-semibold flex items-center justify-center mx-auto">
        {n}
      </div>
      <h3 className="font-semibold mt-4">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{body}</p>
    </div>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-white mb-3">{title}</p>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-sm text-gray-400 hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
