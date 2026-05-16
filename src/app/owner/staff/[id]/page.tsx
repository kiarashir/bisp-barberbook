'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type DayHours = { start: string; end: string; on: boolean }
type OffDay = { id: string; off_date: string; reason: string | null }
type Service = { id: string; name: string; duration_min: number; price_uzs: number }

// Build the default hours table (all days off, 10:00–19:00).
function defaultHours(): DayHours[] {
  const result: DayHours[] = []
  for (let i = 0; i < 7; i++) {
    result.push({ start: '10:00', end: '19:00', on: false })
  }
  return result
}

export default function StaffEdit() {
  const supabase = createClient()
  const { id } = useParams<{ id: string }>()

  // Which action is currently saving (null = idle). Used to disable buttons.
  const [saving, setSaving] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [hours, setHours] = useState<DayHours[]>(defaultHours())
  const [offDate, setOffDate] = useState('')
  const [offDays, setOffDays] = useState<OffDay[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [assignedIds, setAssignedIds] = useState<string[]>([])
  // Per-service override inputs as strings; '' means "use the shop default".
  const [overrides, setOverrides] = useState<Record<string, { duration: string; price: string }>>({})

  async function load() {
    // Basic profile
    const { data: s } = await supabase
      .from('staff')
      .select('full_name,bio,shop_id')
      .eq('id', id)
      .single()
    if (s) {
      setName(s.full_name)
      setBio(s.bio ?? '')

      // Services offered by this shop, and which ones this barber performs.
      const { data: sv } = await supabase
        .from('services')
        .select('id,name,duration_min,price_uzs')
        .eq('shop_id', s.shop_id)
        .order('name')
      setServices(sv ?? [])

      const { data: ss } = await supabase
        .from('service_staff')
        .select('service_id,duration_min,price_uzs')
        .eq('staff_id', id)
      const rows = (ss ?? []) as { service_id: string; duration_min: number | null; price_uzs: number | null }[]
      setAssignedIds(rows.map(r => r.service_id))
      const ov: Record<string, { duration: string; price: string }> = {}
      for (const r of rows) {
        ov[r.service_id] = {
          duration: r.duration_min != null ? String(r.duration_min) : '',
          price: r.price_uzs != null ? String(r.price_uzs) : '',
        }
      }
      setOverrides(ov)
    }

    // Working hours: start with defaults, then turn on the saved days.
    const { data: wh } = await supabase
      .from('staff_working_hours')
      .select('weekday,start_time,end_time')
      .eq('staff_id', id)

    const nextHours = defaultHours()
    for (const row of wh ?? []) {
      nextHours[row.weekday] = {
        start: String(row.start_time).slice(0, 5),
        end: String(row.end_time).slice(0, 5),
        on: true,
      }
    }
    setHours(nextHours)

    // Time off
    const { data: to } = await supabase
      .from('staff_time_off')
      .select('id,off_date,reason')
      .eq('staff_id', id)
      .order('off_date')
    setOffDays(to ?? [])
  }

  useEffect(() => { load() }, [id])

  // Update one day's hours without mutating state directly.
  function updateDay(weekday: number, change: Partial<DayHours>) {
    const next: DayHours[] = []
    for (let i = 0; i < hours.length; i++) {
      if (i === weekday) {
        next.push({ ...hours[i], ...change })
      } else {
        next.push(hours[i])
      }
    }
    setHours(next)
  }

  async function saveBasics() {
    if (saving) return
    setSaving('profile')
    try {
      const { error } = await supabase
        .from('staff')
        .update({ full_name: name, bio: bio || null })
        .eq('id', id)
      if (error) { toast.error(error.message); return }
      toast.success('Saved')
    } finally {
      setSaving(null)
    }
  }

  // Replace the staff's whole hours table with the rows that are switched on.
  async function saveHours() {
    if (saving) return
    setSaving('hours')
    try {
      await supabase.from('staff_working_hours').delete().eq('staff_id', id)

      const newRows: { staff_id: string; weekday: number; start_time: string; end_time: string }[] = []
      for (let weekday = 0; weekday < hours.length; weekday++) {
        const h = hours[weekday]
        if (h.on) {
          newRows.push({
            staff_id: id,
            weekday,
            start_time: h.start,
            end_time: h.end,
          })
        }
      }

      if (newRows.length > 0) {
        const { error } = await supabase.from('staff_working_hours').insert(newRows)
        if (error) { toast.error(error.message); return }
      }
      toast.success('Hours saved')
    } finally {
      setSaving(null)
    }
  }

  async function addOff(e: React.FormEvent) {
    e.preventDefault()
    if (!offDate || saving) return
    setSaving('off')
    try {
      const { error } = await supabase
        .from('staff_time_off')
        .insert({ staff_id: id, off_date: offDate, reason: null })
      if (error) { toast.error(error.message); return }
      setOffDate('')
      await load()
    } finally {
      setSaving(null)
    }
  }

  async function removeOff(rowId: string) {
    if (saving) return
    setSaving('off')
    try {
      await supabase.from('staff_time_off').delete().eq('id', rowId)
      await load()
    } finally {
      setSaving(null)
    }
  }

  // Tick/untick locally only; saved when the button is pressed.
  function toggleService(serviceId: string) {
    if (assignedIds.includes(serviceId)) {
      setAssignedIds(assignedIds.filter(x => x !== serviceId))
    } else {
      setAssignedIds([...assignedIds, serviceId])
    }
  }

  function setOverride(serviceId: string, field: 'duration' | 'price', value: string) {
    const current = overrides[serviceId] ?? { duration: '', price: '' }
    setOverrides({ ...overrides, [serviceId]: { ...current, [field]: value } })
  }

  // Replace this barber's whole service list with the ticked ones (with optional overrides).
  async function saveServices() {
    if (saving) return
    setSaving('services')
    try {
      await supabase.from('service_staff').delete().eq('staff_id', id)

      if (assignedIds.length > 0) {
        const rows = assignedIds.map(serviceId => {
          const o = overrides[serviceId] ?? { duration: '', price: '' }
          return {
            service_id: serviceId,
            staff_id: id,
            duration_min: o.duration ? Number(o.duration) : null,
            price_uzs: o.price ? Number(o.price) : null,
          }
        })
        const { error } = await supabase.from('service_staff').insert(rows)
        if (error) { toast.error(error.message); return }
      }
      toast.success('Services saved')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <Link
            href="/owner/staff"
            className="inline-flex items-center text-sm font-medium rounded-full border border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:text-stone-900 px-4 py-1.5 transition"
          >
            ← Back to staff
          </Link>
        </div>
        <div className="max-w-5xl mx-auto px-4 pt-6 pb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900">
            {name || 'Staff details'}
          </h1>
          <p className="text-stone-500 mt-1">Edit profile, set working hours, and manage time off.</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-xl font-semibold text-stone-900 mb-6">Profile</h2>
        <div className="space-y-5 max-w-md">
          <div>
            <label className="block text-sm text-stone-700 mb-1.5">Full name</label>
            <input
              className="w-full border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-stone-700 mb-1.5">Bio</label>
            <textarea
              className="w-full border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
            />
          </div>
          <button
            onClick={saveBasics}
            disabled={!!saving}
            className="rounded-full bg-stone-900 text-white px-6 py-2.5 text-sm font-medium hover:bg-stone-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving === 'profile' ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-xl font-semibold text-stone-900 mb-6">Working hours</h2>
        <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-200 max-w-xl">
          {WEEKDAYS.map((label, i) => {
            const h = hours[i]
            return (
              <div key={i} className="px-5 py-3 flex items-center gap-3 flex-wrap">
                <label className="w-28 inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-stone-300"
                    checked={h.on}
                    onChange={e => updateDay(i, { on: e.target.checked })}
                  />
                  <span className="text-stone-900 text-sm font-medium">{label}</span>
                </label>
                <input
                  type="time"
                  value={h.start}
                  onChange={e => updateDay(i, { start: e.target.value })}
                  className="border border-stone-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-stone-400 disabled:opacity-40"
                  disabled={!h.on}
                />
                <span className="text-stone-400">—</span>
                <input
                  type="time"
                  value={h.end}
                  onChange={e => updateDay(i, { end: e.target.value })}
                  className="border border-stone-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-stone-400 disabled:opacity-40"
                  disabled={!h.on}
                />
              </div>
            )
          })}
        </div>
        <button
          onClick={saveHours}
          disabled={!!saving}
          className="mt-5 rounded-full bg-stone-900 text-white px-6 py-2.5 text-sm font-medium hover:bg-stone-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving === 'hours' ? 'Saving…' : 'Save hours'}
        </button>
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-xl font-semibold text-stone-900 mb-2">Services</h2>
        <p className="text-stone-500 mb-6 text-sm">
          Tick the services this barber performs. Leave price/duration blank to use the shop default.
        </p>
        {services.length === 0 && (
          <p className="text-sm text-stone-500">No services yet. Add them on the Services page.</p>
        )}
        {services.length > 0 && (
          <>
            <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-200 max-w-xl">
              {services.map(sv => {
                const checked = assignedIds.includes(sv.id)
                const o = overrides[sv.id] ?? { duration: '', price: '' }
                // Price options: 50% of default up to 200%, in 5,000 steps.
                const minP = Math.ceil((sv.price_uzs * 0.5) / 5000) * 5000
                const maxP = Math.floor((sv.price_uzs * 2) / 5000) * 5000
                const priceOptions: number[] = []
                for (let p = minP; p <= maxP; p += 5000) priceOptions.push(p)
                // Effective values: barber's override if set, else the shop default.
                const effDur = o.duration ? Number(o.duration) : sv.duration_min
                const effPrice = o.price ? Number(o.price) : sv.price_uzs
                const hasOverride = !!(o.duration || o.price)
                return (
                  <div key={sv.id} className="px-5 py-4">
                    <label className="flex items-center gap-4 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-stone-300"
                        checked={checked}
                        onChange={() => toggleService(sv.id)}
                      />
                      <span className="flex-1 text-stone-900 font-medium">{sv.name}</span>
                      <span className="text-sm text-stone-500 text-right">
                        {effDur} min · {effPrice.toLocaleString()} UZS
                      </span>
                    </label>
                    {checked && (
                      <div className="mt-4 ml-8 flex gap-4 max-w-sm">
                        <div className="flex-1">
                          <label className="block text-xs font-medium uppercase tracking-wide text-stone-500 mb-1.5">
                            Duration
                          </label>
                          <div className="relative">
                            <select
                              value={o.duration}
                              onChange={e => setOverride(sv.id, 'duration', e.target.value)}
                              className="appearance-none w-full border border-stone-200 rounded-lg pl-3 pr-9 py-2 text-sm bg-white focus:outline-none focus:border-stone-400"
                            >
                              <option value="">Default ({sv.duration_min} min)</option>
                              {[15, 30, 45, 60, 90, 120].map(m => (
                                <option key={m} value={m}>{m} min</option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
                              ▼
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium uppercase tracking-wide text-stone-500 mb-1.5">
                            Price (UZS)
                          </label>
                          <div className="relative">
                            <select
                              value={o.price}
                              onChange={e => setOverride(sv.id, 'price', e.target.value)}
                              className="appearance-none w-full border border-stone-200 rounded-lg pl-3 pr-9 py-2 text-sm bg-white focus:outline-none focus:border-stone-400"
                            >
                              <option value="">Default ({sv.price_uzs.toLocaleString()})</option>
                              {priceOptions.map(p => (
                                <option key={p} value={p}>{p.toLocaleString()}</option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
                              ▼
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    {checked && hasOverride && (
                      <div className="mt-2 ml-8">
                        <button
                          type="button"
                          onClick={() =>
                            setOverrides({ ...overrides, [sv.id]: { duration: '', price: '' } })
                          }
                          className="text-xs text-stone-500 hover:text-stone-900 underline"
                        >
                          Reset to default
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <button
              onClick={saveServices}
              disabled={!!saving}
              className="mt-5 rounded-full bg-stone-900 text-white px-6 py-2.5 text-sm font-medium hover:bg-stone-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving === 'services' ? 'Saving…' : 'Save services'}
            </button>
          </>
        )}
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-10 pb-20">
        <h2 className="text-xl font-semibold text-stone-900 mb-6">Time off</h2>
        <form onSubmit={addOff} className="flex gap-2 mb-6 max-w-md">
          <input
            type="date"
            disabled={!!saving}
            className="border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400 disabled:opacity-50"
            value={offDate}
            onChange={e => setOffDate(e.target.value)}
          />
          <button
            disabled={!!saving}
            className="rounded-full bg-stone-900 text-white px-5 text-sm font-medium hover:bg-stone-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving === 'off' ? 'Saving…' : 'Add day off'}
          </button>
        </form>
        {offDays.length === 0 && <p className="text-sm text-stone-500">No days off scheduled.</p>}
        {offDays.length > 0 && (
          <ul className="space-y-2 max-w-md">
            {offDays.map(o => (
              <li
                key={o.id}
                className="rounded-xl border border-stone-200 px-4 py-3 bg-white flex justify-between items-center"
              >
                <span className="text-stone-900">{o.off_date}</span>
                <button
                  onClick={() => removeOff(o.id)}
                  disabled={!!saving}
                  className="text-red-600 text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
