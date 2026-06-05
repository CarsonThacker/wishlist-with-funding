import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getWishlistItems } from '@/app/actions/wishlist'
import { AdminPanel } from '@/components/admin-panel'

export default async function AdminPage() {
  const cookieStore = await cookies()
  if (cookieStore.get('logged_in')?.value !== 'true') {
    redirect('/sign-in')
  }

  const items = await getWishlistItems()

  return <AdminPanel initialItems={items} />
}
