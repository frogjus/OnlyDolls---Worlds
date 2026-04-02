import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { deepAnalyze } from '@/lib/ai/deep-analyze'
import { parseByExtension } from '@/lib/ingestion/binary-parsers'
import { sourceQueries } from '@/lib/db/source-queries'
import { characterQueries } from '@/lib/db/queries'
import { locationQueries } from '@/lib/db/location-queries'
import { themeQueries } from '@/lib/db/theme-queries'
import { relationshipQueries } from '@/lib/db/relationship-queries'

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

    // Deep AI analysis
    const analysis = await deepAnalyze(content)

    // Persist source material
    const source = await sourceQueries.create({
      title: file.name.replace(/\.[^.]+$/, ''),
      type: extension === 'fountain' ? 'screenplay' : 'text',
      content,
      metadata: {
        originalFileName: file.name,
        fileSize: file.size,
        contentType,
        characterCount: analysis.characters.length,
        locationCount: analysis.locations.length,
        themeCount: analysis.themes.length,
        relationshipCount: analysis.relationships.length,
        insights: JSON.parse(JSON.stringify(analysis.insights)),
      },
      storyWorldId: id,
    })

    // Auto-populate entities into the world
    const createdCharacters = await Promise.all(
      analysis.characters.map((c) =>
        characterQueries.create({
          name: c.name,
          description: c.psychologicalProfile.slice(0, 500),
          archetype: c.role,
          storyWorldId: id,
          metadata: {
            analysis: {
              psychologicalProfile: c.psychologicalProfile,
              motivation: c.motivation,
              arcTrajectory: c.arcTrajectory,
              contradictions: c.contradictions,
              voicePattern: c.voicePattern,
              keyScenes: c.keyScenes,
              thematicRole: c.thematicRole,
            },
          },
        })
      )
    )

    const createdLocations = await Promise.all(
      analysis.locations.map((l) =>
        locationQueries.create({
          name: l.name,
          description: l.atmosphere,
          storyWorldId: id,
          metadata: {
            analysis: {
              atmosphere: l.atmosphere,
              narrativeFunction: l.narrativeFunction,
              thematicResonance: l.thematicResonance,
              characterAssociations: l.characterAssociations,
              transformation: l.transformation,
            },
          },
        })
      )
    )

    const createdThemes = await Promise.all(
      analysis.themes.map((t) =>
        themeQueries.create({
          name: t.name,
          description: t.thesis,
          storyWorldId: id,
          metadata: {
            analysis: {
              thesis: t.thesis,
              manifestation: t.manifestation,
              symbolicAnchors: t.symbolicAnchors,
              evolution: t.evolution,
              opposition: t.opposition,
            },
          },
        })
      )
    )

    const createdRelationships = await Promise.all(
      analysis.relationships.map((r) => {
        const char1 = createdCharacters.find(
          (c) => c.name.toLowerCase() === r.characters[0].toLowerCase()
        )
        const char2 = createdCharacters.find(
          (c) => c.name.toLowerCase() === r.characters[1].toLowerCase()
        )
        if (!char1 || !char2) return null
        return relationshipQueries.create({
          type: r.type,
          description: r.dynamic,
          character1Id: char1.id,
          character2Id: char2.id,
          storyWorldId: id,
          metadata: {
            analysis: {
              dynamic: r.dynamic,
              evolution: r.evolution,
              subtext: r.subtext,
              keyMoments: r.keyMoments,
              powerDynamics: r.powerDynamics,
              thematicFunction: r.thematicFunction,
            },
          },
        })
      })
    )

    const validRelationships = createdRelationships.filter(Boolean)

    return NextResponse.json(
      {
        data: {
          sourceId: source.id,
          characters: createdCharacters.map((c) => ({ id: c.id, name: c.name })),
          locations: createdLocations.map((l) => ({ id: l.id, name: l.name })),
          themes: createdThemes.map((t) => ({ id: t.id, name: t.name })),
          relationships: validRelationships.map((r) => r ? { id: r.id, type: r.type } : null).filter(Boolean),
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
