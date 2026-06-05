import { getPublicWishlistItems } from '@/app/actions/public'
import { WishlistGrid } from '@/components/wishlist-grid'

export default async function HomePage() {
  const items = await getPublicWishlistItems()

  const totalSaved = items.reduce((sum, i) => sum + parseFloat(String(i.saved)), 0)
  const totalGoal = items.reduce((sum, i) => sum + parseFloat(String(i.price)), 0)

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-10">
        <h1 className="text-3xl font-bold text-gray-900 text-balance">
          carson's wishlist
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          things i'm saving up for — help me get there
        </p>

        {/* Stats */}
        {items.length > 0 && (
          <div className="flex items-center gap-6 mt-8">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{items.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">items</div>
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">
                ${totalSaved.toFixed(0)}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">saved</div>
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">
                ${totalGoal.toFixed(0)}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">goal</div>
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <WishlistGrid items={items} />
      </div>

      {/* Footer */}
      <div className="pb-8 text-center">
        <p className="text-xs text-gray-400">
          venmo @carsonthacker to help
        </p>
      </div>
    </main>
  )
}
