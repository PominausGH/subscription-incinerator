'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'

interface NavigationProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    tier?: string
  } | null
}

export function Navigation({ user }: NavigationProps) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const isLandingPage = pathname === '/' || pathname === '/login'
  const isLoggedIn = !!user

  // Landing page navigation (minimal, no auth state)
  if (isLandingPage && !isLoggedIn) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 text-white font-bold text-xl">
              <span className="text-2xl">🔥</span>
              <span>Subscription Incinerator</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/10"
              >
                Sign In
              </Link>
              <Link 
                href="/login" 
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:from-amber-400 hover:to-orange-500 transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // App navigation (logged in)
  if (isLoggedIn) {
    return (
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-2 text-gray-900 font-bold text-xl">
              <span className="text-2xl">🔥</span>
              <span className="hidden sm:inline">Subscription Incinerator</span>
              <span className="sm:hidden">SI</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                href="/dashboard" 
                className={`text-sm font-medium transition-colors ${
                  pathname === '/dashboard' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                href="/import" 
                className={`text-sm font-medium transition-colors ${
                  pathname === '/import' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Import
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {user.tier === 'premium' && (
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                  Premium
                </span>
              )}
              
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-medium">
                    {user.name?.[0] || user.email?.[0] || '?'}
                  </div>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        signOut({ callbackUrl: '/' })
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden border-t border-gray-200">
          <div className="flex">
            <Link 
              href="/dashboard" 
              className={`flex-1 py-3 text-center text-sm font-medium ${
                pathname === '/dashboard' ? 'text-gray-900 border-b-2 border-orange-500' : 'text-gray-500'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              href="/import" 
              className={`flex-1 py-3 text-center text-sm font-medium ${
                pathname === '/import' ? 'text-gray-900 border-b-2 border-orange-500' : 'text-gray-500'
              }`}
            >
              Import
            </Link>
          </div>
        </div>
      </nav>
    )
  }

  // Fallback (shouldn't reach here)
  return null
}
