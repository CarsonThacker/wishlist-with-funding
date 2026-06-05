'use server'

import { db } from '@/lib/db'
import { wishlistItems } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getPublicWishlistItems() {
  return db
    .select()
    .from(wishlistItems)
    .orderBy(desc(wishlistItems.createdAt))
}

export async function addPublicSavings(id: number, amount: number) {
  const [item] = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.id, id))
  if (!item) throw new Error('Item not found')
  const currentSaved = parseFloat(String(item.saved))
  const price = parseFloat(String(item.price))
  const newSaved = Math.min(currentSaved + amount, price)
  await db
    .update(wishlistItems)
    .set({ saved: String(newSaved), updatedAt: new Date() })
    .where(eq(wishlistItems.id, id))
  revalidatePath('/')
}
