import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import ShopMapView from '@/components/ShopMapView'
import { DAYS, parseHours } from '@/lib/hours'

type Review = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  profiles: { full_name: string } | null
}

export default async function ShopDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Load the shop. Show 404 if missing or hidden.
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('id', id)
    .eq('is_hidden', false)
    .single()
  if (!shop) notFound()

  const openingHours = parseHours(shop.opening_hours)
  const today = (new Date().getDay() + 6) % 7

  // Load related data.
  const { data: staffData } = await supabase
    .from('staff')
    .select('id,full_name,photo_url,bio')
    .eq('shop_id', id)
    .eq('is_active', true)
  const staff = staffData ?? []

  const { data: serviceData } = await supabase
    .from('services')
    .select('id,name,duration_min,price_uzs')
    .eq('shop_id', id)
  const services = serviceData ?? []

  const { data: reviewData } = await supabase
    .from('reviews')
    .select('id,rating,comment,created_at,profiles(full_name)')
    .eq('shop_id', id)
    .order('created_at', { ascending: false })
  const reviews = (reviewData ?? []) as unknown as Review[]

  // Average rating across all reviews.
  let avg: string | null = null
  if (reviews.length > 0) {
    let total = 0
    for (const r of reviews) total = total + r.rating
    avg = (total / reviews.length).toFixed(1)
  }

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <Link
            href="/shops"
            className="inline-flex items-center text-sm font-medium rounded-full border border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:text-stone-900 px-4 py-1.5 transition"
          >
            ← Back to shops
          </Link>
        </div>

        <div className="max-w-5xl mx-auto px-4 pt-6 pb-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center text-2xl text-stone-500 font-semibold">
              {shop.photo_url ? (
                <img src={shop.photo_url} alt={shop.name} className="w-full h-full object-cover" />
              ) : (
                <span>{shop.name.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
                {shop.name}
              </h1>
              <p className="text-stone-500 mt-1">{shop.address}</p>
              {avg && (
                <p className="mt-2 text-sm text-stone-700">
                  <span className="text-orange-600">★</span> {avg}
                  <span className="text-stone-500"> · {reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
                </p>
              )}
            </div>

            <Link
              href={`/book/${shop.id}`}
              className="shrink-0 inline-block text-sm font-medium rounded-full px-6 py-2.5 bg-stone-900 text-white hover:bg-stone-800 transition"
            >
              Book now
            </Link>
          </div>

          {shop.description && (
            <p className="mt-6 text-stone-600 max-w-2xl leading-relaxed">{shop.description}</p>
          )}
        </div>
      </section>

      {shop.lat != null && shop.lng != null && (
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-xl font-semibold text-stone-900 mb-6">Location</h2>
          {(shop.district || shop.region) && (
            <p className="text-stone-500 mb-4">
              {[shop.district, shop.region, shop.country].filter(Boolean).join(', ')}
            </p>
          )}
          <ShopMapView lat={shop.lat} lng={shop.lng} name={shop.name} />
        </section>
      )}

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-xl font-semibold text-stone-900 mb-6">Opening hours</h2>
        <ul className="rounded-xl border border-stone-200 bg-white overflow-hidden max-w-sm">
          {openingHours.map((d, i) => (
            <li
              key={DAYS[i]}
              className={`px-5 py-2.5 flex items-center justify-between text-sm border-b border-stone-100 last:border-b-0 ${
                i === today ? 'bg-stone-50 font-medium' : ''
              }`}
            >
              <span className="text-stone-700">{DAYS[i]}</span>
              <span className={d.closed ? 'text-stone-400' : 'text-stone-900'}>
                {d.closed ? 'Closed' : `${d.open} – ${d.close}`}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-xl font-semibold text-stone-900 mb-6">Staff</h2>
        {staff.length === 0 && <p className="text-stone-500">No staff yet.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map(s => (
            <div key={s.id} className="rounded-xl border border-stone-200 p-4 bg-white flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center text-stone-500 font-medium">
                {s.photo_url ? (
                  <img src={s.photo_url} alt={s.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span>{s.full_name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-stone-900">{s.full_name}</p>
                {s.bio && <p className="text-sm text-stone-500 mt-1 leading-relaxed">{s.bio}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-xl font-semibold text-stone-900 mb-6">Services</h2>
        {services.length === 0 && <p className="text-stone-500">No services yet.</p>}
        {services.length > 0 && (
          <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white overflow-hidden">
            {services.map(sv => (
              <li key={sv.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-stone-900">{sv.name}</p>
                  <p className="text-sm text-stone-500">{sv.duration_min} min</p>
                </div>
                <span className="font-medium text-stone-900 shrink-0">
                  {sv.price_uzs.toLocaleString()} UZS
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-12 pb-20">
        <h2 className="text-xl font-semibold text-stone-900 mb-6">Reviews</h2>
        {reviews.length === 0 && <p className="text-stone-500">No reviews yet.</p>}
        <ul className="space-y-4">
          {reviews.map(r => (
            <li key={r.id} className="rounded-xl border border-stone-200 p-5 bg-white">
              <div className="flex items-center gap-2 flex-wrap">
                <span aria-label={`${r.rating} out of 5`}>
                  <span className="text-orange-600">{'★'.repeat(r.rating)}</span>
                  <span className="text-stone-300">{'★'.repeat(5 - r.rating)}</span>
                </span>
                <span className="text-sm font-medium text-stone-900">
                  {r.profiles?.full_name ?? 'Customer'}
                </span>
                <span className="text-sm text-stone-500">
                  · {format(new Date(r.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              {r.comment && (
                <p className="mt-2 text-stone-700 leading-relaxed">{r.comment}</p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
