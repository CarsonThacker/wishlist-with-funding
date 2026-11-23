import { notFound } from 'next/navigation'
import { getWishlistList } from '@/app/actions/lists'
import { BrandMark } from '@/components/brand-mark'
import { PublicListItems } from '@/components/list-items'

export default async function SharedListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const list = await getWishlistList(slug)
  if (!list) notFound()
  const showSavings = list.list_type === 'wishlist'
  const total = list.items.reduce((sum, item) => sum + Number(item.price), 0)
  const saved = list.items.reduce((sum, item) => sum + Number(item.saved), 0)

  return <main className="min-h-screen bg-white px-5 py-12 sm:px-8">
    <div className="mx-auto max-w-5xl">
      <BrandMark className="mb-5" />
      <header className="mb-8 mt-6 border-b border-gray-100 pb-6">
        <p className="text-sm text-gray-500">{list.owner_name}&apos;s {list.list_type === 'wishlist' ? 'wishlist' : `${list.list_type} list`}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{list.title}</h1>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">{list.items.length} items{showSavings && <><span className="px-2">·</span>${saved.toFixed(2)} saved of ${total.toFixed(2)}</>}</p>
          <a href={`/manage/${list.slug}`} className="inline-flex min-h-11 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-800 hover:bg-gray-50">edit this list</a>
        </div>
      </header>
      <PublicListItems list={list} />
    </div>
  </main>
}
