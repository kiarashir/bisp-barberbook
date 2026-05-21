'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { reverseGeocode } from '@/lib/geocode'
import { ShopIcon } from '@/components/icons'

const MapPicker = dynamic(() => import('@/components/Maps').then(m => m.MapPicker), { ssr: false })

export default function EditShop() {
  const supabase = createClient()
  const router = useRouter()
  const [shopId, setShopId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null)
  const [country, setCountry] = useState('')
  const [region, setRegion] = useState('')
  const [district, setDistrict] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: shop } = await supabase
        .from('shops')
        .select('id,name,address,description,photo_url,lat,lng,country,region,district')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()
      if (!shop) { router.push('/owner/onboarding'); return }
      setShopId(shop.id)
      setName(shop.name)
      setAddress(shop.address)
      setDescription(shop.description ?? '')
      setPhotoUrl(shop.photo_url ?? null)
      if (shop.lat != null && shop.lng != null) setPoint({ lat: shop.lat, lng: shop.lng })
      setCountry(shop.country ?? '')
      setRegion(shop.region ?? '')
      setDistrict(shop.district ?? '')
      setFetching(false)
    }
    load()
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

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!shopId) return
    setLoading(true)
    const { error } = await supabase
      .from('shops')
      .update({
        name,
        address,
        description: description || null,
        lat: point?.lat ?? null,
        lng: point?.lng ?? null,
        country: country || null,
        region: region || null,
        district: district || null,
      })
      .eq('id', shopId)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Saved')
  }

  // Upload a new photo to Supabase Storage and save the URL to the shop.
  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    if (!shopId) return
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    // Build a unique path inside the shop's folder.
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${shopId}/${Date.now()}.${ext}`

    // Upload the file.
    const { error: uploadError } = await supabase.storage
      .from('shop-photos')
      .upload(path, file)
    if (uploadError) {
      setUploading(false)
      toast.error(uploadError.message)
      return
    }

    // Get the public URL.
    const { data: pub } = supabase.storage.from('shop-photos').getPublicUrl(path)

    // Save it on the shop record.
    const { error: updateError } = await supabase
      .from('shops')
      .update({ photo_url: pub.publicUrl })
      .eq('id', shopId)

    setUploading(false)
    if (updateError) {
      toast.error(updateError.message)
      return
    }

    setPhotoUrl(pub.publicUrl)
    // Clear the input so the same file can be picked again later if needed.
    e.target.value = ''
    toast.success('Photo updated')
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
            <ShopIcon />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900">
              Edit shop
            </h1>
            <p className="text-stone-500 mt-1">Update your shop information.</p>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-10 pb-20">
        {fetching ? (
          <div className="space-y-5 max-w-md animate-pulse">
            <SkeletonField />
            <SkeletonField />
            <SkeletonField />
            <SkeletonField tall />
            <div className="h-10 w-32 bg-stone-100 rounded-full" />
          </div>
        ) : (
          <form onSubmit={save} className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-stone-700 mb-2">Photo</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-xl bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center text-2xl text-stone-500 font-semibold">
                    {photoUrl ? (
                      <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{name.charAt(0).toUpperCase() || '?'}</span>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="photo-upload"
                      className="cursor-pointer inline-block rounded-full border border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:text-stone-900 px-4 py-2 text-sm font-medium transition"
                    >
                      {uploading ? 'Uploading…' : 'Change photo'}
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={uploadPhoto}
                      disabled={uploading}
                      className="hidden"
                    />
                    <p className="text-xs text-stone-500 mt-2">JPG, PNG, or WebP</p>
                  </div>
                </div>
              </div>

              <Field label="Name">
                <input
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </Field>
              <Field label="Address">
                <input
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </Field>
              <Field label="Description">
                <textarea
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </Field>

              <div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Country">
                    <input
                      disabled
                      placeholder="—"
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-100 text-stone-600"
                      value={country}
                    />
                  </Field>
                  <Field label="Region">
                    <input
                      disabled
                      placeholder="—"
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-100 text-stone-600"
                      value={region}
                    />
                  </Field>
                  <Field label="District">
                    <input
                      disabled
                      placeholder="—"
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-100 text-stone-600"
                      value={district}
                    />
                  </Field>
                </div>
                <p className="text-xs text-stone-500 mt-1.5">
                  Filled automatically from the map location.
                </p>
              </div>

              <button
                disabled={loading}
                className="rounded-full bg-stone-900 text-white px-6 py-2.5 text-sm font-medium hover:bg-stone-800 transition disabled:opacity-40"
              >
                {loading ? 'Saving…' : 'Save changes'}
              </button>
            </div>

            <div>
              <label className="block text-sm text-stone-700 mb-1.5">
                Location — click on the map
              </label>
              <MapPicker
                value={point}
                onPick={pickLocation}
                className="h-[600px] w-full rounded-lg border border-stone-200"
              />
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-stone-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function SkeletonField({ tall }: { tall?: boolean }) {
  return (
    <div>
      <div className="h-4 w-20 bg-stone-100 rounded mb-2" />
      <div className={`w-full bg-stone-100 rounded-lg ${tall ? 'h-20' : 'h-10'}`} />
    </div>
  )
}
