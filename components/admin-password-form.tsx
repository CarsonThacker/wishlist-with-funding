'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { unlockWishlistAdmin } from '@/app/actions/lists'

export function AdminPasswordForm({ slug, title }: { slug: string; title: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await unlockWishlistAdmin(slug, password)
      if (result.error) {
        setError(result.error)
        return
      }
      setPassword('')
      router.refresh()
    })
  }

  return (
    <section className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
      <p className="text-sm text-gray-500">list admin</p>
      <h1 className="mt-1 text-xl font-semibold text-gray-900">Edit {title}</h1>
      <p className="mt-2 text-sm text-gray-600">Enter the admin password you chose when creating this list.</p>
      <form onSubmit={submit} className="mt-5 space-y-3">
        <label htmlFor="admin-password-entry" className="block text-sm font-medium text-gray-700">admin password</label>
        <input id="admin-password-entry" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={128} className="min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base outline-none focus:border-gray-500" />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={isPending} className="min-h-11 w-full rounded-lg bg-black px-4 text-sm font-semibold text-white disabled:opacity-50">{isPending ? 'checking...' : 'unlock edit access'}</button>
      </form>
    </section>
  )
}
