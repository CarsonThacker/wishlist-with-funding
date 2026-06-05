import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST() {
  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, 'carson@gmail.com'))

    if (existingUser.length > 0) {
      return Response.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Create user using Better Auth
    const result = await auth.api.signUpEmail({
      body: {
        email: 'carson@gmail.com',
        password: '1234',
        name: 'Carson',
      },
    })

    return Response.json({
      success: true,
      message: 'Account created! Email: carson@gmail.com, Password: 1234',
    })
  } catch (error) {
    console.error('Setup error:', error)
    return Response.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
