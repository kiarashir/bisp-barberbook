'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import ShopCard from '@/components/ShopCard'
import { createClient } from '@/lib/supabase/client'

const ShopsMap = dynamic(() => import('@/components/Maps').then(m => m.ShopsMap), { ssr: false })

type Shop = {
  id: string
  name: string
  address: string
  description: string | null
  photo_url: string | null
  created_at: string
  lat: number | null
  lng: number | null
  district: string | null
  avg_rating: number | null
}

type SortOption = 'newest' | 'rating' | 'name'

export default function ShopsPage() {
  const supabase = createClient()
  const [shops, setShops] = useState<Shop[]>([])
  const [fetching, setFetching] = useState(true)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [districtFilter, setDistrictFilter] = useState('')
  const [view, setView] = useState<'list' | 'map'>('list')

  // Pre-fill the search box if the landing page passed a ?q= query.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q')
    if (q) setQuery(q)
  }, [])

  // Load shops and their average ratings.
  useEffect(() => {
    async function load() {
      const { data: shopsData } = await supabase
        .from('shops')
        .select('id,name,address,description,photo_url,created_at,lat,lng,district')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
      const allShops = shopsData ?? []
      const allIds = allShops.map(s => s.id)

      // Only show shops that can actually be booked: at least one active barber and one service.
      let raw = allShops
      if (allIds.length > 0) {
        const { data: staffRows } = await supabase
          .from('staff')
          .select('shop_id')
          .eq('is_active', true)
          .in('shop_id', allIds)
        const { data: serviceRows } = await supabase
          .from('services')
          .select('shop_id')
          .in('shop_id', allIds)
        const withStaff = new Set((staffRows ?? []).map(r => r.shop_id))
        const withServices = new Set((serviceRows ?? []).map(r => r.shop_id))
        raw = allShops.filter(s => withStaff.has(s.id) && withServices.has(s.id))
      }

      const shopIds = raw.map(s => s.id)
      let reviews: { shop_id: string; rating: number }[] = []
      if (shopIds.length > 0) {
        const { data } = await supabase
          .from('reviews')
          .select('shop_id,rating')
          .in('shop_id', shopIds)
        reviews = data ?? []
      }

      // Attach average rating to each shop.
      const enriched: Shop[] = []
      for (const s of raw) {
        let total = 0
        let count = 0
        for (const r of reviews) {
          if (r.shop_id === s.id) {
            total = total + r.rating
            count = count + 1
          }
        }
        enriched.push({ ...s, avg_rating: count > 0 ? total / count : null })
      }

      setShops(enriched)
      setFetching(false)
    }
    load()
  }, [])

  // Build the list of districts available for the filter dropdown.
  const districts: string[] = []
  for (const s of shops) {
    if (s.district && !districts.includes(s.district)) districts.push(s.district)
  }
  districts.sort()

  // Filter by search query (name or address) and by district.
  const filtered: Shop[] = []
  const lowerQuery = query.trim().toLowerCase()
  for (const s of shops) {
    if (districtFilter && s.district !== districtFilter) continue
    if (lowerQuery) {
      const nameMatch = s.name.toLowerCase().includes(lowerQuery)
      const addressMatch = s.address.toLowerCase().includes(lowerQuery)
      const districtMatch = (s.district ?? '').toLowerCase().includes(lowerQuery)
      if (!nameMatch && !addressMatch && !districtMatch) continue
    }
    filtered.push(s)
  }

  // Sort the filtered list.
  if (sort === 'rating') {
    filtered.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0))
  } else if (sort === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name))
  }
  // 'newest' is already the order from Supabase.

  // Shops that have coordinates, for the map view.
  const mapShops = filtered
    .filter(s => s.lat != null && s.lng != null)
    .map(s => ({ id: s.id, name: s.name, lat: s.lat as number, lng: s.lng as number, district: s.district }))

  return (
    <div className="bg-white min-h-screen">
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 mb-2">
          Barbershops
        </h1>
        <p className="text-stone-500">Browse local shops and book your next haircut.</p>
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-10 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
          <input
            type="text"
            placeholder="Search by name, address or district"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
          />
          <Select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}>
            <option value="">All districts</option>
            {districts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
          <Select value={sort} onChange={e => setSort(e.target.value as SortOption)}>
            <option value="newest">Newest first</option>
            <option value="rating">Highest rated</option>
            <option value="name">Name (A–Z)</option>
          </Select>

          {/* List / Map toggle */}
          <div className="inline-flex rounded-lg border border-stone-200 p-0.5 shrink-0">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 text-sm rounded-md ${view === 'list' ? 'bg-stone-900 text-white' : 'text-stone-600'}`}
            >
              List
            </button>
            <button
              onClick={() => setView('map')}
              className={`px-4 py-2 text-sm rounded-md ${view === 'map' ? 'bg-stone-900 text-white' : 'text-stone-600'}`}
            >
              Map
            </button>
          </div>
        </div>

        {fetching && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!fetching && view === 'list' && (
          filtered.length === 0 ? (
            <p className="text-stone-500">
              {query || districtFilter ? 'No shops match your search.' : 'No shops listed yet.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(s => (
                <ShopCard key={s.id} shop={s} />
              ))}
            </div>
          )
        )}

        {!fetching && view === 'map' && (
          mapShops.length === 0 ? (
            <p className="text-stone-500">No shops with a location to show on the map yet.</p>
          ) : (
            <ShopsMap shops={mapShops} />
          )
        )}
      </section>
    </div>
  )
}

function Select({ value, onChange, children }: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: React.ReactNode
}) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={onChange}
        className="appearance-none cursor-pointer border border-stone-200 rounded-lg bg-white pl-3 pr-9 py-2 focus:outline-none focus:border-stone-400"
      >
        {children}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
      <div className="aspect-[4/3] bg-stone-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-32 bg-stone-100 rounded" />
        <div className="h-3 w-48 bg-stone-100 rounded" />
      </div>
    </div>
  )
}
