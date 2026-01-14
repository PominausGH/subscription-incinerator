'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { UpgradeButton } from '@/components/upgrade-button'

export function Navbar({ userEmail, userTier }: { userEmail: string; userTier: string }) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-2xl">🔥</span>
              <span className="ml-2 text-xl font-bold hidden sm:inline">Subscription Incinerator</span>
            </Link>

            {/* Navigation Links */}
            <div className="ml-8 flex space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/settings"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Settings
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {userTier !== 'premium' && (
              <UpgradeButton variant="outline" size="sm" />
            )}
            <span className="text-sm text-gray-600 hidden sm:inline">{userEmail}</span>
            <Button
              variant="ghost"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
