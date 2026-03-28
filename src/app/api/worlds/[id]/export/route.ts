import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/db/prisma'
import { exportFountain } from '@/lib/export/fountain'
import { exportPDF } from '@/lib/export/pdf'
import { exportMarkdown } from '@/lib/export/markdown'
import type { ExportFormat, ExportType, ExportableContent, ExportSection } from '@/lib/export/types'

const VALID_FORMATS: ExportFormat[] = ['fountain', 'pdf', 'markdown', 'text']
const VALID_TYPES: ExportType[] = ['treatment', 'screenplay', 'bible', 'outline']

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  const url = new URL(request.url)
  const format = url.searchParams.get('format') as ExportFormat | null
  const type = url.searchParams.get('type') as ExportType | null

  if (!format || !VALID_FORMATS.includes(format)) {
    return NextResponse.json(
      { error: `Invalid format. Must be one of: ${VALID_FORMATS.join(', ')}`, code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`, code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const world = await prisma.storyWorld.findUnique({
    where: { id },
    select: {
      name: true,
      description: true,
      genre: true,
      logline: true,
      beats: {
        orderBy: { position: 'asc' },
        select: { name: true, description: true, notes: true },
      },
      characters: {
        select: { name: true, description: true, archetype: true },
      },
    },
  })

  if (!world) {
    return NextResponse.json(
      { error: 'World not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const sections: ExportSection[] = []

  if (type === 'treatment' || type === 'outline') {
    for (const beat of world.beats) {
      sections.push({
        title: beat.name,
        content: [beat.description, beat.notes].filter(Boolean).join('\n\n'),
        level: 2,
      })
    }
  }

  if (type === 'bible') {
    if (world.description) {
      sections.push({
        title: 'Overview',
        content: world.description,
        level: 1,
      })
    }
    if (world.characters.length > 0) {
      sections.push({
        title: 'Characters',
        content: world.characters
          .map(
            (c) =>
              `${c.name}${c.archetype ? ` (${c.archetype})` : ''}${c.description ? `\n${c.description}` : ''}`
          )
          .join('\n\n'),
        level: 1,
      })
    }
    if (world.beats.length > 0) {
      sections.push({
        title: 'Story Beats',
        content: world.beats
          .map((b) => `${b.name}${b.description ? `: ${b.description}` : ''}`)
          .join('\n'),
        level: 1,
      })
    }
  }

  if (type === 'screenplay') {
    for (const beat of world.beats) {
      sections.push({
        title: beat.name,
        content: beat.description ?? '',
        level: 2,
      })
    }
  }

  const exportable: ExportableContent = {
    title: world.name,
    type,
    sections,
    metadata: {
      date: new Date().toISOString().split('T')[0],
      genre: world.genre ?? undefined,
      logline: world.logline ?? undefined,
    },
  }

  try {
    switch (format) {
      case 'fountain': {
        const result = exportFountain(exportable)
        return new NextResponse(result.content as string, {
          headers: {
            'Content-Type': result.mimeType,
            'Content-Disposition': `attachment; filename="${result.filename}"`,
          },
        })
      }

      case 'pdf': {
        const result = await exportPDF(exportable)
        return new NextResponse(new Uint8Array(result.content as Buffer), {
          headers: {
            'Content-Type': result.mimeType,
            'Content-Disposition': `attachment; filename="${result.filename}"`,
          },
        })
      }

      case 'markdown': {
        const result = exportMarkdown(exportable)
        return new NextResponse(result.content as string, {
          headers: {
            'Content-Type': result.mimeType,
            'Content-Disposition': `attachment; filename="${result.filename}"`,
          },
        })
      }

      case 'text': {
        const result = exportMarkdown(exportable)
        return new NextResponse(result.content as string, {
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="${exportable.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt"`,
          },
        })
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Export failed'
    return NextResponse.json(
      { error: message, code: 'EXPORT_ERROR' },
      { status: 500 }
    )
  }
}
