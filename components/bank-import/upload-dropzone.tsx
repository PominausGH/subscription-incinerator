'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void
  isLoading: boolean
  error: string | null
}

export function UploadDropzone({ onFileSelect, isLoading, error }: UploadDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0])
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE_BYTES,
    disabled: isLoading
  })

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        {...getRootProps()}
        role="button"
        aria-label="Upload CSV file"
        aria-disabled={isLoading}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="space-y-4">
          <div className="text-4xl">📄</div>

          {isLoading ? (
            <div>
              <div
                className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-2"
                role="status"
                aria-label="Loading"
              />
              <p className="text-gray-600">Processing your statement...</p>
            </div>
          ) : isDragActive ? (
            <p className="text-blue-600 font-medium">Drop your CSV file here</p>
          ) : (
            <>
              <p className="text-gray-600">
                Drag and drop your bank statement CSV here, or click to browse
              </p>
              <p className="text-sm text-gray-400">
                Supports CSV files up to 5MB
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <div className="mt-2 text-sm text-red-500">
            <p>Tips:</p>
            <ul className="list-disc list-inside">
              <li>Export as CSV, not PDF</li>
              <li>Use &quot;Download transactions&quot; option</li>
              <li>Try a shorter date range</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
