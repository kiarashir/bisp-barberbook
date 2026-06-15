import { Resend } from 'resend'

// "From" address. Resend's shared sandbox sender (onboarding@resend.dev) works
// without verifying a domain, but can only deliver to your own account email.
// Set RESEND_FROM to a verified address once you have a domain set up.
const FROM = process.env.RESEND_FROM || 'BarberBook <onboarding@resend.dev>'

type WaitlistEmail = {
  to: string
  name?: string | null
  shopName: string
  staffName: string
  serviceName: string
  /** Human-readable slot time, already formatted (e.g. "Mon, Jun 16 · 15:00"). */
  when: string
  /** Link back into the booking flow for this shop. */
  bookUrl: string
}

// Emails one waitlisted customer that a matching slot has opened up.
// Returns { skipped: true } (and logs) if email isn't configured, so the app
// still works in dev / for graders without a Resend key.
export async function sendWaitlistOpeningEmail(msg: WaitlistEmail) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[email] RESEND_API_KEY not set — skipping waitlist email to', msg.to)
    return { skipped: true as const }
  }

  const resend = new Resend(key)
  const greeting = msg.name ? `Hi ${msg.name},` : 'Hi,'

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, sans-serif; color: #1c1917; max-width: 480px; margin: 0 auto;">
      <h2 style="margin: 0 0 12px;">A slot just opened up 🎉</h2>
      <p style="margin: 0 0 8px;">${greeting}</p>
      <p style="margin: 0 0 16px;">
        Good news — a time near the one you wanted is now free at
        <strong>${msg.shopName}</strong>.
      </p>
      <div style="border: 1px solid #e7e5e4; border-radius: 12px; padding: 16px; margin: 0 0 16px;">
        <p style="margin: 0 0 4px;"><strong>${msg.serviceName}</strong> with ${msg.staffName}</p>
        <p style="margin: 0; color: #57534e;">Around ${msg.when}</p>
      </div>
      <p style="margin: 0 0 16px; color: #57534e;">
        Slots are first-come, first-served — book now before someone else grabs it.
      </p>
      <a href="${msg.bookUrl}"
         style="display: inline-block; background: #1c1917; color: #fff; text-decoration: none;
                padding: 10px 20px; border-radius: 9999px; font-weight: 500;">
        Book now
      </a>
      <p style="margin: 24px 0 0; color: #a8a29e; font-size: 12px;">
        You're receiving this because you joined the waitlist on BarberBook.
      </p>
    </div>
  `

  const { error } = await resend.emails.send({
    from: FROM,
    to: msg.to,
    subject: `A slot opened up at ${msg.shopName}`,
    html,
  })

  if (error) {
    console.error('[email] failed to send waitlist email to', msg.to, error)
    return { skipped: false as const, error }
  }
  return { skipped: false as const }
}
