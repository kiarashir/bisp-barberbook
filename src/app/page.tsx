import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-orange-50 to-white" />
        <div className="absolute -top-24 -right-24 -z-10 h-72 w-72 rounded-full bg-orange-100 blur-3xl opacity-70" />

        <div className="max-w-5xl mx-auto px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              Now booking across Tashkent
            </span>

            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold leading-[1.1] tracking-tight text-stone-900">
              Find your next haircut in Tashkent
            </h1>

            <p className="mt-4 text-base sm:text-lg text-stone-500 max-w-md">
              Browse local barbershops, compare real reviews, and book your
              appointment in seconds — no calls, no waiting.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/shops"
                className="inline-flex items-center bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-full px-6 py-3 transition"
              >
                Browse shops
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center border border-stone-300 hover:border-stone-400 text-stone-900 text-sm font-medium rounded-full px-6 py-3 transition"
              >
                Create account
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-3">
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
              <p className="text-sm text-stone-500">
                <span className="font-medium text-stone-900">4.8 ★</span> from
                1,200+ bookings
              </p>
            </div>
          </div>

          {/* Hero image with floating booking card */}
          <div className="relative">
            <div className="aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5] overflow-hidden rounded-2xl border border-stone-200 shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=80"
                alt="Barber giving a haircut"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="absolute -bottom-5 -left-4 sm:left-6 w-56 rounded-xl border border-stone-200 bg-white p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-500">
                  Next slot
                </span>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                  Today
                </span>
              </div>
              <p className="mt-1 font-semibold text-stone-900">Fade & Beard</p>
              <p className="text-sm text-stone-500">14:30 · Old City Cuts</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
            Book in three steps
          </h2>
          <p className="mt-2 text-stone-500">
            From scrolling to sitting in the chair, the whole thing takes a
            minute.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Step n="1" title="Find a shop" body="Browse barbershops near you with photos, prices, and reviews." />
          <Step n="2" title="Pick a time" body="Choose your barber and a slot that fits your day. Instant confirmation." />
          <Step n="3" title="Get your cut" body="Show up, get groomed, and leave a review to help others." />
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-stone-200 bg-stone-50">
        <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-3 gap-6 text-center">
          <Stat value="40+" label="Barbershops" />
          <Stat value="1,200+" label="Bookings made" />
          <Stat value="4.8 ★" label="Average rating" />
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="rounded-2xl bg-stone-900 px-6 py-14 sm:px-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Ready for a fresh cut?
          </h2>
          <p className="mt-3 text-stone-300 max-w-md mx-auto">
            Find a barbershop you like and lock in a time right now.
          </p>
          <Link
            href="/shops"
            className="mt-7 inline-flex items-center bg-white hover:bg-stone-100 text-stone-900 text-sm font-medium rounded-full px-6 py-3 transition"
          >
            Browse shops
          </Link>
        </div>
      </section>
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
    <div className="rounded-xl border border-stone-200 p-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
        {n}
      </div>
      <h3 className="mt-4 font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm text-stone-500 leading-relaxed">{body}</p>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl sm:text-3xl font-semibold text-stone-900">{value}</div>
      <div className="mt-1 text-sm text-stone-500">{label}</div>
    </div>
  )
}
