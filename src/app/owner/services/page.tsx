'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { ScissorsIcon } from '@/components/icons'

type Service = { id: string; name: string; duration_min: number; price_uzs: number }
type Staff = { id: string; full_name: string }
type Assignment = { service_id: string; staff_id: string }

export default function ServicesPage() {
  const supabase = createClient()
  const [shopId, setShopId] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])

  const [name, setName] = useState('')
  const [duration, setDuration] = useState(30)
  const [price, setPrice] = useState(80000)
  const [fetching, setFetching] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)

  // Load services, staff, and the service-staff mapping for this shop.
  async function loadAll(sid: string) {
    const { data: sv } = await supabase
      .from('services')
      .select('id,name,duration_min,price_uzs')
      .eq('shop_id', sid)
      .order('name')
    setServices(sv ?? [])

    const { data: st } = await supabase
      .from('staff')
      .select('id,full_name')
      .eq('shop_id', sid)
      .eq('is_active', true)
      .order('full_name')
    setStaff(st ?? [])

    const serviceIds = (sv ?? []).map(s => s.id)
    if (serviceIds.length > 0) {
      const { data: ss } = await supabase
        .from('service_staff')
        .select('service_id,staff_id')
        .in('service_id', serviceIds)
      setAssignments(ss ?? [])
    } else {
      setAssignments([])
    }
  }

  // Find which shop belongs to the logged-in owner, then load everything.
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
      await loadAll(shop.id)
      setFetching(false)
    }
    init()
  }, [])

  // Is this staff member assigned to this service?
  function isAssigned(serviceId: string, staffId: string): boolean {
    for (const a of assignments) {
      if (a.service_id === serviceId && a.staff_id === staffId) return true
    }
    return false
  }

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!shopId || !name || adding) return
    setAdding(true)
    try {
      const { error } = await supabase.from('services').insert({
        shop_id: shopId,
        name,
        duration_min: duration,
        price_uzs: price,
      })
      if (error) { toast.error(error.message); return }
      setName('')
      setDuration(30)
      setPrice(80000)
      setShowAdd(false)
      await loadAll(shopId)
    } finally {
      setAdding(false)
    }
  }

  async function remove(id: string) {
    await supabase.from('services').delete().eq('id', id)
    if (shopId) loadAll(shopId)
  }

  // Toggle a staff member on or off for a service.
  async function toggleStaff(serviceId: string, staffId: string) {
    if (isAssigned(serviceId, staffId)) {
      await supabase
        .from('service_staff')
        .delete()
        .match({ service_id: serviceId, staff_id: staffId })
    } else {
      await supabase
        .from('service_staff')
        .insert({ service_id: serviceId, staff_id: staffId })
    }
    if (shopId) loadAll(shopId)
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
            <ScissorsIcon />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900">
              Services
            </h1>
            <p className="text-stone-500 mt-1">Define your services and assign them to staff.</p>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-10 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-stone-900">Your services</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-full bg-stone-900 text-white px-5 py-2 text-sm font-medium hover:bg-stone-800 transition"
          >
            + Add service
          </button>
        </div>

        {fetching && (
          <ul className="space-y-3 animate-pulse">
            <SkeletonServiceRow />
            <SkeletonServiceRow />
          </ul>
        )}

        {!fetching && services.length === 0 && (
          <p className="text-stone-500">No services yet — click &quot;Add service&quot;.</p>
        )}
        {!fetching && services.length > 0 && (
          <ul className="space-y-3">
            {services.map(sv => (
              <li key={sv.id} className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-medium text-stone-900">{sv.name}</p>
                    <p className="text-sm text-stone-500">
                      {sv.duration_min} min · {sv.price_uzs.toLocaleString()} UZS
                    </p>
                  </div>
                  <button
                    onClick={() => remove(sv.id)}
                    className="text-red-600 text-sm hover:underline shrink-0"
                  >
                    Delete
                  </button>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-stone-500 mb-2">Performed by</p>
                  {staff.length === 0 && (
                    <p className="text-sm text-stone-500">Add staff first.</p>
                  )}
                  {staff.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {staff.map(s => {
                        const on = isAssigned(sv.id, s.id)
                        return (
                          <button
                            key={s.id}
                            onClick={() => toggleStaff(sv.id, s.id)}
                            className={`px-3 py-1.5 rounded-full text-sm border transition ${
                              on
                                ? 'bg-stone-900 text-white border-stone-900'
                                : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            {s.full_name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showAdd && (
        <div
          onClick={() => !adding && setShowAdd(false)}
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-semibold text-stone-900 mb-5">Add a service</h3>
            <form onSubmit={add} className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-stone-500 mb-1.5">
                  Name
                </label>
                <input
                  autoFocus
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
                  placeholder="e.g. Classic Haircut"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium uppercase tracking-wide text-stone-500 mb-1.5">
                    Duration
                  </label>
                  <div className="relative">
                    <select
                      className="appearance-none w-full border border-stone-200 rounded-lg pl-3 pr-9 py-2 text-sm bg-white focus:outline-none focus:border-stone-400"
                      value={duration}
                      onChange={e => setDuration(Number(e.target.value))}
                    >
                      {[15, 30, 45, 60, 90, 120].map(n => (
                        <option key={n} value={n}>{n} min</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
                      ▼
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium uppercase tracking-wide text-stone-500 mb-1.5">
                    Price (UZS)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  disabled={adding}
                  className="rounded-full border border-stone-200 text-stone-700 px-5 py-2 text-sm font-medium hover:border-stone-300 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding || !name}
                  className="rounded-full bg-stone-900 text-white px-5 py-2 text-sm font-medium hover:bg-stone-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adding ? 'Adding…' : 'Add service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function SkeletonServiceRow() {
  return (
    <li className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="space-y-2">
          <div className="h-4 w-40 bg-stone-100 rounded" />
          <div className="h-3 w-28 bg-stone-100 rounded" />
        </div>
      </div>
      <div className="h-3 w-24 bg-stone-100 rounded mb-3" />
      <div className="flex gap-2">
        <div className="h-7 w-20 bg-stone-100 rounded-full" />
        <div className="h-7 w-24 bg-stone-100 rounded-full" />
      </div>
    </li>
  )
}
