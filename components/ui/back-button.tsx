'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface BackButtonProps {
  href?: string
  label?: string
}

export function BackButton({ href = '/dashboard', label = 'Back to dashboard' }: BackButtonProps) {
  return (
    <Link 
      href={href}
      className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
    >
      <ChevronLeft className="w-4 h-4 mr-1" />
      {label}
    </Link>
  )
}
