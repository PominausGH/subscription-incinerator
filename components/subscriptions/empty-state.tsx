'use client'

import Link from 'next/link'
import { Inbox, Mail, Plus, Sparkles, ArrowRight } from 'lucide-react'

export function EmptySubscriptionsState() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12">
      <div className="max-w-2xl mx-auto text-center">
        {/* Icon */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 mb-6">
          <Inbox className="h-10 w-10 text-orange-500" />
        </div>

        {/* Heading */}
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          No subscriptions yet
        </h3>
        
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Start tracking your subscriptions to see how much you&apos;re spending and get reminders before renewals.
        </p>

        {/* Options */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {/* Option 1: Add Manually */}
          <div className="bg-gray-50 rounded-lg p-6 text-left hover:bg-gray-100 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <Plus className="h-6 w-6 text-orange-500" />
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Add manually</h4>
            <p className="text-sm text-gray-600">Quickly add a subscription above</p>
          </div>

          {/* Option 2: Connect Gmail */}
          <div className="bg-gray-50 rounded-lg p-6 text-left hover:bg-gray-100 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <Mail className="h-6 w-6 text-blue-500" />
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Scan Gmail</h4>
            <p className="text-sm text-gray-600">Auto-detect from receipts</p>
          </div>

          {/* Option 3: Import Bank */}
          <Link href="/import">
            <div className="bg-gray-50 rounded-lg p-6 text-left hover:bg-gray-100 transition-colors cursor-pointer group h-full">
              <div className="flex items-center justify-between mb-3">
                <Sparkles className="h-6 w-6 text-purple-500" />
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Import CSV</h4>
              <p className="text-sm text-gray-600">Upload bank statement</p>
            </div>
          </Link>
        </div>

        {/* Quick Tip */}
        <div className="bg-blue-50 rounded-lg p-4 text-left">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Pro tip</h4>
              <p className="text-sm text-blue-800">
                Connect your Gmail to automatically find subscriptions from receipt emails. 
                We&apos;ll scan for Netflix, Spotify, AWS, and 100+ other services.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
