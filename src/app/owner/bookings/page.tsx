'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { CalendarIcon } from '@/components/icons'

type Row = {
  id: string
  start_time: string
  status: string
  services: { name: string } | null
  staff: { id: string; full_name: string } | null
  profiles: { full_name: string; phone: string | null } | null
}

export default function OwnerBookings() {
  const supabase = createClient()
  const [shopId, setShopId] = useState<string | null>(null)
  const [staffOptions, setStaffOptions] = useState<{ id: string; full_name: string }[]>([])
  const [staffFilter, setStaffFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState<string>('')
  const [rows, setRows] = useState<Row[]>([])
  const [fetching, setFetching] = useState(true)

  // Find this owner's shop and load the staff list.
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setFetching(false); return }

      const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()
      if (!shop) { setFetching(false); return }
      setShopId(shop.id)

      const { data: st } = await supabase
        .from('staff')
        .select('id,full_name')
        .eq('shop_id', shop.id)
        .order('full_name')
      setStaffOptions(st ?? [])

      await loadBookings(shop.id, '', dateFrom, dateTo)
      setFetching(false)
    }
    init()
  }, [])

  // Load bookings with optional staff and date filters.
  async function loadBookings(sid: string, sf: string, df: string, dt: string) {
    let query = supabase
      .from('bookings')
      .select('id,start_time,status,services(name),staff(id,full_name),profiles(full_name,phone)')
      .eq('shop_id', sid)
      .order('start_time')

    if (sf) query = query.eq('staff_id', sf)
    if (df) query = query.gte('start_time', new Date(df + 'T00:00:00').toISOString())
    if (dt) query = query.lte('start_time', new Date(dt + 'T23:59:59').toISOString())

    const { data } = await query
    setRows((data as unknown as Row[]) ?? [])
  }

  async function refilter() {
    if (!shopId) return
    setFetching(true)
    await loadBookings(shopId, staffFilter, dateFrom, dateTo)
    setFetching(false)
  }

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
            <CalendarIcon />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900">
              All bookings
            </h1>
            <p className="text-stone-500 mt-1">Filter by staff or date to find specific appointments.</p>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-10 pb-20">
        <div className="flex flex-wrap gap-3 mb-8">
          <select
            value={staffFilter}
            onChange={e => setStaffFilter(e.target.value)}
            className="border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400 bg-white"
          >
            <option value="">All staff</option>
            {staffOptions.map(s => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
          />
          <button
            onClick={refilter}
            className="rounded-full bg-stone-900 text-white px-5 text-sm font-medium hover:bg-stone-800 transition"
          >
            Apply
          </button>
        </div>

        {fetching && (
          <ul className="space-y-2 animate-pulse">
            <SkeletonBookingRow />
            <SkeletonBookingRow />
            <SkeletonBookingRow />
          </ul>
        )}

        {!fetching && rows.length === 0 && (
          <p className="text-stone-500">No bookings match these filters.</p>
        )}

        {!fetching && rows.length > 0 && (
          <ul className="space-y-2">
            {rows.map(r => {
              const start = new Date(r.start_time)
              const phone = r.profiles?.phone ? ` · ${r.profiles.phone}` : ''
              return (
                <li key={r.id} className="rounded-xl border border-stone-200 bg-white p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-5 min-w-0">
                      <div className="w-14 shrink-0 text-center">
                        <p className="text-[10px] uppercase tracking-wide text-stone-500">{format(start, 'MMM')}</p>
                        <p className="text-xl font-semibold text-stone-900 leading-tight">{format(start, 'd')}</p>
                        <p className="text-xs text-stone-500">{format(start, 'EEE')}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-stone-900">
                          {format(start, 'HH:mm')} · {r.services?.name ?? '—'}
                        </p>
                        <p className="text-sm text-stone-500 truncate">
                          {r.profiles?.full_name ?? '—'}{phone} · with {r.staff?.full_name ?? '—'}
                        </p>
                      </div>
                    </div>
                    <StatusChip status={r.status} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function SkeletonBookingRow() {
  return (
    <li className="rounded-xl border border-stone-200 bg-white p-4 flex items-center gap-5">
      <div className="w-14 shrink-0 space-y-1">
        <div className="h-3 w-8 bg-stone-100 rounded mx-auto" />
        <div className="h-5 w-6 bg-stone-100 rounded mx-auto" />
        <div className="h-3 w-8 bg-stone-100 rounded mx-auto" />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-48 bg-stone-100 rounded" />
        <div className="h-3 w-64 bg-stone-100 rounded" />
      </div>
    </li>
  )
}

function StatusChip({ status }: { status: string }) {
  let style = 'bg-stone-100 text-stone-600'
  if (status === 'confirmed') style = 'bg-emerald-50 text-emerald-700'
  if (status === 'cancelled') style = 'bg-red-50 text-red-600'
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full self-start sm:self-auto ${style}`}>
      {status}
    </span>
  )
}
