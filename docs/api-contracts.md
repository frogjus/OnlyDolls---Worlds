# StoryForge API Contract Specification

Complete endpoint reference for the StoryForge story world architecture platform. All endpoints are Next.js API routes under `/api`.

---

## Table of Contents

1. [Global Conventions](#global-conventions)
2. [Worlds](#1-worlds)
3. [Characters](#2-characters)
4. [Relationships](#3-relationships)
5. [Events](#4-events)
6. [Scenes](#5-scenes)
7. [Beats](#6-beats)
8. [Acts & Sequences](#7-acts--sequences)
9. [Arcs](#8-arcs)
10. [Locations](#9-locations)
11. [Objects](#10-objects)
12. [Themes & Motifs](#11-themes--motifs)
13. [Factions](#12-factions)
14. [Ingestion](#13-ingestion)
15. [Analysis](#14-analysis)
16. [Search](#15-search)
17. [Canon](#16-canon)
18. [Consistency](#17-consistency)
19. [What-If](#18-what-if)
20. [Structure Templates](#19-structure-templates)
21. [Export](#20-export)
22. [AI Assist (Wand)](#21-ai-assist-wand)
23. [Collaboration](#22-collaboration)
24. [Writing Surface](#23-writing-surface)
25. [Treatment](#24-treatment)
26. [Wiki](#25-wiki)
27. [WebSocket Events](#websocket-events)

---

## Global Conventions

### Authentication

All endpoints require a valid JWT bearer token unless marked `[public]`.

```
Authorization: Bearer <jwt_token>
```

JWT payload:

```typescript
interface JWTPayload {
  sub: string;          // user ID
  email: string;
  name: string;
  iat: number;
  exp: number;
}
```

Auth endpoints (outside scope of this doc) issue tokens at `/api/auth/login` and `/api/auth/refresh`.

### Pagination

All list endpoints accept and return a standard pagination envelope.

Query parameters:

| Param    | Type   | Default | Description                              |
|----------|--------|---------|------------------------------------------|
| `page`   | number | 1       | Page number (1-indexed)                  |
| `limit`  | number | 50      | Items per page (max 200)                 |
| `sort`   | string | `created_at` | Field to sort by                    |
| `order`  | string | `desc`  | Sort direction: `asc` or `desc`          |

Paginated response wrapper:

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
```

### Error Response Format

Every error response uses this shape:

```typescript
interface ErrorResponse {
  error: string;   // human-readable message
  code: string;    // machine-readable error code
}
```

Standard error codes:

| HTTP Status | Code                    | Meaning                                  |
|-------------|-------------------------|------------------------------------------|
| 400         | `VALIDATION_ERROR`      | Invalid request body or parameters       |
| 401         | `UNAUTHORIZED`          | Missing or invalid JWT                   |
| 403         | `FORBIDDEN`             | Insufficient permissions                 |
| 404         | `NOT_FOUND`             | Resource does not exist                  |
| 409         | `CONFLICT`              | Resource version conflict or duplicate   |
| 413         | `PAYLOAD_TOO_LARGE`     | Upload exceeds size limit                |
| 422         | `UNPROCESSABLE_ENTITY`  | Valid syntax but semantic error          |
| 429         | `RATE_LIMITED`           | Too many requests                        |
| 500         | `INTERNAL_ERROR`        | Server error                             |
| 503         | `SERVICE_UNAVAILABLE`   | Dependency unavailable (AI API, etc.)    |

### Rate Limiting

| Tier           | Limit             | Window  | Applies To                        |
|----------------|-------------------|---------|-----------------------------------|
| Standard       | 300 requests      | 1 min   | All authenticated endpoints       |
| AI / Analysis  | 30 requests       | 1 min   | `/api/analyze/*`, `/api/ai-assist/*` |
| Ingestion      | 10 requests       | 1 min   | `/api/ingest/*`                   |
| Export         | 10 requests       | 1 min   | `/api/export/*`                   |
| Search         | 60 requests       | 1 min   | `/api/search/*`                   |

Rate limit headers on every response:

```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 287
X-RateLimit-Reset: 1700000060
```

### Common Types

These types are referenced throughout the endpoint definitions.

```typescript
// Every entity carries these fields
interface BaseEntity {
  id: string;                    // UUID v4
  world_id: string;              // parent StoryWorld
  created_at: string;            // ISO 8601
  updated_at: string;            // ISO 8601
  created_by: string;            // user ID
}

// Temporal range for relationships and roles
interface TemporalRange {
  valid_from_event_id?: string;  // event ID marking start of validity
  valid_from_scene_id?: string;  // scene ID marking start of validity
  valid_to_event_id?: string;    // event ID marking end of validity
  valid_to_scene_id?: string;    // scene ID marking end of validity
}

// Media reference for entity attachments
interface MediaRef {
  id: string;
  url: string;
  type: "image" | "audio" | "video" | "document";
  filename: string;
  mime_type: string;
  size_bytes: number;
}

// Confidence-tagged AI extraction result
interface AIExtraction<T> {
  value: T;
  confidence: number;            // 0.0 to 1.0
  status: "proposed" | "confirmed" | "rejected";
  source_material_id?: string;
  source_offset?: number;        // character offset in source
  source_length?: number;
}
```

---

## 1. Worlds

Story worlds are the top-level container for all narrative data.

### `POST /api/worlds`

Create a new story world.

**Request:**

```typescript
interface CreateWorldRequest {
  title: string;                                // required, max 200 chars
  description?: string;
  synopsis?: string;                            // drives AI context; required before wand features activate
  media_type: "novel" | "screenplay" | "tv_series" | "game" | "short_story" | "other";
  mode: "film" | "tv";                          // determines structural hierarchy (acts vs seasons/episodes)
  genre_type?: string;                          // Blake Snyder genre classification
  story_pattern?: "heroic_arrow" | "carrier_bag" | "cyclical" | "network" | "ensemble";
  cover_image_url?: string;
  tags?: string[];
}
```

**Response:** `201 Created`

```typescript
interface WorldResponse extends BaseEntity {
  title: string;
  description: string | null;
  synopsis: string | null;
  media_type: string;
  mode: "film" | "tv";
  genre_type: string | null;
  story_pattern: string | null;
  cover_image_url: string | null;
  tags: string[];
  stats: {
    character_count: number;
    scene_count: number;
    event_count: number;
    word_count: number;
  };
  owner_id: string;
  collaborator_count: number;
}
```

### `GET /api/worlds`

List all worlds accessible by the authenticated user.

**Query Parameters:**

| Param        | Type   | Description                            |
|--------------|--------|----------------------------------------|
| `page`       | number | Pagination                             |
| `limit`      | number | Pagination                             |
| `media_type` | string | Filter by media type                   |
| `q`          | string | Search by title                        |
| `owned`      | boolean| Only show worlds owned by current user |

**Response:** `200 OK` — `PaginatedResponse<WorldResponse>`

### `GET /api/worlds/:worldId`

Get a single world with full details.

**Response:** `200 OK` — `WorldResponse`

### `PATCH /api/worlds/:worldId`

Update world metadata.

**Request:**

```typescript
interface UpdateWorldRequest {
  title?: string;
  description?: string;
  synopsis?: string;
  media_type?: string;
  mode?: "film" | "tv";
  genre_type?: string;
  story_pattern?: string;
  cover_image_url?: string;
  tags?: string[];
}
```

**Response:** `200 OK` — `WorldResponse`

### `DELETE /api/worlds/:worldId`

Delete a world and all its contents. Irreversible.

**Response:** `204 No Content`

### `GET /api/worlds/:worldId/stats`

Get aggregate statistics for a world.

**Response:** `200 OK`

```typescript
interface WorldStatsResponse {
  world_id: string;
  character_count: number;
  location_count: number;
  event_count: number;
  scene_count: number;
  beat_count: number;
  arc_count: number;
  relationship_count: number;
  source_material_count: number;
  word_count: number;
  last_activity: string;         // ISO 8601
}
```

### `GET /api/worlds/:worldId/settings`

Get world settings including calendar configuration.

**Response:** `200 OK`

```typescript
interface WorldSettingsResponse {
  world_id: string;
  calendar_system_id: string | null;
  default_structure_template_id: string | null;
  narrator: {
    type: "first_person" | "third_limited" | "third_omniscient" | "second_person" | "unreliable";
    character_id?: string;       // for first-person narrators
  } | null;
  focalization_default: "internal" | "external" | "zero" | null;
  narrative_levels: NarrativeLevel[];
  ai_assist_enabled: boolean;
  collaboration_enabled: boolean;
}
```

### `PATCH /api/worlds/:worldId/settings`

Update world settings.

**Request:**

```typescript
interface UpdateWorldSettingsRequest {
  calendar_system_id?: string | null;
  default_structure_template_id?: string | null;
  narrator?: {
    type: "first_person" | "third_limited" | "third_omniscient" | "second_person" | "unreliable";
    character_id?: string;
  } | null;
  focalization_default?: "internal" | "external" | "zero" | null;
  ai_assist_enabled?: boolean;
  collaboration_enabled?: boolean;
}
```

**Response:** `200 OK` — `WorldSettingsResponse`

### `POST /api/worlds/:worldId/calendar`

Create a custom calendar system for fantasy/sci-fi worlds.

**Request:**

```typescript
interface CreateCalendarRequest {
  name: string;                                  // e.g. "Heptadic Calendar"
  description?: string;
  epoch_label?: string;                          // e.g. "Age of Fire"
  days_per_week: number;
  day_names: string[];                           // length must match days_per_week
  months: {
    name: string;
    days: number;
  }[];
  hours_per_day?: number;                        // default 24
  eras?: {
    name: string;
    start_year: number;
    end_year?: number;
  }[];
  intercalary_days?: {                           // leap days, festival days outside months
    name: string;
    after_month_index: number;
    frequency?: number;                          // every N years; null = every year
  }[];
}
```

**Response:** `201 Created`

```typescript
interface CalendarSystemResponse extends BaseEntity {
  name: string;
  description: string | null;
  epoch_label: string | null;
  days_per_week: number;
  day_names: string[];
  months: { name: string; days: number }[];
  hours_per_day: number;
  eras: { name: string; start_year: number; end_year: number | null }[];
  intercalary_days: { name: string; after_month_index: number; frequency: number | null }[];
  total_days_per_year: number;                   // computed
}
```

### `PATCH /api/worlds/:worldId/calendar/:calendarId`

Update a custom calendar system.

**Request:** Partial `CreateCalendarRequest`

**Response:** `200 OK` — `CalendarSystemResponse`

### `DELETE /api/worlds/:worldId/calendar/:calendarId`

Delete a calendar system. Fails if events reference it.

**Response:** `204 No Content`

---

## 2. Characters

Characters with 100+ configurable attributes, interviews, and voice profiles.

### `POST /api/worlds/:worldId/characters`

Create a new character.

**Request:**

```typescript
interface CreateCharacterRequest {
  name: string;                                  // required
  aliases?: string[];
  role_importance: "protagonist" | "antagonist" | "secondary" | "tertiary" | "mentioned";
  status: "alive" | "dead" | "unknown" | "other";

  // Physical attributes
  physical?: {
    age?: number | string;                       // number or description like "early 30s"
    gender?: string;
    ethnicity?: string;
    height?: string;
    build?: string;
    hair_color?: string;
    hair_style?: string;
    eye_color?: string;
    skin_tone?: string;
    distinguishing_marks?: string[];             // scars, tattoos, etc.
    clothing_style?: string;
    portrait_url?: string;
    additional?: Record<string, string>;         // extensible physical attributes
  };

  // Psychological profile
  psychological?: {
    personality_type?: string;                   // e.g. MBTI, enneagram
    temperament?: string;
    values?: string[];
    fears?: string[];
    desires?: string[];
    flaws?: string[];
    strengths?: string[];
    habits?: string[];
    quirks?: string[];
    internal_conflict?: string;
    worldview?: string;
    moral_alignment?: string;                    // e.g. "lawful good"
    additional?: Record<string, string>;
  };

  // Background
  background?: {
    birthplace?: string;
    occupation?: string;
    education?: string;
    socioeconomic_status?: string;
    family_background?: string;
    key_backstory_events?: string[];
    secrets?: string[];
    skills?: string[];
    languages?: string[];
    additional?: Record<string, string>;
  };

  // Story function
  narrative?: {
    character_arc_summary?: string;
    motivation?: string;
    goal?: string;
    obstacle?: string;
    ghost?: string;                              // wound from the past driving behavior
    lie_believed?: string;                       // thematic lie the character believes
    truth_learned?: string;                      // thematic truth discovered
    need_vs_want?: { need: string; want: string };
    additional?: Record<string, string>;
  };

  // Custom attributes (for the 100+ extensible fields)
  custom_attributes?: Record<string, string | number | boolean | string[]>;

  faction_ids?: string[];
  tags?: string[];
  notes?: string;
  color?: string;                                // hex color for visualization
}
```

**Response:** `201 Created`

```typescript
interface CharacterResponse extends BaseEntity {
  name: string;
  aliases: string[];
  role_importance: string;
  status: string;
  physical: Record<string, any>;
  psychological: Record<string, any>;
  background: Record<string, any>;
  narrative: Record<string, any>;
  custom_attributes: Record<string, any>;
  faction_ids: string[];
  tags: string[];
  notes: string | null;
  color: string | null;
  voice_profile: VoiceProfileSummary | null;
  relationship_count: number;
  scene_count: number;
}
```

### `GET /api/worlds/:worldId/characters`

List characters in a world.

**Query Parameters:**

| Param            | Type   | Description                             |
|------------------|--------|-----------------------------------------|
| `page`, `limit`  | number | Pagination                              |
| `role_importance` | string | Filter: protagonist, antagonist, etc.   |
| `status`         | string | Filter: alive, dead, unknown            |
| `faction_id`     | string | Filter by faction membership            |
| `tag`            | string | Filter by tag                           |
| `q`              | string | Search by name or alias                 |
| `include_voice`  | boolean| Include voice profile summary           |

**Response:** `200 OK` — `PaginatedResponse<CharacterResponse>`

### `GET /api/worlds/:worldId/characters/:characterId`

Get full character details.

**Response:** `200 OK` — `CharacterResponse` (with expanded fields)

### `PATCH /api/worlds/:worldId/characters/:characterId`

Update character. Partial updates are supported at any nesting level.

**Request:** Partial `CreateCharacterRequest`

**Response:** `200 OK` — `CharacterResponse`

### `DELETE /api/worlds/:worldId/characters/:characterId`

Delete a character. Relationships and role assignments are cascade-deleted.

**Response:** `204 No Content`

### `POST /api/worlds/:worldId/characters/:characterId/interview`

Start or continue a character interview (Bibisco-inspired guided questionnaire).

**Request:**

```typescript
interface CharacterInterviewRequest {
  session_id?: string;                           // omit to start new session
  answers: {
    question_id: string;
    answer: string;
  }[];
}
```

**Response:** `200 OK`

```typescript
interface CharacterInterviewResponse {
  session_id: string;
  character_id: string;
  progress: number;                              // 0.0 to 1.0
  completed_categories: string[];
  current_category: string;
  next_questions: {
    question_id: string;
    category: "identity" | "psychology" | "relationships" | "history" | "goals" | "voice" | "appearance" | "habits" | "beliefs" | "secrets";
    question_text: string;
    hint?: string;
    required: boolean;
  }[];
  auto_populated_fields: {                       // fields auto-filled from answers
    field_path: string;                          // e.g. "psychological.fears"
    value: string;
  }[];
}
```

### `GET /api/worlds/:worldId/characters/:characterId/interview`

Get all interview sessions for a character.

**Response:** `200 OK`

```typescript
interface InterviewSessionListResponse {
  sessions: {
    session_id: string;
    started_at: string;
    last_updated: string;
    progress: number;
    answer_count: number;
  }[];
}
```

### `GET /api/worlds/:worldId/characters/:characterId/voice-profile`

Get the computed voice profile for a character.

**Response:** `200 OK`

```typescript
interface VoiceProfileResponse extends BaseEntity {
  character_id: string;
  vocabulary_level: "simple" | "moderate" | "complex" | "specialized";
  avg_sentence_length: number;                   // words
  formality_level: number;                       // 0.0 (casual) to 1.0 (formal)
  speech_tics: string[];                         // repeated phrases, filler words
  dialect_markers: string[];
  favorite_expressions: string[];
  contraction_frequency: number;                 // 0.0 to 1.0
  question_frequency: number;                    // proportion of dialogue that is questions
  exclamation_frequency: number;
  unique_word_count: number;
  top_words: { word: string; count: number }[];
  sample_dialogue: string[];                     // representative lines
  similarity_warnings: {                         // other characters that sound too similar
    character_id: string;
    character_name: string;
    similarity_score: number;                    // 0.0 to 1.0
  }[];
  last_computed: string;                         // ISO 8601
}
```

### `POST /api/worlds/:worldId/characters/:characterId/voice-profile/compute`

Trigger recomputation of a character's voice profile from their dialogue.

**Request:**

```typescript
interface ComputeVoiceProfileRequest {
  scene_ids?: string[];                          // limit to specific scenes; omit for all
}
```

**Response:** `202 Accepted`

```typescript
interface JobAcceptedResponse {
  job_id: string;
  status: "queued";
  estimated_seconds?: number;
}
```

### `GET /api/worlds/:worldId/characters/:characterId/roles`

Get all narrative roles assigned to a character across the story.

**Response:** `200 OK`

```typescript
interface CharacterRolesResponse {
  character_id: string;
  roles: {
    id: string;
    framework: "vogler" | "greimas" | "propp" | "dramatica" | "custom";
    role_name: string;                           // e.g. "Herald", "Subject", "Villain"
    scene_id?: string;
    event_id?: string;
    temporal_range: TemporalRange;
    notes?: string;
  }[];
}
```

### `POST /api/worlds/:worldId/characters/:characterId/roles`

Assign a narrative role to a character for a given scope.

**Request:**

```typescript
interface AssignNarrativeRoleRequest {
  framework: "vogler" | "greimas" | "propp" | "dramatica" | "custom";
  role_name: string;
  scene_id?: string;
  event_id?: string;
  temporal_range?: TemporalRange;
  notes?: string;
}
```

**Response:** `201 Created`

```typescript
interface NarrativeRoleResponse extends BaseEntity {
  character_id: string;
  framework: string;
  role_name: string;
  scene_id: string | null;
  event_id: string | null;
  temporal_range: TemporalRange;
  notes: string | null;
}
```

### `DELETE /api/worlds/:worldId/characters/:characterId/roles/:roleId`

Remove a narrative role assignment.

**Response:** `204 No Content`

---

## 3. Relationships

Temporal, typed, weighted edges between any two entities.

### `POST /api/worlds/:worldId/relationships`

Create a relationship.

**Request:**

```typescript
interface CreateRelationshipRequest {
  source_entity_type: "character" | "faction" | "location" | "object" | "event";
  source_entity_id: string;
  target_entity_type: "character" | "faction" | "location" | "object" | "event";
  target_entity_id: string;
  relationship_type: string;                     // e.g. "parent_of", "allied_with", "loves", "rivals", "owns", "located_in"
  label?: string;                                // display label override
  weight: number;                                // 0.0 to 1.0 (strength/importance)
  bidirectional: boolean;                        // true = mutual, false = directed
  sentiment: "positive" | "negative" | "neutral" | "ambivalent";
  description?: string;
  temporal_range?: TemporalRange;
  color?: string;                                // hex color for visualization
  tags?: string[];
}
```

**Response:** `201 Created`

```typescript
interface RelationshipResponse extends BaseEntity {
  source_entity_type: string;
  source_entity_id: string;
  source_entity_name: string;                    // resolved name for display
  target_entity_type: string;
  target_entity_id: string;
  target_entity_name: string;
  relationship_type: string;
  label: string | null;
  weight: number;
  bidirectional: boolean;
  sentiment: string;
  description: string | null;
  temporal_range: TemporalRange;
  color: string | null;
  tags: string[];
}
```

### `GET /api/worlds/:worldId/relationships`

List relationships in a world.

**Query Parameters:**

| Param                | Type   | Description                                |
|----------------------|--------|--------------------------------------------|
| `page`, `limit`      | number | Pagination                                 |
| `entity_id`          | string | Relationships involving this entity        |
| `entity_type`        | string | Filter by entity type                      |
| `relationship_type`  | string | Filter by type (parent_of, loves, etc.)    |
| `sentiment`          | string | Filter by sentiment                        |
| `at_event_id`        | string | Only relationships valid at this event     |
| `at_scene_id`        | string | Only relationships valid at this scene     |
| `bidirectional`      | boolean| Filter by directionality                   |
| `min_weight`         | number | Minimum weight threshold                   |

**Response:** `200 OK` — `PaginatedResponse<RelationshipResponse>`

### `GET /api/worlds/:worldId/relationships/:relationshipId`

Get a single relationship.

**Response:** `200 OK` — `RelationshipResponse`

### `PATCH /api/worlds/:worldId/relationships/:relationshipId`

Update a relationship.

**Request:** Partial `CreateRelationshipRequest`

**Response:** `200 OK` — `RelationshipResponse`

### `DELETE /api/worlds/:worldId/relationships/:relationshipId`

Delete a relationship.

**Response:** `204 No Content`

### `GET /api/worlds/:worldId/relationships/graph`

Get the full relationship graph for visualization (character map, faction map).

**Query Parameters:**

| Param            | Type    | Description                                    |
|------------------|---------|------------------------------------------------|
| `entity_types`   | string  | Comma-separated entity types to include        |
| `relationship_types` | string | Comma-separated relationship types to include |
| `at_event_id`    | string  | Snapshot relationships at this event           |
| `at_scene_id`    | string  | Snapshot relationships at this scene           |
| `faction_id`     | string  | Filter to faction members only                 |
| `max_depth`      | number  | Max traversal depth from a root entity (default 3) |
| `root_entity_id` | string  | Start graph from this entity                   |
| `cluster_by`     | string  | `faction`, `family`, `allegiance`              |
| `min_weight`     | number  | Exclude weak relationships below threshold     |

**Response:** `200 OK`

```typescript
interface RelationshipGraphResponse {
  nodes: {
    id: string;
    entity_type: string;
    name: string;
    color: string | null;
    importance: number;                          // for node sizing
    faction_id: string | null;
    metadata: Record<string, any>;               // role_importance, status, etc.
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    relationship_type: string;
    label: string | null;
    weight: number;
    sentiment: string;
    bidirectional: boolean;
    color: string | null;
  }[];
  clusters: {
    id: string;
    label: string;
    node_ids: string[];
  }[];
}
```

### `GET /api/worlds/:worldId/relationships/graph/timeline`

Get relationship graph at multiple time points for animation.

**Query Parameters:**

| Param          | Type   | Description                                 |
|----------------|--------|---------------------------------------------|
| `event_ids`    | string | Comma-separated event IDs as time points    |
| `scene_ids`    | string | Comma-separated scene IDs as time points    |
| `entity_types` | string | Comma-separated entity types to include     |
| `steps`        | number | Number of evenly-spaced snapshots (default 10) |

**Response:** `200 OK`

```typescript
interface RelationshipTimelineResponse {
  snapshots: {
    point_id: string;                            // event or scene ID
    point_label: string;
    graph: RelationshipGraphResponse;
  }[];
}
```

---

## 4. Events

Something that happens in the story. Exists in both fabula and sjuzhet timelines.

### `POST /api/worlds/:worldId/events`

Create an event.

**Request:**

```typescript
interface CreateEventRequest {
  title: string;
  description?: string;
  event_type: "action" | "dialogue" | "discovery" | "transformation" | "revelation" | "decision" | "custom";
  custom_type_label?: string;                    // when event_type is "custom"

  // Fabula positioning (chronological truth)
  fabula_position: {
    date?: string;                               // ISO 8601 or custom calendar date string
    calendar_system_id?: string;                 // for custom calendars
    sequence_order: number;                      // ordinal for ordering within same date
  };

  // Sjuzhet positioning (narrative presentation order)
  sjuzhet_position: {
    act_id?: string;
    sequence_id?: string;
    scene_id?: string;
    beat_id?: string;
    presentation_order: number;                  // global ordinal in narrative
  };

  character_ids?: string[];                      // characters involved
  location_id?: string;
  object_ids?: string[];                         // significant objects in this event
  tags?: string[];
  is_canonical: boolean;                         // default true
  branch_id?: string;                            // if part of a what-if branch
  source_material_id?: string;
  source_offset?: number;
  source_length?: number;
}
```

**Response:** `201 Created`

```typescript
interface EventResponse extends BaseEntity {
  title: string;
  description: string | null;
  event_type: string;
  custom_type_label: string | null;
  fabula_position: {
    date: string | null;
    calendar_system_id: string | null;
    sequence_order: number;
  };
  sjuzhet_position: {
    act_id: string | null;
    sequence_id: string | null;
    scene_id: string | null;
    beat_id: string | null;
    presentation_order: number;
  };
  character_ids: string[];
  character_names: string[];                     // resolved for display
  location_id: string | null;
  location_name: string | null;
  object_ids: string[];
  tags: string[];
  is_canonical: boolean;
  branch_id: string | null;
  source_material_id: string | null;
  causal_relations_count: number;
}
```

### `GET /api/worlds/:worldId/events`

List events.

**Query Parameters:**

| Param           | Type    | Description                                |
|-----------------|---------|-------------------------------------------|
| `page`, `limit` | number  | Pagination                                |
| `event_type`    | string  | Filter by type                            |
| `character_id`  | string  | Events involving this character            |
| `location_id`   | string  | Events at this location                    |
| `scene_id`      | string  | Events in this scene                       |
| `act_id`        | string  | Events in this act                         |
| `branch_id`     | string  | Events in this branch (null = canonical)   |
| `is_canonical`  | boolean | Filter canonical/speculative               |
| `timeline`      | string  | `fabula` or `sjuzhet` (affects sort order) |
| `date_from`     | string  | Fabula date range start                    |
| `date_to`       | string  | Fabula date range end                      |
| `tag`           | string  | Filter by tag                              |

**Response:** `200 OK` — `PaginatedResponse<EventResponse>`

### `GET /api/worlds/:worldId/events/:eventId`

Get full event details.

**Response:** `200 OK` — `EventResponse`

### `PATCH /api/worlds/:worldId/events/:eventId`

Update an event.

**Request:** Partial `CreateEventRequest`

**Response:** `200 OK` — `EventResponse`

### `DELETE /api/worlds/:worldId/events/:eventId`

Delete an event. Causal relations are cascade-deleted.

**Response:** `204 No Content`

### `GET /api/worlds/:worldId/events/timeline`

Get events arranged for dual timeline visualization.

**Query Parameters:**

| Param           | Type   | Description                              |
|-----------------|--------|------------------------------------------|
| `character_ids` | string | Comma-separated; filter to these lanes   |
| `arc_id`        | string | Events on this arc                       |
| `location_ids`  | string | Comma-separated; filter to these locations |
| `date_from`     | string | Fabula date range start                  |
| `date_to`       | string | Fabula date range end                    |
| `zoom`          | string | `series`, `season`, `episode`, `scene`, `beat` |
| `branch_id`     | string | Include branch events alongside canonical |

**Response:** `200 OK`

```typescript
interface DualTimelineResponse {
  fabula: {
    events: (EventResponse & { lane: string })[];
    lanes: { id: string; label: string; type: "character" | "arc" | "location" }[];
  };
  sjuzhet: {
    events: (EventResponse & { lane: string })[];
    lanes: { id: string; label: string; type: "character" | "arc" | "location" }[];
  };
  connections: {
    event_id: string;
    fabula_index: number;
    sjuzhet_index: number;
  }[];
  calendar_system: CalendarSystemResponse | null;
}
```

---

## 5. Scenes

Collection of beats with a net value change (McKee). Has goal/conflict/outcome.

### `POST /api/worlds/:worldId/scenes`

Create a scene.

**Request:**

```typescript
interface CreateSceneRequest {
  title: string;
  description?: string;
  sequence_id?: string;                          // parent sequence
  act_id?: string;                               // parent act
  episode_id?: string;                           // for TV mode
  order_index: number;                           // position within parent

  // yWriter-style scene fields
  goal?: string;                                 // what the POV character wants
  conflict?: string;                             // what opposes the goal
  outcome?: string;                              // how the scene resolves

  // McKee value change
  value_changes?: {
    value_name: string;                          // e.g. "hope", "justice", "love"
    direction: "positive" | "negative" | "ambiguous";
    magnitude: number;                           // 1-5
    description?: string;
  }[];

  location_id?: string;
  character_ids?: string[];
  pov_character_id?: string;                     // focalization

  // Genette narratological properties
  focalization?: "internal" | "external" | "zero";
  duration_type?: "scene" | "summary" | "ellipsis" | "stretch" | "pause";
  frequency?: "singulative" | "repeating" | "iterative";

  word_count_target?: number;
  status: "planned" | "drafting" | "revised" | "final";
  tags?: string[];
  notes?: string;
  color?: string;
}
```

**Response:** `201 Created`

```typescript
interface SceneResponse extends BaseEntity {
  title: string;
  description: string | null;
  sequence_id: string | null;
  act_id: string | null;
  episode_id: string | null;
  order_index: number;
  goal: string | null;
  conflict: string | null;
  outcome: string | null;
  value_changes: {
    value_name: string;
    direction: string;
    magnitude: number;
    description: string | null;
  }[];
  location_id: string | null;
  location_name: string | null;
  character_ids: string[];
  character_names: string[];
  pov_character_id: string | null;
  focalization: string | null;
  duration_type: string | null;
  frequency: string | null;
  word_count_target: number | null;
  word_count_actual: number;
  status: string;
  tags: string[];
  notes: string | null;
  color: string | null;
  beat_count: number;
  pacing_metrics: PacingMetricSummary | null;
}
```

### `GET /api/worlds/:worldId/scenes`

List scenes.

**Query Parameters:**

| Param           | Type   | Description                              |
|-----------------|--------|------------------------------------------|
| `page`, `limit` | number | Pagination                               |
| `act_id`        | string | Scenes in this act                       |
| `sequence_id`   | string | Scenes in this sequence                  |
| `episode_id`    | string | Scenes in this episode (TV mode)         |
| `character_id`  | string | Scenes involving this character           |
| `location_id`   | string | Scenes at this location                  |
| `status`        | string | Filter by status                         |
| `tag`           | string | Filter by tag                            |
| `sort`          | string | `order_index`, `created_at`, `word_count` |

**Response:** `200 OK` — `PaginatedResponse<SceneResponse>`

### `GET /api/worlds/:worldId/scenes/:sceneId`

Get full scene details including beats.

**Response:** `200 OK` — `SceneResponse & { beats: BeatResponse[] }`

### `PATCH /api/worlds/:worldId/scenes/:sceneId`

Update a scene.

**Request:** Partial `CreateSceneRequest`

**Response:** `200 OK` — `SceneResponse`

### `DELETE /api/worlds/:worldId/scenes/:sceneId`

Delete a scene and its child beats.

**Response:** `204 No Content`

### `POST /api/worlds/:worldId/scenes/reorder`

Reorder scenes within a parent container.

**Request:**

```typescript
interface ReorderScenesRequest {
  scene_orders: {
    scene_id: string;
    order_index: number;
  }[];
}
```

**Response:** `200 OK`

```typescript
interface ReorderResponse {
  updated_count: number;
}
```

### `GET /api/worlds/:worldId/scenes/:sceneId/emotional-states`

Get emotional states for all characters in a scene.

**Response:** `200 OK`

```typescript
interface SceneEmotionalStatesResponse {
  scene_id: string;
  states: {
    character_id: string;
    character_name: string;
    joy: number;            // 0.0 to 1.0
    grief: number;
    anger: number;
    fear: number;
    hope: number;
    surprise: number;
    dominant_emotion: string;
    notes: string | null;
  }[];
}
```

### `PUT /api/worlds/:worldId/scenes/:sceneId/emotional-states`

Set emotional states for characters in a scene.

**Request:**

```typescript
interface SetEmotionalStatesRequest {
  states: {
    character_id: string;
    joy: number;
    grief: number;
    anger: number;
    fear: number;
    hope: number;
    surprise: number;
    notes?: string;
  }[];
}
```

**Response:** `200 OK` — `SceneEmotionalStatesResponse`

---

## 6. Beats

Atomic unit of action/reaction. Beat cards with Othelia-matching fields.

### `POST /api/worlds/:worldId/beats`

Create a beat.

**Request:**

```typescript
interface CreateBeatRequest {
  title: string;
  description?: string;
  scene_id?: string;                             // parent scene
  order_index: number;                           // position within scene or board

  // Othelia-matching beat card fields
  character_ids?: string[];                      // characters assigned to this beat
  color?: string;                                // hex color coding
  tags?: string[];
  notes?: string;
  star_rating?: number;                          // 1-5 (Othelia star rating)

  // Beat type
  beat_type?: "action" | "reaction" | "revelation" | "decision" | "dialogue" | "description" | "transition" | "custom";

  // Linkage to writing surface
  document_id?: string;                          // linked writing surface document
  document_anchor?: string;                      // anchor within document to jump to

  // Structure mapping (optional; links beat to a structure template position)
  structure_mapping?: {
    template_id: string;
    structure_beat_id: string;
  };
}
```

**Response:** `201 Created`

```typescript
interface BeatResponse extends BaseEntity {
  title: string;
  description: string | null;
  scene_id: string | null;
  order_index: number;
  character_ids: string[];
  character_names: string[];
  color: string | null;
  tags: string[];
  notes: string | null;
  star_rating: number | null;
  beat_type: string | null;
  document_id: string | null;
  document_anchor: string | null;
  structure_mapping: {
    template_id: string;
    template_name: string;
    structure_beat_id: string;
    structure_beat_name: string;
    expected_position_pct: number | null;
  } | null;
}
```

### `GET /api/worlds/:worldId/beats`

List beats (for the beat sheet / scene board).

**Query Parameters:**

| Param           | Type   | Description                              |
|-----------------|--------|------------------------------------------|
| `page`, `limit` | number | Pagination                               |
| `scene_id`      | string | Beats in this scene                      |
| `character_id`  | string | Beats assigned to this character         |
| `tag`           | string | Filter by tag                            |
| `star_rating`   | number | Filter by exact star rating              |
| `min_rating`    | number | Filter by minimum star rating            |
| `color`         | string | Filter by color                          |
| `beat_type`     | string | Filter by beat type                      |
| `template_id`   | string | Beats mapped to this structure template  |
| `unmapped`      | boolean| Beats not mapped to any structure        |
| `sort`          | string | `order_index`, `star_rating`, `created_at` |

**Response:** `200 OK` — `PaginatedResponse<BeatResponse>`

### `GET /api/worlds/:worldId/beats/:beatId`

Get a single beat.

**Response:** `200 OK` — `BeatResponse`

### `PATCH /api/worlds/:worldId/beats/:beatId`

Update a beat. Triggers treatment auto-regeneration.

**Request:** Partial `CreateBeatRequest`

**Response:** `200 OK` — `BeatResponse`

### `DELETE /api/worlds/:worldId/beats/:beatId`

Delete a beat. Triggers treatment auto-regeneration.

**Response:** `204 No Content`

### `POST /api/worlds/:worldId/beats/reorder`

Reorder beats (drag-and-drop on scene board). Triggers treatment auto-regeneration and story world update.

**Request:**

```typescript
interface ReorderBeatsRequest {
  beat_orders: {
    beat_id: string;
    order_index: number;
    scene_id?: string;                           // allows moving between scenes
  }[];
}
```

**Response:** `200 OK`

```typescript
interface ReorderBeatsResponse {
  updated_count: number;
  treatment_regenerated: boolean;
}
```

### `POST /api/worlds/:worldId/beats/bulk`

Bulk create beats (e.g., when importing a template).

**Request:**

```typescript
interface BulkCreateBeatsRequest {
  beats: CreateBeatRequest[];
}
```

**Response:** `201 Created`

```typescript
interface BulkCreateBeatsResponse {
  created: BeatResponse[];
  count: number;
}
```

---

## 7. Acts & Sequences

Structural hierarchy: Act > Sequence > Scene > Beat.

### Acts

#### `POST /api/worlds/:worldId/acts`

**Request:**

```typescript
interface CreateActRequest {
  title: string;
  description?: string;
  order_index: number;
  episode_id?: string;                           // for TV mode: which episode
  season_number?: number;                        // for TV mode
  episode_number?: number;                       // for TV mode
  act_number: number;                            // e.g. 1, 2, 3 for three-act structure
  notes?: string;
}
```

**Response:** `201 Created`

```typescript
interface ActResponse extends BaseEntity {
  title: string;
  description: string | null;
  order_index: number;
  episode_id: string | null;
  season_number: number | null;
  episode_number: number | null;
  act_number: number;
  notes: string | null;
  sequence_count: number;
  scene_count: number;
}
```

#### `GET /api/worlds/:worldId/acts`

**Query Parameters:**

| Param            | Type   | Description                          |
|------------------|--------|--------------------------------------|
| `page`, `limit`  | number | Pagination                           |
| `episode_id`     | string | Acts in this episode                 |
| `season_number`  | number | Acts in this season (TV mode)        |
| `episode_number` | number | Acts in this episode number          |

**Response:** `200 OK` — `PaginatedResponse<ActResponse>`

#### `GET /api/worlds/:worldId/acts/:actId`

**Response:** `200 OK` — `ActResponse & { sequences: SequenceResponse[] }`

#### `PATCH /api/worlds/:worldId/acts/:actId`

**Request:** Partial `CreateActRequest`

**Response:** `200 OK` — `ActResponse`

#### `DELETE /api/worlds/:worldId/acts/:actId`

Cascade-deletes child sequences, scenes, and beats.

**Response:** `204 No Content`

### Sequences

#### `POST /api/worlds/:worldId/sequences`

**Request:**

```typescript
interface CreateSequenceRequest {
  title: string;
  description?: string;
  act_id: string;                                // required parent act
  order_index: number;
  value_change_summary?: string;                 // McKee: what value shifts across this sequence
  notes?: string;
}
```

**Response:** `201 Created`

```typescript
interface SequenceResponse extends BaseEntity {
  title: string;
  description: string | null;
  act_id: string;
  order_index: number;
  value_change_summary: string | null;
  notes: string | null;
  scene_count: number;
}
```

#### `GET /api/worlds/:worldId/sequences`

**Query Parameters:**

| Param           | Type   | Description                    |
|-----------------|--------|--------------------------------|
| `page`, `limit` | number | Pagination                     |
| `act_id`        | string | Sequences in this act          |

**Response:** `200 OK` — `PaginatedResponse<SequenceResponse>`

#### `GET /api/worlds/:worldId/sequences/:sequenceId`

**Response:** `200 OK` — `SequenceResponse & { scenes: SceneResponse[] }`

#### `PATCH /api/worlds/:worldId/sequences/:sequenceId`

**Request:** Partial `CreateSequenceRequest`

**Response:** `200 OK` — `SequenceResponse`

#### `DELETE /api/worlds/:worldId/sequences/:sequenceId`

Cascade-deletes child scenes and beats.

**Response:** `204 No Content`

### Episodes (TV Mode)

#### `POST /api/worlds/:worldId/episodes`

**Request:**

```typescript
interface CreateEpisodeRequest {
  title: string;
  description?: string;
  season_number: number;
  episode_number: number;
  logline?: string;
  air_date?: string;                             // ISO 8601 or custom calendar
  status: "planned" | "outlined" | "drafted" | "revised" | "final";
  notes?: string;
}
```

**Response:** `201 Created`

```typescript
interface EpisodeResponse extends BaseEntity {
  title: string;
  description: string | null;
  season_number: number;
  episode_number: number;
  logline: string | null;
  air_date: string | null;
  status: string;
  notes: string | null;
  act_count: number;
  scene_count: number;
  word_count: number;
}
```

#### `GET /api/worlds/:worldId/episodes`

**Query Parameters:**

| Param            | Type   | Description                    |
|------------------|--------|--------------------------------|
| `page`, `limit`  | number | Pagination                     |
| `season_number`  | number | Filter by season               |
| `status`         | string | Filter by status               |

**Response:** `200 OK` — `PaginatedResponse<EpisodeResponse>`

#### `GET /api/worlds/:worldId/episodes/:episodeId`

**Response:** `200 OK` — `EpisodeResponse & { acts: ActResponse[] }`

#### `PATCH /api/worlds/:worldId/episodes/:episodeId`

**Request:** Partial `CreateEpisodeRequest`

**Response:** `200 OK` — `EpisodeResponse`

#### `DELETE /api/worlds/:worldId/episodes/:episodeId`

Cascade-deletes child acts, sequences, scenes, beats.

**Response:** `204 No Content`

---

## 8. Arcs

Throughlines tracking progression: character arcs, plot arcs, thematic arcs, relationship arcs.

### `POST /api/worlds/:worldId/arcs`

Create an arc.

**Request:**

```typescript
interface CreateArcRequest {
  title: string;
  description?: string;
  arc_type: "character" | "plot" | "thematic" | "relationship" | "custom";
  custom_type_label?: string;

  // Linked entities
  character_id?: string;                         // for character arcs
  theme_id?: string;                             // for thematic arcs
  relationship_id?: string;                      // for relationship arcs

  color?: string;
  tags?: string[];
  notes?: string;
}
```

**Response:** `201 Created`

```typescript
interface ArcResponse extends BaseEntity {
  title: string;
  description: string | null;
  arc_type: string;
  custom_type_label: string | null;
  character_id: string | null;
  character_name: string | null;
  theme_id: string | null;
  theme_name: string | null;
  relationship_id: string | null;
  color: string | null;
  tags: string[];
  notes: string | null;
  phase_count: number;
  mapped_event_count: number;
}
```

### `GET /api/worlds/:worldId/arcs`

**Query Parameters:**

| Param           | Type   | Description                    |
|-----------------|--------|--------------------------------|
| `page`, `limit` | number | Pagination                     |
| `arc_type`      | string | Filter by arc type             |
| `character_id`  | string | Character arcs for this char   |
| `theme_id`      | string | Thematic arcs for this theme   |
| `tag`           | string | Filter by tag                  |

**Response:** `200 OK` — `PaginatedResponse<ArcResponse>`

### `GET /api/worlds/:worldId/arcs/:arcId`

**Response:** `200 OK` — `ArcResponse & { phases: ArcPhaseResponse[]; structure_mappings: StructureMappingResponse[] }`

### `PATCH /api/worlds/:worldId/arcs/:arcId`

**Request:** Partial `CreateArcRequest`

**Response:** `200 OK` — `ArcResponse`

### `DELETE /api/worlds/:worldId/arcs/:arcId`

**Response:** `204 No Content`

### Arc Phases

#### `POST /api/worlds/:worldId/arcs/:arcId/phases`

**Request:**

```typescript
interface CreateArcPhaseRequest {
  name: string;                                  // e.g. "Setup", "Rising Action", "Climax"
  description?: string;
  phase_type: "setup" | "rising" | "climax" | "falling" | "resolution" | "custom";
  custom_type_label?: string;
  order_index: number;
  start_event_id?: string;
  end_event_id?: string;
  start_scene_id?: string;
  end_scene_id?: string;
  intensity: number;                             // 0.0 to 1.0 (for arc diagram height)
  notes?: string;
}
```

**Response:** `201 Created`

```typescript
interface ArcPhaseResponse extends BaseEntity {
  arc_id: string;
  name: string;
  description: string | null;
  phase_type: string;
  custom_type_label: string | null;
  order_index: number;
  start_event_id: string | null;
  end_event_id: string | null;
  start_scene_id: string | null;
  end_scene_id: string | null;
  intensity: number;
  notes: string | null;
}
```

#### `GET /api/worlds/:worldId/arcs/:arcId/phases`

**Response:** `200 OK` — `ArcPhaseResponse[]` (ordered by `order_index`)

#### `PATCH /api/worlds/:worldId/arcs/:arcId/phases/:phaseId`

**Request:** Partial `CreateArcPhaseRequest`

**Response:** `200 OK` — `ArcPhaseResponse`

#### `DELETE /api/worlds/:worldId/arcs/:arcId/phases/:phaseId`

**Response:** `204 No Content`

### Arc Visualization Data

#### `GET /api/worlds/:worldId/arcs/diagram`

Get data for the arc diagram visualization.

**Query Parameters:**

| Param       | Type   | Description                                 |
|-------------|--------|---------------------------------------------|
| `arc_ids`   | string | Comma-separated arc IDs to include          |
| `arc_type`  | string | Filter by arc type                          |
| `template_id` | string | Overlay a structure template              |

**Response:** `200 OK`

```typescript
interface ArcDiagramResponse {
  arcs: {
    id: string;
    title: string;
    arc_type: string;
    color: string | null;
    phases: {
      id: string;
      name: string;
      phase_type: string;
      order_index: number;
      intensity: number;
      start_position_pct: number;                // 0.0 to 1.0 position in narrative
      end_position_pct: number;
    }[];
    plot_points: {
      event_id: string;
      event_title: string;
      position_pct: number;
      phase_id: string;
    }[];
  }[];
  template_overlay: {
    template_id: string;
    template_name: string;
    beats: {
      id: string;
      name: string;
      expected_position_pct: number;
      actual_position_pct: number | null;        // null if unmapped
      deviation: number | null;                  // difference from expected
    }[];
  } | null;
}
```

---

## 9. Locations

Places with properties, history, significance, and optional map coordinates.

### `POST /api/worlds/:worldId/locations`

**Request:**

```typescript
interface CreateLocationRequest {
  name: string;
  aliases?: string[];
  description?: string;
  location_type: "interior" | "exterior" | "virtual" | "abstract" | "custom";
  custom_type_label?: string;
  parent_location_id?: string;                   // for nested locations (room within building)

  // Geography
  coordinates?: {
    latitude?: number;
    longitude?: number;
    custom_x?: number;                           // for fantasy maps
    custom_y?: number;
    map_layer?: string;                          // e.g. "overworld", "underground"
  };

  // Properties
  properties?: {
    climate?: string;
    population?: number | string;
    governing_faction_id?: string;
    economic_status?: string;
    atmosphere?: string;                         // mood/tone of the place
    significance?: string;                       // why this place matters to the story
  };

  // History
  history?: {
    founded?: string;                            // date or era
    key_events?: string[];
    previous_names?: string[];
  };

  image_urls?: string[];
  tags?: string[];
  notes?: string;
  color?: string;
}
```

**Response:** `201 Created`

```typescript
interface LocationResponse extends BaseEntity {
  name: string;
  aliases: string[];
  description: string | null;
  location_type: string;
  custom_type_label: string | null;
  parent_location_id: string | null;
  parent_location_name: string | null;
  coordinates: {
    latitude: number | null;
    longitude: number | null;
    custom_x: number | null;
    custom_y: number | null;
    map_layer: string | null;
  } | null;
  properties: Record<string, any>;
  history: Record<string, any>;
  image_urls: string[];
  tags: string[];
  notes: string | null;
  color: string | null;
  scene_count: number;
  event_count: number;
  child_location_count: number;
}
```

### `GET /api/worlds/:worldId/locations`

**Query Parameters:**

| Param               | Type   | Description                          |
|---------------------|--------|--------------------------------------|
| `page`, `limit`     | number | Pagination                           |
| `location_type`     | string | Filter by type                       |
| `parent_location_id`| string | Children of this location            |
| `root_only`         | boolean| Only top-level locations             |
| `faction_id`        | string | Governed by this faction             |
| `q`                 | string | Search by name or alias              |
| `tag`               | string | Filter by tag                        |

**Response:** `200 OK` — `PaginatedResponse<LocationResponse>`

### `GET /api/worlds/:worldId/locations/:locationId`

**Response:** `200 OK` — `LocationResponse & { children: LocationResponse[] }`

### `PATCH /api/worlds/:worldId/locations/:locationId`

**Request:** Partial `CreateLocationRequest`

**Response:** `200 OK` — `LocationResponse`

### `DELETE /api/worlds/:worldId/locations/:locationId`

**Response:** `204 No Content`

### `GET /api/worlds/:worldId/locations/map`

Get all locations with coordinates for map visualization.

**Query Parameters:**

| Param       | Type   | Description                      |
|-------------|--------|----------------------------------|
| `map_layer` | string | Filter by map layer              |
| `faction_id`| string | Highlight faction-controlled     |

**Response:** `200 OK`

```typescript
interface LocationMapResponse {
  locations: {
    id: string;
    name: string;
    location_type: string;
    coordinates: {
      latitude: number | null;
      longitude: number | null;
      custom_x: number | null;
      custom_y: number | null;
    };
    parent_location_id: string | null;
    governing_faction_id: string | null;
    significance: string | null;
    color: string | null;
    scene_count: number;
  }[];
  map_layers: string[];
}
```

---

## 10. Objects

Significant story objects tracked for setup/payoff (Chekhov's gun, magical agents).

### `POST /api/worlds/:worldId/objects`

**Request:**

```typescript
interface CreateObjectRequest {
  name: string;
  aliases?: string[];
  description?: string;
  object_type: "weapon" | "artifact" | "document" | "vehicle" | "technology" | "symbol" | "mcguffin" | "custom";
  custom_type_label?: string;
  significance: "key_plot" | "supporting" | "atmospheric" | "chekhov_gun";

  properties?: {
    origin?: string;
    current_owner_character_id?: string;
    current_location_id?: string;
    powers_abilities?: string[];
    limitations?: string[];
    physical_description?: string;
  };

  // Setup/payoff tracking
  setup_event_id?: string;                       // where the object is first introduced
  payoff_event_ids?: string[];                   // where the object pays off

  magic_system_id?: string;                      // linked to a world system
  image_urls?: string[];
  tags?: string[];
  notes?: string;
}
```

**Response:** `201 Created`

```typescript
interface ObjectResponse extends BaseEntity {
  name: string;
  aliases: string[];
  description: string | null;
  object_type: string;
  custom_type_label: string | null;
  significance: string;
  properties: Record<string, any>;
  setup_event_id: string | null;
  payoff_event_ids: string[];
  has_payoff: boolean;                           // false = orphan Chekhov's gun
  magic_system_id: string | null;
  image_urls: string[];
  tags: string[];
  notes: string | null;
  appearance_count: number;                      // events/scenes referencing this object
}
```

### `GET /api/worlds/:worldId/objects`

**Query Parameters:**

| Param           | Type    | Description                          |
|-----------------|---------|--------------------------------------|
| `page`, `limit` | number  | Pagination                           |
| `object_type`   | string  | Filter by type                       |
| `significance`  | string  | Filter by significance level         |
| `orphan_only`   | boolean | Only objects with setup but no payoff |
| `character_id`  | string  | Objects owned by this character       |
| `location_id`   | string  | Objects at this location              |
| `q`             | string  | Search by name                       |
| `tag`           | string  | Filter by tag                        |

**Response:** `200 OK` — `PaginatedResponse<ObjectResponse>`

### `GET /api/worlds/:worldId/objects/:objectId`

**Response:** `200 OK` — `ObjectResponse`

### `PATCH /api/worlds/:worldId/objects/:objectId`

**Request:** Partial `CreateObjectRequest`

**Response:** `200 OK` — `ObjectResponse`

### `DELETE /api/worlds/:worldId/objects/:objectId`

**Response:** `204 No Content`

---

## 11. Themes & Motifs

Themes with thematic oppositions and motifs with appearance tracking.

### Themes

#### `POST /api/worlds/:worldId/themes`

**Request:**

```typescript
interface CreateThemeRequest {
  name: string;                                  // e.g. "Justice", "Identity", "Power"
  description?: string;

  // Barthes' symbolic code: thematic opposition pairs
  oppositions?: {
    positive_pole: string;                       // e.g. "order"
    negative_pole: string;                       // e.g. "chaos"
    description?: string;
  }[];

  // Semiotic square (Greimas)
  semiotic_square?: {
    s1: string;                                  // positive term
    s2: string;                                  // negative term (contrary)
    not_s1: string;                              // contradiction of s1
    not_s2: string;                              // contradiction of s2
  };

  character_ids?: string[];                      // characters exploring this theme
  scene_ids?: string[];                          // scenes where theme appears
  tags?: string[];
  notes?: string;
  color?: string;
}
```

**Response:** `201 Created`

```typescript
interface ThemeResponse extends BaseEntity {
  name: string;
  description: string | null;
  oppositions: {
    positive_pole: string;
    negative_pole: string;
    description: string | null;
  }[];
  semiotic_square: {
    s1: string;
    s2: string;
    not_s1: string;
    not_s2: string;
  } | null;
  character_ids: string[];
  scene_ids: string[];
  tags: string[];
  notes: string | null;
  color: string | null;
  motif_count: number;
  arc_count: number;
}
```

#### `GET /api/worlds/:worldId/themes`

**Query Parameters:**

| Param           | Type   | Description                    |
|-----------------|--------|--------------------------------|
| `page`, `limit` | number | Pagination                     |
| `character_id`  | string | Themes explored by this char   |
| `q`             | string | Search by name                 |
| `tag`           | string | Filter by tag                  |

**Response:** `200 OK` — `PaginatedResponse<ThemeResponse>`

#### `GET /api/worlds/:worldId/themes/:themeId`

**Response:** `200 OK` — `ThemeResponse & { motifs: MotifResponse[] }`

#### `PATCH /api/worlds/:worldId/themes/:themeId`

**Request:** Partial `CreateThemeRequest`

**Response:** `200 OK` — `ThemeResponse`

#### `DELETE /api/worlds/:worldId/themes/:themeId`

**Response:** `204 No Content`

### Motifs

#### `POST /api/worlds/:worldId/motifs`

**Request:**

```typescript
interface CreateMotifRequest {
  name: string;                                  // e.g. "The raven", "Broken mirrors", "Rain"
  description?: string;
  motif_type: "symbol" | "image" | "phrase" | "sound" | "color" | "object" | "action" | "custom";
  theme_ids?: string[];                          // themes this motif relates to

  appearances?: {
    scene_id?: string;
    event_id?: string;
    description: string;                         // how the motif manifests in this appearance
    significance?: string;
  }[];

  tags?: string[];
  notes?: string;
  color?: string;
}
```

**Response:** `201 Created`

```typescript
interface MotifResponse extends BaseEntity {
  name: string;
  description: string | null;
  motif_type: string;
  theme_ids: string[];
  theme_names: string[];
  appearances: {
    id: string;
    scene_id: string | null;
    event_id: string | null;
    description: string;
    significance: string | null;
  }[];
  tags: string[];
  notes: string | null;
  color: string | null;
  appearance_count: number;
}
```

#### `GET /api/worlds/:worldId/motifs`

**Query Parameters:**

| Param           | Type   | Description                    |
|-----------------|--------|--------------------------------|
| `page`, `limit` | number | Pagination                     |
| `theme_id`      | string | Motifs for this theme          |
| `motif_type`    | string | Filter by type                 |
| `scene_id`      | string | Motifs appearing in this scene |
| `q`             | string | Search by name                 |

**Response:** `200 OK` — `PaginatedResponse<MotifResponse>`

#### `PATCH /api/worlds/:worldId/motifs/:motifId`

**Request:** Partial `CreateMotifRequest`

**Response:** `200 OK` — `MotifResponse`

#### `DELETE /api/worlds/:worldId/motifs/:motifId`

**Response:** `204 No Content`

#### `POST /api/worlds/:worldId/motifs/:motifId/appearances`

Add an appearance of a motif.

**Request:**

```typescript
interface AddMotifAppearanceRequest {
  scene_id?: string;
  event_id?: string;
  description: string;
  significance?: string;
}
```

**Response:** `201 Created`

```typescript
interface MotifAppearanceResponse {
  id: string;
  motif_id: string;
  scene_id: string | null;
  event_id: string | null;
  description: string;
  significance: string | null;
  created_at: string;
}
```

#### `DELETE /api/worlds/:worldId/motifs/:motifId/appearances/:appearanceId`

**Response:** `204 No Content`

---

## 12. Factions

Groups/organizations with hierarchy, allegiances, and evolving power levels.

### `POST /api/worlds/:worldId/factions`

**Request:**

```typescript
interface CreateFactionRequest {
  name: string;
  aliases?: string[];
  description?: string;
  faction_type: "government" | "military" | "religious" | "criminal" | "commercial" | "family" | "secret_society" | "guild" | "custom";
  custom_type_label?: string;

  parent_faction_id?: string;                    // for sub-factions / hierarchy
  leader_character_id?: string;
  headquarters_location_id?: string;

  // Power dynamics
  power_level: number;                           // 0.0 to 1.0
  influence_scope: "local" | "regional" | "national" | "global" | "cosmic";
  resources?: string[];
  goals?: string[];
  methods?: string[];

  // Allegiances
  allegiances?: {
    target_faction_id: string;
    type: "alliance" | "rivalry" | "war" | "trade" | "vassal" | "neutral" | "custom";
    strength: number;                            // 0.0 to 1.0
    temporal_range?: TemporalRange;
  }[];

  member_character_ids?: string[];
  founding_event_id?: string;
  dissolution_event_id?: string;

  symbol_url?: string;
  color?: string;
  tags?: string[];
  notes?: string;
}
```

**Response:** `201 Created`

```typescript
interface FactionResponse extends BaseEntity {
  name: string;
  aliases: string[];
  description: string | null;
  faction_type: string;
  custom_type_label: string | null;
  parent_faction_id: string | null;
  parent_faction_name: string | null;
  leader_character_id: string | null;
  leader_character_name: string | null;
  headquarters_location_id: string | null;
  headquarters_location_name: string | null;
  power_level: number;
  influence_scope: string;
  resources: string[];
  goals: string[];
  methods: string[];
  allegiances: {
    target_faction_id: string;
    target_faction_name: string;
    type: string;
    strength: number;
    temporal_range: TemporalRange;
  }[];
  member_count: number;
  sub_faction_count: number;
  founding_event_id: string | null;
  dissolution_event_id: string | null;
  symbol_url: string | null;
  color: string | null;
  tags: string[];
  notes: string | null;
}
```

### `GET /api/worlds/:worldId/factions`

**Query Parameters:**

| Param              | Type   | Description                          |
|--------------------|--------|--------------------------------------|
| `page`, `limit`    | number | Pagination                           |
| `faction_type`     | string | Filter by type                       |
| `parent_faction_id`| string | Sub-factions of this faction         |
| `root_only`        | boolean| Only top-level factions              |
| `character_id`     | string | Factions this character belongs to   |
| `q`                | string | Search by name                       |
| `tag`              | string | Filter by tag                        |

**Response:** `200 OK` — `PaginatedResponse<FactionResponse>`

### `GET /api/worlds/:worldId/factions/:factionId`

**Response:** `200 OK` — `FactionResponse & { members: { id: string; name: string; role: string }[]; sub_factions: FactionResponse[] }`

### `PATCH /api/worlds/:worldId/factions/:factionId`

**Request:** Partial `CreateFactionRequest`

**Response:** `200 OK` — `FactionResponse`

### `DELETE /api/worlds/:worldId/factions/:factionId`

**Response:** `204 No Content`

### `GET /api/worlds/:worldId/factions/power-map`

Get the faction power map for visualization.

**Query Parameters:**

| Param         | Type   | Description                               |
|---------------|--------|-------------------------------------------|
| `at_event_id` | string | Snapshot at this event (time slider)      |
| `at_scene_id` | string | Snapshot at this scene                    |

**Response:** `200 OK`

```typescript
interface FactionPowerMapResponse {
  nodes: {
    id: string;
    name: string;
    faction_type: string;
    power_level: number;
    parent_faction_id: string | null;
    color: string | null;
    member_count: number;
  }[];
  edges: {
    source_faction_id: string;
    target_faction_id: string;
    type: string;
    strength: number;
  }[];
}
```

---

## 13. Ingestion

File upload, async processing pipeline, entity review/confirmation.

### `POST /api/worlds/:worldId/ingest`

Upload and ingest source material. Uses multipart/form-data.

**Request:** `Content-Type: multipart/form-data`

| Field            | Type   | Description                                      |
|------------------|--------|--------------------------------------------------|
| `file`           | File   | Required. The file to ingest.                    |
| `title`          | string | Display name for this source material            |
| `source_type`    | string | `text`, `audio`, `video`, `image`                |
| `description`    | string | Optional description                             |
| `language`       | string | ISO 639-1 language code (default: `en`)          |
| `tags`           | string | Comma-separated tags                             |

Accepted file types:
- Text: `.txt`, `.md`, `.docx`, `.pdf`, `.fdx`, `.fountain`, `.epub`
- Audio: `.mp3`, `.wav`, `.m4a`, `.ogg`, `.flac`
- Video: `.mp4`, `.mkv`, `.mov`, `.webm`, `.avi`
- Image: `.png`, `.jpg`, `.jpeg`, `.webp`

Max file size: 500MB (video), 100MB (audio), 50MB (text/image).

**Response:** `202 Accepted`

```typescript
interface IngestionJobResponse {
  job_id: string;
  source_material_id: string;
  status: "queued" | "processing" | "extracting" | "embedding" | "complete" | "failed";
  file_name: string;
  file_size_bytes: number;
  source_type: string;
  estimated_seconds: number | null;
  created_at: string;
}
```

### `GET /api/worlds/:worldId/ingest/jobs`

List ingestion jobs for a world.

**Query Parameters:**

| Param           | Type   | Description                    |
|-----------------|--------|--------------------------------|
| `page`, `limit` | number | Pagination                     |
| `status`        | string | Filter by job status           |

**Response:** `200 OK` — `PaginatedResponse<IngestionJobResponse>`

### `GET /api/worlds/:worldId/ingest/jobs/:jobId`

Get detailed status for an ingestion job.

**Response:** `200 OK`

```typescript
interface IngestionJobDetailResponse extends IngestionJobResponse {
  steps: {
    step_name: string;                           // "parse", "transcribe", "extract", "embed", "index"
    status: "pending" | "running" | "complete" | "failed" | "skipped";
    started_at: string | null;
    completed_at: string | null;
    error: string | null;
    progress: number;                            // 0.0 to 1.0
  }[];
  extracted_entity_summary: {
    characters_proposed: number;
    locations_proposed: number;
    events_proposed: number;
    relationships_proposed: number;
    themes_proposed: number;
    objects_proposed: number;
  } | null;
}
```

### `GET /api/worlds/:worldId/ingest/jobs/:jobId/entities`

Get proposed entities from an ingestion job for user review.

**Query Parameters:**

| Param           | Type   | Description                    |
|-----------------|--------|--------------------------------|
| `entity_type`   | string | Filter by type                 |
| `status`        | string | `proposed`, `confirmed`, `rejected` |
| `min_confidence`| number | Minimum confidence score       |

**Response:** `200 OK`

```typescript
interface ProposedEntitiesResponse {
  job_id: string;
  entities: {
    extraction_id: string;
    entity_type: "character" | "location" | "event" | "relationship" | "theme" | "object";
    proposed_data: Record<string, any>;          // varies by entity type
    confidence: number;
    status: "proposed" | "confirmed" | "rejected";
    source_offset: number;
    source_length: number;
    source_text_snippet: string;                 // surrounding text for context
    possible_duplicates: {                       // existing entities that may match
      entity_id: string;
      entity_name: string;
      similarity: number;
    }[];
  }[];
}
```

### `POST /api/worlds/:worldId/ingest/jobs/:jobId/entities/review`

Bulk review (confirm/reject) proposed entities.

**Request:**

```typescript
interface ReviewEntitiesRequest {
  decisions: {
    extraction_id: string;
    action: "confirm" | "reject" | "merge";
    merge_target_id?: string;                    // when action is "merge", merge into this existing entity
    overrides?: Record<string, any>;             // user corrections to proposed data
  }[];
}
```

**Response:** `200 OK`

```typescript
interface ReviewEntitiesResponse {
  confirmed_count: number;
  rejected_count: number;
  merged_count: number;
  created_entity_ids: string[];                  // IDs of newly created entities from confirmations
}
```

### `GET /api/worlds/:worldId/sources`

List source materials.

**Query Parameters:**

| Param           | Type   | Description                    |
|-----------------|--------|--------------------------------|
| `page`, `limit` | number | Pagination                     |
| `source_type`   | string | Filter by type                 |
| `tag`           | string | Filter by tag                  |
| `q`             | string | Search by title                |

**Response:** `200 OK`

```typescript
interface SourceMaterialListResponse {
  data: SourceMaterialResponse[];
  pagination: PaginatedResponse<any>["pagination"];
}

interface SourceMaterialResponse extends BaseEntity {
  title: string;
  description: string | null;
  file_name: string;
  file_url: string;
  source_type: string;
  mime_type: string;
  file_size_bytes: number;
  language: string;
  tags: string[];
  ingestion_status: string;
  entity_count: number;
  word_count: number | null;
  duration_seconds: number | null;               // for audio/video
  transcript_available: boolean;
}
```

### `GET /api/worlds/:worldId/sources/:sourceId`

Get source material with annotations.

**Response:** `200 OK`

```typescript
interface SourceMaterialDetailResponse extends SourceMaterialResponse {
  parsed_text: string | null;                    // full parsed text (or transcript)
  annotations: {
    id: string;
    entity_type: string;
    entity_id: string;
    entity_name: string;
    offset: number;
    length: number;
    confidence: number;
  }[];
  time_codes: {                                  // for audio/video
    start_seconds: number;
    end_seconds: number;
    text: string;
    speaker: string | null;
    annotations: {
      entity_type: string;
      entity_id: string;
      entity_name: string;
    }[];
  }[] | null;
  key_frames: {                                  // for video
    timestamp_seconds: number;
    image_url: string;
    description: string | null;
  }[] | null;
}
```

### `DELETE /api/worlds/:worldId/sources/:sourceId`

Delete source material. Does not delete entities that were confirmed from it.

**Response:** `204 No Content`

---

## 14. Analysis

AI-powered analysis endpoints. All are async (return job IDs) or cached.

### `POST /api/worlds/:worldId/analyze/entities`

Run entity extraction on existing text content in the world.

**Request:**

```typescript
interface EntityExtractionRequest {
  target_type: "document" | "scene" | "source_material";
  target_id: string;
  entity_types?: ("character" | "location" | "event" | "relationship" | "theme" | "object")[];
  reextract: boolean;                            // true = ignore previous extractions
}
```

**Response:** `202 Accepted` — `JobAcceptedResponse`

### `POST /api/worlds/:worldId/analyze/consistency`

Run a consistency check across the world.

**Request:**

```typescript
interface ConsistencyCheckRequest {
  scope?: {
    character_ids?: string[];
    scene_ids?: string[];
    act_ids?: string[];
    arc_ids?: string[];
  };                                             // omit for full-world check
  check_types?: (
    | "timeline_paradox"
    | "dead_character_reappearance"
    | "location_inconsistency"
    | "relationship_contradiction"
    | "character_attribute_conflict"
    | "broken_promise"                           // setups without payoffs
    | "world_rule_violation"
    | "behavioral_inconsistency"
  )[];
}
```

**Response:** `202 Accepted` — `JobAcceptedResponse`

### `POST /api/worlds/:worldId/analyze/pacing`

Compute pacing metrics across the narrative.

**Request:**

```typescript
interface PacingAnalysisRequest {
  scope?: {
    act_ids?: string[];
    episode_ids?: string[];
  };                                             // omit for full story
  metrics?: ("action_density" | "dialogue_ratio" | "description_density" | "tension_level" | "scene_length")[];
}
```

**Response:** `202 Accepted` — `JobAcceptedResponse`

### `GET /api/worlds/:worldId/analyze/pacing/results`

Get pacing analysis results.

**Query Parameters:**

| Param       | Type   | Description                    |
|-------------|--------|--------------------------------|
| `act_id`    | string | Filter to this act             |
| `episode_id`| string | Filter to this episode         |
| `metric`    | string | Single metric to retrieve      |

**Response:** `200 OK`

```typescript
interface PacingResultsResponse {
  world_id: string;
  last_computed: string;
  scenes: {
    scene_id: string;
    scene_title: string;
    order_index: number;
    act_id: string | null;
    action_density: number;                      // 0.0 to 1.0
    dialogue_ratio: number;                      // 0.0 to 1.0
    description_density: number;                 // 0.0 to 1.0
    tension_level: number;                       // 0.0 to 1.0
    scene_length_words: number;
  }[];
  template_overlay: {
    template_name: string;
    expected_pacing_curve: { position_pct: number; expected_tension: number }[];
  } | null;
}
```

### `POST /api/worlds/:worldId/analyze/voice`

Trigger character voice analysis.

**Request:**

```typescript
interface VoiceAnalysisRequest {
  character_ids?: string[];                      // omit for all characters
  compare_pairs?: [string, string][];            // specific pairs to compare
}
```

**Response:** `202 Accepted` — `JobAcceptedResponse`

### `POST /api/worlds/:worldId/analyze/emotional-arcs`

Compute emotional arc trajectories for characters.

**Request:**

```typescript
interface EmotionalArcRequest {
  character_ids?: string[];                      // omit for all characters
}
```

**Response:** `202 Accepted` — `JobAcceptedResponse`

### `GET /api/worlds/:worldId/analyze/emotional-arcs/results`

Get emotional arc data for visualization.

**Query Parameters:**

| Param           | Type   | Description                    |
|-----------------|--------|--------------------------------|
| `character_ids` | string | Comma-separated character IDs  |

**Response:** `200 OK`

```typescript
interface EmotionalArcResultsResponse {
  world_id: string;
  last_computed: string;
  characters: {
    character_id: string;
    character_name: string;
    color: string | null;
    data_points: {
      scene_id: string;
      scene_title: string;
      order_index: number;
      joy: number;
      grief: number;
      anger: number;
      fear: number;
      hope: number;
      surprise: number;
      dominant_emotion: string;
    }[];
  }[];
}
```

### `POST /api/worlds/:worldId/analyze/narrative-codes`

Tag text segments with Barthes' five codes.

**Request:**

```typescript
interface NarrativeCodeRequest {
  target_type: "document" | "scene" | "source_material";
  target_id: string;
  code_types?: ("hermeneutic" | "proairetic" | "semic" | "symbolic" | "cultural")[];
}
```

**Response:** `202 Accepted` — `JobAcceptedResponse`

### `GET /api/worlds/:worldId/analyze/narrative-codes/results`

Get narrative code annotations.

**Query Parameters:**

| Param        | Type   | Description                    |
|--------------|--------|--------------------------------|
| `target_type`| string | `document`, `scene`, `source_material` |
| `target_id`  | string | ID of the target               |
| `code_type`  | string | Filter by Barthes code type    |

**Response:** `200 OK`

```typescript
interface NarrativeCodeResultsResponse {
  target_type: string;
  target_id: string;
  annotations: {
    id: string;
    code_type: "hermeneutic" | "proairetic" | "semic" | "symbolic" | "cultural";
    text_offset: number;
    text_length: number;
    text_snippet: string;
    label: string;                               // e.g. "Enigma: Who is the stranger?"
    description: string;
    confidence: number;
    status: "proposed" | "confirmed" | "rejected";
  }[];
}
```

### `GET /api/worlds/:worldId/analyze/jobs/:jobId`

Get status of any analysis job.

**Response:** `200 OK`

```typescript
interface AnalysisJobStatusResponse {
  job_id: string;
  analysis_type: string;
  status: "queued" | "processing" | "complete" | "failed";
  progress: number;                              // 0.0 to 1.0
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  result_url: string | null;                     // URL to fetch results when complete
}
```

---

## 15. Search

Full-text search, semantic/creative intent search, and filtered entity search.

### `GET /api/worlds/:worldId/search`

Unified search across all entity types.

**Query Parameters:**

| Param           | Type    | Description                                    |
|-----------------|---------|------------------------------------------------|
| `q`             | string  | Required. Search query text                    |
| `mode`          | string  | `fulltext` (default), `semantic`, `hybrid`     |
| `entity_types`  | string  | Comma-separated types to search (default: all) |
| `limit`         | number  | Max results (default 20, max 100)              |
| `offset`        | number  | Result offset for pagination                   |
| `min_score`     | number  | Minimum relevance score (0.0 to 1.0)           |
| `tag`           | string  | Filter by tag                                  |
| `character_id`  | string  | Scope to entities related to this character    |

**Response:** `200 OK`

```typescript
interface SearchResponse {
  query: string;
  mode: string;
  total: number;
  results: {
    entity_type: string;
    entity_id: string;
    name: string;
    description: string | null;
    score: number;                               // relevance score 0.0 to 1.0
    highlights: {                                // matching text snippets with <mark> tags
      field: string;
      snippet: string;
    }[];
    metadata: Record<string, any>;               // type-specific fields
  }[];
}
```

### `POST /api/worlds/:worldId/search/creative-intent`

Search by creative intent using embeddings (semantic search). Search by emotion, tone, story beat, or thematic intent.

**Request:**

```typescript
interface CreativeIntentSearchRequest {
  query: string;                                 // natural language: "scenes with growing tension before betrayal"
  entity_types?: string[];
  filters?: {
    character_ids?: string[];
    arc_ids?: string[];
    act_ids?: string[];
    emotion?: string;                            // filter by dominant emotion
    min_tension?: number;
  };
  limit?: number;                                // default 20
}
```

**Response:** `200 OK`

```typescript
interface CreativeIntentSearchResponse {
  query: string;
  results: {
    entity_type: string;
    entity_id: string;
    name: string;
    description: string | null;
    similarity_score: number;                    // 0.0 to 1.0
    intent_match_explanation: string;            // why this result matches the creative intent
    metadata: Record<string, any>;
  }[];
}
```

### `GET /api/worlds/:worldId/search/entities`

Filtered entity search (structured queries, not full-text).

**Query Parameters:**

| Param             | Type   | Description                                |
|-------------------|--------|--------------------------------------------|
| `entity_type`     | string | Required. Entity type to search            |
| `page`, `limit`   | number | Pagination                                 |
| `filters`         | string | JSON-encoded filter object (type-specific) |
| `sort`            | string | Field to sort by                           |
| `order`           | string | `asc` or `desc`                            |

The `filters` JSON structure varies by entity type. For characters, it supports any field in `CreateCharacterRequest`. For scenes, any field in `CreateSceneRequest`, etc.

**Response:** `200 OK` — `PaginatedResponse<Record<string, any>>` (typed per entity_type)

---

## 16. Canon

Version-controlled snapshots, branches, diff, and merge.

### `POST /api/worlds/:worldId/canon/snapshots`

Create a canon snapshot (version-controlled save point).

**Request:**

```typescript
interface CreateSnapshotRequest {
  name: string;                                  // e.g. "Draft 1", "Post-Revision", "Season 1 Lock"
  description?: string;
  tags?: string[];
}
```

**Response:** `201 Created`

```typescript
interface CanonSnapshotResponse extends BaseEntity {
  name: string;
  description: string | null;
  tags: string[];
  entity_counts: {
    characters: number;
    locations: number;
    events: number;
    scenes: number;
    beats: number;
    arcs: number;
    relationships: number;
  };
  snapshot_size_bytes: number;
  created_by_name: string;
}
```

### `GET /api/worlds/:worldId/canon/snapshots`

List snapshots.

**Query Parameters:**

| Param           | Type   | Description                    |
|-----------------|--------|--------------------------------|
| `page`, `limit` | number | Pagination                     |
| `tag`           | string | Filter by tag                  |

**Response:** `200 OK` — `PaginatedResponse<CanonSnapshotResponse>`

### `GET /api/worlds/:worldId/canon/snapshots/:snapshotId`

Get snapshot details.

**Response:** `200 OK` — `CanonSnapshotResponse`

### `POST /api/worlds/:worldId/canon/snapshots/:snapshotId/restore`

Restore the world to a snapshot state. Creates a backup snapshot automatically before restoring.

**Request:**

```typescript
interface RestoreSnapshotRequest {
  confirm: boolean;                              // must be true (safety check)
}
```

**Response:** `200 OK`

```typescript
interface RestoreSnapshotResponse {
  restored_snapshot_id: string;
  backup_snapshot_id: string;                    // auto-created backup before restore
  entities_restored: number;
}
```

### `DELETE /api/worlds/:worldId/canon/snapshots/:snapshotId`

Delete a snapshot.

**Response:** `204 No Content`

### `GET /api/worlds/:worldId/canon/diff`

Compare two snapshots or a snapshot to the current state.

**Query Parameters:**

| Param     | Type   | Description                                      |
|-----------|--------|--------------------------------------------------|
| `base`    | string | Snapshot ID (or `current` for live state)        |
| `compare` | string | Snapshot ID (or `current` for live state)        |

**Response:** `200 OK`

```typescript
interface CanonDiffResponse {
  base_id: string;
  compare_id: string;
  changes: {
    entity_type: string;
    entity_id: string;
    entity_name: string;
    change_type: "added" | "modified" | "deleted";
    field_changes: {
      field: string;
      old_value: any;
      new_value: any;
    }[];
  }[];
  summary: {
    added: number;
    modified: number;
    deleted: number;
  };
}
```

### `POST /api/worlds/:worldId/canon/branches`

Create a speculative branch for what-if scenarios or draft exploration.

**Request:**

```typescript
interface CreateBranchRequest {
  name: string;
  description?: string;
  fork_from_event_id?: string;                   // fork point; omit to branch from current state
  fork_from_snapshot_id?: string;
  tags?: string[];
}
```

**Response:** `201 Created`

```typescript
interface BranchResponse extends BaseEntity {
  name: string;
  description: string | null;
  fork_from_event_id: string | null;
  fork_from_snapshot_id: string | null;
  status: "active" | "merged" | "archived";
  entity_count: number;
  tags: string[];
  created_by_name: string;
}
```

### `GET /api/worlds/:worldId/canon/branches`

List branches.

**Query Parameters:**

| Param           | Type   | Description                    |
|-----------------|--------|--------------------------------|
| `page`, `limit` | number | Pagination                     |
| `status`        | string | Filter by status               |

**Response:** `200 OK` — `PaginatedResponse<BranchResponse>`

### `GET /api/worlds/:worldId/canon/branches/:branchId`

**Response:** `200 OK` — `BranchResponse`

### `POST /api/worlds/:worldId/canon/branches/:branchId/merge`

Merge a branch into the canonical timeline.

**Request:**

```typescript
interface MergeBranchRequest {
  strategy: "overwrite" | "manual";              // overwrite = branch wins; manual = present conflicts
  confirm: boolean;
}
```

**Response:** `200 OK`

```typescript
interface MergeBranchResponse {
  merged: boolean;
  conflicts: {                                   // only when strategy is "manual" and conflicts exist
    entity_type: string;
    entity_id: string;
    entity_name: string;
    canonical_value: any;
    branch_value: any;
    field: string;
  }[];
  entities_merged: number;
}
```

### `POST /api/worlds/:worldId/canon/branches/:branchId/resolve`

Resolve merge conflicts from a manual merge.

**Request:**

```typescript
interface ResolveConflictsRequest {
  resolutions: {
    entity_type: string;
    entity_id: string;
    field: string;
    chosen: "canonical" | "branch" | "custom";
    custom_value?: any;
  }[];
}
```

**Response:** `200 OK`

```typescript
interface ResolveConflictsResponse {
  resolved_count: number;
  remaining_conflicts: number;
  merge_complete: boolean;
}
```

### `PATCH /api/worlds/:worldId/canon/branches/:branchId`

Update branch metadata or archive it.

**Request:**

```typescript
interface UpdateBranchRequest {
  name?: string;
  description?: string;
  status?: "active" | "archived";
  tags?: string[];
}
```

**Response:** `200 OK` — `BranchResponse`

### `DELETE /api/worlds/:worldId/canon/branches/:branchId`

Delete a branch and all its speculative entities.

**Response:** `204 No Content`

---

## 17. Consistency

Contradiction detection and world rule validation.

### `GET /api/worlds/:worldId/consistency/issues`

Get detected consistency issues.

**Query Parameters:**

| Param           | Type   | Description                                  |
|-----------------|--------|----------------------------------------------|
| `page`, `limit` | number | Pagination                                   |
| `severity`      | string | `hard` (factual) or `soft` (behavioral)      |
| `issue_type`    | string | Filter by issue type                         |
| `status`        | string | `open`, `resolved`, `dismissed`              |
| `entity_id`     | string | Issues involving this entity                 |
| `sort`          | string | `severity`, `created_at`, `confidence`       |

**Response:** `200 OK`

```typescript
interface ConsistencyIssuesResponse {
  data: {
    id: string;
    issue_type: string;                          // timeline_paradox, dead_character_reappearance, etc.
    severity: "hard" | "soft";
    confidence: number;                          // 0.0 to 1.0
    status: "open" | "resolved" | "dismissed";
    title: string;
    description: string;
    affected_entities: {
      entity_type: string;
      entity_id: string;
      entity_name: string;
    }[];
    evidence: {
      source_type: string;
      source_id: string;
      description: string;
    }[];
    suggested_resolution: string | null;
    created_at: string;
    resolved_at: string | null;
  }[];
  pagination: PaginatedResponse<any>["pagination"];
  summary: {
    total_open: number;
    hard_count: number;
    soft_count: number;
  };
}
```

### `PATCH /api/worlds/:worldId/consistency/issues/:issueId`

Update issue status (resolve or dismiss).

**Request:**

```typescript
interface UpdateConsistencyIssueRequest {
  status: "resolved" | "dismissed";
  resolution_notes?: string;
}
```

**Response:** `200 OK`

```typescript
interface ConsistencyIssueResponse {
  id: string;
  status: string;
  resolution_notes: string | null;
  resolved_at: string | null;
}
```

### `POST /api/worlds/:worldId/consistency/rules`

Create a world rule that the consistency checker enforces.

**Request:**

```typescript
interface CreateWorldRuleRequest {
  name: string;                                  // e.g. "Magic requires line of sight"
  description: string;
  rule_type: "physical_law" | "magic_rule" | "social_rule" | "technology_constraint" | "character_constraint" | "custom";
  conditions?: string;                           // natural language conditions
  entity_ids?: string[];                         // entities this rule applies to
  magic_system_id?: string;
  severity: "error" | "warning";                 // how to treat violations
  tags?: string[];
}
```

**Response:** `201 Created`

```typescript
interface WorldRuleResponse extends BaseEntity {
  name: string;
  description: string;
  rule_type: string;
  conditions: string | null;
  entity_ids: string[];
  magic_system_id: string | null;
  severity: string;
  tags: string[];
  violation_count: number;
}
```

### `GET /api/worlds/:worldId/consistency/rules`

List world rules.

**Query Parameters:**

| Param           | Type   | Description                    |
|-----------------|--------|--------------------------------|
| `page`, `limit` | number | Pagination                     |
| `rule_type`     | string | Filter by rule type            |
| `magic_system_id` | string | Rules for this magic system |

**Response:** `200 OK` — `PaginatedResponse<WorldRuleResponse>`

### `PATCH /api/worlds/:worldId/consistency/rules/:ruleId`

**Request:** Partial `CreateWorldRuleRequest`

**Response:** `200 OK` — `WorldRuleResponse`

### `DELETE /api/worlds/:worldId/consistency/rules/:ruleId`

**Response:** `204 No Content`

---

## 18. What-If

Scenario creation, cascade simulation, and branch comparison.

### `POST /api/worlds/:worldId/whatif/scenarios`

Create a what-if scenario.

**Request:**

```typescript
interface CreateScenarioRequest {
  title: string;
  description?: string;
  fork_event_id: string;                         // the event to change
  changes: {
    change_type: "modify_event" | "remove_event" | "add_event" | "modify_character" | "kill_character" | "revive_character" | "change_relationship" | "change_location";
    entity_id?: string;
    modifications: Record<string, any>;          // type-specific changes
  }[];
  tags?: string[];
}
```

**Response:** `201 Created`

```typescript
interface ScenarioResponse extends BaseEntity {
  title: string;
  description: string | null;
  fork_event_id: string;
  fork_event_title: string;
  changes: {
    change_type: string;
    entity_id: string | null;
    modifications: Record<string, any>;
  }[];
  branch_id: string;                             // auto-created branch for this scenario
  cascade_computed: boolean;
  tags: string[];
}
```

### `GET /api/worlds/:worldId/whatif/scenarios`

**Query Parameters:**

| Param           | Type   | Description                    |
|-----------------|--------|--------------------------------|
| `page`, `limit` | number | Pagination                     |
| `tag`           | string | Filter by tag                  |

**Response:** `200 OK` — `PaginatedResponse<ScenarioResponse>`

### `GET /api/worlds/:worldId/whatif/scenarios/:scenarioId`

**Response:** `200 OK` — `ScenarioResponse`

### `DELETE /api/worlds/:worldId/whatif/scenarios/:scenarioId`

**Response:** `204 No Content`

### `POST /api/worlds/:worldId/whatif/scenarios/:scenarioId/simulate`

Trigger cascade simulation to compute the ripple effects of changes.

**Response:** `202 Accepted` — `JobAcceptedResponse`

### `GET /api/worlds/:worldId/whatif/scenarios/:scenarioId/impact`

Get the computed cascade impact of a scenario.

**Response:** `200 OK`

```typescript
interface ScenarioImpactResponse {
  scenario_id: string;
  computed_at: string;
  affected_entities: {
    entity_type: string;
    entity_id: string;
    entity_name: string;
    impact_severity: "high" | "medium" | "low";
    impact_description: string;
    changes: {
      field: string;
      canonical_value: any;
      projected_value: any;
    }[];
  }[];
  broken_relationships: {
    relationship_id: string;
    description: string;
  }[];
  new_contradictions: {
    description: string;
    severity: "hard" | "soft";
  }[];
  summary: {
    total_affected: number;
    high_impact: number;
    medium_impact: number;
    low_impact: number;
    broken_relationships: number;
    new_contradictions: number;
  };
}
```

### `GET /api/worlds/:worldId/whatif/compare`

Compare two branches or a branch to canonical side by side.

**Query Parameters:**

| Param     | Type   | Description                            |
|-----------|--------|----------------------------------------|
| `left`    | string | Branch ID or `canonical`               |
| `right`   | string | Branch ID or `canonical`               |

**Response:** `200 OK`

```typescript
interface BranchComparisonResponse {
  left_id: string;
  left_label: string;
  right_id: string;
  right_label: string;
  differences: {
    entity_type: string;
    entity_id: string;
    entity_name: string;
    existence: "both" | "left_only" | "right_only";
    field_diffs: {
      field: string;
      left_value: any;
      right_value: any;
    }[];
  }[];
  summary: {
    shared: number;
    left_only: number;
    right_only: number;
    modified: number;
  };
}
```

---

## 19. Structure Templates

Story structure template CRUD and scene/event-to-beat mapping.

### `GET /api/structure-templates`

List available structure templates (global library). Does not require a world ID.

**Query Parameters:**

| Param           | Type   | Description                           |
|-----------------|--------|---------------------------------------|
| `page`, `limit` | number | Pagination                            |
| `framework`     | string | Filter: `save_the_cat`, `heros_journey`, `story_circle`, `kishotenketsu`, `seven_point`, `freytags_pyramid`, `todorov`, `dramatica`, `propp`, `writers_journey`, `custom` |
| `q`             | string | Search by name                        |
| `custom_only`   | boolean| Only user-created templates           |

**Response:** `200 OK`

```typescript
interface StructureTemplateListResponse {
  data: StructureTemplateResponse[];
  pagination: PaginatedResponse<any>["pagination"];
}

interface StructureTemplateResponse {
  id: string;
  name: string;                                  // e.g. "Save the Cat! Beat Sheet"
  framework: string;
  description: string | null;
  is_builtin: boolean;                           // true for system templates
  created_by: string | null;                     // null for builtins
  beat_count: number;
  beats: StructureBeatResponse[];
}

interface StructureBeatResponse {
  id: string;
  name: string;                                  // e.g. "Opening Image", "Theme Stated", "Catalyst"
  description: string;
  expected_position_pct: number | null;          // e.g. 0.10 for 10% into narrative
  act_number: number | null;                     // which act this beat belongs to
  order_index: number;
  is_required: boolean;
  parent_beat_id: string | null;                 // for nested beats (Dramatica quads)
}
```

### `GET /api/structure-templates/:templateId`

Get a single template with all beats.

**Response:** `200 OK` — `StructureTemplateResponse`

### `POST /api/structure-templates`

Create a custom structure template.

**Request:**

```typescript
interface CreateStructureTemplateRequest {
  name: string;
  framework: string;                             // use "custom" for user-defined
  description?: string;
  beats: {
    name: string;
    description: string;
    expected_position_pct?: number;
    act_number?: number;
    order_index: number;
    is_required?: boolean;
    parent_beat_id?: string;                     // reference by temporary ID for nested creation
    temp_id?: string;                            // temporary ID for parent references
  }[];
}
```

**Response:** `201 Created` — `StructureTemplateResponse`

### `PATCH /api/structure-templates/:templateId`

Update a custom template. Fails for builtin templates.

**Request:** Partial `CreateStructureTemplateRequest`

**Response:** `200 OK` — `StructureTemplateResponse`

### `DELETE /api/structure-templates/:templateId`

Delete a custom template. Fails for builtin templates. Fails if worlds have active mappings.

**Response:** `204 No Content`

### `POST /api/worlds/:worldId/structure-mappings`

Map scenes/events/beats to structure template positions.

**Request:**

```typescript
interface CreateStructureMappingRequest {
  template_id: string;
  mappings: {
    structure_beat_id: string;                   // beat position in the template
    entity_type: "scene" | "event" | "beat";
    entity_id: string;
  }[];
}
```

**Response:** `201 Created`

```typescript
interface StructureMappingResponse {
  template_id: string;
  template_name: string;
  mappings: {
    id: string;
    structure_beat_id: string;
    structure_beat_name: string;
    expected_position_pct: number | null;
    entity_type: string;
    entity_id: string;
    entity_name: string;
    actual_position_pct: number;                 // computed from entity's position in narrative
    deviation: number | null;                    // difference from expected
  }[];
  coverage: number;                              // 0.0 to 1.0: how many template beats are mapped
  unmapped_beats: {
    id: string;
    name: string;
    is_required: boolean;
  }[];
}
```

### `GET /api/worlds/:worldId/structure-mappings`

Get all structure mappings for a world.

**Query Parameters:**

| Param         | Type   | Description                    |
|---------------|--------|--------------------------------|
| `template_id` | string | Filter to this template        |

**Response:** `200 OK` — `StructureMappingResponse[]`

### `PUT /api/worlds/:worldId/structure-mappings/:templateId`

Replace all mappings for a specific template.

**Request:** `CreateStructureMappingRequest` (template_id in path)

**Response:** `200 OK` — `StructureMappingResponse`

### `DELETE /api/worlds/:worldId/structure-mappings/:templateId`

Remove all mappings for a template from this world.

**Response:** `204 No Content`

---

## 20. Export

Series bible, pitch deck, screenplay, and treatment export.

### `POST /api/worlds/:worldId/export/series-bible`

Generate a series bible document.

**Request:**

```typescript
interface ExportSeriesBibleRequest {
  format: "pdf" | "docx" | "html";
  sections?: (
    | "synopsis"
    | "characters"
    | "locations"
    | "timeline"
    | "relationships"
    | "arcs"
    | "themes"
    | "factions"
    | "world_rules"
    | "magic_systems"
    | "episode_guide"
  )[];                                           // omit for all sections
  include_images: boolean;
  character_ids?: string[];                      // limit to specific characters
  template?: "standard" | "production" | "pitch";
}
```

**Response:** `202 Accepted`

```typescript
interface ExportJobResponse {
  job_id: string;
  status: "queued" | "generating" | "complete" | "failed";
  format: string;
  estimated_seconds: number | null;
}
```

### `POST /api/worlds/:worldId/export/pitch-deck`

Generate a pitch deck.

**Request:**

```typescript
interface ExportPitchDeckRequest {
  format: "pdf" | "pptx";
  slides?: (
    | "logline"
    | "synopsis"
    | "characters"
    | "world"
    | "structure"
    | "themes"
    | "comparable_titles"
    | "episode_breakdown"
  )[];
  style?: "minimal" | "visual" | "detailed";
}
```

**Response:** `202 Accepted` — `ExportJobResponse`

### `POST /api/worlds/:worldId/export/screenplay`

Export as screenplay format.

**Request:**

```typescript
interface ExportScreenplayRequest {
  format: "fountain" | "fdx" | "pdf";
  document_id?: string;                          // specific document; omit for full screenplay
  episode_ids?: string[];                        // for TV mode
  include_scene_numbers: boolean;
  title_page?: {
    title: string;
    author: string;
    contact?: string;
    draft_date?: string;
  };
}
```

**Response:** `202 Accepted` — `ExportJobResponse`

### `POST /api/worlds/:worldId/export/treatment`

Export the treatment document.

**Request:**

```typescript
interface ExportTreatmentRequest {
  format: "pdf" | "docx" | "txt" | "md";
  include_beat_details: boolean;                 // include full beat descriptions or just titles
  include_character_assignments: boolean;
  episode_ids?: string[];                        // for TV mode
}
```

**Response:** `202 Accepted` — `ExportJobResponse`

### `GET /api/worlds/:worldId/export/jobs/:jobId`

Check export job status.

**Response:** `200 OK`

```typescript
interface ExportJobStatusResponse extends ExportJobResponse {
  download_url: string | null;                   // available when status is "complete"
  download_expires_at: string | null;            // URL expiry time
  file_size_bytes: number | null;
}
```

### `GET /api/worlds/:worldId/export/jobs`

List export jobs.

**Query Parameters:**

| Param           | Type   | Description                    |
|-----------------|--------|--------------------------------|
| `page`, `limit` | number | Pagination                     |
| `status`        | string | Filter by status               |

**Response:** `200 OK` — `PaginatedResponse<ExportJobStatusResponse>`

---

## 21. AI Assist (Wand)

Opt-in generative assist via Claude API. All endpoints require the world's synopsis to be set.

All wand endpoints return suggestions that must be explicitly accepted by the user. Nothing auto-commits.

### `POST /api/worlds/:worldId/ai-assist/beat`

Generate or refine a beat card's title and description.

**Prerequisite:** World synopsis must be non-empty. Returns `422 UNPROCESSABLE_ENTITY` with code `SYNOPSIS_REQUIRED` otherwise.

**Request:**

```typescript
interface AIAssistBeatRequest {
  beat_id?: string;                              // existing beat to refine; omit for new generation
  context?: {
    preceding_beat_ids?: string[];               // surrounding beats for context
    following_beat_ids?: string[];
    act_id?: string;
    target_structure_beat_id?: string;           // structure template position to target
  };
  instructions?: string;                         // user guidance: "make it more tense", "add a twist"
  temperature?: number;                          // 0.0 to 1.0 (default 0.7)
}
```

**Response:** `200 OK`

```typescript
interface AIAssistBeatResponse {
  suggestion_id: string;
  beat_id: string | null;
  suggested_title: string;
  suggested_description: string;
  reasoning: string;                             // why the AI made these suggestions
  context_used: string[];                        // list of context sources used
  status: "pending_review";                      // always starts as pending
}
```

### `POST /api/worlds/:worldId/ai-assist/script`

Generate draft script text from beat context.

**Prerequisite:** World synopsis must be non-empty.

**Request:**

```typescript
interface AIAssistScriptRequest {
  beat_id: string;                               // beat to generate script for
  document_id?: string;                          // target document
  format: "prose" | "screenplay";
  character_ids?: string[];                      // characters in the scene
  location_id?: string;
  instructions?: string;
  max_words?: number;                            // approximate length limit
  temperature?: number;
}
```

**Response:** `200 OK`

```typescript
interface AIAssistScriptResponse {
  suggestion_id: string;
  beat_id: string;
  format: string;
  suggested_text: string;
  word_count: number;
  characters_used: { id: string; name: string }[];
  reasoning: string;
  status: "pending_review";
}
```

### `POST /api/worlds/:worldId/ai-assist/synopsis`

Expand a logline into a full synopsis.

**Request:**

```typescript
interface AIAssistSynopsisRequest {
  logline: string;                               // short logline to expand
  media_type?: string;                           // novel, screenplay, tv_series
  genre_type?: string;
  target_length?: "short" | "medium" | "long";   // paragraph, half-page, full-page
  instructions?: string;
  temperature?: number;
}
```

**Response:** `200 OK`

```typescript
interface AIAssistSynopsisResponse {
  suggestion_id: string;
  logline: string;
  suggested_synopsis: string;
  word_count: number;
  reasoning: string;
  status: "pending_review";
}
```

### `POST /api/worlds/:worldId/ai-assist/suggestions/:suggestionId/accept`

Accept an AI suggestion, applying it to the target entity.

**Request:**

```typescript
interface AcceptSuggestionRequest {
  edits?: Record<string, any>;                   // user modifications before accepting
}
```

**Response:** `200 OK`

```typescript
interface AcceptSuggestionResponse {
  suggestion_id: string;
  applied_to_type: string;                       // "beat", "document", "world"
  applied_to_id: string;
  status: "accepted";
}
```

### `POST /api/worlds/:worldId/ai-assist/suggestions/:suggestionId/dismiss`

Dismiss an AI suggestion without applying it.

**Response:** `200 OK`

```typescript
interface DismissSuggestionResponse {
  suggestion_id: string;
  status: "dismissed";
}
```

### `GET /api/worlds/:worldId/ai-assist/suggestions`

List AI suggestions for a world.

**Query Parameters:**

| Param           | Type   | Description                          |
|-----------------|--------|--------------------------------------|
| `page`, `limit` | number | Pagination                           |
| `status`        | string | `pending_review`, `accepted`, `dismissed` |
| `type`          | string | `beat`, `script`, `synopsis`         |

**Response:** `200 OK` — `PaginatedResponse<AIAssistBeatResponse | AIAssistScriptResponse | AIAssistSynopsisResponse>`

---

## 22. Collaboration

Real-time presence, comments, and @mentions for writers room functionality.

### `GET /api/worlds/:worldId/collaborators`

List collaborators on a world.

**Response:** `200 OK`

```typescript
interface CollaboratorsResponse {
  collaborators: {
    user_id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    role: "owner" | "showrunner" | "writer" | "researcher" | "viewer";
    joined_at: string;
    last_active: string;
    is_online: boolean;
  }[];
}
```

### `POST /api/worlds/:worldId/collaborators`

Invite a collaborator.

**Request:**

```typescript
interface InviteCollaboratorRequest {
  email: string;
  role: "showrunner" | "writer" | "researcher" | "viewer";
  message?: string;
  fog_of_war_scope?: {                           // what this collaborator can see
    character_ids?: string[];
    location_ids?: string[];
    arc_ids?: string[];
    act_ids?: string[];
    full_access: boolean;                        // overrides specific scopes
  };
}
```

**Response:** `201 Created`

```typescript
interface InviteResponse {
  invite_id: string;
  email: string;
  role: string;
  status: "pending";
  invite_url: string;
  expires_at: string;
}
```

### `PATCH /api/worlds/:worldId/collaborators/:userId`

Update a collaborator's role or access scope.

**Request:**

```typescript
interface UpdateCollaboratorRequest {
  role?: "showrunner" | "writer" | "researcher" | "viewer";
  fog_of_war_scope?: {
    character_ids?: string[];
    location_ids?: string[];
    arc_ids?: string[];
    act_ids?: string[];
    full_access: boolean;
  };
}
```

**Response:** `200 OK`

```typescript
interface UpdateCollaboratorResponse {
  user_id: string;
  role: string;
  fog_of_war_scope: Record<string, any>;
}
```

### `DELETE /api/worlds/:worldId/collaborators/:userId`

Remove a collaborator from a world.

**Response:** `204 No Content`

### `POST /api/worlds/:worldId/comments`

Add a comment on any entity.

**Request:**

```typescript
interface CreateCommentRequest {
  entity_type: string;                           // any entity type
  entity_id: string;
  body: string;                                  // markdown supported
  mentions?: string[];                           // user IDs of @mentioned users
  parent_comment_id?: string;                    // for threaded replies
}
```

**Response:** `201 Created`

```typescript
interface CommentResponse {
  id: string;
  entity_type: string;
  entity_id: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  body: string;
  mentions: { user_id: string; user_name: string }[];
  parent_comment_id: string | null;
  reply_count: number;
  created_at: string;
  updated_at: string;
}
```

### `GET /api/worlds/:worldId/comments`

List comments.

**Query Parameters:**

| Param             | Type   | Description                        |
|-------------------|--------|------------------------------------|
| `page`, `limit`   | number | Pagination                         |
| `entity_type`     | string | Filter by entity type              |
| `entity_id`       | string | Comments on this entity            |
| `author_id`       | string | Comments by this user              |
| `parent_comment_id` | string | Thread replies                  |
| `since`           | string | ISO 8601; comments after this date |

**Response:** `200 OK` — `PaginatedResponse<CommentResponse>`

### `PATCH /api/worlds/:worldId/comments/:commentId`

Edit a comment (own comments only).

**Request:**

```typescript
interface UpdateCommentRequest {
  body: string;
  mentions?: string[];
}
```

**Response:** `200 OK` — `CommentResponse`

### `DELETE /api/worlds/:worldId/comments/:commentId`

Delete a comment (own comments or owner/showrunner).

**Response:** `204 No Content`

### `GET /api/worlds/:worldId/activity`

Get recent activity feed for a world.

**Query Parameters:**

| Param           | Type   | Description                    |
|-----------------|--------|--------------------------------|
| `page`, `limit` | number | Pagination                     |
| `user_id`       | string | Filter to this user's actions  |
| `entity_type`   | string | Filter by entity type          |
| `action_type`   | string | `created`, `updated`, `deleted`, `commented`, `ai_assist` |
| `since`         | string | ISO 8601                       |

**Response:** `200 OK`

```typescript
interface ActivityFeedResponse {
  data: {
    id: string;
    user_id: string;
    user_name: string;
    action_type: string;
    entity_type: string;
    entity_id: string;
    entity_name: string;
    description: string;
    metadata: Record<string, any>;
    created_at: string;
  }[];
  pagination: PaginatedResponse<any>["pagination"];
}
```

---

## 23. Writing Surface

Document CRUD for the integrated manuscript/script editor.

### `POST /api/worlds/:worldId/documents`

Create a new document.

**Request:**

```typescript
interface CreateDocumentRequest {
  title: string;
  document_type: "prose" | "screenplay";
  parent_type?: "act" | "sequence" | "scene" | "episode";
  parent_id?: string;                            // structural container
  content?: string;                              // initial content (TipTap JSON or plain text)
  content_format: "tiptap_json" | "plain_text" | "fountain" | "html";
  word_count_target?: number;
  status: "draft" | "revised" | "final";
  tags?: string[];
}
```

**Response:** `201 Created`

```typescript
interface DocumentResponse extends BaseEntity {
  title: string;
  document_type: string;
  parent_type: string | null;
  parent_id: string | null;
  content_format: string;
  word_count_actual: number;
  word_count_target: number | null;
  progress_pct: number | null;                   // word_count_actual / word_count_target
  status: string;
  tags: string[];
  last_edited_by: string | null;
  last_edited_by_name: string | null;
  linked_beat_ids: string[];
  collaboration_enabled: boolean;
}
```

### `GET /api/worlds/:worldId/documents`

List documents.

**Query Parameters:**

| Param           | Type   | Description                      |
|-----------------|--------|----------------------------------|
| `page`, `limit` | number | Pagination                       |
| `document_type` | string | `prose` or `screenplay`          |
| `parent_type`   | string | Filter by structural parent type |
| `parent_id`     | string | Documents in this container      |
| `status`        | string | Filter by status                 |
| `tag`           | string | Filter by tag                    |
| `q`             | string | Search by title                  |

**Response:** `200 OK` — `PaginatedResponse<DocumentResponse>`

### `GET /api/worlds/:worldId/documents/:documentId`

Get document with full content.

**Response:** `200 OK`

```typescript
interface DocumentDetailResponse extends DocumentResponse {
  content: any;                                  // TipTap JSON, plain text, or Fountain markup
  entity_highlights: {                           // recognized entities in the text
    entity_type: string;
    entity_id: string;
    entity_name: string;
    offsets: { start: number; end: number }[];   // positions in the text
  }[];
  revision_count: number;
}
```

### `PATCH /api/worlds/:worldId/documents/:documentId`

Update document metadata or content.

**Request:**

```typescript
interface UpdateDocumentRequest {
  title?: string;
  content?: any;
  content_format?: string;
  word_count_target?: number;
  status?: string;
  tags?: string[];
}
```

**Response:** `200 OK` — `DocumentResponse`

### `DELETE /api/worlds/:worldId/documents/:documentId`

Delete a document.

**Response:** `204 No Content`

### `POST /api/worlds/:worldId/documents/:documentId/entity-highlights`

Trigger entity recognition on document content.

**Response:** `202 Accepted` — `JobAcceptedResponse`

### `GET /api/worlds/:worldId/documents/:documentId/revisions`

Get revision history for a document.

**Query Parameters:**

| Param           | Type   | Description                    |
|-----------------|--------|--------------------------------|
| `page`, `limit` | number | Pagination                     |

**Response:** `200 OK`

```typescript
interface DocumentRevisionsResponse {
  data: {
    revision_id: string;
    document_id: string;
    author_id: string;
    author_name: string;
    word_count: number;
    change_summary: string | null;
    created_at: string;
  }[];
  pagination: PaginatedResponse<any>["pagination"];
}
```

### `GET /api/worlds/:worldId/documents/:documentId/revisions/:revisionId`

Get a specific revision's content.

**Response:** `200 OK`

```typescript
interface DocumentRevisionDetailResponse {
  revision_id: string;
  document_id: string;
  content: any;
  content_format: string;
  author_id: string;
  author_name: string;
  word_count: number;
  created_at: string;
}
```

### `POST /api/worlds/:worldId/documents/:documentId/revisions/:revisionId/restore`

Restore a document to a previous revision.

**Response:** `200 OK` — `DocumentDetailResponse`

### `POST /api/worlds/:worldId/documents/:documentId/format/screenplay`

Parse and auto-format document content as screenplay. Detects and formats sluglines, action, dialogue, parentheticals, and transitions.

**Request:**

```typescript
interface ScreenplayFormatRequest {
  source_format: "plain_text" | "fountain";
}
```

**Response:** `200 OK`

```typescript
interface ScreenplayFormatResponse {
  document_id: string;
  formatted_content: any;                        // TipTap JSON with screenplay formatting
  detected_elements: {
    sluglines: number;
    action_blocks: number;
    dialogue_blocks: number;
    parentheticals: number;
    transitions: number;
    characters_detected: string[];               // character names found in dialogue headers
  };
}
```

---

## 24. Treatment

Auto-generated treatment document assembled from beat cards in order.

### `GET /api/worlds/:worldId/treatment`

Get the current treatment for a world.

**Query Parameters:**

| Param         | Type   | Description                          |
|---------------|--------|--------------------------------------|
| `episode_id`  | string | Treatment for this episode (TV mode) |
| `act_id`      | string | Treatment for this act only          |

**Response:** `200 OK`

```typescript
interface TreatmentResponse {
  world_id: string;
  last_generated: string;
  sections: {
    beat_id: string;
    beat_title: string;
    beat_order_index: number;
    scene_id: string | null;
    scene_title: string | null;
    act_id: string | null;
    act_title: string | null;
    treatment_text: string;                      // auto-generated from beat description
    has_manual_override: boolean;
    manual_override_text: string | null;
    character_names: string[];
  }[];
  word_count: number;
}
```

### `POST /api/worlds/:worldId/treatment/regenerate`

Force regeneration of the treatment from current beat state.

**Request:**

```typescript
interface RegenerateTreatmentRequest {
  preserve_overrides: boolean;                   // true = keep manual edits; false = regenerate all
  episode_id?: string;                           // TV mode: regenerate for this episode
}
```

**Response:** `200 OK` — `TreatmentResponse`

### `PATCH /api/worlds/:worldId/treatment/sections/:beatId`

Apply a manual override to a treatment section.

**Request:**

```typescript
interface UpdateTreatmentSectionRequest {
  manual_override_text: string;                  // overrides auto-generated text
}
```

**Response:** `200 OK`

```typescript
interface TreatmentSectionResponse {
  beat_id: string;
  treatment_text: string;
  has_manual_override: boolean;
  manual_override_text: string;
}
```

### `DELETE /api/worlds/:worldId/treatment/sections/:beatId/override`

Remove manual override, reverting to auto-generated text.

**Response:** `200 OK` — `TreatmentSectionResponse` (with `has_manual_override: false`)

---

## 25. Wiki

Auto-linking world encyclopedia with automatic cross-referencing.

### `POST /api/worlds/:worldId/wiki/entries`

Create a wiki entry.

**Request:**

```typescript
interface CreateWikiEntryRequest {
  title: string;
  content: string;                               // markdown with auto-linking support
  entry_type: "character" | "location" | "object" | "faction" | "event" | "concept" | "lore" | "custom";
  linked_entity_type?: string;                   // link to a core entity
  linked_entity_id?: string;
  parent_entry_id?: string;                      // for hierarchical entries
  aliases?: string[];                            // alternative names for auto-linking
  tags?: string[];
  is_spoiler?: boolean;
}
```

**Response:** `201 Created`

```typescript
interface WikiEntryResponse extends BaseEntity {
  title: string;
  content: string;
  content_html: string;                          // rendered markdown with auto-links injected
  entry_type: string;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  parent_entry_id: string | null;
  aliases: string[];
  tags: string[];
  is_spoiler: boolean;
  auto_links: {                                  // entities auto-detected in content
    entity_type: string;
    entity_id: string;
    entity_name: string;
    mention_count: number;
  }[];
  inbound_links: {                               // other wiki entries linking to this one
    entry_id: string;
    entry_title: string;
  }[];
  child_entry_count: number;
}
```

### `GET /api/worlds/:worldId/wiki/entries`

List wiki entries.

**Query Parameters:**

| Param             | Type    | Description                        |
|-------------------|---------|------------------------------------|
| `page`, `limit`   | number  | Pagination                         |
| `entry_type`      | string  | Filter by type                     |
| `parent_entry_id` | string  | Children of this entry             |
| `root_only`       | boolean | Only top-level entries             |
| `tag`             | string  | Filter by tag                      |
| `q`               | string  | Search by title, alias, or content |
| `linked_entity_id`| string  | Entry for this core entity         |
| `is_spoiler`      | boolean | Filter by spoiler status           |

**Response:** `200 OK` — `PaginatedResponse<WikiEntryResponse>`

### `GET /api/worlds/:worldId/wiki/entries/:entryId`

Get a wiki entry with full content and links.

**Response:** `200 OK` — `WikiEntryResponse`

### `PATCH /api/worlds/:worldId/wiki/entries/:entryId`

Update a wiki entry. Re-computes auto-links on content change.

**Request:** Partial `CreateWikiEntryRequest`

**Response:** `200 OK` — `WikiEntryResponse`

### `DELETE /api/worlds/:worldId/wiki/entries/:entryId`

Delete a wiki entry.

**Response:** `204 No Content`

### `POST /api/worlds/:worldId/wiki/auto-generate`

Auto-generate wiki entries from existing world entities that do not yet have entries.

**Request:**

```typescript
interface AutoGenerateWikiRequest {
  entity_types?: string[];                       // which entity types to generate for
  overwrite_existing: boolean;                   // true = regenerate even if entry exists
}
```

**Response:** `202 Accepted` — `JobAcceptedResponse`

### `POST /api/worlds/:worldId/wiki/relink`

Re-scan all wiki entries and update auto-links. Use after bulk entity changes.

**Response:** `202 Accepted` — `JobAcceptedResponse`

---

## WebSocket Events

Real-time features use WebSocket connections via Socket.io. Connect to the server with a valid JWT.

### Connection

```
ws://localhost:3000/ws?token=<jwt_token>&world_id=<world_id>
```

### Client-to-Server Events

| Event                   | Payload                                           | Description                              |
|-------------------------|---------------------------------------------------|------------------------------------------|
| `join_world`            | `{ world_id: string }`                            | Join a world's real-time channel         |
| `leave_world`           | `{ world_id: string }`                            | Leave a world's real-time channel        |
| `cursor_move`           | `{ document_id: string, position: number }`       | Report cursor position in a document     |
| `start_editing`         | `{ entity_type: string, entity_id: string }`      | Optimistic lock: signal editing an entity|
| `stop_editing`          | `{ entity_type: string, entity_id: string }`      | Release optimistic lock                  |
| `typing_indicator`      | `{ document_id: string, is_typing: boolean }`     | Typing indicator for collaborative editing |

### Server-to-Client Events

| Event                   | Payload                                           | Description                              |
|-------------------------|---------------------------------------------------|------------------------------------------|
| `presence_update`       | `{ users: { user_id, name, avatar_url, status }[] }` | Current users in the world           |
| `user_joined`           | `{ user_id, name, avatar_url }`                   | A user joined the world                  |
| `user_left`             | `{ user_id }`                                     | A user left the world                    |
| `entity_updated`        | `{ entity_type, entity_id, updated_by, changes }` | An entity was modified                   |
| `entity_created`        | `{ entity_type, entity_id, created_by, entity }`  | A new entity was created                 |
| `entity_deleted`        | `{ entity_type, entity_id, deleted_by }`          | An entity was deleted                    |
| `cursor_update`         | `{ user_id, document_id, position, name, color }` | Another user's cursor moved              |
| `editing_started`       | `{ user_id, user_name, entity_type, entity_id }`  | Another user started editing an entity   |
| `editing_stopped`       | `{ user_id, entity_type, entity_id }`             | Another user stopped editing             |
| `comment_added`         | `{ comment: CommentResponse }`                    | A new comment was posted                 |
| `mention_notification`  | `{ comment_id, author_name, entity_type, entity_id, snippet }` | You were @mentioned       |
| `ingestion_progress`    | `{ job_id, status, progress, step_name }`         | Ingestion job progress update            |
| `analysis_progress`     | `{ job_id, analysis_type, status, progress }`     | Analysis job progress update             |
| `export_complete`       | `{ job_id, download_url, format }`                | Export job completed                     |
| `consistency_alert`     | `{ issue: ConsistencyIssueResponse }`             | New consistency issue detected           |
| `treatment_updated`     | `{ world_id }`                                    | Treatment was auto-regenerated           |
| `beat_reordered`        | `{ world_id, beat_ids: string[] }`                | Beats were reordered                     |
| `ai_suggestion_ready`   | `{ suggestion_id, type, summary }`                | AI wand suggestion is ready for review   |

---

## Appendix A: World Systems Endpoints

### Magic / Technology Systems

#### `POST /api/worlds/:worldId/systems`

Create a world system (magic system, technology framework, etc.).

**Request:**

```typescript
interface CreateWorldSystemRequest {
  name: string;
  description?: string;
  system_type: "magic" | "technology" | "political" | "economic" | "religious" | "custom";

  rules: {
    name: string;
    description: string;
    is_hard_rule: boolean;                       // hard = never broken; soft = sometimes bent
  }[];

  costs?: {
    name: string;
    description: string;
  }[];

  limitations?: {
    name: string;
    description: string;
  }[];

  practitioners?: {
    character_id?: string;
    title: string;                               // e.g. "Wizard", "Engineer"
    skill_level?: "novice" | "intermediate" | "expert" | "master";
  }[];

  related_object_ids?: string[];
  related_faction_ids?: string[];
  tags?: string[];
  notes?: string;
}
```

**Response:** `201 Created`

```typescript
interface WorldSystemResponse extends BaseEntity {
  name: string;
  description: string | null;
  system_type: string;
  rules: { id: string; name: string; description: string; is_hard_rule: boolean }[];
  costs: { id: string; name: string; description: string }[];
  limitations: { id: string; name: string; description: string }[];
  practitioners: {
    id: string;
    character_id: string | null;
    character_name: string | null;
    title: string;
    skill_level: string | null;
  }[];
  related_object_ids: string[];
  related_faction_ids: string[];
  tags: string[];
  notes: string | null;
  world_rule_count: number;
}
```

#### `GET /api/worlds/:worldId/systems`

**Query Parameters:**

| Param           | Type   | Description                    |
|-----------------|--------|--------------------------------|
| `page`, `limit` | number | Pagination                     |
| `system_type`   | string | Filter by type                 |
| `q`             | string | Search by name                 |

**Response:** `200 OK` — `PaginatedResponse<WorldSystemResponse>`

#### `GET /api/worlds/:worldId/systems/:systemId`

**Response:** `200 OK` — `WorldSystemResponse`

#### `PATCH /api/worlds/:worldId/systems/:systemId`

**Request:** Partial `CreateWorldSystemRequest`

**Response:** `200 OK` — `WorldSystemResponse`

#### `DELETE /api/worlds/:worldId/systems/:systemId`

**Response:** `204 No Content`

---

## Appendix B: Foreshadowing & Causality Endpoints

### Setup/Payoff (Foreshadowing)

#### `POST /api/worlds/:worldId/setup-payoffs`

Create a setup/payoff link.

**Request:**

```typescript
interface CreateSetupPayoffRequest {
  setup_event_id: string;
  payoff_event_id?: string;                      // null = orphan setup (Chekhov's unfired gun)
  description?: string;
  setup_type: "object" | "dialogue" | "scene" | "character_trait" | "world_detail" | "custom";
  strength: number;                              // 0.0 to 1.0 (how obvious)
  tags?: string[];
}
```

**Response:** `201 Created`

```typescript
interface SetupPayoffResponse extends BaseEntity {
  setup_event_id: string;
  setup_event_title: string;
  payoff_event_id: string | null;
  payoff_event_title: string | null;
  description: string | null;
  setup_type: string;
  strength: number;
  is_orphan: boolean;                            // true if no payoff
  is_deus_ex_machina: boolean;                   // true if payoff has no setup (computed)
  tags: string[];
}
```

#### `GET /api/worlds/:worldId/setup-payoffs`

**Query Parameters:**

| Param           | Type    | Description                        |
|-----------------|---------|------------------------------------|
| `page`, `limit` | number  | Pagination                         |
| `setup_type`    | string  | Filter by type                     |
| `orphan_only`   | boolean | Only setups without payoffs        |
| `deus_ex_only`  | boolean | Only payoffs without setups        |
| `event_id`      | string  | Setups or payoffs involving event  |

**Response:** `200 OK` — `PaginatedResponse<SetupPayoffResponse>`

#### `PATCH /api/worlds/:worldId/setup-payoffs/:setupPayoffId`

**Request:** Partial `CreateSetupPayoffRequest`

**Response:** `200 OK` — `SetupPayoffResponse`

#### `DELETE /api/worlds/:worldId/setup-payoffs/:setupPayoffId`

**Response:** `204 No Content`

#### `GET /api/worlds/:worldId/setup-payoffs/web`

Get the foreshadowing web for visualization.

**Response:** `200 OK`

```typescript
interface ForeshadowingWebResponse {
  nodes: {
    id: string;                                  // event ID
    title: string;
    event_type: string;
    position_pct: number;                        // position in narrative
    is_setup: boolean;
    is_payoff: boolean;
    is_orphan: boolean;
    is_deus_ex_machina: boolean;
  }[];
  edges: {
    id: string;                                  // setup_payoff ID
    source: string;                              // setup event ID
    target: string;                              // payoff event ID
    setup_type: string;
    strength: number;
  }[];
  threads: {                                     // grouped foreshadowing threads
    thread_id: string;
    label: string;
    event_ids: string[];
  }[];
}
```

### Causal Relations

#### `POST /api/worlds/:worldId/causal-relations`

Create a causal relation between events.

**Request:**

```typescript
interface CreateCausalRelationRequest {
  cause_event_id: string;
  effect_event_id: string;
  causality_type: "physical" | "motivational" | "psychological" | "enabling";
  description?: string;
  strength: number;                              // 0.0 to 1.0
  is_direct: boolean;                            // true = immediate cause; false = contributing factor
}
```

**Response:** `201 Created`

```typescript
interface CausalRelationResponse extends BaseEntity {
  cause_event_id: string;
  cause_event_title: string;
  effect_event_id: string;
  effect_event_title: string;
  causality_type: string;
  description: string | null;
  strength: number;
  is_direct: boolean;
}
```

#### `GET /api/worlds/:worldId/causal-relations`

**Query Parameters:**

| Param            | Type   | Description                    |
|------------------|--------|--------------------------------|
| `page`, `limit`  | number | Pagination                     |
| `causality_type` | string | Filter by type                 |
| `event_id`       | string | Causes or effects of event     |
| `is_direct`      | boolean| Filter direct/contributing     |

**Response:** `200 OK` — `PaginatedResponse<CausalRelationResponse>`

#### `PATCH /api/worlds/:worldId/causal-relations/:relationId`

**Request:** Partial `CreateCausalRelationRequest`

**Response:** `200 OK` — `CausalRelationResponse`

#### `DELETE /api/worlds/:worldId/causal-relations/:relationId`

**Response:** `204 No Content`

#### `GET /api/worlds/:worldId/causal-relations/graph`

Get the causality graph for visualization.

**Query Parameters:**

| Param            | Type   | Description                           |
|------------------|--------|---------------------------------------|
| `root_event_id`  | string | Trace from this event                 |
| `direction`      | string | `forward` (consequences), `backward` (root causes), `both` |
| `max_depth`      | number | Max traversal depth (default 5)       |
| `causality_types`| string | Comma-separated types to include      |

**Response:** `200 OK`

```typescript
interface CausalityGraphResponse {
  nodes: {
    id: string;
    title: string;
    event_type: string;
    depth: number;                               // distance from root
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    causality_type: string;
    strength: number;
    is_direct: boolean;
  }[];
}
```

---

## Appendix C: Audience Knowledge Endpoints

### `POST /api/worlds/:worldId/audience-knowledge`

Record what information is revealed to or hidden from the audience at a narrative point.

**Request:**

```typescript
interface CreateAudienceKnowledgeRequest {
  information: string;                           // what the audience learns or what is hidden
  knowledge_type: "reveal" | "conceal" | "mislead";
  scene_id?: string;
  event_id?: string;
  character_knowledge: {                         // what characters know about this information
    character_id: string;
    knows: boolean;
    since_event_id?: string;
  }[];
  creates_dramatic_irony: boolean;               // true if audience knows more than characters
  creates_mystery: boolean;                      // true if audience knows less
  enigma_id?: string;                            // link to a mystery/enigma tracker
  tags?: string[];
}
```

**Response:** `201 Created`

```typescript
interface AudienceKnowledgeResponse extends BaseEntity {
  information: string;
  knowledge_type: string;
  scene_id: string | null;
  event_id: string | null;
  character_knowledge: {
    character_id: string;
    character_name: string;
    knows: boolean;
    since_event_id: string | null;
  }[];
  creates_dramatic_irony: boolean;
  creates_mystery: boolean;
  enigma_id: string | null;
  tags: string[];
}
```

### `GET /api/worlds/:worldId/audience-knowledge`

**Query Parameters:**

| Param              | Type    | Description                            |
|--------------------|---------|----------------------------------------|
| `page`, `limit`    | number  | Pagination                             |
| `knowledge_type`   | string  | Filter by type                         |
| `scene_id`         | string  | Knowledge state at this scene          |
| `dramatic_irony`   | boolean | Only dramatic irony moments            |
| `mystery`          | boolean | Only mystery/concealment moments       |
| `character_id`     | string  | Information this character knows/lacks |

**Response:** `200 OK` — `PaginatedResponse<AudienceKnowledgeResponse>`

### `PATCH /api/worlds/:worldId/audience-knowledge/:entryId`

**Request:** Partial `CreateAudienceKnowledgeRequest`

**Response:** `200 OK` — `AudienceKnowledgeResponse`

### `DELETE /api/worlds/:worldId/audience-knowledge/:entryId`

**Response:** `204 No Content`

### `GET /api/worlds/:worldId/audience-knowledge/map`

Get the audience knowledge map for visualization (split view).

**Query Parameters:**

| Param            | Type   | Description                           |
|------------------|--------|---------------------------------------|
| `at_scene_id`    | string | Knowledge state at this point         |
| `at_event_id`    | string | Knowledge state at this point         |
| `character_ids`  | string | Comma-separated characters to compare |

**Response:** `200 OK`

```typescript
interface AudienceKnowledgeMapResponse {
  point_id: string;
  point_label: string;
  audience_knows: {
    id: string;
    information: string;
    revealed_at_scene: string | null;
    revealed_at_event: string | null;
  }[];
  audience_does_not_know: {
    id: string;
    information: string;
    concealed_since_scene: string | null;
  }[];
  characters: {
    character_id: string;
    character_name: string;
    knows: {
      id: string;
      information: string;
    }[];
    does_not_know: {
      id: string;
      information: string;
    }[];
  }[];
  dramatic_irony_moments: {
    id: string;
    information: string;
    characters_unaware: string[];
  }[];
  mystery_moments: {
    id: string;
    information: string;
    characters_who_know: string[];
  }[];
}
```

### Enigma Tracker

#### `POST /api/worlds/:worldId/enigmas`

Create a mystery/question tracker (Barthes' hermeneutic code).

**Request:**

```typescript
interface CreateEnigmaRequest {
  question: string;                              // the mystery question
  posed_at_event_id?: string;
  posed_at_scene_id?: string;
  answered_at_event_id?: string;
  answered_at_scene_id?: string;
  answer?: string;                               // the resolution
  status: "open" | "partially_answered" | "answered" | "red_herring";
  clues: {
    event_id?: string;
    scene_id?: string;
    description: string;
    is_misleading: boolean;
  }[];
  tags?: string[];
}
```

**Response:** `201 Created`

```typescript
interface EnigmaResponse extends BaseEntity {
  question: string;
  posed_at_event_id: string | null;
  posed_at_scene_id: string | null;
  answered_at_event_id: string | null;
  answered_at_scene_id: string | null;
  answer: string | null;
  status: string;
  clues: {
    id: string;
    event_id: string | null;
    scene_id: string | null;
    description: string;
    is_misleading: boolean;
  }[];
  tags: string[];
  duration_scenes: number | null;                // how many scenes the mystery spans
}
```

#### `GET /api/worlds/:worldId/enigmas`

**Query Parameters:**

| Param           | Type   | Description                    |
|-----------------|--------|--------------------------------|
| `page`, `limit` | number | Pagination                     |
| `status`        | string | Filter by status               |

**Response:** `200 OK` — `PaginatedResponse<EnigmaResponse>`

#### `PATCH /api/worlds/:worldId/enigmas/:enigmaId`

**Request:** Partial `CreateEnigmaRequest`

**Response:** `200 OK` — `EnigmaResponse`

#### `DELETE /api/worlds/:worldId/enigmas/:enigmaId`

**Response:** `204 No Content`
