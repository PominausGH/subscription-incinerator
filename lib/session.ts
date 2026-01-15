import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function getCurrentUser() {
  // DEV BYPASS: Return mock user for testing
  if (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === 'true') {
    return {
      id: 'b0cb34a4-add7-48d6-b2bf-5792d4c90583', // Existing user ID
      email: 'genmailing@gmail.com',
      tier: 'premium',
    }
  }

  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return session.user
}
