import { getAIClient } from './client'

export interface QuickExtraction {
  characters: Array<{ name: string; description: string; role: string }>
  locations: Array<{ name: string; description: string }>
  themes: Array<{ name: string; description: string }>
  relationships: Array<{
    character1: string
    character2: string
    type: string
    description: string
  }>
  summary: string
}

export async function quickExtract(text: string): Promise<QuickExtraction> {
  const client = getAIClient()
  const words = text.split(/\s+/)
  let sample = text
  if (words.length > 5000) {
    sample =
      words.slice(0, 3000).join(' ') +
      '\n\n[...]\n\n' +
      words.slice(-1000).join(' ')
  }

  const raw = await client.analyze(
    'Analyze this story text and extract ALL of the following in a single JSON response.\n\nText:\n' +
      sample,
    'You are a story world analysis engine. Extract characters, locations, themes, and relationships from the provided narrative text.\n\nReturn ONLY a valid JSON object with this exact structure:\n{\n  "summary": "A 2-3 sentence summary of the story",\n  "characters": [\n    { "name": "Character Name", "description": "Brief description from the text", "role": "protagonist/antagonist/supporting/minor" }\n  ],\n  "locations": [\n    { "name": "Place Name", "description": "What we know about this place" }\n  ],\n  "themes": [\n    { "name": "Theme Name", "description": "How this theme appears in the story" }\n  ],\n  "relationships": [\n    { "character1": "Name", "character2": "Name", "type": "family/romantic/rivalry/friendship/professional", "description": "Nature of the relationship" }\n  ]\n}\n\nBe thorough. Extract every named character, location, theme. Return valid JSON only.'
  )

  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON')
    const parsed = JSON.parse(match[0]) as QuickExtraction
    return {
      summary: parsed.summary ?? '',
      characters: parsed.characters ?? [],
      locations: parsed.locations ?? [],
      themes: parsed.themes ?? [],
      relationships: parsed.relationships ?? [],
    }
  } catch {
    return {
      summary: '',
      characters: [],
      locations: [],
      themes: [],
      relationships: [],
    }
  }
}
