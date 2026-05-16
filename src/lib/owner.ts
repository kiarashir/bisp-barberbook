import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireOwnerShop() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_id', user.id)
    .limit(1)
    .single()
  if (!shop) redirect('/owner/onboarding')
  return { user, shop, supabase }
}
