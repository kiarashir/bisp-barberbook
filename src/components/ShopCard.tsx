import Link from 'next/link'

type Shop = {
  id: string
  name: string
  address: string
  description: string | null
  photo_url: string | null
  avg_rating: number | null
}

export default function ShopCard({ shop }: { shop: Shop }) {
  return (
    <Link
      href={`/shops/${shop.id}`}
      className="group block rounded-xl overflow-hidden bg-white border border-stone-200 hover:border-stone-300 transition"
    >
      <div className="aspect-[4/3] bg-stone-100 overflow-hidden">
        {shop.photo_url ? (
          <img
            src={shop.photo_url}
            alt={shop.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition"
          />
        ) : (
          <div className="w-full h-full bg-stone-100" />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-stone-900">{shop.name}</h3>
          {shop.avg_rating !== null && (
            <span className="text-sm text-stone-700 shrink-0">★ {shop.avg_rating.toFixed(1)}</span>
          )}
        </div>
        <p className="text-sm text-stone-500 mt-1">{shop.address}</p>
      </div>
    </Link>
  )
}
