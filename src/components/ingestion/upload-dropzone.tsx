'use client'

import { useCallback, useState, useRef } from 'react'
import { Upload, FileText, X, Loader2, FileUp } from 'lucide-react'
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
      {/* Large drop target */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
          isDragOver
            ? 'scale-[1.01] border-primary bg-primary/5 shadow-lg'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
        }`}
        style={{
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
            isDragOver
              ? 'scale-110 bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'
          }`}
          style={{
            transitionDuration: 'var(--duration-normal)',
            transitionTimingFunction: 'var(--ease-out)',
          }}
        >
          <FileUp className="size-7" />
        </div>
        <p className="mb-1 text-base font-medium">
          {isDragOver ? 'Drop your file here' : 'Drop a file here or click to browse'}
        </p>
        <p className="text-sm text-muted-foreground">
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

      {/* Selected file */}
      {selectedFile && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
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

      {/* Progress bar */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {uploadProgress < 90 ? 'Uploading...' : 'Analyzing content...'}
            </span>
            <span className="tabular-nums">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${uploadProgress}%`,
                transitionDuration: 'var(--duration-normal)',
                transitionTimingFunction: 'var(--ease-out)',
              }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {uploadError && (
        <p className="text-sm text-destructive">{uploadError}</p>
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
