import { getAIClient } from './client'
import {
  beatGenerationPrompt,
  scriptGenerationPrompt,
  synopsisExpansionPrompt,
} from './prompts'
import type { AISuggestion, GenerationContext } from './types'

function parseJSONResponse(raw: string): AISuggestion {
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON object found in AI response')
  }
  const parsed = JSON.parse(jsonMatch[0]) as {
    suggestion?: string
    confidence?: number
    contextUsed?: string[]
  }
  return {
    suggestion: parsed.suggestion ?? raw,
    confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0.5)),
    contextUsed: parsed.contextUsed ?? [],
  }
}

export async function generateBeat(
  context: GenerationContext
): Promise<AISuggestion> {
  if (!context.synopsis) {
    throw new Error('Synopsis is required for beat generation. Fill in the Story Sidebar synopsis first.')
  }

  const client = getAIClient()
  const prompt = beatGenerationPrompt(context)
  const raw = await client.generate(prompt.user, prompt.system)
  return parseJSONResponse(raw)
}

export async function generateScript(
  context: GenerationContext
): Promise<AISuggestion> {
  const client = getAIClient()
  const prompt = scriptGenerationPrompt(context)
  const raw = await client.generate(prompt.user, prompt.system)
  return parseJSONResponse(raw)
}

export async function generateSynopsis(
  logline: string,
  context: GenerationContext
): Promise<AISuggestion> {
  const client = getAIClient()
  const prompt = synopsisExpansionPrompt(logline)

  const userMessage = context.characters?.length
    ? `${prompt.user}\n\nExisting characters:\n${context.characters.map((c) => `- ${c.name}`).join('\n')}`
    : prompt.user

  const raw = await client.generate(userMessage, prompt.system)
  return parseJSONResponse(raw)
}
