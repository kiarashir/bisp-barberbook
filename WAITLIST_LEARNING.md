# 🎓 Understanding the Waitlist Feature — Learning Checklist

A running doc to make sure I (the developer) deeply understand what we built and why.
We go stage by stage. Nothing gets checked off until I can explain it in my own words.

Legend: ⬜ not yet · 🟡 in progress · ✅ mastered

---

## Stage 1 — The Problem (the "why before the what")
- ✅ 1.1 What real-world problem does the waitlist solve? (the user's pain — churn: she leaves for a competitor)
- ✅ 1.2 Why did this problem exist before? (dead end: "No free slots" + nothing to click; no waitlist, no email existed)
- 🟡 1.3 What were the different ways we *could* have solved it? (the branches/options)
- ✅ 1.4 Why "get notified when a slot frees up"? (a waitlist nobody acts on is useless; the auto-email is what gives it value)

**Stage 1 key insight locked in:** Two NEW capabilities were added —
(1) customer can JOIN a waitlist instead of leaving, and
(2) when a booking is CANCELLED (slot frees up), the app AUTOMATICALLY EMAILS waiting customers.

## Stage 2 — The Solution (what we built & why this way)
- ⬜ 2.1 The data model: the `waitlist` table and each column's purpose
- ⬜ 2.2 The "join" flow (browser → database, direct insert)
- ⬜ 2.3 The "notify" flow (cancel → API route → email)
- ⬜ 2.4 Why cancellation goes through a server API route, not the browser
- ⬜ 2.5 The two Supabase clients: anon key vs service_role key
- ⬜ 2.6 The matching logic: timestamps + the ±60-minute window
- ⬜ 2.7 Edge cases: double-join, no-spam (notified), email not configured, timezones

## Stage 3 — The Broader Context (why it matters)
- ⬜ 3.1 Security: RLS, why secret keys never touch the browser
- ⬜ 3.2 What this design unlocks (owner-cancel reuse, future notifications)
- ⬜ 3.3 Trade-offs we accepted and what we'd improve with more time

---

## Notes & "aha" moments
(we'll fill this in as we go)
