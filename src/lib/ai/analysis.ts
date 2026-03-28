import { getAIClient } from './client'
import { entityExtractionPrompt, consistencyCheckPrompt } from './prompts'
import type { AIContext, AnalysisResult, ExtractedEntity, Contradiction } from './types'

function parseJSONResponse<T>(raw: string): T {
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON object found in AI response')
  }
  return JSON.parse(jsonMatch[0]) as T
}

export async function analyzeEntities(
  text: string,
  context: AIContext
): Promise<AnalysisResult> {
  const client = getAIClient()
  const prompt = entityExtractionPrompt(context)

  const raw = await client.analyze(
    `${prompt.user}\n\nText:\n${text}`,
    prompt.system
  )

  const parsed = parseJSONResponse<{ entities: ExtractedEntity[] }>(raw)

  return {
    entities: parsed.entities.map((entity) => ({
      name: entity.name,
      type: entity.type,
      description: entity.description,
      confidence: Math.max(0, Math.min(1, entity.confidence)),
    })),
    raw,
  }
}

export async function analyzeConsistency(
  facts: string[]
): Promise<AnalysisResult> {
  const client = getAIClient()
  const prompt = consistencyCheckPrompt(facts)

  const raw = await client.analyze(prompt.user, prompt.system)

  const parsed = parseJSONResponse<{ contradictions: Contradiction[] }>(raw)

  return {
    contradictions: parsed.contradictions.map((c) => ({
      description: c.description,
      severity: c.severity,
      entities: c.entities,
      suggestion: c.suggestion,
    })),
    raw,
  }
}
