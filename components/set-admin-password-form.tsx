'use client'

import { useState, useTransition } from 'react'
import { setWishlistAdminPassword } from '@/app/actions/lists'

export function SetAdminPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await setWishlistAdminPassword(token, password, confirmation)
      if (result.error) {
        setError(result.error)
        return
      }
      window.location.reload()
    })
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
      <h2 className="font-semibold text-gray-900">Add password-based editing</h2>
      <p className="mt-1 text-sm text-gray-600">Set a password so you can return to the shared list and unlock editing anytime.</p>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-gray-700">new admin password<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} maxLength={128} required className="mt-1 block min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-base" /></label>
        <label className="text-sm text-gray-700">confirm password<input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={12} maxLength={128} required className="mt-1 block min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-base" /></label>
        {error && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <button disabled={isPending} className="min-h-11 rounded-lg bg-black px-4 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2">{isPending ? 'saving...' : 'set admin password'}</button>
      </form>
    </section>
  )
}
