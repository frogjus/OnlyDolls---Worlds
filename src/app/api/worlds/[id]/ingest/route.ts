import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { IngestionPipeline } from '@/lib/ingestion/pipeline'
import { sourceQueries } from '@/lib/db/source-queries'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'text/plain',
  'text/markdown',
  'text/x-fountain',
  'application/octet-stream',
]
const ALLOWED_EXTENSIONS = ['txt', 'md', 'markdown', 'fountain']

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Request must be multipart/form-data', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: 'File is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File exceeds maximum size of 10MB', code: 'FILE_TOO_LARGE' },
      { status: 400 }
    )
  }

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return NextResponse.json(
      {
        error: `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
        code: 'UNSUPPORTED_FILE_TYPE',
      },
      { status: 400 }
    )
  }

  const mimeType = ALLOWED_TYPES.includes(file.type) ? file.type : 'text/plain'

  let content: string
  try {
    content = await file.text()
  } catch {
    return NextResponse.json(
      { error: 'Failed to read file content', code: 'FILE_READ_ERROR' },
      { status: 400 }
    )
  }

  try {
    const pipeline = new IngestionPipeline(id)
    const result = await pipeline.process({
      name: file.name,
      content,
      mimeType,
    })

    // Persist a SourceMaterial record so the file appears in the sources list
    const source = await sourceQueries.create({
      title: file.name.replace(/\.[^.]+$/, ''),
      type: extension === 'fountain' ? 'screenplay' : 'text',
      content,
      metadata: {
        originalFileName: file.name,
        mimeType,
        fileSize: file.size,
        jobId: result.jobId,
        entities: result.extractedEntities,
        sections: result.parsedContent.sections.map((s) => ({
          heading: s.heading,
          type: s.type,
        })),
      },
      storyWorldId: id,
    })

    return NextResponse.json(
      {
        data: {
          jobId: result.jobId,
          sourceId: source.id,
          status: result.status,
          entityCount: result.extractedEntities.length,
          sectionCount: result.parsedContent.sections.length,
          entities: result.extractedEntities,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ingestion failed'
    return NextResponse.json(
      { error: message, code: 'INGESTION_ERROR' },
      { status: 500 }
    )
  }
}
