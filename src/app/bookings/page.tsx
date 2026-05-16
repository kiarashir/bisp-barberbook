'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { format, differenceInHours } from 'date-fns'

type Row = {
  id: string
  start_time: string
  end_time: string
  status: string
  price_uzs: number
  shops: { name: string } | null
  staff: { full_name: string } | null
  services: { name: string } | null
}

export default function MyBookings() {
  const supabase = createClient()
  const [rows, setRows] = useState<Row[]>([])
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')

  // Load this customer's bookings.
  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('bookings')
      .select('id,start_time,end_time,status,price_uzs,shops(name),staff(full_name),services(name)')
      .eq('customer_id', user.id)
      .order('start_time', { ascending: false })
    setRows((data as unknown as Row[]) ?? [])
  }

  useEffect(() => { load() }, [])

  // Split bookings into upcoming vs past.
  const now = new Date()
  const upcoming: Row[] = []
  const past: Row[] = []
  for (const r of rows) {
    const start = new Date(r.start_time)
    if (start > now && r.status === 'confirmed') {
      upcoming.push(r)
    } else {
      past.push(r)
    }
  }

  async function cancel(id: string, startTime: string) {
    // Less than 2 hours away? Don't allow cancellation.
    if (differenceInHours(new Date(startTime), new Date()) < 2) {
      toast.error('Cancellation window closed (less than 2 hours away).')
      return
    }
    if (!window.confirm('Cancel this booking? This cannot be undone.')) return
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Booking cancelled')
    load()
  }

  const list = tab === 'upcoming' ? upcoming : past

  return (
    <div className="bg-white min-h-screen">
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 mb-2">
          My bookings
        </h1>
        <p className="text-stone-500">Manage upcoming appointments and review past visits.</p>
      </section>

      <div className="border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 flex gap-6">
          <TabButton on={tab === 'upcoming'} onClick={() => setTab('upcoming')} label="Upcoming" count={upcoming.length} />
          <TabButton on={tab === 'past'} onClick={() => setTab('past')} label="Past" count={past.length} />
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-4 py-10 pb-20">
        {list.length === 0 && (
          <div className="text-center py-16">
            <p className="text-stone-500 mb-4">
              {tab === 'upcoming'
                ? "You don't have any upcoming bookings."
                : 'No past bookings yet.'}
            </p>
            {tab === 'upcoming' && (
              <Link
                href="/"
                className="inline-block text-sm font-medium rounded-full px-5 py-2 bg-stone-900 text-white hover:bg-stone-800 transition"
              >
                Browse shops
              </Link>
            )}
          </div>
        )}

        {list.length > 0 && (
          <ul className="space-y-3">
            {list.map(r => {
              const start = new Date(r.start_time)
              return (
                <li key={r.id} className="rounded-xl border border-stone-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-5 min-w-0">
                      <div className="w-14 shrink-0 text-center">
                        <p className="text-[10px] uppercase tracking-wide text-stone-500">{format(start, 'MMM')}</p>
                        <p className="text-2xl font-semibold text-stone-900 leading-tight">{format(start, 'd')}</p>
                        <p className="text-xs text-stone-500">{format(start, 'EEE')}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-stone-900 truncate">{r.shops?.name ?? '—'}</p>
                        <p className="text-sm text-stone-500 truncate">
                          {r.services?.name ?? '—'} · {r.staff?.full_name ?? '—'}
                        </p>
                        <p className="text-sm text-stone-700 mt-1">
                          {format(start, 'HH:mm')}
                          <span className="text-stone-500"> · {r.price_uzs.toLocaleString()} UZS</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <StatusChip status={r.status} />
                      {tab === 'upcoming' && r.status === 'confirmed' && (
                        <button
                          onClick={() => cancel(r.id, r.start_time)}
                          className="text-red-600 text-sm hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                      {tab === 'past' && r.status !== 'cancelled' && (
                        <Link
                          href={`/bookings/${r.id}/review`}
                          className="text-stone-700 text-sm hover:underline"
                        >
                          Leave review
                        </Link>
                      )}
                    </div>
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

function TabButton({ on, onClick, label, count }: { on: boolean; onClick: () => void; label: string; count: number }) {
  const base = '-mb-px py-4 text-sm font-medium border-b-2 transition'
  const style = on
    ? 'border-stone-900 text-stone-900'
    : 'border-transparent text-stone-500 hover:text-stone-900'
  return (
    <button onClick={onClick} className={`${base} ${style}`}>
      {label}
      <span className="ml-1.5 text-stone-400">({count})</span>
    </button>
  )
}

function StatusChip({ status }: { status: string }) {
  let style = 'bg-stone-100 text-stone-600'
  if (status === 'confirmed') style = 'bg-emerald-50 text-emerald-700'
  if (status === 'cancelled') style = 'bg-red-50 text-red-600'
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${style}`}>
      {status}
    </span>
  )
}
