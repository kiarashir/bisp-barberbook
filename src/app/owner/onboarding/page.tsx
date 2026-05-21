'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { reverseGeocode } from '@/lib/geocode'

const MapPicker = dynamic(() => import('@/components/Maps').then(m => m.MapPicker), { ssr: false })

export default function Onboarding() {
  const supabase = createClient()
  const router = useRouter()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null)
  const [country, setCountry] = useState('')
  const [region, setRegion] = useState('')
  const [district, setDistrict] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()
      if (data) router.push('/owner')
    })()
  }, [])

  // When the owner picks a point, fill in the place names from it.
  async function pickLocation(lat: number, lng: number) {
    setPoint({ lat, lng })
    const place = await reverseGeocode(lat, lng)
    if (place) {
      setCountry(place.country ?? '')
      setRegion(place.region ?? '')
      setDistrict(place.district ?? '')
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !address) { toast.error('Name and address required'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { error } = await supabase.from('shops').insert({
      owner_id: user.id,
      name,
      address,
      description: description || null,
      lat: point?.lat ?? null,
      lng: point?.lng ?? null,
      country: country || null,
      region: region || null,
      district: district || null,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Shop created')
    router.push('/owner')
  }

  return (
    <div className="bg-white min-h-screen">
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 mb-2">
          Set up your shop
        </h1>
        <p className="text-stone-500">Tell customers about your barbershop. You can edit this later.</p>
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-10 pb-20">
        <form onSubmit={submit} className="space-y-5 max-w-md">
          <div>
            <label className="block text-sm text-stone-700 mb-1.5">Shop name</label>
            <input
              className="w-full border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-stone-700 mb-1.5">Address</label>
            <input
              className="w-full border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-stone-700 mb-1.5">Short description (optional)</label>
            <textarea
              className="w-full border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-stone-700 mb-1.5">Location — click on the map</label>
            <MapPicker value={point} onPick={pickLocation} />
          </div>

          <div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-stone-700 mb-1.5">Country</label>
                <input
                  disabled
                  placeholder="—"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-100 text-stone-600"
                  value={country}
                />
              </div>
              <div>
                <label className="block text-sm text-stone-700 mb-1.5">Region</label>
                <input
                  disabled
                  placeholder="—"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-100 text-stone-600"
                  value={region}
                />
              </div>
              <div>
                <label className="block text-sm text-stone-700 mb-1.5">District</label>
                <input
                  disabled
                  placeholder="—"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-100 text-stone-600"
                  value={district}
                />
              </div>
            </div>
            <p className="text-xs text-stone-500 mt-1.5">
              Filled automatically from the map location.
            </p>
          </div>

          <button
            disabled={loading}
            className="rounded-full bg-stone-900 text-white px-6 py-2.5 text-sm font-medium hover:bg-stone-800 transition disabled:opacity-40"
          >
            {loading ? 'Creating…' : 'Create shop'}
          </button>
        </form>
      </section>
    </div>
  )
}
