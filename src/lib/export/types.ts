// =============================================================================
// Export System Type Definitions
// =============================================================================

export type ExportFormat = 'fountain' | 'pdf' | 'markdown' | 'text'

export type ExportType = 'treatment' | 'screenplay' | 'bible' | 'outline'

export interface ExportSection {
  title: string
  content: string
  level: number
  metadata?: Record<string, string>
}

export interface ExportableContent {
  title: string
  type: ExportType
  sections: ExportSection[]
  metadata?: {
    author?: string
    date?: string
    genre?: string
    logline?: string
  }
}

export interface ExportResult {
  content: string | Buffer
  filename: string
  mimeType: string
  format: ExportFormat
}
