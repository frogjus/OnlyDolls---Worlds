// =============================================================================
// AI Layer Type Definitions
// =============================================================================

export type AIOperationType =
  | 'entity_extraction'
  | 'consistency_check'
  | 'pacing_analysis'
  | 'beat_generation'
  | 'script_generation'
  | 'synopsis_expansion'
  | 'treatment_generation'

export interface AIContext {
  worldId: string
  synopsis?: string
  characters?: { id: string; name: string }[]
  beats?: { id: string; title: string; description?: string }[]
  memoryContext?: string[]
}

export interface AISuggestion {
  suggestion: string
  confidence: number
  contextUsed: string[]
}

export interface AnalysisResult {
  entities?: ExtractedEntity[]
  contradictions?: Contradiction[]
  metrics?: Record<string, number>
  raw: string
}

export interface ExtractedEntity {
  name: string
  type: 'character' | 'location' | 'event' | 'item' | 'faction'
  description: string
  confidence: number
}

export interface Contradiction {
  description: string
  severity: 'critical' | 'major' | 'minor'
  entities: string[]
  suggestion: string
}

export interface GenerationContext extends AIContext {
  currentBeat?: { title: string; description: string }
  selectedText?: string
}

export interface PromptPair {
  system: string
  user: string
}
