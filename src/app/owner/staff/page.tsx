'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { StaffIcon } from '@/components/icons'

type StaffRow = { id: string; full_name: string; photo_url: string | null; is_active: boolean }

export default function StaffList() {
  const supabase = createClient()
  const [shopId, setShopId] = useState<string | null>(null)
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [serviceMap, setServiceMap] = useState<Record<string, string[]>>({})
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

  async function load(sid: string) {
    const { data } = await supabase
      .from('staff')
      .select('id,full_name,photo_url,is_active')
      .eq('shop_id', sid)
      .order('full_name')
    setStaff(data ?? [])

    // Services each barber performs.
    const staffIds = (data ?? []).map(s => s.id)
    const map: Record<string, string[]> = {}
    if (staffIds.length > 0) {
      const { data: ss } = await supabase
        .from('service_staff')
        .select('staff_id,services(name)')
        .in('staff_id', staffIds)
      for (const row of (ss ?? []) as unknown as { staff_id: string; services: { name: string } | null }[]) {
        if (!row.services) continue
        if (!map[row.staff_id]) map[row.staff_id] = []
        map[row.staff_id].push(row.services.name)
      }
    }
    setServiceMap(map)
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()
      if (!shop) { setLoading(false); return }
      setShopId(shop.id)
      await load(shop.id)
      setLoading(false)
    }
    init()
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!shopId || !name) return
    const { error } = await supabase.from('staff').insert({ shop_id: shopId, full_name: name })
    if (error) { toast.error(error.message); return }
    setName('')
    load(shopId)
  }

  async function toggle(id: string, current: boolean) {
    const { error } = await supabase.from('staff').update({ is_active: !current }).eq('id', id)
    if (error) { toast.error(error.message); return }
    if (shopId) load(shopId)
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
            <StaffIcon />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900">
              Staff
            </h1>
            <p className="text-stone-500 mt-1">Add barbers and manage who is taking bookings.</p>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-10 pb-20">
        <form onSubmit={add} className="flex gap-2 mb-8 max-w-md">
          <input
            className="flex-1 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
            placeholder="Full name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <button className="rounded-full bg-stone-900 text-white px-5 text-sm font-medium hover:bg-stone-800 transition">
            Add
          </button>
        </form>

        {loading && (
          <ul className="space-y-2 animate-pulse">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </ul>
        )}

        {!loading && staff.length === 0 && (
          <p className="text-stone-500">No staff yet — add one above.</p>
        )}

        {!loading && staff.length > 0 && (
          <ul className="space-y-2">
            {staff.map(s => (
              <li
                key={s.id}
                className="rounded-xl border border-stone-200 p-4 bg-white flex items-center justify-between gap-4"
              >
                <Link href={`/owner/staff/${s.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center text-stone-500 text-sm font-medium">
                    {s.photo_url ? (
                      <img src={s.photo_url} alt={s.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{s.full_name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-900 truncate">{s.full_name}</span>
                      {!s.is_active && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-stone-100 text-stone-600">
                          inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-500 truncate mt-0.5">
                      {serviceMap[s.id]?.length
                        ? serviceMap[s.id].join(' · ')
                        : 'No services assigned'}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => toggle(s.id, s.is_active)}
                  className="text-sm text-stone-600 hover:text-stone-900 transition shrink-0"
                >
                  {s.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function SkeletonRow() {
  return (
    <li className="rounded-xl border border-stone-200 p-4 bg-white flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-stone-100 shrink-0" />
      <div className="h-4 bg-stone-100 rounded w-40" />
    </li>
  )
}
