import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShopIcon, StaffIcon, CalendarIcon, ScissorsIcon } from '@/components/icons'

const display = 'font-[family-name:var(--font-display)]'

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

      {/* 2 — How it works */}
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

      {/* 3 — Why BarberBook */}
      <section className="max-w-6xl mx-auto px-6 py-20 lg:py-24">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
              Why BarberBook
            </p>
            <h2 className={`${display} mt-3 text-3xl sm:text-4xl tracking-tight`}>
              Built around a better barbershop visit
            </h2>
            <p className="mt-5 text-stone-600 leading-relaxed">
              Everything you need to choose well and book with confidence —
              for customers and shop owners alike.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Feature icon={<ShopIcon />} title="Verified barbershops" body="Every shop on BarberBook is checked before it goes live." />
            <Feature icon={<StaffIcon />} title="Choose your barber" body="See the team, pick the person you trust with your hair." />
            <Feature icon={<CalendarIcon />} title="Instant confirmation" body="No phone tag. Your slot is reserved the moment you book." />
            <Feature icon={<ScissorsIcon />} title="Honest reviews" body="Real ratings from real visits, so there are no surprises." />
          </div>
        </div>
      </section>

      {/* 4 — Testimonial */}
      <section className="bg-[#211b16] text-stone-100">
        <div className="max-w-4xl mx-auto px-6 py-20 lg:py-28 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
            From our customers
          </p>
          <blockquote className={`${display} mt-6 text-2xl sm:text-[2rem] leading-snug`}>
            &ldquo;I used to spend ten minutes calling around to find a free
            slot. Now I book my barber on the way to work and the chair is
            ready when I arrive.&rdquo;
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
              alt=""
              className="h-11 w-11 rounded-full object-cover"
            />
            <div className="text-left">
              <p className="text-sm font-semibold">Jamshid A.</p>
              <p className="text-sm text-stone-400">Regular at Old City Cuts</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5 — Final CTA */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-20 lg:py-24">
          <div className="relative overflow-hidden rounded-3xl bg-orange-600 px-8 py-16 sm:px-16 text-center">
            <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-orange-500/60 blur-2xl" />
            <div className="relative">
              <h2 className={`${display} text-3xl sm:text-5xl tracking-tight text-white`}>
                Ready for a fresh cut?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-orange-50">
                Find a barbershop you like and book your chair in the next
                minute.
              </p>
              <Link
                href="/shops"
                className="mt-8 inline-flex items-center rounded-full bg-stone-900 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                Browse barbershops
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6 — Footer */}
      <footer className="bg-[#211b16] text-stone-300">
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

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-stone-900">{title}</h3>
      <p className="mt-1.5 text-sm text-stone-500 leading-relaxed">{body}</p>
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
