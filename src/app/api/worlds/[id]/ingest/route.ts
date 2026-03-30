import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { analyzeDocument } from '@/lib/ai/document-analyzer'
import { parseByExtension } from '@/lib/ingestion/binary-parsers'
import { sourceQueries } from '@/lib/db/source-queries'
import { characterQueries } from '@/lib/db/queries'
import { locationQueries } from '@/lib/db/location-queries'
import { themeQueries } from '@/lib/db/theme-queries'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_EXTENSIONS = [
  'txt', 'md', 'markdown', 'fountain',
  'pdf', 'docx', 'doc', 'rtf', 'epub',
]

type ContentType = 'production' | 'reference'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [user, err] = await requireWorldAuth(id)
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
      { error: 'File exceeds maximum size of 50MB', code: 'FILE_TOO_LARGE' },
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

  const contentType: ContentType =
    (formData.get('contentType') as ContentType) || 'production'

  try {
    // Parse binary formats into text
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const content = await parseByExtension(buffer, extension)

    // Multi-pass AI analysis
    const analysis = await analyzeDocument(content)

    // Persist source material
    const source = await sourceQueries.create({
      title: file.name.replace(/\.[^.]+$/, ''),
      type: extension === 'fountain' ? 'screenplay' : 'text',
      content,
      metadata: {
        originalFileName: file.name,
        fileSize: file.size,
        contentType,
        summary: analysis.summary,
        characterCount: analysis.characters.length,
        locationCount: analysis.locations.length,
        themeCount: analysis.themes.length,
        relationshipCount: analysis.relationships.length,
      },
      storyWorldId: id,
    })

    // Auto-populate entities into the world
    const createdCharacters = await Promise.all(
      analysis.characters.map((c) =>
        characterQueries.create({
          name: c.name,
          description: c.description,
          storyWorldId: id,
        })
      )
    )

    const createdLocations = await Promise.all(
      analysis.locations.map((l) =>
        locationQueries.create({
          name: l.name,
          description: l.description,
          storyWorldId: id,
        })
      )
    )

    const createdThemes = await Promise.all(
      analysis.themes.map((t) =>
        themeQueries.create({
          name: t.name,
          description: t.description,
          storyWorldId: id,
        })
      )
    )

    return NextResponse.json(
      {
        data: {
          sourceId: source.id,
          summary: analysis.summary,
          characters: createdCharacters.map((c) => ({ id: c.id, name: c.name })),
          locations: createdLocations.map((l) => ({ id: l.id, name: l.name })),
          themes: createdThemes.map((t) => ({ id: t.id, name: t.name })),
          relationships: analysis.relationships,
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
