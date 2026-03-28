import { NextResponse } from 'next/server'
import { requireWorldAuth } from '@/lib/auth/helpers'
import { analyzeEntities, analyzeConsistency } from '@/lib/ai/analysis'
import type { AIOperationType, AIContext } from '@/lib/ai/types'

interface AnalyzeRequestBody {
  type: AIOperationType
  text?: string
  facts?: string[]
  context?: AIContext
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [, err] = await requireWorldAuth(id)
  if (err) return err

  let body: AnalyzeRequestBody
  try {
    body = (await request.json()) as AnalyzeRequestBody
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  if (!body.type) {
    return NextResponse.json(
      { error: 'Analysis type is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  const context: AIContext = {
    worldId: id,
    ...body.context,
  }

  try {
    switch (body.type) {
      case 'entity_extraction': {
        if (!body.text) {
          return NextResponse.json(
            { error: 'Text is required for entity extraction', code: 'VALIDATION_ERROR' },
            { status: 400 }
          )
        }
        const results = await analyzeEntities(body.text, context)
        return NextResponse.json({
          data: { results, analysisType: 'entity_extraction' },
        })
      }

      case 'consistency_check': {
        if (!body.facts || body.facts.length === 0) {
          return NextResponse.json(
            { error: 'Facts array is required for consistency check', code: 'VALIDATION_ERROR' },
            { status: 400 }
          )
        }
        const results = await analyzeConsistency(body.facts)
        return NextResponse.json({
          data: { results, analysisType: 'consistency_check' },
        })
      }

      default:
        return NextResponse.json(
          { error: `Unsupported analysis type: ${body.type}`, code: 'UNSUPPORTED_TYPE' },
          { status: 400 }
        )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed'
    return NextResponse.json(
      { error: message, code: 'ANALYSIS_ERROR' },
      { status: 500 }
    )
  }
}
