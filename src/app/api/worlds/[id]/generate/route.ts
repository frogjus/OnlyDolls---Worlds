import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/db/prisma'
import { generateBeat, generateScript, generateSynopsis } from '@/lib/ai/generation'
import { searchWorldMemory } from '@/lib/supermemory/sync'
import type { AIOperationType, GenerationContext } from '@/lib/ai/types'

interface GenerateRequestBody {
  type: AIOperationType
  context: GenerationContext
  logline?: string
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  let body: GenerateRequestBody
  try {
    body = (await request.json()) as GenerateRequestBody
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  if (!body.type) {
    return NextResponse.json(
      { error: 'Generation type is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const world = await prisma.storyWorld.findUnique({
    where: { id },
    select: { description: true },
  })

  const synopsis = body.context?.synopsis ?? world?.description
  if (!synopsis) {
    return NextResponse.json(
      {
        error: 'Synopsis is required for AI generation. Fill in the Story Sidebar synopsis first.',
        code: 'SYNOPSIS_REQUIRED',
      },
      { status: 400 }
    )
  }

  // Search SuperMemory for relevant world context to enrich generation
  let memoryContext: string[] = []
  try {
    const searchQuery = body.context?.currentBeat?.description ?? synopsis
    const memories = await searchWorldMemory(id, searchQuery, 5)
    memoryContext = memories.map((m) => m.content)
  } catch {
    // Non-blocking — proceed without memory context
  }

  const context: GenerationContext = {
    ...body.context,
    worldId: id,
    synopsis,
    memoryContext,
  }

  try {
    switch (body.type) {
      case 'beat_generation': {
        const result = await generateBeat(context)
        return NextResponse.json({
          data: {
            suggestion: result.suggestion,
            confidence: result.confidence,
            contextUsed: result.contextUsed,
          },
        })
      }

      case 'script_generation': {
        const result = await generateScript(context)
        return NextResponse.json({
          data: {
            suggestion: result.suggestion,
            confidence: result.confidence,
            contextUsed: result.contextUsed,
          },
        })
      }

      case 'synopsis_expansion': {
        const logline = body.logline ?? synopsis
        const result = await generateSynopsis(logline, context)
        return NextResponse.json({
          data: {
            suggestion: result.suggestion,
            confidence: result.confidence,
            contextUsed: result.contextUsed,
          },
        })
      }

      default:
        return NextResponse.json(
          { error: `Unsupported generation type: ${body.type}`, code: 'UNSUPPORTED_TYPE' },
          { status: 400 }
        )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json(
      { error: message, code: 'GENERATION_ERROR' },
      { status: 500 }
    )
  }
}
