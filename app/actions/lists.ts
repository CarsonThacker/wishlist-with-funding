'use server'

import { createHash, randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export type ListKind = 'wishlist' | 'birthday' | 'christmas'

const EARLY_ACCESS_CODE = 'supawishlistapp'

export async function verifyEarlyAccessCode(code: string) {
  return typeof code === 'string' && code.trim() === EARLY_ACCESS_CODE
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')
const cleanText = (value: unknown, max = 160) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''
const safeWebUrl = (value: unknown) => {
  const url = cleanText(value, 1500)
  if (!url) return null
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null
  } catch {
    return null
  }
}

export async function createWishlistList(formData: {
  ownerName: string
  listKind: ListKind
  title?: string
  accessCode: string
}) {
  if (!(await verifyEarlyAccessCode(formData.accessCode))) {
    return { error: 'That early access code is not valid.' }
  }
  const ownerName = cleanText(formData.ownerName, 60)
  const listKind = formData.listKind
  if (!ownerName || !['wishlist', 'birthday', 'christmas'].includes(listKind)) {
    return { error: 'Add your name and choose a list type.' }
  }

  const slug = randomBytes(9).toString('hex')
  const adminToken = randomBytes(32).toString('base64url')
  const title = cleanText(formData.title, 80) || `${ownerName}'s ${listKind === 'wishlist' ? 'wishlist' : `${listKind} list`}`
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from('wishlist_lists').insert({
    slug,
    title,
    list_type: listKind,
    owner_name: ownerName,
    admin_token_hash: hashToken(adminToken),
  })

  if (error) {
    console.error('[v0] Could not create wishlist list:', error.message)
    return { error: 'Could not create your list. Please try again.' }
  }

  revalidatePath('/')
  return { slug, adminToken }
}

export async function getWishlistLists() {
  const { data, error } = await createSupabaseAdmin()
    .from('wishlist_lists')
    .select('slug, title, list_type, owner_name, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[v0] Could not load wishlist lists:', error.message)
    return []
  }
  return data ?? []
}

export async function getWishlistList(slug: string) {
  const supabase = createSupabaseAdmin()
  const { data: list, error } = await supabase
    .from('wishlist_lists')
    .select('id, slug, title, list_type, owner_name')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !list) return null
  const { data: items, error: itemError } = await supabase
    .from('wishlist_list_items')
    .select('id, name, description, price, saved, image_url, url, buyer_name')
    .eq('list_id', list.id)
    .order('created_at', { ascending: false })

  if (itemError) return null
  return { ...list, items: (items ?? []).map(({ buyer_name, ...item }) => ({ ...item, claimed_by: buyer_name })) }
}

async function getManagedList(token: string) {
  if (!token || token.length > 100) return null
  const { data } = await createSupabaseAdmin()
    .from('wishlist_lists')
    .select('id, slug, title, list_type, owner_name')
    .eq('admin_token_hash', hashToken(token))
    .maybeSingle()
  return data
}

export async function getManagedWishlist(token: string) {
  const list = await getManagedList(token)
  if (!list) return null
  const { data: items, error } = await createSupabaseAdmin()
    .from('wishlist_list_items')
    .select('id, name, description, price, saved, image_url, url')
    .eq('list_id', list.id)
    .order('created_at', { ascending: false })
  if (error) return null
  return { ...list, items: items ?? [] }
}

export async function addWishlistListItem(token: string, input: {
  name: string
  description: string
  price: number
  imageUrl: string
  url: string
}) {
  const list = await getManagedList(token)
  const name = cleanText(input.name, 120)
  const price = Number(input.price)
  if (!list) return { error: 'This edit link is not valid.' }
  if (!name || !Number.isFinite(price) || price < 0 || price > 10000000) {
    return { error: 'Add an item name and a valid price.' }
  }
  const imageUrl = safeWebUrl(input.imageUrl)
  const itemUrl = safeWebUrl(input.url)
  if ((input.imageUrl && !imageUrl) || (input.url && !itemUrl)) {
    return { error: 'Use a valid web address starting with http or https.' }
  }
  const { error } = await createSupabaseAdmin().from('wishlist_list_items').insert({
    list_id: list.id,
    name,
    description: cleanText(input.description, 500) || null,
    price,
    image_url: imageUrl,
    url: itemUrl,
  })
  if (error) return { error: 'Could not add the item. Please try again.' }
  revalidatePath(`/list/${list.slug}`)
  revalidatePath(`/manage/${token}`)
  return { success: true }
}

export async function updateWishlistListItem(token: string, itemId: string, savedAmount: number) {
  const list = await getManagedList(token)
  const amount = Number(savedAmount)
  if (!list) return { error: 'This edit link is not valid.' }
  if (!itemId || !Number.isFinite(amount) || amount < 0) return { error: 'Enter a valid saved amount.' }

  const supabase = createSupabaseAdmin()
  const { data: item } = await supabase
    .from('wishlist_list_items')
    .select('price')
    .eq('id', itemId)
    .eq('list_id', list.id)
    .maybeSingle()
  if (!item) return { error: 'That item was not found.' }

  const { error } = await supabase
    .from('wishlist_list_items')
    .update({ saved: Math.min(amount, Number(item.price)), updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .eq('list_id', list.id)
  if (error) return { error: 'Could not update the saved amount.' }
  revalidatePath(`/list/${list.slug}`)
  revalidatePath(`/manage/${token}`)
  return { success: true }
}

export async function claimWishlistItem(slug: string, itemId: string, buyerName: string) {
  const name = cleanText(buyerName, 60)
  if (!name || !itemId || !slug) return { error: 'Enter your name to claim this gift.' }
  const supabase = createSupabaseAdmin()
  const { data: list } = await supabase
    .from('wishlist_lists')
    .select('id, list_type')
    .eq('slug', slug)
    .maybeSingle()
  if (!list || !['birthday', 'christmas'].includes(list.list_type)) {
    return { error: 'This list does not support gift claims.' }
  }

  const { data: claimed, error } = await supabase
    .from('wishlist_list_items')
    .update({ buyer_name: name })
    .eq('id', itemId)
    .eq('list_id', list.id)
    .is('buyer_name', null)
    .select('id')
    .maybeSingle()

  if (error) return { error: 'Could not reserve this gift. Please try again.' }
  if (!claimed) {
    const { data: current } = await supabase
      .from('wishlist_list_items')
      .select('buyer_name')
      .eq('id', itemId)
      .eq('list_id', list.id)
      .maybeSingle()
    return { error: 'This gift was just reserved by someone else.', claimedBy: current?.buyer_name ?? 'someone' }
  }
  revalidatePath(`/list/${slug}`)
  return { success: true }
}

export async function deleteWishlistListItem(token: string, itemId: string) {
  const list = await getManagedList(token)
  if (!list) return { error: 'This edit link is not valid.' }
  const { error } = await createSupabaseAdmin()
    .from('wishlist_list_items')
    .delete()
    .eq('id', itemId)
    .eq('list_id', list.id)
  if (error) return { error: 'Could not remove that item.' }
  revalidatePath(`/list/${list.slug}`)
  revalidatePath(`/manage/${token}`)
  return { success: true }
}
