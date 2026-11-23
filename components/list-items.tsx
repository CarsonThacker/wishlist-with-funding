'use client'

import { useState, useTransition } from 'react'
import { addWishlistListItem, deleteWishlistListItem, updateWishlistListItem } from '@/app/actions/lists'

type Item = { id: string; name: string; description: string | null; price: number; saved: number; image_url: string | null; url: string | null }
type List = { slug: string; title: string; list_type: string; owner_name: string; items: Item[] }

function GiftCard({ item }: { item: Item }) {
  const price = Number(item.price)
  const saved = Number(item.saved)
  const percent = price > 0 ? Math.min(Math.round((saved / price) * 100), 100) : 0
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {item.image_url ? <img src={item.image_url} alt={item.name} className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center bg-gray-50 text-sm text-gray-400">no image</div>}
      <div className="p-4">
        <h3 className="font-medium text-gray-900">{item.url ? <a className="underline-offset-4 hover:underline" href={item.url} target="_blank" rel="noreferrer">{item.name}</a> : item.name}</h3>
        {item.description && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.description}</p>}
        <div className="mt-4 flex items-center justify-between text-sm"><span className="text-gray-600">${saved.toFixed(2)} saved</span><span className="font-medium text-gray-900">${price.toFixed(2)}</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-label={`${item.name} savings`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className={`h-full rounded-full ${percent <= 20 ? 'bg-red-500' : percent <= 50 ? 'bg-orange-500' : percent <= 80 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${percent}%` }} />
        </div>
      </div>
    </article>
  )
}

export function PublicListItems({ list }: { list: List }) {
  if (!list.items.length) return <p className="rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">nothing on the list yet</p>
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.items.map((item) => <GiftCard key={item.id} item={item} />)}</div>
}

export function ManageList({ list, token }: { list: List; token: string }) {
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function addItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await addWishlistListItem(token, {
        name: String(form.get('name') ?? ''),
        description: String(form.get('description') ?? ''),
        price: Number(form.get('price')),
        imageUrl: String(form.get('imageUrl') ?? ''),
        url: String(form.get('url') ?? ''),
      })
      if (result.error) setError(result.error)
      else window.location.reload()
    })
  }

  function saveAmount(event: React.FormEvent<HTMLFormElement>, item: Item) {
    event.preventDefault()
    const amount = Number(new FormData(event.currentTarget).get('saved'))
    startTransition(async () => {
      const result = await updateWishlistListItem(token, item.id, amount)
      if (result.error) setError(result.error)
      else window.location.reload()
    })
  }

  function deleteItem(item: Item) {
    if (!window.confirm(`remove ${item.name} from this list?`)) return
    startTransition(async () => {
      const result = await deleteWishlistListItem(token, item.id)
      if (result.error) setError(result.error)
      else window.location.reload()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-semibold text-gray-900">{list.title}</h1><p className="mt-1 text-sm text-gray-500">list admin</p></div>
        <button onClick={() => setFormOpen((open) => !open)} className="min-h-11 rounded-lg bg-black px-4 text-sm font-medium text-white hover:bg-gray-800">{formOpen ? 'cancel' : 'add item'}</button>
      </div>
      {formOpen && <form onSubmit={addItem} className="grid gap-3 rounded-xl border border-gray-200 p-4 sm:grid-cols-2">
        <label className="text-sm text-gray-700">item name<input required name="name" maxLength={120} className="mt-1 block min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base" /></label>
        <label className="text-sm text-gray-700">price<input required name="price" type="number" min="0" step="0.01" className="mt-1 block min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base" /></label>
        <label className="text-sm text-gray-700 sm:col-span-2">description<input name="description" maxLength={500} className="mt-1 block min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base" /></label>
        <label className="text-sm text-gray-700">image URL<input name="imageUrl" type="url" className="mt-1 block min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base" placeholder="https://" /></label>
        <label className="text-sm text-gray-700">product URL<input name="url" type="url" className="mt-1 block min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base" placeholder="https://" /></label>
        {error && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <button disabled={isPending} className="min-h-11 rounded-lg bg-black px-4 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2">{isPending ? 'adding...' : 'add item'}</button>
      </form>}
      {error && !formOpen && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {!list.items.length ? <p className="rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">your list is empty</p> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {list.items.map((item) => <div key={item.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <GiftCard item={item} />
          <form onSubmit={(event) => saveAmount(event, item)} className="flex items-end gap-2 border-t border-gray-100 p-3">
            <label className="flex-1 text-xs text-gray-500">amount saved<input name="saved" type="number" min="0" max={item.price} step="0.01" defaultValue={item.saved} className="mt-1 block min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base text-gray-900" /></label>
            <button disabled={isPending} className="min-h-11 rounded-lg bg-black px-3 text-sm text-white disabled:opacity-50">save</button>
            <button type="button" disabled={isPending} onClick={() => deleteItem(item)} className="min-h-11 rounded-lg border border-gray-200 px-3 text-sm text-gray-700">delete</button>
          </form>
        </div>)}
      </div>}
    </div>
  )
}
