'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginAction } from '@/app/actions/login'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await loginAction(email, password)
    if (result.success) {
      router.push('/admin')
      router.refresh()
    } else {
      setError(result.error || 'Sign in failed')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">sign in</h1>
          <p className="text-sm text-gray-500 mt-1">manage your wishlist</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all"
              placeholder="carson@gmail.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-semibold text-sm text-white bg-black hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? 'signing in...' : 'sign in'}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-6 text-center">
          demo: carson@gmail.com / 1234
        </p>
      </div>
    </main>
  )
}
