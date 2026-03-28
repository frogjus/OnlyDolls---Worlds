// =============================================================================
// SuperMemory Sync Type Definitions
// =============================================================================

export interface SyncConfig {
  apiKey: string
  baseUrl?: string
  containerTag: string
}

export interface WorldMemoryContainer {
  worldId: string
  containerTag: string
  lastSyncedAt?: Date
}

export interface SyncResult {
  success: boolean
  memoriesCreated: number
  memoriesUpdated: number
  errors: string[]
}

export interface MemoryEntry {
  id?: string
  content: string
  metadata: Record<string, string>
  containerTag: string
}

export interface SearchResult {
  id: string
  content: string
  score: number
  metadata: Record<string, string>
}
