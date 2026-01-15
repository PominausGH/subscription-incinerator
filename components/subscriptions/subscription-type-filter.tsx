'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SubscriptionTypeFilterProps {
  currentFilter?: string
}

export function SubscriptionTypeFilter({ currentFilter }: SubscriptionTypeFilterProps) {
  const pathname = usePathname()

  const filters = [
    { value: undefined, label: 'All' },
    { value: 'personal', label: 'Personal' },
    { value: 'business', label: 'Business' },
  ]

  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
      {filters.map((filter) => {
        const isActive = currentFilter === filter.value
        const href = filter.value
          ? `${pathname}?type=${filter.value}`
          : pathname

        return (
          <Link
            key={filter.label}
            href={href}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {filter.label}
          </Link>
        )
      })}
    </div>
  )
}
