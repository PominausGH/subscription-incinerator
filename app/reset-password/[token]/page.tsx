import { db } from '@/lib/db/client'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

type Props = {
  params: Promise<{ token: string }>
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-3">
        <h1 className="text-2xl font-bold text-gray-900">Reset link unavailable</h1>
        <p className="text-gray-600">{message}</p>
        <a href="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">
          Request a new link
        </a>
      </div>
    </div>
  )
}

export default async function ResetPasswordPage({ params }: Props) {
  const { token } = await params
  const resetToken = await db.passwordResetToken.findUnique({ where: { token } })

  if (!resetToken || resetToken.usedAt) {
    return <ErrorState message="This reset link is invalid or has already been used." />
  }
  if (resetToken.expiresAt < new Date()) {
    return <ErrorState message="This reset link has expired. Request a new one." />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">🔥</h1>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Choose a new password</h2>
        </div>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  )
}
