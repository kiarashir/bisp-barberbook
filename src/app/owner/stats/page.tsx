import Link from 'next/link'
import { requireOwnerShop } from '@/lib/owner'
import { ChartIcon } from '@/components/icons'

type Booking = {
  status: string
  start_time: string
  price_uzs: number
  services: { name: string } | null
  staff: { full_name: string } | null
}

type Ranking = { name: string; count: number }

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default async function OwnerStats() {
  const { shop, supabase } = await requireOwnerShop()

  // Load all bookings for this shop.
  const { data: bookingData } = await supabase
    .from('bookings')
    .select('status,start_time,price_uzs,services(name),staff(full_name)')
    .eq('shop_id', shop.id)
  const bookings = (bookingData as unknown as Booking[]) ?? []

  // Load all reviews for this shop.
  const { data: reviewData } = await supabase
    .from('reviews')
    .select('rating')
    .eq('shop_id', shop.id)
  const reviews = reviewData ?? []

  // Helper: is this a confirmed/completed booking (not cancelled)?
  function isActive(b: Booking) {
    return b.status === 'confirmed' || b.status === 'completed'
  }

  // This month: bookings + revenue.
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  let monthBookings = 0
  let monthRevenue = 0
  for (const b of bookings) {
    if (!isActive(b)) continue
    if (new Date(b.start_time) < monthStart) continue
    monthBookings = monthBookings + 1
    monthRevenue = monthRevenue + b.price_uzs
  }

  // Page visits this month.
  const { data: statsRows } = await supabase.rpc('shop_stats', { s_id: shop.id })
  const monthVisits = Number(statsRows?.[0]?.visits ?? 0)

  // Average rating.
  let avgRating = '—'
  if (reviews.length > 0) {
    let total = 0
    for (const r of reviews) total = total + r.rating
    avgRating = (total / reviews.length).toFixed(1)
  }

  // Cancellation rate.
  let cancellationRate = '0%'
  if (bookings.length > 0) {
    let cancelled = 0
    for (const b of bookings) {
      if (b.status === 'cancelled') cancelled = cancelled + 1
    }
    cancellationRate = Math.round((cancelled / bookings.length) * 100) + '%'
  }

  // Top services.
  const serviceCounts: Ranking[] = []
  for (const b of bookings) {
    if (!isActive(b)) continue
    addToRanking(serviceCounts, b.services?.name ?? 'Unknown')
  }
  serviceCounts.sort((a, b) => b.count - a.count)
  const topServices = serviceCounts.slice(0, 5)

  // Top barbers.
  const staffCounts: Ranking[] = []
  for (const b of bookings) {
    if (!isActive(b)) continue
    addToRanking(staffCounts, b.staff?.full_name ?? 'Unknown')
  }
  staffCounts.sort((a, b) => b.count - a.count)
  const topStaff = staffCounts.slice(0, 5)

  // Bookings by weekday (Sun → Sat).
  const dayCounts = [0, 0, 0, 0, 0, 0, 0]
  for (const b of bookings) {
    if (!isActive(b)) continue
    const day = new Date(b.start_time).getDay()
    dayCounts[day] = dayCounts[day] + 1
  }
  let weekdayMax = 0
  for (const c of dayCounts) if (c > weekdayMax) weekdayMax = c

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <Link
            href="/owner"
            className="inline-flex items-center text-sm font-medium rounded-full border border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:text-stone-900 px-4 py-1.5 transition"
          >
            ← Back to dashboard
          </Link>
        </div>
        <div className="max-w-5xl mx-auto px-4 pt-6 pb-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-white border border-stone-200 shrink-0 flex items-center justify-center text-stone-700">
            <ChartIcon />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900">
              Stats
            </h1>
            <p className="text-stone-500 mt-1">An overview of your shop&apos;s performance.</p>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Page visits this month"
            value={monthVisits.toString()}
          />
          <StatCard
            label="Bookings this month"
            value={monthBookings.toString()}
          />
          <StatCard
            label="Revenue this month"
            value={monthRevenue.toLocaleString()}
            suffix="UZS"
          />
          <StatCard
            label="Average rating"
            value={avgRating}
            suffix={avgRating === '—' ? undefined : '★'}
            suffixClass="text-orange-500"
          />
          <StatCard
            label="Cancellation rate"
            value={cancellationRate}
          />
        </div>
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RankingList title="Top services" rows={topServices} />
          <RankingList title="Top barbers" rows={topStaff} />
        </div>
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-10 pb-20">
        <h2 className="text-xl font-semibold text-stone-900 mb-2">Bookings by weekday</h2>
        <p className="text-sm text-stone-500 mb-6">All-time, excluding cancellations.</p>

        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <ul className="space-y-3">
            {WEEKDAYS_SHORT.map((label, i) => (
              <li key={label} className="flex items-center gap-3">
                <span className="w-10 text-sm text-stone-500 shrink-0">{label}</span>
                <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-stone-900"
                    style={{ width: weekdayMax === 0 ? '0%' : `${(dayCounts[i] / weekdayMax) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-sm text-stone-700 text-right shrink-0">{dayCounts[i]}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

function addToRanking(list: Ranking[], name: string) {
  for (const row of list) {
    if (row.name === name) {
      row.count = row.count + 1
      return
    }
  }
  list.push({ name, count: 1 })
}

function StatCard({
  label,
  value,
  suffix,
  suffixClass,
}: {
  label: string
  value: string
  suffix?: string
  suffixClass?: string
}) {
  return (
    <div className="rounded-xl border border-stone-200 p-5 bg-white">
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="text-3xl font-semibold text-stone-900 mt-3 break-words">
        {value}
        {suffix && <span className={`text-base font-medium ml-1 ${suffixClass ?? 'text-stone-500'}`}>{suffix}</span>}
      </p>
    </div>
  )
}

function RankingList({ title, rows }: { title: string; rows: Ranking[] }) {
  // Largest count = full bar; smaller counts scale relative to it.
  let max = 0
  for (const r of rows) if (r.count > max) max = r.count

  return (
    <div>
      <h2 className="text-xl font-semibold text-stone-900 mb-4">{title}</h2>
      {rows.length === 0 && <p className="text-stone-500">No data yet.</p>}
      {rows.length > 0 && (
        <ul className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-200">
          {rows.map((r, i) => (
            <li key={i} className="px-5 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-stone-900 font-medium truncate">{r.name}</span>
                <span className="text-sm text-stone-500 shrink-0 ml-3">{r.count}</span>
              </div>
              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-stone-900"
                  style={{ width: max === 0 ? '0%' : `${(r.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
