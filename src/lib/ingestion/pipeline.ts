import { parseText, parseMarkdown, parseFountain } from './parsers'
import { analyzeEntities } from '@/lib/ai/analysis'
import type { AIContext } from '@/lib/ai/types'
import type {
  IngestionJob,
  IngestionResult,
  IngestionStatus,
  ParsedContent,
} from './types'

type StatusCallback = (status: IngestionStatus, progress: number) => void

export class IngestionPipeline {
  private worldId: string
  private context: AIContext
  private onStatusChange?: StatusCallback

  constructor(
    worldId: string,
    context?: AIContext,
    onStatusChange?: StatusCallback
  ) {
    this.worldId = worldId
    this.context = context ?? { worldId }
    this.onStatusChange = onStatusChange
  }

  async process(file: {
    name: string
    content: string
    mimeType: string
  }): Promise<IngestionResult> {
    const jobId = generateJobId()

    this.updateStatus('parsing', 10)

    let parsed: ParsedContent

    try {
      parsed = this.parseFile(file.name, file.content, file.mimeType)
    } catch {
      this.updateStatus('failed', 0)
      return {
        jobId,
        parsedContent: { text: '', sections: [], metadata: {} },
        extractedEntities: [],
        status: 'failed',
      }
    }

    this.updateStatus('extracting', 40)

    const extractedEntities: IngestionResult['extractedEntities'] = []

    try {
      const fullText = parsed.sections.map((s) => s.content).join('\n\n')
      const analysisResult = await analyzeEntities(fullText, this.context)

      if (analysisResult.entities) {
        for (const entity of analysisResult.entities) {
          extractedEntities.push({
            name: entity.name,
            type: entity.type,
            description: entity.description,
            confidence: entity.confidence,
            confirmed: false,
          })
        }
      }
    } catch {
      // Entity extraction failure is non-fatal; return parsed content without entities
    }

    this.updateStatus('reviewing', 80)

    return {
      jobId,
      parsedContent: parsed,
      extractedEntities,
      status: 'reviewing',
    }
  }

  private parseFile(
    filename: string,
    content: string,
    mimeType: string
  ): ParsedContent {
    const extension = filename.split('.').pop()?.toLowerCase()

    if (
      extension === 'fountain' ||
      mimeType === 'text/x-fountain'
    ) {
      return parseFountain(content, filename)
    }

    if (
      extension === 'md' ||
      extension === 'markdown' ||
      mimeType === 'text/markdown'
    ) {
      return parseMarkdown(content, filename)
    }

    return parseText(content, filename)
  }

  private updateStatus(status: IngestionStatus, progress: number): void {
    if (this.onStatusChange) {
      this.onStatusChange(status, progress)
    }
  }
}

function generateJobId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 8)
  return `ingest_${timestamp}_${random}`
}

export function createIngestionJob(
  worldId: string,
  filename: string,
  mimeType: string
): IngestionJob {
  return {
    id: generateJobId(),
    worldId,
    filename,
    mimeType,
    status: 'pending',
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}
