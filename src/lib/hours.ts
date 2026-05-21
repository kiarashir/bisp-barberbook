export type DayHours = { closed: boolean; open: string; close: string }

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function defaultHours(): DayHours[] {
  return DAYS.map(() => ({ closed: false, open: '09:00', close: '18:00' }))
}

// Opening hours are stored as a 7-item JSON array; fall back to defaults if missing or malformed.
export function parseHours(value: unknown): DayHours[] {
  if (Array.isArray(value) && value.length === 7) return value as DayHours[]
  return defaultHours()
}
