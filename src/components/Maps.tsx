'use client'
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import Link from 'next/link'
import 'leaflet/dist/leaflet.css'

// Leaflet's default marker images don't resolve through bundlers, so point them at the CDN.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const TASHKENT: [number, number] = [41.3111, 69.2797]
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; OpenStreetMap contributors'

type Point = { lat: number; lng: number }

// A pulsing blue dot marking the user's live location ("you are here").
// Built as a divIcon so we can animate it with CSS (see globals.css).
const userLocationIcon = L.divIcon({
  className: 'user-location-icon',
  html: '<span class="user-pulse-ring"></span><span class="user-pulse-dot"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Smoothly pans/zooms the map to the user once their location is known.
function RecenterOnUser({ pos }: { pos: Point }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([pos.lat, pos.lng], Math.max(map.getZoom(), 13), { duration: 1.2 })
  }, [map, pos.lat, pos.lng])
  return null
}

// Map for picking a shop location while creating/editing a shop.
export function MapPicker({ value, onPick, className }: {
  value: Point | null
  onPick: (lat: number, lng: number) => void
  className?: string
}) {
  const center: [number, number] = value ? [value.lat, value.lng] : TASHKENT
  return (
    <MapContainer center={center} zoom={12} className={className ?? 'h-72 w-full rounded-lg border border-stone-200'}>
      <TileLayer attribution={ATTRIBUTION} url={TILE_URL} />
      <ClickHandler onPick={onPick} />
      {value && <Marker position={[value.lat, value.lng]} />}
    </MapContainer>
  )
}

// Read-only map showing a single shop's location on its detail page.
export function ShopMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  return (
    <MapContainer center={[lat, lng]} zoom={15} className="h-80 w-full rounded-xl border border-stone-200">
      <TileLayer attribution={ATTRIBUTION} url={TILE_URL} />
      <Marker position={[lat, lng]}>
        <Popup>{name}</Popup>
      </Marker>
    </MapContainer>
  )
}

type ShopPoint = { id: string; name: string; lat: number; lng: number; district: string | null }

// Map showing every shop that has a location, used on the /shops page.
// When userPos is set, the user's live location is shown as a pulsing dot
// and the map recenters on them.
export function ShopsMap({ shops, userPos }: { shops: ShopPoint[]; userPos?: Point | null }) {
  const center: [number, number] = userPos ? [userPos.lat, userPos.lng] : TASHKENT
  return (
    <MapContainer center={center} zoom={userPos ? 13 : 11} className="h-[520px] w-full rounded-xl border border-gray-200">
      <TileLayer attribution={ATTRIBUTION} url={TILE_URL} />
      {shops.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lng]}>
          <Popup>
            <span className="font-semibold">{s.name}</span>
            {s.district && <span className="block text-gray-500">{s.district}</span>}
            <Link href={`/shops/${s.id}`} className="text-orange-600">
              View shop
            </Link>
          </Popup>
        </Marker>
      ))}
      {userPos && (
        <>
          <Marker position={[userPos.lat, userPos.lng]} icon={userLocationIcon} zIndexOffset={1000}>
            <Popup>You are here</Popup>
          </Marker>
          <RecenterOnUser pos={userPos} />
        </>
      )}
    </MapContainer>
  )
}
