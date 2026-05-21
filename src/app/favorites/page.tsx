'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ShopCard from '@/components/ShopCard'
import { createClient } from '@/lib/supabase/client'

type Shop = {
  id: string
  name: string
  address: string
  description: string | null
  photo_url: string | null
  avg_rating: number | null
}

export default function FavoritesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [shops, setShops] = useState<Shop[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('favorites')
        .select('shop_id, shops(id,name,address,description,photo_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const list: Shop[] = []
      for (const row of data ?? []) {
        const s = row.shops as unknown as Omit<Shop, 'avg_rating'> | null
        if (s) list.push({ ...s, avg_rating: null })
      }
      setShops(list)
      setFetching(false)
    }
    load()
  }, [])

  return (
    <div className="bg-white min-h-screen">
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 mb-2">
          Saved shops
        </h1>
        <p className="text-stone-500">Barbershops you have saved.</p>
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-10 pb-20">
        {fetching && <p className="text-stone-500">Loading…</p>}

        {!fetching && shops.length === 0 && (
          <p className="text-stone-500">
            You haven&apos;t saved any shops yet.{' '}
            <Link href="/shops" className="text-orange-600 hover:underline">
              Browse shops
            </Link>
          </p>
        )}

        {!fetching && shops.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map(s => (
              <ShopCard key={s.id} shop={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
