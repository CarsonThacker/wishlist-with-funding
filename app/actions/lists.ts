'use server'

import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export type ListKind = 'wishlist' | 'birthday' | 'christmas'

const EARLY_ACCESS_CODE = 'supawishlistapp'

export async function verifyEarlyAccessCode(code: string) {
  return typeof code === 'string' && code.trim() === EARLY_ACCESS_CODE
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')
const hashAdminPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}
const verifyAdminPassword = (password: string, stored: string) => {
  const [salt, digest] = stored.split(':')
  if (!salt || !digest || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(digest)) return false
  const expected = Buffer.from(digest, 'hex')
  const actual = scryptSync(password, salt, 64)
  return timingSafeEqual(actual, expected)
}
const adminCookieName = (slug: string) => `wishlist_admin_${slug}`
const sessionSignature = (listId: string, slug: string, expires: string) => {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) return null
  return createHmac('sha256', secret).update(`${listId}.${slug}.${expires}`).digest('hex')
}
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
  adminPassword: string
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
  if (typeof formData.adminPassword !== 'string' || formData.adminPassword.length < 12 || formData.adminPassword.length > 128) {
    return { error: 'Choose an admin password between 12 and 128 characters.' }
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
    admin_password_hash: hashAdminPassword(formData.adminPassword),
  })

  if (error) {
    console.error('[v0] Could not create wishlist list:', error.message)
    return { error: 'Could not create your list. Please try again.' }
  }

  revalidatePath('/')
  return { slug, adminToken }
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
  const supabase = createSupabaseAdmin()
  const { data: tokenList } = await supabase
    .from('wishlist_lists')
    .select('id, slug, title, list_type, owner_name, admin_password_hash')
    .eq('admin_token_hash', hashToken(token))
    .maybeSingle()
  if (tokenList) return tokenList
  if (!/^[a-f0-9]{18}$/.test(token)) return null

  const { data: list } = await supabase
    .from('wishlist_lists')
    .select('id, slug, title, list_type, owner_name, admin_password_hash')
    .eq('slug', token)
    .maybeSingle()
  if (!list) return null

  const cookieStore = await cookies()
  const value = cookieStore.get(adminCookieName(token))?.value
  const [expires, signature] = value?.split('.') ?? []
  const expected = sessionSignature(list.id, list.slug, expires ?? '')
  if (!expires || !signature || !expected || !/^[0-9]+$/.test(expires) || Number(expires) < Date.now()) return null
  const suppliedBytes = Buffer.from(signature, 'hex')
  const expectedBytes = Buffer.from(expected, 'hex')
  if (suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(suppliedBytes, expectedBytes)) return null
  return list
}

export async function getAdminPasswordInfo(slug: string) {
  if (!/^[a-f0-9]{18}$/.test(slug)) return null
  const { data } = await createSupabaseAdmin()
    .from('wishlist_lists')
    .select('slug, title, admin_password_hash')
    .eq('slug', slug)
    .maybeSingle()
  return data ? { slug: data.slug, title: data.title, passwordConfigured: Boolean(data.admin_password_hash) } : null
}

export async function unlockWishlistAdmin(slug: string, password: string) {
  if (!/^[a-f0-9]{18}$/.test(slug) || typeof password !== 'string' || password.length > 128) {
    return { error: 'The password could not be verified.' }
  }
  const { data: list } = await createSupabaseAdmin()
    .from('wishlist_lists')
    .select('id, slug, admin_password_hash')
    .eq('slug', slug)
    .maybeSingle()
  if (!list?.admin_password_hash || !verifyAdminPassword(password, list.admin_password_hash)) {
    return { error: 'The password could not be verified.' }
  }
  const expires = String(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const signature = sessionSignature(list.id, list.slug, expires)
  if (!signature) return { error: 'Admin access is temporarily unavailable.' }
  const cookieStore = await cookies()
  cookieStore.set(adminCookieName(slug), `${expires}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/manage',
    expires: new Date(Number(expires)),
  })
  revalidatePath(`/manage/${slug}`)
  return { success: true }
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
  const { admin_password_hash, ...publicList } = list
  return { ...publicList, adminPasswordConfigured: Boolean(admin_password_hash), items: items ?? [] }
}

export async function setWishlistAdminPassword(token: string, password: string, confirmation: string) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128 || password !== confirmation) {
    return { error: 'Use a matching password of at least 12 characters.' }
  }
  const list = await getManagedList(token)
  if (!list) return { error: 'This edit link is not valid.' }
  const { error } = await createSupabaseAdmin()
    .from('wishlist_lists')
    .update({ admin_password_hash: hashAdminPassword(password) })
    .eq('id', list.id)
  if (error) return { error: 'Could not save the admin password. Please try again.' }
  revalidatePath(`/manage/${token}`)
  return { success: true }
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
  const enteredPrice = Number(input.price)
  if (!list) return { error: 'This edit link is not valid.' }
  if (list.list_type === 'wishlist' && (!Number.isFinite(enteredPrice) || enteredPrice < 0 || enteredPrice > 10000000)) {
    return { error: 'Add a valid item price.' }
  }
  const price = list.list_type === 'wishlist' ? enteredPrice : 0
  if (!name) return { error: 'Add an item name.' }
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
  if (list.list_type !== 'wishlist') return { error: 'Savings are only available on wishlists.' }
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
