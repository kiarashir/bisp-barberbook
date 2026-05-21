// Reverse-geocode coordinates into place names using the free Nominatim API.
export type Place = {
  country: string | null
  region: string | null
  district: string | null
}

// Uzbekistan regions keyed by their ISO 3166-2 code, which Nominatim always returns.
const UZ_REGIONS: Record<string, string> = {
  'UZ-AN': 'Andijan',
  'UZ-BU': 'Bukhara',
  'UZ-FA': 'Fergana',
  'UZ-JI': 'Jizzakh',
  'UZ-NG': 'Namangan',
  'UZ-NW': 'Navoiy',
  'UZ-QA': 'Qashqadaryo',
  'UZ-QR': 'Karakalpakstan',
  'UZ-SA': 'Samarkand',
  'UZ-SI': 'Sirdaryo',
  'UZ-SU': 'Surxondaryo',
  'UZ-TK': 'Tashkent',
  'UZ-TO': 'Tashkent Region',
  'UZ-XO': 'Khorezm',
}

export async function reverseGeocode(lat: number, lng: number): Promise<Place | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const a = data.address ?? {}
    const isoRegion = UZ_REGIONS[a['ISO3166-2-lvl4']]
    return {
      country: a.country ?? null,
      region: isoRegion ?? a.state ?? a.region ?? null,
      district: a.county ?? a.city_district ?? a.district ?? a.suburb ?? null,
    }
  } catch {
    return null
  }
}
