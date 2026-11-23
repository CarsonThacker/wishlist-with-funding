import { notFound } from 'next/navigation'
import { getManagedWishlist } from '@/app/actions/lists'
import { ManageList } from '@/components/list-items'

export default async function ManageWishlistPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const list = await getManagedWishlist(token)
  if (!list) notFound()

  return <main className="min-h-screen bg-white px-5 py-10 sm:px-8">
    <div className="mx-auto max-w-4xl">
      <a href={`/list/${list.slug}`} className="text-sm text-gray-500 hover:text-gray-900">view shared list</a>
      <div className="mt-6"><ManageList list={list} token={token} /></div>
    </div>
  </main>
}
