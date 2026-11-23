'use client'

import { useState, useTransition } from 'react'
import { createWishlistList, verifyEarlyAccessCode, type ListKind } from '@/app/actions/lists'

export function CreateListForm() {
  const [accessCode, setAccessCode] = useState('')
  const [accessGranted, setAccessGranted] = useState(false)
  const [ownerName, setOwnerName] = useState('')
  const [listKind, setListKind] = useState<ListKind>('wishlist')
  const [title, setTitle] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('')
  const [links, setLinks] = useState<{ share: string; admin: string; passwordAdmin: string } | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  function submitCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    startTransition(async () => {
      const valid = await verifyEarlyAccessCode(accessCode)
      if (!valid) {
        setError('That early access code is not valid.')
        return
      }
      setAccessGranted(true)
    })
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (adminPassword !== confirmAdminPassword) {
      setError('The admin passwords do not match.')
      return
    }
    startTransition(async () => {
      const result = await createWishlistList({ ownerName, listKind, title, accessCode, adminPassword })
      if (result.error || !result.slug || !result.adminToken) {
        setError(result.error ?? 'Could not create your list.')
        return
      }
      const base = window.location.origin
      setLinks({
        share: `${base}/list/${result.slug}`,
        admin: `${base}/manage/${result.adminToken}`,
        passwordAdmin: `${base}/manage/${result.slug}`,
      })
    })
  }

  async function copyShareLink() {
    if (!links) return
    await navigator.clipboard.writeText(links.share)
    setCopied(true)
  }

  if (!accessGranted) {
    return (
      <section className="rounded-xl border border-gray-200 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">early access</h2>
        <p className="mt-1 text-sm text-gray-500">enter your invite code to create a list</p>
        <form onSubmit={submitCode} className="mt-5 space-y-3">
          <label htmlFor="early-access-code" className="block text-sm text-gray-700">access code</label>
          <input id="early-access-code" type="password" autoComplete="off" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} required className="min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base outline-none focus:border-gray-500" />
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={isPending} className="min-h-11 w-full rounded-lg bg-black px-4 text-sm font-semibold text-white disabled:opacity-50">{isPending ? 'checking...' : 'continue'}</button>
        </form>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-gray-200 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900">create a list</h2>
      <p className="mt-1 text-sm text-gray-500">make a list, add gifts, and share it with anyone</p>

      {!links ? (
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="owner-name" className="mb-1.5 block text-sm text-gray-700">your name</label>
            <input id="owner-name" value={ownerName} onChange={(event) => setOwnerName(event.target.value)} required maxLength={60} className="min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base outline-none focus:border-gray-500" placeholder="your name" />
          </div>
          <div>
            <label htmlFor="list-type" className="mb-1.5 block text-sm text-gray-700">list type</label>
            <select id="list-type" value={listKind} onChange={(event) => setListKind(event.target.value as ListKind)} className="min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-base outline-none focus:border-gray-500">
              <option value="wishlist">wishlist</option>
              <option value="birthday">birthday list</option>
              <option value="christmas">christmas list</option>
            </select>
          </div>
          <div>
            <label htmlFor="list-title" className="mb-1.5 block text-sm text-gray-700">list title <span className="text-gray-400">optional</span></label>
            <input id="list-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} className="min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base outline-none focus:border-gray-500" placeholder="leave blank for a default title" />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1.5 block text-sm text-gray-700">admin password</label>
            <input id="admin-password" type="password" autoComplete="new-password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} minLength={12} maxLength={128} required className="min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base outline-none focus:border-gray-500" />
            <p className="mt-1 text-xs text-gray-500">Use at least 12 characters. You&apos;ll enter this password whenever you want to edit the list.</p>
          </div>
          <div>
            <label htmlFor="confirm-admin-password" className="mb-1.5 block text-sm text-gray-700">confirm admin password</label>
            <input id="confirm-admin-password" type="password" autoComplete="new-password" value={confirmAdminPassword} onChange={(event) => setConfirmAdminPassword(event.target.value)} minLength={12} maxLength={128} required className="min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base outline-none focus:border-gray-500" />
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={isPending} className="min-h-11 w-full rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50">{isPending ? 'creating...' : 'create list'}</button>
        </form>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">your list is ready</p>
            <p className="mt-1 break-all text-sm text-gray-600">share link: {links.share}</p>
            <button onClick={copyShareLink} className="mt-3 min-h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900">{copied ? 'copied' : 'copy share link'}</button>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-gray-900">edit your list with your password</p>
            <p className="mt-1 text-sm text-gray-600">You can open your shared list and tap &apos;edit this list&apos; whenever you need to make changes.</p>
            <a href={links.passwordAdmin} className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-black px-4 text-sm font-medium text-white">enter admin password</a>
          </div>
          <details className="rounded-lg border border-gray-200 p-4">
            <summary className="min-h-11 cursor-pointer content-center text-sm font-medium text-gray-700">show private backup edit link</summary>
            <p className="mt-2 text-sm text-gray-600">Keep this private link safe; anyone with it can edit your list without the password.</p>
            <a href={links.admin} className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900">open backup edit link</a>
          </details>
        </div>
      )}
    </section>
  )
}
