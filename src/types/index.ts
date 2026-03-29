import type { Prisma } from '@prisma/client'

// =============================================================================
// Re-export Prisma model types (source of truth is the schema)
// =============================================================================

export type {
  StoryWorld,
  Character,
  Beat,
  User,
  Location,
  Event,
  Scene,
  Faction,
  Theme,
  Motif,
  StoryObject,
  Arc,
  ArcPhase,
  Relationship,
  Sequence,
  Act,
  SourceMaterial,
  Manuscript,
  ManuscriptSection,
  Treatment,
  Comment,
  Annotation,
  Tag,
} from '@prisma/client'

// =============================================================================
// API Request Payloads — World
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

// =============================================================================
// API Request Payloads — Character
// =============================================================================

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

// =============================================================================
// API Request Payloads — Beat
// =============================================================================

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
  treatmentOverride?: string | null
}

export interface ReorderBeatsPayload {
  beats: { id: string; position: number; status?: BeatStatus }[]
}

// =============================================================================
// API Request Payloads — Location
// =============================================================================

export interface CreateLocationPayload {
  name: string
  description?: string
  locationType?: string
  parentId?: string
  coordinates?: Prisma.InputJsonValue
  properties?: Prisma.InputJsonValue
}

export interface UpdateLocationPayload {
  name?: string
  description?: string
  locationType?: string
  parentId?: string | null
  coordinates?: Prisma.InputJsonValue
  properties?: Prisma.InputJsonValue
}

// =============================================================================
// API Request Payloads — Event
// =============================================================================

export interface CreateEventPayload {
  name: string
  description?: string
  fabulaPosition?: number
  fabulaDate?: string
  isKeyEvent?: boolean
  locationId?: string
}

export interface UpdateEventPayload {
  name?: string
  description?: string
  fabulaPosition?: number
  fabulaDate?: string
  isKeyEvent?: boolean
  locationId?: string | null
}

// =============================================================================
// API Request Payloads — Scene
// =============================================================================

export interface CreateScenePayload {
  name: string
  summary?: string
  content?: string
  sjuzhetPosition?: number
  purpose?: string
  tone?: string
  polarity?: number
  wordCountTarget?: number
  eventId?: string
  locationId?: string
  beatId?: string
  sequenceId?: string
  actId?: string
}

export interface UpdateScenePayload {
  name?: string
  summary?: string
  content?: string
  sjuzhetPosition?: number
  purpose?: string
  tone?: string
  polarity?: number
  wordCountTarget?: number
  eventId?: string | null
  locationId?: string | null
  beatId?: string | null
  sequenceId?: string | null
  actId?: string | null
}

// =============================================================================
// API Request Payloads — Faction
// =============================================================================

export interface CreateFactionPayload {
  name: string
  description?: string
  factionType?: string
  goals?: Prisma.InputJsonValue
  resources?: Prisma.InputJsonValue
}

export interface UpdateFactionPayload {
  name?: string
  description?: string
  factionType?: string
  goals?: Prisma.InputJsonValue
  resources?: Prisma.InputJsonValue
}

// =============================================================================
// API Request Payloads — Theme & Motif
// =============================================================================

export interface CreateThemePayload {
  name: string
  description?: string
  thesis?: string
}

export interface UpdateThemePayload {
  name?: string
  description?: string
  thesis?: string
}

export interface CreateMotifPayload {
  name: string
  description?: string
  motifType?: string
  occurrences?: Prisma.InputJsonValue
}

export interface UpdateMotifPayload {
  name?: string
  description?: string
  motifType?: string
  occurrences?: Prisma.InputJsonValue
}

// =============================================================================
// API Request Payloads — StoryObject
// =============================================================================

export interface CreateObjectPayload {
  name: string
  description?: string
  objectType?: string
  significance?: string
  properties?: Prisma.InputJsonValue
}

export interface UpdateObjectPayload {
  name?: string
  description?: string
  objectType?: string
  significance?: string
  properties?: Prisma.InputJsonValue
}

// =============================================================================
// API Request Payloads — Arc & ArcPhase
// =============================================================================

export interface CreateArcPayload {
  name: string
  arcType?: string
  description?: string
  characterId?: string
}

export interface UpdateArcPayload {
  name?: string
  arcType?: string
  description?: string
  characterId?: string | null
}

export interface CreateArcPhasePayload {
  name: string
  description?: string
  position?: number
  state?: string
  targetType?: string
  targetId?: string
}

export interface UpdateArcPhasePayload {
  name?: string
  description?: string
  position?: number
  state?: string
  targetType?: string | null
  targetId?: string | null
}

// =============================================================================
// API Request Payloads — Relationship
// =============================================================================

export interface CreateRelationshipPayload {
  type: string
  subtype?: string
  intensity?: number
  description?: string
  bidirectional?: boolean
  characterAId: string
  characterBId: string
  validFromEventId?: string
  validToEventId?: string
}

export interface UpdateRelationshipPayload {
  type?: string
  subtype?: string
  intensity?: number
  description?: string
  bidirectional?: boolean
  validFromEventId?: string | null
  validToEventId?: string | null
}

// =============================================================================
// API Request Payloads — Sequence & Act
// =============================================================================

export interface CreateSequencePayload {
  name: string
  description?: string
  position?: number
  actId?: string
}

export interface UpdateSequencePayload {
  name?: string
  description?: string
  position?: number
  actId?: string | null
}

export interface CreateActPayload {
  name: string
  description?: string
  position?: number
}

export interface UpdateActPayload {
  name?: string
  description?: string
  position?: number
}

// =============================================================================
// API Request Payloads — Source Material
// =============================================================================

export interface CreateSourceMaterialPayload {
  title: string
  sourceType?: string
  author?: string
  url?: string
  content?: string
  notes?: string
}

export interface UpdateSourceMaterialPayload {
  title?: string
  sourceType?: string
  author?: string
  url?: string
  content?: string
  notes?: string
}

// =============================================================================
// API Request Payloads — Manuscript & Section
// =============================================================================

export interface CreateManuscriptPayload {
  title: string
  format?: string
  status?: string
  targetWordCount?: number
}

export interface UpdateManuscriptPayload {
  title?: string
  format?: string
  status?: string
  targetWordCount?: number
}

export interface CreateManuscriptSectionPayload {
  title: string
  sectionType?: string
  position?: number
  content?: string
  status?: string
  notes?: string
  parentId?: string
  sceneId?: string
}

export interface UpdateManuscriptSectionPayload {
  title?: string
  sectionType?: string
  position?: number
  content?: string
  wordCount?: number
  status?: string
  notes?: string
  parentId?: string | null
  sceneId?: string | null
}

// =============================================================================
// API Request Payloads — Treatment
// =============================================================================

export interface CreateTreatmentPayload {
  title: string
  level?: string
  content?: string
  version?: number
}

export interface UpdateTreatmentPayload {
  title?: string
  level?: string
  content?: string
  version?: number
}

// =============================================================================
// API Request Payloads — Comment, Tag, Annotation (polymorphic)
// =============================================================================

export interface CreateCommentPayload {
  content: string
  targetType: string
  targetId: string
  parentId?: string
}

export interface UpdateCommentPayload {
  content: string
}

export interface CreateTagPayload {
  name: string
  color?: string
  targetType: string
  targetId: string
}

export interface CreateAnnotationPayload {
  content: string
  targetType: string
  targetId: string
  anchorStart?: number
  anchorEnd?: number
  color?: string
  label?: string
}

export interface UpdateAnnotationPayload {
  content?: string
  anchorStart?: number
  anchorEnd?: number
  color?: string
  label?: string
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
