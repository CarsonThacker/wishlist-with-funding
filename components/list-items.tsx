'use client'

import { useState, useTransition } from 'react'
import { LockKeyhole } from 'lucide-react'
import { addWishlistListItem, claimWishlistItem, deleteWishlistListItem, updateWishlistListItem } from '@/app/actions/lists'
import { SetAdminPasswordForm } from '@/components/set-admin-password-form'

type Item = { id: string; name: string; description: string | null; price: number; saved: number; image_url: string | null; url: string | null; claimed_by?: string | null }
type ProductPreview = { title?: string; description?: string; price?: number | null; imageUrl?: string }
type List = { slug: string; title: string; list_type: string; owner_name: string; adminPasswordConfigured?: boolean; items: Item[] }

function GiftCard({ item, showMoney = true }: { item: Item; showMoney?: boolean }) {
  const price = Number(item.price)
  const saved = Number(item.saved)
  const percent = price > 0 ? Math.min(Math.round((saved / price) * 100), 100) : 0
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {item.image_url ? <img src={item.image_url} alt={item.name} className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center bg-gray-50 text-sm text-gray-400">no image</div>}
      <div className="p-4">
        <h3 className="font-medium text-gray-900">{item.url ? <a className="underline-offset-4 hover:underline" href={item.url} target="_blank" rel="noreferrer">{item.name}</a> : item.name}</h3>
        {item.description && <p className="mt-1 line-clamp-4 whitespace-pre-line text-sm text-gray-500">{item.description}</p>}
        {showMoney && <>
          <div className="mt-4 flex items-center justify-between text-sm"><span className="text-gray-600">${saved.toFixed(2)} saved</span><span className="font-medium text-gray-900">${price.toFixed(2)}</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-label={`${item.name} savings`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div className={`h-full rounded-full ${percent <= 20 ? 'bg-red-500' : percent <= 50 ? 'bg-orange-500' : percent <= 80 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${percent}%` }} />
          </div>
        </>}
      </div>
    </article>
  )
}

