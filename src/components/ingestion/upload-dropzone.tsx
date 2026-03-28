'use client'

import { useCallback, useState, useRef } from 'react'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UploadDropzoneProps {
  worldId: string
  onUploadComplete?: (result: UploadResult) => void
  onError?: (error: string) => void
}

interface UploadResult {
  jobId: string
  status: string
  entityCount: number
  sectionCount: number
}

const ACCEPTED_EXTENSIONS = ['.txt', '.md', '.markdown', '.fountain']
const MAX_FILE_SIZE_MB = 10

export function UploadDropzone({
  worldId,
  onUploadComplete,
  onError,
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      return `Unsupported file type. Accepted: ${ACCEPTED_EXTENSIONS.join(', ')}`
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File exceeds ${MAX_FILE_SIZE_MB}MB limit`
    }
    return null
  }, [])

  const handleFile = useCallback(
    (file: File) => {
      const error = validateFile(file)
      if (error) {
        setUploadError(error)
        onError?.(error)
        return
      }
      setSelectedFile(file)
      setUploadError(null)
    },
    [validateFile, onError]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(`/api/worlds/${worldId}/ingest`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = (await response.json()) as { error: string }
        throw new Error(errorData.error ?? 'Upload failed')
      }

      const result = (await response.json()) as { data: UploadResult }
      setSelectedFile(null)
      onUploadComplete?.(result.data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed'
      setUploadError(message)
      onError?.(message)
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile, worldId, onUploadComplete, onError])

  const clearFile = useCallback(() => {
    setSelectedFile(null)
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
      >
        <Upload className="mb-4 size-10 text-muted-foreground" />
        <p className="mb-1 text-sm font-medium">
          Drop a file here or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          Supported: {ACCEPTED_EXTENSIONS.join(', ')} (max {MAX_FILE_SIZE_MB}MB)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {selectedFile && (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <FileText className="size-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation()
              clearFile()
            }}
            disabled={isUploading}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {uploadError && (
        <p className="text-sm text-destructive">{uploadError}</p>
      )}

      {selectedFile && (
        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 size-4" />
              Upload and Analyze
            </>
          )}
        </Button>
      )}
    </div>
  )
}
