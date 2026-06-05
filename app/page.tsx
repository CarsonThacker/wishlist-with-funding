import { getPublicWishlistItems } from '@/app/actions/public'
import { WishlistGrid } from '@/components/wishlist-grid'

export default async function HomePage() {
  const items = await getPublicWishlistItems()

  const totalSaved = items.reduce((sum, i) => sum + parseFloat(String(i.saved)), 0)
  const totalGoal = items.reduce((sum, i) => sum + parseFloat(String(i.price)), 0)

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(0,122,255,0.07) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-14 text-center relative">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl font-bold text-white shadow-lg select-none"
            style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)' }}
          >
            C
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight text-balance">
            {"Carson's Wishlist"}
          </h1>
          <p className="mt-3 text-lg text-gray-400 font-medium">
            {"Things I'm saving up for — help me get there!"}
          </p>

          {/* Stats */}
          {items.length > 0 && (
            <div className="flex items-center justify-center gap-8 mt-10">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{items.length}</div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                  Items
                </div>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  ${totalSaved.toFixed(0)}
                </div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                  Saved
                </div>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  ${totalGoal.toFixed(0)}
                </div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                  Total Goal
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="h-px bg-gray-100" />
      </div>

      {/* Grid */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <WishlistGrid items={items} />
      </div>

      {/* Footer */}
      <div className="pb-12 text-center">
        <p className="text-xs text-gray-300">
          Made with care &bull; Venmo @carsonthacker
        </p>
      </div>
    </main>
  )
}
