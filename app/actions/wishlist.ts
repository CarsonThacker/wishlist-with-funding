'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { wishlistItems } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getWishlistItems() {
  const userId = await getUserId()
  return db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId))
    .orderBy(desc(wishlistItems.createdAt))
}

export async function addWishlistItem(data: {
  name: string
  description?: string
  price: number
  imageUrl?: string
  url?: string
}) {
  const userId = await getUserId()
  await db.insert(wishlistItems).values({
    userId,
    name: data.name,
    description: data.description ?? null,
    price: String(data.price),
    saved: '0',
    imageUrl: data.imageUrl ?? null,
    url: data.url ?? null,
  })
  revalidatePath('/')
  revalidatePath('/admin')
}

export async function updateWishlistItem(
  id: number,
  data: {
    name?: string
    description?: string
    price?: number
    imageUrl?: string
    url?: string
  }
) {
  const userId = await getUserId()
  await db
    .update(wishlistItems)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: String(data.price) }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      ...(data.url !== undefined && { url: data.url }),
      updatedAt: new Date(),
    })
    .where(and(eq(wishlistItems.id, id), eq(wishlistItems.userId, userId)))
  revalidatePath('/')
  revalidatePath('/admin')
}

export async function deleteWishlistItem(id: number) {
  const userId = await getUserId()
  await db
    .delete(wishlistItems)
    .where(and(eq(wishlistItems.id, id), eq(wishlistItems.userId, userId)))
  revalidatePath('/')
  revalidatePath('/admin')
}

export async function addSavings(id: number, amount: number) {
  const userId = await getUserId()
  const [item] = await db
    .select()
    .from(wishlistItems)
    .where(and(eq(wishlistItems.id, id), eq(wishlistItems.userId, userId)))
  if (!item) throw new Error('Item not found')
  const currentSaved = parseFloat(String(item.saved))
  const price = parseFloat(String(item.price))
  const newSaved = Math.min(currentSaved + amount, price)
  await db
    .update(wishlistItems)
    .set({ saved: String(newSaved), updatedAt: new Date() })
    .where(and(eq(wishlistItems.id, id), eq(wishlistItems.userId, userId)))
  revalidatePath('/')
  revalidatePath('/admin')
}
