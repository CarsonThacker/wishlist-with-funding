'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import {
  addWishlistItem,
  updateWishlistItem,
  deleteWishlistItem,
  addSavings,
} from '@/app/actions/wishlist'
import { CircularProgress } from './circular-progress'
import type { WishlistItem } from '@/lib/db/schema'

interface AdminPanelProps {
  initialItems: WishlistItem[]
}

function AdminItemCard({
  item,
  onRefresh,
}: {
  item: WishlistItem
  onRefresh: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [savingsAmount, setSavingsAmount] = useState('')
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: item.name,
    description: item.description ?? '',
    price: String(item.price),
    imageUrl: item.imageUrl ?? '',
    url: item.url ?? '',
  })
  const [showDelete, setShowDelete] = useState(false)

  const price = parseFloat(String(item.price))
  const saved = parseFloat(String(item.saved))
  const percent = price > 0 ? Math.min((saved / price) * 100, 100) : 0

  function handleAddSavings() {
    const amount = parseFloat(savingsAmount)
    if (!amount || amount <= 0) return
    startTransition(async () => {
      await addSavings(item.id, amount)
      setSavingsAmount('')
      onRefresh()
    })
  }

  function handleUpdate() {
    startTransition(async () => {
      await updateWishlistItem(item.id, {
        name: editData.name,
        description: editData.description || undefined,
        price: parseFloat(editData.price),
        imageUrl: editData.imageUrl || undefined,
        url: editData.url || undefined,
      })
      setEditing(false)
      onRefresh()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteWishlistItem(item.id)
      onRefresh()
    })
  }

  if (editing) {
    return (
      <div
        className="bg-white rounded-3xl p-5 animate-in fade-in duration-200"
        style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}
      >
        <h3 className="font-semibold text-gray-900 mb-4">Edit Item</h3>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Name', key: 'name', placeholder: 'AirPods Pro', type: 'text' },
            { label: 'Description', key: 'description', placeholder: 'Optional description', type: 'text' },
            { label: 'Price ($)', key: 'price', placeholder: '249.00', type: 'number' },
            { label: 'Image URL', key: 'imageUrl', placeholder: 'https://...', type: 'url' },
            { label: 'Product URL', key: 'url', placeholder: 'https://apple.com/...', type: 'url' },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
              <input
                type={type}
                value={editData[key as keyof typeof editData]}
                onChange={(e) => setEditData((d) => ({ ...d, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleUpdate}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: '#007AFF' }}
          >
            Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 transition-all active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="bg-white rounded-3xl overflow-hidden transition-all duration-300"
      style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden flex-shrink-0">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            ${saved.toFixed(2)} / ${price.toFixed(2)}
          </p>
        </div>

        <CircularProgress percent={percent} size={52} strokeWidth={4} />
      </div>

      {/* Add savings row */}
      <div className="px-4 pb-4 flex gap-2">
        <input
          type="number"
          value={savingsAmount}
          onChange={(e) => setSavingsAmount(e.target.value)}
          placeholder="Add $"
          min="0"
          step="0.01"
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
        />
        <button
          onClick={handleAddSavings}
          disabled={isPending || !savingsAmount}
          className="px-3 py-2 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-40"
          style={{ backgroundColor: '#34C759' }}
        >
          + Save
        </button>
        <button
          onClick={() => setEditing(true)}
          className="px-3 py-2 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 transition-all active:scale-95 hover:bg-gray-200"
        >
          Edit
        </button>
        {showDelete ? (
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="px-3 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 transition-all active:scale-95 disabled:opacity-50"
          >
            Sure?
          </button>
        ) : (
          <button
            onClick={() => setShowDelete(true)}
            className="px-3 py-2 rounded-xl text-sm font-medium text-red-400 bg-red-50 transition-all active:scale-95 hover:bg-red-100"
          >
            Del
          </button>
        )}
      </div>
    </div>
  )
}

export function AdminPanel({ initialItems }: AdminPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    url: '',
  })
  const [error, setError] = useState('')

  function handleRefresh() {
    router.refresh()
  }

  function handleAdd() {
    if (!newItem.name || !newItem.price) {
      setError('Name and price are required.')
      return
    }
    setError('')
    startTransition(async () => {
      await addWishlistItem({
        name: newItem.name,
        description: newItem.description || undefined,
        price: parseFloat(newItem.price),
        imageUrl: newItem.imageUrl || undefined,
        url: newItem.url || undefined,
      })
      setNewItem({ name: '', description: '', price: '', imageUrl: '', url: '' })
      setShowAdd(false)
      router.refresh()
    })
  }

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10" style={{ backdropFilter: 'blur(20px)' }}>
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-400">{"Carson's Wishlist"}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="px-3 py-1.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-all"
            >
              View Site
            </a>
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-50 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Add item button */}
        <div className="mb-6">
          {!showAdd ? (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full py-3.5 rounded-3xl font-semibold text-sm text-white transition-all duration-200 active:scale-95 hover:opacity-90 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#007AFF' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Wishlist Item
            </button>
          ) : (
            <div
              className="bg-white rounded-3xl p-5 animate-in fade-in slide-in-from-top-2 duration-300"
              style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}
            >
              <h2 className="font-bold text-gray-900 mb-4">New Item</h2>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Name *', key: 'name', placeholder: 'AirPods Pro', type: 'text' },
                  { label: 'Description', key: 'description', placeholder: 'Optional', type: 'text' },
                  { label: 'Price ($) *', key: 'price', placeholder: '249.00', type: 'number' },
                  { label: 'Image URL', key: 'imageUrl', placeholder: 'https://...', type: 'url' },
                  { label: 'Product URL', key: 'url', placeholder: 'https://apple.com/...', type: 'url' },
                ].map(({ label, key, placeholder, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                    <input
                      type={type}
                      value={newItem[key as keyof typeof newItem]}
                      onChange={(e) =>
                        setNewItem((d) => ({ ...d, [key]: e.target.value }))
                      }
                      placeholder={placeholder}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                    />
                  </div>
                ))}
              </div>
              {error && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl mt-3">{error}</p>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAdd}
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: '#007AFF' }}
                >
                  {isPending ? 'Adding...' : 'Add Item'}
                </button>
                <button
                  onClick={() => { setShowAdd(false); setError('') }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 transition-all active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Items list */}
        {initialItems.length === 0 ? (
          <div className="text-center py-20 text-gray-300">
            <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
            <p className="text-sm font-medium">No items yet. Add your first!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              {initialItems.length} {initialItems.length === 1 ? 'item' : 'items'}
            </p>
            {initialItems.map((item) => (
              <AdminItemCard key={item.id} item={item} onRefresh={handleRefresh} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
