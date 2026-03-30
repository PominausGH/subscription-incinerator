import Link from 'next/link'

export function Footer() {
  return (
    <footer className="py-12 bg-dark-900 border-t border-dark-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Logo column */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🔥</span>
              <span className="font-bold text-white">Subscription Incinerator</span>
            </Link>
            <p className="text-gray-400 text-sm">
              Never forget another subscription.
            </p>
          </div>

          {/* Navigation column */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <a href="/#features" className="text-gray-400 hover:text-fire-400 transition-colors text-sm">
                  Features
                </a>
              </li>
              <li>
                <a href="/#how-it-works" className="text-gray-400 hover:text-fire-400 transition-colors text-sm">
                  How It Works
                </a>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-400 hover:text-fire-400 transition-colors text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-400 hover:text-fire-400 transition-colors text-sm">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal column */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-fire-400 transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-fire-400 transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-fire-400 transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-dark-700 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Subscription Incinerator. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
