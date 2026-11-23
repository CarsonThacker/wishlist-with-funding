import { notFound } from 'next/navigation'
import { getAdminPasswordInfo, getManagedWishlist } from '@/app/actions/lists'
import { BrandMark } from '@/components/brand-mark'
import { AdminPasswordForm } from '@/components/admin-password-form'
import { ManageList } from '@/components/list-items'

export default async function ManageWishlistPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const list = await getManagedWishlist(token)
  if (!list) {
    const adminInfo = await getAdminPasswordInfo(token)
    if (!adminInfo) notFound()
    return <main className="min-h-screen bg-white px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <BrandMark />
          <a href={`/list/${adminInfo.slug}`} className="inline-flex min-h-11 items-center text-sm text-gray-500 hover:text-gray-900">view shared list</a>
        </div>
        <div className="mt-6">
          {adminInfo.passwordConfigured
            ? <AdminPasswordForm slug={adminInfo.slug} title={adminInfo.title} />
            : <section className="mx-auto max-w-md rounded-xl border border-gray-200 p-5"><h1 className="font-semibold text-gray-900">Password access not set</h1><p className="mt-2 text-sm text-gray-600">This older list can still be edited with its original private edit link.</p></section>}
        </div>
      </div>
    </main>
  }

  return <main className="min-h-screen bg-white px-5 py-10 sm:px-8">
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <BrandMark />
        <a href={`/list/${list.slug}`} className="inline-flex min-h-11 items-center text-sm text-gray-500 hover:text-gray-900">view shared list</a>
      </div>
      <div className="mt-6"><ManageList list={list} token={token} /></div>
    </div>
  </main>
}
