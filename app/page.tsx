import { BrandMark } from '@/components/brand-mark'
import { CreateListForm } from '@/components/create-list-form'

export default function HomePage() {
  return <main className="min-h-screen bg-[#fbfaf8] px-5 pb-10 pt-8 sm:px-8 sm:pt-14">
    <div className="mx-auto max-w-xl">
      <header className="mb-8 sm:mb-10">
        <BrandMark />
        <div className="mt-8 border-l-2 border-gray-950 pl-4 sm:mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">A little wish, shared by link</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl">Make it easy to ask.</h1>
          <p className="mt-3 max-w-md text-base leading-7 text-gray-600">Keep your wishlist, birthday, or holiday ideas in one simple place.</p>
        </div>
      </header>

      <CreateListForm />

      <footer className="mt-6 rounded-xl border border-gray-200/80 bg-white/70 px-4 py-3 text-sm leading-6 text-gray-600">
        Lists don&apos;t appear in a public directory. Anyone with your link can view yours, so share it only with people you trust.
      </footer>
      <p className="mt-8 text-center text-xs font-medium uppercase tracking-[0.16em] text-gray-400">If You Ask</p>
    </div>
  </main>
}
