
import { NextRequest, NextResponse } from 'next/server'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWaitlistOpeningEmail } from '@/lib/email'

// Sending several emails can take a moment.
export const maxDuration = 60

// How close (in minutes) a freed slot must be to a customer's preferred time
// for us to notify them. A 3pm cancellation pings everyone who wanted 2pm–4pm.
const MATCH_WINDOW_MIN = 60

type BookingRow = {
  id: string
  customer_id: string
  shop_id: string
  staff_id: string
  start_time: string
  status: string
  shops: { name: string } | null
  staff: { full_name: string } | null
  services: { name: string } | null
}

export async function POST(request: NextRequest) {
  // Must be logged in to cancel anything.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const bookingId = body?.bookingId
  if (typeof bookingId !== 'string' || !bookingId) {
    return NextResponse.json({ error: 'Missing bookingId.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Load the booking (admin client so we can read it regardless of who owns it).
  const { data: booking, error: loadErr } = await admin
    .from('bookings')
    .select('id,customer_id,shop_id,staff_id,start_time,status,shops(name),staff(full_name),services(name)')
    .eq('id', bookingId)
    .single<BookingRow>()

  if (loadErr || !booking) {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
  }

  // Authorize: the customer who booked it, OR the owner of the shop.
  const isCustomer = booking.customer_id === user.id
  let isOwner = false
  if (!isCustomer) {
    const { data: shop } = await admin
      .from('shops')
      .select('id')
      .eq('id', booking.shop_id)
      .eq('owner_id', user.id)
      .maybeSingle()
    isOwner = !!shop
  }
  if (!isCustomer && !isOwner) {
    return NextResponse.json({ error: 'Not allowed to cancel this booking.' }, { status: 403 })
  }

  if (booking.status !== 'confirmed') {
    return NextResponse.json({ error: 'This booking is not active.' }, { status: 409 })
  }

  // Cancel it.
  const { error: updErr } = await admin
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', booking.id)
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  // Find waitlisted customers wanting a time near the freed slot, then email them.
  const notified = await notifyWaitlist(admin, booking)

  return NextResponse.json({ ok: true, notified })
}

async function notifyWaitlist(
  admin: ReturnType<typeof createAdminClient>,
  booking: BookingRow,
): Promise<number> {
  const freedMs = new Date(booking.start_time).getTime()
  const windowMs = MATCH_WINDOW_MIN * 60 * 1000

  // Pull all "waiting" rows for this barber, then filter by time window in JS.
  const { data: entries } = await admin
    .from('waitlist')
    .select('id,customer_email,customer_name,preferred_at')
    .eq('staff_id', booking.staff_id)
    .eq('status', 'waiting')

  const matches = (entries ?? []).filter(
    e => Math.abs(new Date(e.preferred_at).getTime() - freedMs) <= windowMs,
  )
  if (matches.length === 0) return 0

  const when = format(new Date(booking.start_time), 'EEE, MMM d · HH:mm')
  const bookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/book/${booking.shop_id}`

  // Email everyone (notify-all). Failures don't block the others.
  await Promise.allSettled(
    matches.map(m =>
      sendWaitlistOpeningEmail({
        to: m.customer_email,
        name: m.customer_name,
        shopName: booking.shops?.name ?? 'the shop',
        staffName: booking.staff?.full_name ?? 'your barber',
        serviceName: booking.services?.name ?? 'your service',
        when,
        bookUrl,
      }),
    ),
  )

  // Mark them notified so a later cancellation doesn't spam the same people.
  await admin
    .from('waitlist')
    .update({ status: 'notified', notified_at: new Date().toISOString() })
    .in('id', matches.map(m => m.id))

  return matches.length
}
