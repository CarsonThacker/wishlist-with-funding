import { getWishlistLists } from '@/app/actions/lists'
import { CreateListForm } from '@/components/create-list-form'

const listTypeLabel = (type: string) => type === 'wishlist' ? 'wishlist' : `${type} list`

export default async function HomePage() {
  const lists = await getWishlistLists()

  return <main className="min-h-screen bg-white px-5 py-12 sm:px-8">
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">wishlists</h1>
        <p className="mt-2 text-sm text-gray-500">make a wishlist, birthday list, or christmas list and share it</p>
      </header>

      <CreateListForm />

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">shared lists</h2>
        {!lists.length ? <p className="rounded-xl border border-gray-200 p-6 text-sm text-gray-500">no lists yet. create the first one above.</p> : <div className="divide-y divide-gray-100 border-y border-gray-100">
          {lists.map((list) => <a key={list.slug} href={`/list/${list.slug}`} className="flex min-h-16 items-center justify-between gap-4 py-3 hover:bg-gray-50">
            <div className="min-w-0"><span className="block truncate font-medium text-gray-900">{list.title}</span><span className="mt-1 block text-xs text-gray-500">{list.owner_name} · {listTypeLabel(list.list_type)}</span></div>
            <span className="shrink-0 text-sm text-gray-400">view</span>
          </a>)}
        </div>}
      </section>
      <footer className="mt-10 text-center text-xs text-gray-400">simple lists made to share</footer>
    </div>
  </main>
}
