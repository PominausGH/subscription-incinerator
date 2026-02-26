'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadDropzone } from '@/components/bank-import/upload-dropzone'
import { BackButton } from '@/components/ui/back-button'

export default function ImportPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = async (file: File) => {
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/bank-import', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Failed to process file')
        return
      }

      // Store result in sessionStorage and redirect to review
      sessionStorage.setItem('bankImportResult', JSON.stringify({
        ...data,
        fileName: file.name
      }))
      router.push('/import/review')
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload file. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <BackButton />
        <h1 className="text-2xl font-bold mb-2">Import Bank Statement</h1>
        <p className="text-gray-600 mb-8">
          Upload your bank statement CSV to automatically detect subscriptions.
          We&apos;ll analyze your transactions and find recurring charges.
        </p>

        <UploadDropzone
          onFileSelect={handleFileSelect}
          isLoading={isLoading}
          error={error}
        />

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">How to export your bank statement:</h3>
          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
            <li>Log in to your bank&apos;s website or app</li>
            <li>Navigate to your account transactions</li>
            <li>Look for &quot;Download&quot; or &quot;Export&quot; option</li>
            <li>Select CSV format (not PDF)</li>
            <li>Choose date range (3+ months recommended)</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
