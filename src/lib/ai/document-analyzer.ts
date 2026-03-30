import { getAIClient } from './client'
import type { ExtractedEntity } from './types'

interface AnalyzedDocument {
  summary: string
  characters: ExtractedEntity[]
  locations: ExtractedEntity[]
  themes: Array<{ name: string; description: string }>
  relationships: Array<{
    source: string
    target: string
    type: string
    description: string
  }>
}

function parseJSON<T>(raw: string): T {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found in response')
  return JSON.parse(match[0]) as T
}

function chunkText(text: string, maxChunkSize = 8000): string[] {
  const chunks: string[] = []
  const paragraphs = text.split(/\n\n+/)
  let current = ''

  for (const para of paragraphs) {
    if (current.length + para.length > maxChunkSize && current.length > 0) {
      chunks.push(current.trim())
      current = ''
    }
    current += para + '\n\n'
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks.length > 0 ? chunks : [text]
}

// Pass 1: Summarize the full document
async function summarize(text: string): Promise<string> {
  const client = getAIClient()
  const truncated = text.slice(0, 12000)
  const raw = await client.analyze(
    `Summarize the following document in 2-3 paragraphs. Focus on plot, characters, and setting.\n\nText:\n${truncated}`,
    'You are a narrative analysis engine. Produce concise, accurate summaries.'
  )
  return raw.trim()
}

// Pass 2: Extract characters from each chunk
async function extractCharactersFromChunk(
  chunk: string,
  chunkIndex: number
): Promise<ExtractedEntity[]> {
  const client = getAIClient()
  const raw = await client.analyze(
    `Extract all characters (people, beings, named entities) from this text chunk. For each provide name, description, and confidence (0-1).\n\nReturn JSON: { "characters": [{ "name": "", "description": "", "confidence": 0.0 }] }\n\nChunk ${chunkIndex + 1}:\n${chunk}`,
    'You are a character extraction engine. Return only valid JSON.'
  )
  try {
    const parsed = parseJSON<{ characters: Array<{ name: string; description: string; confidence: number }> }>(raw)
    return parsed.characters.map((c) => ({
      name: c.name,
      type: 'character' as const,
      description: c.description,
      confidence: Math.max(0, Math.min(1, c.confidence)),
    }))
  } catch {
    return []
  }
}

// Pass 3: Deduplicate characters
function deduplicateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
  const seen = new Map<string, ExtractedEntity>()
  for (const entity of entities) {
    const key = entity.name.toLowerCase().trim()
    const existing = seen.get(key)
    if (!existing || entity.confidence > existing.confidence) {
      seen.set(key, entity)
    }
  }
  return Array.from(seen.values())
}

// Pass 4: Extract relationships
async function extractRelationships(
  text: string,
  characterNames: string[]
): Promise<AnalyzedDocument['relationships']> {
  if (characterNames.length < 2) return []
  const client = getAIClient()
  const truncated = text.slice(0, 10000)
  const raw = await client.analyze(
    `Given these characters: ${characterNames.join(', ')}\n\nExtract relationships between them from the text. Return JSON: { "relationships": [{ "source": "", "target": "", "type": "", "description": "" }] }\n\nText:\n${truncated}`,
    'You are a relationship extraction engine. Return only valid JSON.'
  )
  try {
    const parsed = parseJSON<{ relationships: AnalyzedDocument['relationships'] }>(raw)
    return parsed.relationships
  } catch {
    return []
  }
}

// Pass 5: Extract locations and themes
async function extractLocationsAndThemes(
  text: string
): Promise<{ locations: ExtractedEntity[]; themes: AnalyzedDocument['themes'] }> {
  const client = getAIClient()
  const truncated = text.slice(0, 10000)
  const raw = await client.analyze(
    `Extract all locations and themes from this text.\n\nReturn JSON: { "locations": [{ "name": "", "description": "", "confidence": 0.0 }], "themes": [{ "name": "", "description": "" }] }\n\nText:\n${truncated}`,
    'You are a narrative analysis engine. Return only valid JSON.'
  )
  try {
    const parsed = parseJSON<{
      locations: Array<{ name: string; description: string; confidence: number }>
      themes: Array<{ name: string; description: string }>
    }>(raw)
    return {
      locations: parsed.locations.map((l) => ({
        name: l.name,
        type: 'location' as const,
        description: l.description,
        confidence: Math.max(0, Math.min(1, l.confidence)),
      })),
      themes: parsed.themes,
    }
  } catch {
    return { locations: [], themes: [] }
  }
}

export async function analyzeDocument(text: string): Promise<AnalyzedDocument> {
  // Pass 1: Summarize
  const summary = await summarize(text)

  // Pass 2: Extract characters per chunk
  const chunks = chunkText(text)
  const allCharacters: ExtractedEntity[] = []
  for (let i = 0; i < chunks.length; i++) {
    const chars = await extractCharactersFromChunk(chunks[i], i)
    allCharacters.push(...chars)
  }

  // Pass 3: Deduplicate
  const characters = deduplicateEntities(allCharacters)

  // Pass 4: Extract relationships
  const characterNames = characters.map((c) => c.name)
  const relationships = await extractRelationships(text, characterNames)

  // Pass 5: Extract locations and themes
  const { locations, themes } = await extractLocationsAndThemes(text)

  return { summary, characters, locations, themes, relationships }
}
