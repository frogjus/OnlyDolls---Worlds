import { getAIClient } from './client'

export interface QuickExtractResult {
  summary: string
  characters: Array<{ name: string; description: string; role: string }>
  locations: Array<{ name: string; description: string }>
  themes: Array<{ name: string; description: string }>
  relationships: Array<{
    source: string
    target: string
    type: string
    description: string
  }>
}

function condenseText(text: string): string {
  const words = text.split(/\s+/)
  if (words.length <= 5000) return text
  const head = words.slice(0, 3000).join(' ')
  const tail = words.slice(-1000).join(' ')
  return `${head}\n\n[...middle section omitted for brevity...]\n\n${tail}`
}

function parseJSON<T>(raw: string): T {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found in response')
  return JSON.parse(match[0]) as T
}

export async function quickExtract(text: string): Promise<QuickExtractResult> {
  const client = getAIClient()
  const condensed = condenseText(text)

  const raw = await client.analyze(
    `Analyze the following document and extract structured information.

Return a single JSON object with these fields:
- "summary": 2-3 paragraph summary of plot, characters, and setting
- "characters": array of { "name", "description", "role" } for each character found
- "locations": array of { "name", "description" } for each location
- "themes": array of { "name", "description" } for each major theme
- "relationships": array of { "source", "target", "type", "description" } for character relationships

Return ONLY valid JSON, no other text.

Document:
${condensed}`,
    'You are a narrative analysis engine. Extract characters, locations, themes, and relationships from text. Return only valid JSON.'
  )

  return parseJSON<QuickExtractResult>(raw)
}
