// Reverse-geocode coordinates into place names using the free Nominatim API.
export type Place = {
  country: string | null
  region: string | null
  district: string | null
}

export async function reverseGeocode(lat: number, lng: number): Promise<Place | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const a = data.address ?? {}
    return {
      country: a.country ?? null,
      region: a.state ?? a.region ?? null,
      district: a.city_district ?? a.district ?? a.suburb ?? a.county ?? null,
    }
  } catch {
    return null
  }
}
