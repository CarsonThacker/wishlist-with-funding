'use server'

import { cookies } from 'next/headers'

const HARDCODED_EMAIL = 'carson@gmail.com'
const HARDCODED_PASSWORD = '1234'

export async function loginAction(email: string, password: string) {
  if (email === HARDCODED_EMAIL && password === HARDCODED_PASSWORD) {
    const cookieStore = await cookies()
    cookieStore.set('logged_in', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    return { success: true }
  }
  return { success: false, error: 'Invalid email or password' }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('logged_in')
}

export async function isLoggedIn() {
  const cookieStore = await cookies()
  return cookieStore.get('logged_in')?.value === 'true'
}
