'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Home, RefreshCw, Mail, Lock } from 'lucide-react'

const errorMessages: Record<string, { title: string; message: string; icon: React.ReactNode; action: string }> = {
  default: {
    title: 'Something went wrong',
    message: 'We encountered an unexpected error. Please try again.',
    icon: <AlertCircle className="h-12 w-12 text-red-500" />,
    action: 'Try Again'
  },
  Configuration: {
    title: 'Server Configuration Error',
    message: 'There\'s a problem with our authentication setup. Please contact support.',
    icon: <AlertCircle className="h-12 w-12 text-red-500" />,
    action: 'Contact Support'
  },
  AccessDenied: {
    title: 'Access Denied',
    message: 'You don\'t have permission to access this page.',
    icon: <Lock className="h-12 w-12 text-orange-500" />,
    action: 'Go to Login'
  },
  Verification: {
    title: 'Link Expired',
    message: 'This magic link has expired or already been used. Please request a new one.',
    icon: <Mail className="h-12 w-12 text-blue-500" />,
    action: 'Request New Link'
  },
  OAuthSignin: {
    title: 'OAuth Error',
    message: 'There was a problem signing in with Google. Please try again.',
    icon: <AlertCircle className="h-12 w-12 text-red-500" />,
    action: 'Try Again'
  },
  OAuthCallback: {
    title: 'Connection Failed',
    message: 'Could not connect to your Google account. Please try again.',
    icon: <AlertCircle className="h-12 w-12 text-red-500" />,
    action: 'Try Again'
  },
  OAuthCreateAccount: {
    title: 'Account Creation Failed',
    message: 'We couldn\'t create your account. You may already have an account with this email.',
    icon: <AlertCircle className="h-12 w-12 text-orange-500" />,
    action: 'Go to Login'
  },
  EmailCreateAccount: {
    title: 'Email Error',
    message: 'Could not create account with this email. It may already be registered.',
    icon: <Mail className="h-12 w-12 text-orange-500" />,
    action: 'Go to Login'
  },
  Callback: {
    title: 'Callback Error',
    message: 'There was a problem processing your login. Please try again.',
    icon: <RefreshCw className="h-12 w-12 text-blue-500" />,
    action: 'Try Again'
  },
  OAuthAccountNotLinked: {
    title: 'Account Not Linked',
    message: 'This email is already associated with another account. Please sign in with your original method.',
    icon: <Lock className="h-12 w-12 text-orange-500" />,
    action: 'Go to Login'
  },
  EmailSignin: {
    title: 'Email Error',
    message: 'Could not send magic link. Please check your email address and try again.',
    icon: <Mail className="h-12 w-12 text-orange-500" />,
    action: 'Try Again'
  },
  CredentialsSignin: {
    title: 'Invalid Credentials',
    message: 'The email or password you entered is incorrect. Please try again.',
    icon: <Lock className="h-12 w-12 text-red-500" />,
    action: 'Go to Login'
  },
  SessionRequired: {
    title: 'Session Expired',
    message: 'Your session has expired. Please sign in again.',
    icon: <Lock className="h-12 w-12 text-orange-500" />,
    action: 'Go to Login'
  }
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  
  const errorInfo = errorMessages[error || ''] || errorMessages.default
  
  const getActionHref = () => {
    if (errorInfo.action === 'Contact Support') return 'mailto:support@subscriptionincinerator.com'
    if (errorInfo.action === 'Request New Link') return '/login'
    return '/login'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-6">
            {errorInfo.icon}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {errorInfo.title}
          </h1>

          {/* Error Code (for debugging) */}
          {error && (
            <p className="text-xs text-gray-400 mb-4 font-mono">
              Error code: {error}
            </p>
          )}

          {/* Message */}
          <p className="text-gray-600 mb-8">
            {errorInfo.message}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Link 
              href={getActionHref()}
              className="block w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium py-2.5 px-4 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all"
            >
              {errorInfo.action}
            </Link>
            
            <Link 
              href="/"
              className="inline-flex items-center justify-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Need help? Contact us at{' '}
              <a href="mailto:support@subscriptionincinerator.com" className="text-orange-600 hover:underline">
                support@subscriptionincinerator.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="animate-pulse">
            <div className="mx-auto h-16 w-16 bg-gray-200 rounded-full mb-6"></div>
            <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-4"></div>
            <div className="h-4 w-64 bg-gray-200 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
