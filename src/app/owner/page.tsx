import Link from 'next/link'
import { requireOwnerShop } from '@/lib/owner'
import { format } from 'date-fns'
import { ShopIcon, StaffIcon, ScissorsIcon, CalendarIcon, ChartIcon } from '@/components/icons'

type TodayRow = {
  id: string
  start_time: string
  price_uzs: number
  services: { name: string } | null
  staff: { full_name: string } | null
  profiles: { full_name: string } | null
}

export default async function OwnerDashboard() {
  const { shop, supabase } = await requireOwnerShop()

  // Today's range
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  // Today's bookings (with customer name).
  const { data: todayData } = await supabase
    .from('bookings')
    .select('id,start_time,price_uzs,services(name),staff(full_name),profiles(full_name)')
    .eq('shop_id', shop.id)
    .eq('status', 'confirmed')
    .gte('start_time', todayStart.toISOString())
    .lte('start_time', todayEnd.toISOString())
    .order('start_time')
  const todayList = (todayData as unknown as TodayRow[]) ?? []

  // Week range (Sunday onwards).
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  // This week's bookings (count).
  const { count: weekCount } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shop.id)
    .gte('start_time', weekStart.toISOString())

  // This week's revenue (sum of active bookings).
  const { data: weekBookings } = await supabase
    .from('bookings')
    .select('price_uzs,status')
    .eq('shop_id', shop.id)
    .gte('start_time', weekStart.toISOString())

  let weekRevenue = 0
  for (const b of weekBookings ?? []) {
    if (b.status === 'confirmed' || b.status === 'completed') {
      weekRevenue = weekRevenue + b.price_uzs
    }
  }

  // Setup checks: a shop can't take bookings without an active barber and a service.
  const { count: staffCount } = await supabase
    .from('staff')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shop.id)
    .eq('is_active', true)
  const { count: serviceCount } = await supabase
    .from('services')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shop.id)
  const noStaff = (staffCount ?? 0) === 0
  const noServices = (serviceCount ?? 0) === 0

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-10 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-white border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center text-2xl text-stone-500 font-semibold">
            {shop.photo_url ? (
              <img src={shop.photo_url} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              <span>{shop.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 truncate">
              {shop.name}
            </h1>
            <p className="text-stone-500 mt-1 truncate">{shop.address}</p>
          </div>
          <Link
            href={`/shops/${shop.id}`}
            className="hidden sm:inline-block text-sm font-medium rounded-full border border-stone-300 bg-white text-stone-700 hover:border-stone-400 px-4 py-2 transition shrink-0"
          >
            View public page
          </Link>
        </div>
      </section>

      {shop.lat == null && (
        <div className="max-w-5xl mx-auto px-4 pt-8">
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-medium text-amber-900">Set your shop location</p>
              <p className="text-sm text-amber-700">
                Pick your spot on the map so customers can find you on the shops map.
              </p>
            </div>
            <Link
              href="/owner/shop"
              className="shrink-0 text-sm font-medium rounded-full bg-amber-600 text-white px-4 py-2 hover:bg-amber-700 transition"
            >
              Set location
            </Link>
          </div>
        </div>
      )}

      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Today" value={todayList.length.toString()} hint="confirmed bookings" />
          <StatCard label="This week" value={(weekCount ?? 0).toString()} hint="bookings" />
          <StatCard label="This week" value={weekRevenue.toLocaleString()} suffix="UZS" hint="revenue" />
        </div>
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-xl font-semibold text-stone-900 mb-6">Manage</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <ManageLink href="/owner/shop" title="Shop" subtitle="Edit details" icon={<ShopIcon />} />
          <ManageLink href="/owner/staff" title="Staff" subtitle="Manage barbers" icon={<StaffIcon />} warn={noStaff} />
          <ManageLink href="/owner/services" title="Services" subtitle="Prices & duration" icon={<ScissorsIcon />} warn={noServices} />
          <ManageLink href="/owner/bookings" title="Bookings" subtitle="View all" icon={<CalendarIcon />} />
          <ManageLink href="/owner/stats" title="Stats" subtitle="Analytics" icon={<ChartIcon />} />
        </div>
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-10 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-stone-900">Today&apos;s appointments</h2>
          <Link
            href="/owner/bookings"
            className="text-sm text-stone-600 hover:text-stone-900 transition"
          >
            See all →
          </Link>
        </div>

        {todayList.length === 0 && <p className="text-stone-500">No appointments today.</p>}
        {todayList.length > 0 && (
          <ul className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-200 overflow-hidden">
            {todayList.map(b => (
              <li key={b.id} className="px-5 py-4 flex items-center gap-5">
                <div className="w-16 shrink-0">
                  <p className="text-lg font-semibold text-stone-900">
                    {format(new Date(b.start_time), 'HH:mm')}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-900 truncate">
                    {b.profiles?.full_name ?? 'Customer'}
                  </p>
                  <p className="text-sm text-stone-500 truncate">
                    {b.services?.name ?? '—'} · with {b.staff?.full_name ?? '—'}
                  </p>
                </div>
                <p className="text-sm font-medium text-stone-700 shrink-0">
                  {b.price_uzs.toLocaleString()} UZS
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  suffix,
  hint,
}: {
  label: string
  value: string
  suffix?: string
  hint: string
}) {
  return (
    <div className="rounded-xl border border-stone-200 p-5 bg-white">
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="text-3xl font-semibold text-stone-900 mt-3 break-words">
        {value}
        {suffix && <span className="text-base font-medium text-stone-500 ml-1">{suffix}</span>}
      </p>
      <p className="text-xs text-stone-500 mt-2">{hint}</p>
    </div>
  )
}

function ManageLink({
  href,
  title,
  subtitle,
  icon,
  warn,
}: {
  href: string
  title: string
  subtitle: string
  icon: React.ReactNode
  warn?: boolean
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl border bg-white p-4 transition group ${
        warn ? 'border-amber-300 hover:border-amber-400' : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition ${
            warn
              ? 'bg-amber-100 text-amber-700'
              : 'bg-stone-100 text-stone-700 group-hover:bg-stone-900 group-hover:text-white'
          }`}
        >
          {icon}
        </div>
        {warn && (
          <span className="text-xs font-medium text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
            ⚠ Setup
          </span>
        )}
      </div>
      <p className="font-medium text-stone-900">{title}</p>
      <p className={`text-sm mt-0.5 ${warn ? 'text-amber-700' : 'text-stone-500'}`}>
        {warn ? 'None added yet' : subtitle}
      </p>
    </Link>
  )
}

