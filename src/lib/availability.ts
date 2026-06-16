import { addMinutes, format, parse, startOfDay } from 'date-fns'

type WorkingHour = { weekday: number; start_time: string; end_time: string }
type Booking = { start_time: string; end_time: string }

type Options = {
  date: Date
  durationMin: number
  workingHours: WorkingHour[]
  timeOff: string[]
  bookings: Booking[]
}

// Builds the list of available time slots for one day.
export function computeSlots(opts: Options): string[] {
  const { date, durationMin, workingHours, timeOff, bookings } = opts

  // Day off? No slots.
  const isoDate = format(date, 'yyyy-MM-dd')
  if (timeOff.includes(isoDate)) return []

  // Find working hours for this weekday.
  const weekday = date.getDay()
  let hours: WorkingHour | null = null
  for (const wh of workingHours) {
    if (wh.weekday === weekday) {
      hours = wh
      break
    }
  }
  if (!hours) return []

  // Build candidate slots every 30 minutes between start and end.
  const dayStart = parse(hours.start_time, 'HH:mm:ss', startOfDay(date))
  const dayEnd = parse(hours.end_time, 'HH:mm:ss', startOfDay(date))

  // Generate candidate slots every 30 minutes from dayStart to dayEnd - duration.
  const candidates: Date[] = []
  let cursor = dayStart
  while (addMinutes(cursor, durationMin) <= dayEnd) {
    candidates.push(cursor)
    cursor = addMinutes(cursor, 30)
  }

  // Keep slots that are in the future and don't overlap existing bookings.
  const now = new Date()
  const result: string[] = []
  for (const slot of candidates) {
    if (slot <= now) continue
    // Check for overlap with bookings.
    const slotEnd = addMinutes(slot, durationMin)
    let overlaps = false
    for (const b of bookings) {
      const bStart = new Date(b.start_time)
      const bEnd = new Date(b.end_time)
      if (slot < bEnd && slotEnd > bStart) {
        overlaps = true
        break
      }
    }
    if (!overlaps) result.push(slot.toISOString())
  }

  return result
}
