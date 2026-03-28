import type { Prisma } from '@prisma/client'

// =============================================================================
// Re-export Prisma model types (source of truth is the schema)
// =============================================================================

export type { StoryWorld, Character, Beat, User } from '@prisma/client'

// =============================================================================
// API Request Payloads
// =============================================================================

export interface CreateWorldPayload {
  name: string
  description?: string
  genre?: string
  logline?: string
}

export interface UpdateWorldPayload {
  name?: string
  description?: string
  genre?: string
  logline?: string
  coverUrl?: string
  settings?: Prisma.InputJsonValue
}

export interface CreateCharacterPayload {
  name: string
  description?: string
  backstory?: string
  physicalDesc?: string
  psychProfile?: string
  archetype?: string
  aliases?: string[]
  goals?: Prisma.InputJsonValue
  traits?: Prisma.InputJsonValue
}

export interface UpdateCharacterPayload {
  name?: string
  description?: string
  backstory?: string
  physicalDesc?: string
  psychProfile?: string
  archetype?: string
  aliases?: string[]
  goals?: Prisma.InputJsonValue
  traits?: Prisma.InputJsonValue
}

export type BeatStatus = 'todo' | 'in_progress' | 'done'

export interface CreateBeatPayload {
  name: string
  description?: string
  color?: string
  starRating?: number
  notes?: string
  status?: BeatStatus
  characterId?: string
  sequenceId?: string
  position?: number
}

export interface UpdateBeatPayload {
  name?: string
  description?: string
  color?: string
  starRating?: number
  notes?: string
  status?: BeatStatus
  characterId?: string | null
  sequenceId?: string | null
  position?: number
}

export interface ReorderBeatsPayload {
  beats: { id: string; position: number; status?: BeatStatus }[]
}

// =============================================================================
// API Response Shapes
// =============================================================================

export interface ApiResponse<T> {
  data: T
}

export interface ApiError {
  error: string
  code: string
}

export interface ApiListResponse<T> {
  data: T[]
  total: number
}

// =============================================================================
// Auth Types
// =============================================================================

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface SessionUser {
  id: string
  email: string
  name: string
}
