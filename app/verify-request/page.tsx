import Link from 'next/link'
import { Mail, RefreshCw, LifeBuoy, ChevronLeft } from 'lucide-react'

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Back to Home */}
        <div>
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to home
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <Mail className="h-8 w-8 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Check your email
          </h2>
          
          <p className="text-gray-600 mb-6">
            We&apos;ve sent you a magic link to sign in. Click the link in your email to access your dashboard.
          </p>

          {/* What to expect */}
          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">What to expect:</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Email arrives within 1-2 minutes
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Click the button in the email (it&apos;s safe)
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                You&apos;ll be logged in automatically
              </li>
            </ul>
          </div>

          {/* Troubleshooting */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center justify-center">
              <LifeBuoy className="w-4 h-4 mr-2" />
              Didn&apos;t receive it?
            </h3>
            
            <div className="space-y-3 text-left">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                  <span>Check your spam/junk folder</span>
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <p className="text-sm text-gray-500 mt-2 pl-4">
                  Sometimes emails end up in spam. Look for an email from &quot;noreply@subscriptionincinerator.com&quot;
                </p>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                  <span>Wrong email address?</span>
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <p className="text-sm text-gray-500 mt-2 pl-4">
                  <Link href="/login" className="text-orange-600 hover:underline">
                    Go back and try with a different email
                  </Link>
                </p>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                  <span>Still nothing after 5 minutes?</span>
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <p className="text-sm text-gray-500 mt-2 pl-4">
                  There might be a server issue. Try again later or contact support.
                </p>
              </details>
            </div>
          </div>

          {/* Retry button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again with email
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
