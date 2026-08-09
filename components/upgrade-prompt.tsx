'use client'

import { UpgradeButton } from './upgrade-button'

interface UpgradePromptProps {
  feature: string
  description: string
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export function UpgradePrompt({ feature, description }: UpgradePromptProps) {
  return (
    <div className="border rounded-lg p-6 bg-muted/50">
      <div className="flex items-center gap-2 mb-2">
        <LockIcon className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">{feature}</h3>
      </div>
      <p className="text-muted-foreground mb-4">{description}</p>
      <UpgradeButton />
    </div>
  )
}
