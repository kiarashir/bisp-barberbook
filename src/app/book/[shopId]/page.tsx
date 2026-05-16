'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { computeSlots } from '@/lib/availability'
import { addMinutes, format } from 'date-fns'

type Staff = { id: string; full_name: string; photo_url: string | null }
type Service = { id: string; name: string; duration_min: number; price_uzs: number }
type Shop = { name: string; address: string; photo_url: string | null }

const STEP_INFO = [
  { title: 'Choose your barber', subtitle: 'Pick a staff member.' },
  { title: 'Choose a service', subtitle: 'What would you like done?' },
  { title: 'Pick a date and time', subtitle: 'See available slots.' },
  { title: 'Review your booking', subtitle: 'Confirm the details and complete.' },
]

export default function BookPage() {
  const params = useParams<{ shopId: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [shop, setShop] = useState<Shop | null>(null)
  const [staff, setStaff] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [serviceStaff, setServiceStaff] = useState<
    { service_id: string; staff_id: string; duration_min: number | null; price_uzs: number | null }[]
  >([])

  const [step, setStep] = useState(1)
  const [staffId, setStaffId] = useState<string | null>(null)
  const [serviceId, setServiceId] = useState<string | null>(null)
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [slots, setSlots] = useState<string[]>([])
  const [pickedSlot, setPickedSlot] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)

  // Load shop info, staff list, services, and service-staff mapping.
  useEffect(() => {
    async function loadData() {
      const { data: shopData } = await supabase
        .from('shops')
        .select('name,address,photo_url')
        .eq('id', params.shopId)
        .single()
      setShop(shopData)

      const { data: staffData } = await supabase
        .from('staff')
        .select('id,full_name,photo_url')
        .eq('shop_id', params.shopId)
        .eq('is_active', true)
      setStaff(staffData ?? [])

      const { data: serviceData } = await supabase
        .from('services')
        .select('id,name,duration_min,price_uzs')
        .eq('shop_id', params.shopId)
      setServices(serviceData ?? [])

      const serviceIds = (serviceData ?? []).map(s => s.id)
      if (serviceIds.length > 0) {
        const { data: mapping } = await supabase
          .from('service_staff')
          .select('service_id,staff_id,duration_min,price_uzs')
          .in('service_id', serviceIds)
        setServiceStaff(mapping ?? [])
      }
    }
    loadData()
  }, [params.shopId])

  // When staff, service, or date changes, recalculate available slots.
  useEffect(() => {
    setPickedSlot(null)

    if (!staffId || !serviceId) {
      setSlots([])
      return
    }

    let service: Service | null = null
    for (const s of services) {
      if (s.id === serviceId) {
        service = s
        break
      }
    }
    if (!service) return

    async function loadSlots(svc: Service) {
      const { data: workingHours } = await supabase
        .from('staff_working_hours')
        .select('weekday,start_time,end_time')
        .eq('staff_id', staffId)

      const { data: timeOff } = await supabase
        .from('staff_time_off')
        .select('off_date')
        .eq('staff_id', staffId)

      const dayStart = new Date(date + 'T00:00:00')
      const dayEnd = new Date(date + 'T23:59:59')

      const { data: dayBookings } = await supabase
        .from('bookings')
        .select('start_time,end_time')
        .eq('staff_id', staffId)
        .eq('status', 'confirmed')
        .gte('start_time', dayStart.toISOString())
        .lte('start_time', dayEnd.toISOString())

      const offDays = (timeOff ?? []).map(t => t.off_date)
      const computed = computeSlots({
        date: dayStart,
        durationMin: eff(svc).duration_min,
        workingHours: workingHours ?? [],
        timeOff: offDays,
        bookings: dayBookings ?? [],
      })
      setSlots(computed)
    }

    loadSlots(service)
  }, [staffId, serviceId, date, services, serviceStaff, refreshTick])

  // Which services can the selected staff perform?
  function canStaffDoService(svcId: string): boolean {
    if (!staffId) return true
    for (const ss of serviceStaff) {
      if (ss.staff_id === staffId && ss.service_id === svcId) return true
    }
    return false
  }

  // Effective price/duration: the chosen barber's override, else the service default.
  function eff(svc: Service) {
    let o: { duration_min: number | null; price_uzs: number | null } | null = null
    for (const ss of serviceStaff) {
      if (ss.staff_id === staffId && ss.service_id === svc.id) { o = ss; break }
    }
    return {
      duration_min: o && o.duration_min != null ? o.duration_min : svc.duration_min,
      price_uzs: o && o.price_uzs != null ? o.price_uzs : svc.price_uzs,
    }
  }

  const visibleServices: Service[] = []
  for (const sv of services) {
    if (canStaffDoService(sv.id)) visibleServices.push(sv)
  }

  // Selected items helpers
  let selectedStaff: Staff | null = null
  for (const s of staff) {
    if (s.id === staffId) { selectedStaff = s; break }
  }
  let selectedService: Service | null = null
  for (const s of services) {
    if (s.id === serviceId) { selectedService = s; break }
  }
  const effSelected = selectedService ? eff(selectedService) : null

  // Build the next 7 days for the date row.
  const next7Days: { iso: string; date: Date }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    next7Days.push({ iso: format(d, 'yyyy-MM-dd'), date: d })
  }

  // Can the user move to the next step?
  let canNext = false
  if (step === 1 && staffId) canNext = true
  if (step === 2 && serviceId) canNext = true
  if (step === 3 && pickedSlot) canNext = true

  async function confirm() {
    if (!staffId || !serviceId || !pickedSlot || !selectedService) return

    const start = new Date(pickedSlot)
    const e = eff(selectedService)
    const end = addMinutes(start, e.duration_min)

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast('Please log in to confirm booking')
      router.push('/login')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('bookings').insert({
      customer_id: user.id,
      shop_id: params.shopId,
      staff_id: staffId,
      service_id: serviceId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      price_uzs: e.price_uzs,
      status: 'confirmed',
    })
    setLoading(false)

    if (error) {
      if (error.code === '23505') {
        toast.error('That slot was just taken — please pick another.')
        setPickedSlot(null)
        setStep(3)
        setRefreshTick(refreshTick + 1)
      } else {
        toast.error(error.message)
      }
      return
    }
    toast.success('Booking confirmed!')
    router.push('/bookings')
  }

  function goBack() {
    if (step > 1) setStep(step - 1)
  }
  function goNext() {
    if (step < 4) setStep(step + 1)
  }

  return (
    <div className="bg-white min-h-screen">
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <p className="text-sm text-stone-500 mb-3">Book at {shop?.name || '…'}</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 mb-2">
          {STEP_INFO[step - 1].title}
        </h1>
        <p className="text-stone-500">{STEP_INFO[step - 1].subtitle}</p>

        <div className="mt-8 flex items-center gap-3">
          <span className="text-xs text-stone-500 whitespace-nowrap">
            Step {step} of {STEP_INFO.length}
          </span>
          <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-stone-900 transition-all"
              style={{ width: `${(step / STEP_INFO.length) * 100}%` }}
            />
          </div>
        </div>
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-10 min-h-[280px]">
        {step === 1 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {staff.map(s => {
              const selected = staffId === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setStaffId(s.id)}
                  className={`rounded-xl border p-3 flex items-center gap-3 text-left transition ${
                    selected
                      ? 'border-stone-900 bg-stone-50'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center text-stone-500 text-sm font-medium">
                    {s.photo_url ? (
                      <img src={s.photo_url} alt={s.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{s.full_name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="font-medium text-stone-900 truncate">{s.full_name}</span>
                </button>
              )
            })}
          </div>
        )}

        {step === 2 && visibleServices.length === 0 && (
          <p className="text-stone-500">No services available for this staff member.</p>
        )}

        {step === 2 && visibleServices.length > 0 && (
          <div className="space-y-2">
            {visibleServices.map(sv => {
              const selected = serviceId === sv.id
              const e = eff(sv)
              return (
                <button
                  key={sv.id}
                  onClick={() => setServiceId(sv.id)}
                  className={`w-full text-left rounded-xl border px-5 py-4 flex items-center justify-between gap-4 transition ${
                    selected
                      ? 'border-stone-900 bg-stone-50'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div>
                    <p className="font-medium text-stone-900">{sv.name}</p>
                    <p className="text-sm text-stone-500">{e.duration_min} min</p>
                  </div>
                  <span className="font-medium text-stone-900 shrink-0">
                    {e.price_uzs.toLocaleString()} UZS
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="grid grid-cols-7 gap-2 mb-6">
              {next7Days.map((d, i) => {
                const selected = date === d.iso
                return (
                  <button
                    key={d.iso}
                    onClick={() => setDate(d.iso)}
                    className={`flex flex-col items-center rounded-xl border py-3 transition ${
                      selected
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'border-stone-200 hover:border-stone-300 bg-white text-stone-900'
                    }`}
                  >
                    <span className={`text-xs ${selected ? 'text-stone-300' : 'text-stone-500'}`}>
                      {i === 0 ? 'Today' : format(d.date, 'EEE')}
                    </span>
                    <span className="text-lg font-semibold mt-0.5">{format(d.date, 'd')}</span>
                    <span className={`text-[10px] uppercase tracking-wide ${selected ? 'text-stone-300' : 'text-stone-500'}`}>
                      {format(d.date, 'MMM')}
                    </span>
                  </button>
                )
              })}
            </div>

            {slots.length === 0 && (
              <p className="text-sm text-stone-500">No free slots on this day.</p>
            )}

            {slots.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                {slots.map(iso => {
                  const selected = pickedSlot === iso
                  return (
                    <button
                      key={iso}
                      onClick={() => setPickedSlot(iso)}
                      className={`rounded-lg border text-sm py-2 transition ${
                        selected
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'border-stone-200 hover:border-stone-300 text-stone-900 bg-white'
                      }`}
                    >
                      {format(new Date(iso), 'HH:mm')}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="max-w-md mx-auto">
            <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
              <div className="p-5 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center text-stone-500 font-semibold">
                  {shop?.photo_url ? (
                    <img src={shop.photo_url} alt={shop.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{shop?.name.charAt(0).toUpperCase() ?? '?'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900 truncate">{shop?.name ?? '—'}</p>
                  {shop?.address && <p className="text-sm text-stone-500 truncate">{shop.address}</p>}
                </div>
              </div>

              <div className="border-t border-dashed border-stone-200" />

              <div className="px-5 py-6 text-center">
                <p className="text-xs uppercase tracking-wide text-stone-500 mb-1">When</p>
                {pickedSlot && selectedService ? (
                  <>
                    <p className="text-2xl font-semibold text-stone-900">
                      {format(new Date(pickedSlot), 'EEE, MMM d')}
                    </p>
                    <p className="text-stone-700 mt-1">
                      {format(new Date(pickedSlot), 'HH:mm')} —{' '}
                      {format(addMinutes(new Date(pickedSlot), effSelected?.duration_min ?? 0), 'HH:mm')}
                    </p>
                  </>
                ) : (
                  <p className="text-stone-500">—</p>
                )}
              </div>

              <div className="border-t border-dashed border-stone-200" />

              <div className="p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center text-stone-500 text-sm font-medium">
                  {selectedStaff?.photo_url ? (
                    <img src={selectedStaff.photo_url} alt={selectedStaff.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{selectedStaff?.full_name.charAt(0).toUpperCase() ?? '?'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-stone-900 truncate">{selectedStaff?.full_name ?? '—'}</p>
                  <p className="text-sm text-stone-500 truncate">
                    {selectedService ? `${selectedService.name} · ${effSelected?.duration_min} min` : '—'}
                  </p>
                </div>
              </div>

              <div className="border-t border-stone-200 bg-stone-50 px-5 py-4 flex items-center justify-between">
                <span className="font-medium text-stone-900">Total</span>
                <span className="text-xl font-semibold text-stone-900">
                  {selectedService && effSelected ? `${effSelected.price_uzs.toLocaleString()} UZS` : '—'}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-6 pb-20 flex items-center justify-between gap-3">
        <button
          onClick={goBack}
          disabled={step === 1}
          className="rounded-full border border-stone-200 hover:border-stone-300 text-stone-700 px-6 py-2.5 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Back
        </button>

        {step < 4 && (
          <button
            onClick={goNext}
            disabled={!canNext}
            className="rounded-full bg-stone-900 text-white px-8 py-2.5 text-sm font-medium hover:bg-stone-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        )}

        {step === 4 && (
          <button
            onClick={confirm}
            disabled={!pickedSlot || loading}
            className="rounded-full bg-stone-900 text-white px-8 py-2.5 text-sm font-medium hover:bg-stone-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Booking…' : 'Confirm booking'}
          </button>
        )}
      </section>
    </div>
  )
}
