import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Nav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get role for logged-in users so we can show the right links.
  let role: string | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    role = data?.role ?? null
  }

  const linkClass = 'text-sm text-stone-600 hover:text-stone-900 transition'
  const primaryClass =
    'text-sm font-medium rounded-full px-4 py-1.5 bg-stone-900 text-white hover:bg-stone-800 transition'

  return (
    <nav className="border-b border-stone-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-stone-900 tracking-tight">
          BarberBook
        </Link>
        <div className="flex items-center gap-5">
          {!user && (
            <>
              <Link href="/shops" className={linkClass}>Shops</Link>
              <Link href="/login" className={linkClass}>Log in</Link>
              <Link href="/signup" className={primaryClass}>Sign up</Link>
            </>
          )}

          {role === 'customer' && (
            <>
              <Link href="/shops" className={linkClass}>Shops</Link>
              <Link href="/try-on" className={linkClass}>Try-on</Link>
              <Link href="/favorites" className={linkClass}>Saved</Link>
              <Link href="/bookings" className={linkClass}>My bookings</Link>
              <Link href="/account" className={linkClass}>Account</Link>
              <form action="/auth/signout" method="post">
                <button className={linkClass}>Log out</button>
              </form>
            </>
          )}

          {role === 'shop_owner' && (
            <>
              <Link href="/owner" className={linkClass}>Dashboard</Link>
              <Link href="/account" className={linkClass}>Account</Link>
              <form action="/auth/signout" method="post">
                <button className={linkClass}>Log out</button>
              </form>
            </>
          )}

          {role === 'admin' && (
            <>
              <Link href="/admin/shops" className={linkClass}>Admin</Link>
              <form action="/auth/signout" method="post">
                <button className={linkClass}>Log out</button>
              </form>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
