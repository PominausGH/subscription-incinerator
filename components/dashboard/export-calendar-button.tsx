'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function ExportCalendarButton() {
  const [isExporting, setIsExporting] = useState(false)

  function handleExport() {
    setIsExporting(true)
    // Use window.location to trigger download
    window.location.href = '/api/subscriptions/export/calendar'
    // Reset state after a short delay
    setTimeout(() => setIsExporting(false), 1000)
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      size="sm"
    >
      {isExporting ? 'Exporting...' : 'Export Calendar'}
    </Button>
  )
}
