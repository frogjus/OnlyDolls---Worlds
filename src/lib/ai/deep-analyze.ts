import { getAIClient } from './client'
import { DEEP_ANALYSIS_PROMPT } from './lenses/mega-prompt'

// ---------- result types ----------

export interface DeepCharacterAnalysis {
  name: string
  role: string
  psychologicalProfile: string
  motivation: { surface: string; deep: string }
  arcTrajectory: string
  contradictions: string[]
  voicePattern: string
  keyScenes: string[]
  thematicRole: string
}

export interface DeepRelationshipAnalysis {
  characters: [string, string]
  type: string
  dynamic: string
  evolution: string
  subtext: string
  keyMoments: string[]
  powerDynamics: string
  thematicFunction: string
}

export interface DeepThemeAnalysis {
  name: string
  thesis: string
  manifestation: string
  symbolicAnchors: string[]
  evolution: string
  opposition: string
}

export interface DeepLocationAnalysis {
  name: string
  atmosphere: string
  narrativeFunction: string
  thematicResonance: string
  characterAssociations: string
  transformation: string
}

export interface DeepInsights {
  mirrorStructures: string[]
  unconsciousPatterns: string[]
  chekhovsGuns: string[]
  strengths: string[]
  weaknesses: string[]
}

export interface DeepAnalysisResult {
  characters: DeepCharacterAnalysis[]
  relationships: DeepRelationshipAnalysis[]
  themes: DeepThemeAnalysis[]
  locations: DeepLocationAnalysis[]
  insights: DeepInsights
}

// ---------- helpers ----------

function condenseForAnalysis(text: string): string {
  const words = text.split(/\s+/)
  if (words.length <= 80000) return text

  // Trim to ~80k words to stay within context limits
  return words.slice(0, 80000).join(' ')
}

function parseJSON<T>(raw: string): T {
  // Try to extract JSON from the response (handles markdown wrapping)
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON object found in AI response')
  return JSON.parse(jsonMatch[0]) as T
}

// ---------- main export ----------

export async function deepAnalyze(text: string): Promise<DeepAnalysisResult> {
  const client = getAIClient()
  const condensed = condenseForAnalysis(text)

  const raw = await client.analyze(
    condensed,
    DEEP_ANALYSIS_PROMPT,
    { maxTokens: 16384 }
  )

  return parseJSON<DeepAnalysisResult>(raw)
}