export function PublicListItems({ list }: { list: List }) {
  const [buyerName, setBuyerName] = useState('')
  const [nameSubmitted, setNameSubmitted] = useState(false)
  const [claimedHere, setClaimedHere] = useState<string[]>([])
  const [claimedByOthers, setClaimedByOthers] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const supportsClaims = list.list_type === 'birthday' || list.list_type === 'christmas'

  if (supportsClaims && !nameSubmitted) {
    return <form onSubmit={(event) => { event.preventDefault(); if (buyerName.trim()) setNameSubmitted(true) }} className="mx-auto max-w-md rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900">before you view the gifts</h2>
      <p className="mt-1 text-sm text-gray-500">enter your name so everyone can see who claimed a gift</p>
      <label htmlFor="buyer-name" className="mt-4 block text-sm text-gray-700">your name</label>
      <input id="buyer-name" value={buyerName} onChange={(event) => setBuyerName(event.target.value)} required maxLength={60} className="mt-1 min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base" />
      <button className="mt-3 min-h-11 w-full rounded-lg bg-black px-4 text-sm font-medium text-white">view list</button>
    </form>
  }

  if (!list.items.length) return <p className="rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">nothing on the list yet</p>

  function claim(item: Item) {
    setError('')
    startTransition(async () => {
      const result = await claimWishlistItem(list.slug, item.id, buyerName.trim())
      if (result.error) {
        setError(result.error)
        if (result.claimedBy) setClaimedByOthers((current) => ({ ...current, [item.id]: result.claimedBy! }))
      } else setClaimedHere((claimed) => [...claimed, item.id])
    })
  }

  return <div className="space-y-4">
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {list.items.map((item) => {
        const claimed = Boolean(item.claimed_by || claimedHere.includes(item.id) || claimedByOthers[item.id])
        const claimedByMe = claimedHere.includes(item.id)
        return <div key={item.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <GiftCard item={item} showMoney={list.list_type === 'wishlist'} />
          {supportsClaims && <div className="border-t border-gray-100 p-3">
            {claimed ? <div className="flex min-h-11 items-center gap-2 rounded-lg bg-gray-50 px-3 text-sm font-medium text-gray-700"><LockKeyhole aria-hidden="true" className="size-4" />{claimedByMe ? 'marked as bought by you' : `claimed by ${item.claimed_by || claimedByOthers[item.id] || 'someone'}`}</div> : <button onClick={() => claim(item)} disabled={isPending} className="min-h-11 w-full rounded-lg bg-black px-4 text-sm font-medium text-white disabled:opacity-50">{isPending ? 'saving...' : 'i bought this'}</button>}
            {claimedByMe && item.url && <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 flex min-h-11 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700">open product</a>}
          </div>}
        </div>
      })}
    </div>
  </div>
}

export function ManageList({ list, token }: { list: List; token: string }) {
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [itemName, setItemName] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [productMessage, setProductMessage] = useState('')
  const [isFetchingProduct, setIsFetchingProduct] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function fetchProductDetails() {
    if (!productUrl.trim()) return
    setIsFetchingProduct(true)
    setProductMessage('fetching product details...')
    try {
      const response = await fetch('/api/product-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl.trim() }),
      })
      const details = await response.json() as ProductPreview & { error?: string }
      if (!response.ok) {
        setProductMessage(details.error ?? 'Could not fetch details. You can enter them manually.')
        return
      }
      setItemName(details.title ?? '')
      setItemDescription(details.description ?? '')
      setItemPrice(details.price == null ? '' : String(details.price))
      setImageUrl(details.imageUrl ?? '')
      setProductMessage('Details added. Check them before saving.')
    } catch {
      setProductMessage('Could not fetch details. You can enter them manually.')
    } finally {
      setIsFetchingProduct(false)
    }
  }

  function addItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    startTransition(async () => {
      const itemDescription = String(form.get('description') ?? '').trim()
      const options = [
        ['Size', String(form.get('size') ?? '').trim()],
        ['Color', String(form.get('color') ?? '').trim()],
        ['Other details', String(form.get('otherDetails') ?? '').trim()],
      ].filter(([, value]) => value)
      const optionLines = options.map(([label, value]) => `${label}: ${value}`)
      const optionLength = optionLines.join('\n').length
      const description = [
        itemDescription.slice(0, Math.max(0, 500 - optionLength - (optionLines.length ? 1 : 0))),
        ...optionLines,
      ].filter(Boolean).join('\n')
      const result = await addWishlistListItem(token, {
        name: String(form.get('name') ?? ''),
        description,
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
      {!list.adminPasswordConfigured && <SetAdminPasswordForm token={token} />}
      {formOpen && <form onSubmit={addItem} className="grid gap-3 rounded-xl border border-gray-200 p-4 sm:grid-cols-2">
        <label className="text-sm text-gray-700 sm:col-span-2">product page URL<input name="url" type="url" value={productUrl} onChange={(event) => setProductUrl(event.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base" placeholder="https://any-store.com/product/..." /></label>
        <button type="button" onClick={() => void fetchProductDetails()} disabled={isFetchingProduct || !productUrl.trim()} className="min-h-11 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-800 disabled:opacity-50 sm:col-span-2">{isFetchingProduct ? 'fetching product details...' : 'fetch product details'}</button>
        {productMessage && <p role="status" className="text-sm text-gray-500 sm:col-span-2">{productMessage}</p>}
        <label className="text-sm text-gray-700">item name<input required name="name" value={itemName} onChange={(event) => setItemName(event.target.value)} maxLength={120} className="mt-1 block min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base" /></label>
        {list.list_type === 'wishlist' && <label className="text-sm text-gray-700">price<input required name="price" value={itemPrice} onChange={(event) => setItemPrice(event.target.value)} type="number" min="0" step="0.01" className="mt-1 block min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base" /></label>}
        <label className="text-sm text-gray-700 sm:col-span-2">description<textarea name="description" value={itemDescription} onChange={(event) => setItemDescription(event.target.value)} maxLength={500} rows={3} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-base" /></label>
        <label className="text-sm text-gray-700">size<input name="size" maxLength={50} className="mt-1 block min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base" placeholder="e.g. medium, 8.5" /></label>
        <label className="text-sm text-gray-700">color<input name="color" maxLength={50} className="mt-1 block min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base" placeholder="e.g. navy blue" /></label>
        <label className="text-sm text-gray-700 sm:col-span-2">other details<input name="otherDetails" maxLength={200} className="mt-1 block min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base" placeholder="style, model, preferences, or anything else" /></label>
        <label className="text-sm text-gray-700 sm:col-span-2">image URL<input name="imageUrl" type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base" placeholder="https://" /></label>
        {imageUrl && <div className="sm:col-span-2"><img src={imageUrl} alt={`${itemName || 'Product'} thumbnail preview`} className="max-h-48 max-w-full rounded-lg border border-gray-200 object-contain" /></div>}
        {error && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <button disabled={isPending || isFetchingProduct} className="min-h-11 rounded-lg bg-black px-4 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2">{isPending ? 'adding...' : 'add item'}</button>
      </form>}
      {error && !formOpen && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {!list.items.length ? <p className="rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">your list is empty</p> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {list.items.map((item) => <div key={item.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <GiftCard item={item} showMoney={list.list_type === 'wishlist'} />
          {list.list_type === 'wishlist' ? <form onSubmit={(event) => saveAmount(event, item)} className="flex items-end gap-2 border-t border-gray-100 p-3">
            <label className="flex-1 text-xs text-gray-500">amount saved<input name="saved" type="number" min="0" max={item.price} step="0.01" defaultValue={item.saved} className="mt-1 block min-h-11 w-full rounded-lg border border-gray-200 px-3 text-base text-gray-900" /></label>
            <button disabled={isPending} className="min-h-11 rounded-lg bg-black px-3 text-sm text-white disabled:opacity-50">save</button>
            <button type="button" disabled={isPending} onClick={() => deleteItem(item)} className="min-h-11 rounded-lg border border-gray-200 px-3 text-sm text-gray-700">delete</button>
          </form> : <div className="border-t border-gray-100 p-3"><button type="button" disabled={isPending} onClick={() => deleteItem(item)} className="min-h-11 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-700">remove item</button></div>}
        </div>)}
      </div>}
    </div>
  )
}
