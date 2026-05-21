'use client'
import dynamic from 'next/dynamic'

const ShopMap = dynamic(() => import('@/components/Maps').then(m => m.ShopMap), { ssr: false })

export default function ShopMapView({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  return <ShopMap lat={lat} lng={lng} name={name} />
}
