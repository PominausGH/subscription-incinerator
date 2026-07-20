'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadDropzone } from '@/components/bank-import/upload-dropzone'

export function ImportClient() {
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
    <UploadDropzone
      onFileSelect={handleFileSelect}
      isLoading={isLoading}
      error={error}
    />
  )
}
