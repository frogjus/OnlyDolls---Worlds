'use client'

import { useCallback, useState, useRef } from 'react'
import { Upload, FileText, X, FileUp, AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UploadDropzoneProps {
  worldId: string
  onUploadComplete?: (result: UploadResult) => void
  onError?: (error: string) => void
  onUploadStart?: () => void
}

interface ExtractedEntityItem {
  name: string
  type: 'character' | 'location' | 'event' | 'item' | 'faction'
  description: string
  confidence: number
  confirmed: boolean
}

export interface UploadResult {
  jobId: string
  status: string
  entityCount: number
  sectionCount: number
  entities?: ExtractedEntityItem[]
}

const ACCEPTED_EXTENSIONS = ['.txt', '.md', '.docx', '.pdf', '.fdx', '.fountain', '.epub']
const MAX_FILE_SIZE_MB = 10

export function UploadDropzone({
  worldId,
  onUploadComplete,
  onError,
  onUploadStart,
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
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
    setUploadProgress(0)
    onUploadStart?.()

    // Simulate progress during upload/analysis
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 300)

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
      clearInterval(progressInterval)
      setUploadProgress(100)
      setSelectedFile(null)
      onUploadComplete?.(result.data)
    } catch (error) {
      clearInterval(progressInterval)
      setUploadProgress(0)
      const message = error instanceof Error ? error.message : 'Upload failed'
      setUploadError(message)
      onError?.(message)
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile, worldId, onUploadComplete, onError, onUploadStart])

  const clearFile = useCallback(() => {
    setSelectedFile(null)
    setUploadError(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Full-width dark drop target with dashed teal border */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
          isDragOver
            ? 'scale-[1.01] border-[var(--od-teal-400)] shadow-[var(--od-glow-teal-lg)]'
            : 'border-[var(--od-border-emphasis)] hover:border-[rgba(20,184,166,0.4)]'
        }`}
        style={{
          background: isDragOver
            ? 'rgba(20, 184, 166, 0.04)'
            : 'var(--od-bg-raised)',
          transitionDuration: 'var(--duration-normal)',
          transitionTimingFunction: 'var(--ease-out)',
        }}
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
        <div
          className={`mb-4 flex size-14 items-center justify-center rounded-full transition-all ${
            isDragOver ? 'scale-110' : ''
          }`}
          style={{
            background: isDragOver
              ? 'rgba(20, 184, 166, 0.12)'
              : 'var(--od-bg-surface)',
            color: isDragOver
              ? 'var(--od-teal-300)'
              : 'var(--od-teal-500)',
            transitionDuration: 'var(--duration-normal)',
            transitionTimingFunction: 'var(--ease-out)',
          }}
        >
          <FileUp className="size-7" />
        </div>
        <p className="mb-1 text-base font-medium font-[family-name:var(--font-heading)]" style={{ color: 'var(--od-text-primary)' }}>
          {isDragOver ? 'Drop your file here' : 'Drop a file here or click to browse'}
        </p>
        <p className="text-sm" style={{ color: 'var(--od-text-muted)' }}>
          {ACCEPTED_EXTENSIONS.join(', ')} — max {MAX_FILE_SIZE_MB}MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Selected file chip */}
      {selectedFile && (
        <div
          className="flex items-center gap-3 rounded-lg p-3"
          style={{
            background: 'var(--od-bg-raised)',
            border: '1px solid var(--od-border-default)',
          }}
        >
          <FileText className="size-5 shrink-0" style={{ color: 'var(--od-teal-500)' }} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium" style={{ color: 'var(--od-text-primary)' }}>
              {selectedFile.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--od-text-muted)' }}>
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

      {/* Progress bar with teal fill */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--od-text-secondary)' }}>
              {uploadProgress < 30
                ? 'Uploading file...'
                : uploadProgress < 70
                  ? 'Parsing content...'
                  : uploadProgress < 90
                    ? 'Extracting entities...'
                    : 'Finalizing analysis...'}
            </span>
            <span className="tabular-nums" style={{ color: 'var(--od-teal-300)' }}>
              {Math.round(uploadProgress)}%
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full"
            style={{ background: 'var(--od-bg-surface)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${uploadProgress}%`,
                background: 'linear-gradient(90deg, var(--od-teal-600), var(--od-teal-400))',
                boxShadow: 'var(--od-glow-teal-sm)',
                transitionDuration: 'var(--duration-normal)',
                transitionTimingFunction: 'var(--ease-out)',
              }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {uploadError && (
        <div
          className="flex items-start gap-3 rounded-lg p-3"
          style={{
            background: 'var(--od-destructive-muted, rgba(239,68,68,0.08))',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-destructive">Upload failed</p>
            <p className="mt-0.5 text-xs" style={{ color: 'rgba(239, 68, 68, 0.7)' }}>
              {uploadError}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              setUploadError(null)
              setUploadProgress(0)
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* Retry button after error */}
      {uploadError && selectedFile && !isUploading && (
        <Button
          onClick={handleUpload}
          variant="outline"
          className="w-full"
          size="lg"
        >
          <RotateCcw className="mr-2 size-4" />
          Retry Upload
        </Button>
      )}

      {/* Upload button */}
      {selectedFile && !isUploading && (
        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full"
          size="lg"
        >
          <Upload className="mr-2 size-4" />
          Upload and Analyze
        </Button>
      )}
    </div>
  )
}
