// =============================================================================
// Ingestion Pipeline Type Definitions
// =============================================================================

export type IngestionStatus =
  | 'pending'
  | 'parsing'
  | 'extracting'
  | 'reviewing'
  | 'complete'
  | 'failed'

export interface IngestionJob {
  id: string
  worldId: string
  filename: string
  mimeType: string
  status: IngestionStatus
  progress: number
  error?: string
  createdAt: Date
  updatedAt: Date
}

export interface ParsedContent {
  text: string
  title?: string
  sections: ParsedSection[]
  metadata: Record<string, string>
}

export interface ParsedSection {
  heading?: string
  content: string
  position: number
  type: 'chapter' | 'scene' | 'act' | 'section' | 'body'
}

export interface IngestionResult {
  jobId: string
  parsedContent: ParsedContent
  extractedEntities: Array<{
    name: string
    type: string
    description: string
    confidence: number
    confirmed: boolean
  }>
  status: IngestionStatus
}
