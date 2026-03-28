# StoryForge API Contracts

> **Version**: 1.0.0-draft
> **Last Updated**: 2026-03-28
> **Purpose**: Complete API specification for code generation agents.

---

## Table of Contents

1. [Conventions](#conventions)
2. [Auth & Users](#1-auth--users)
3. [Story Worlds](#2-story-worlds)
4. [Characters](#3-characters)
5. [Events](#4-events)
6. [Scenes & Beats](#5-scenes--beats)
7. [Arcs](#6-arcs)
8. [Locations](#7-locations)
9. [Themes & Motifs](#8-themes--motifs)
10. [Factions](#9-factions)
11. [Source Materials](#10-source-materials)
12. [Ingestion](#11-ingestion)
13. [Search](#12-search)
14. [Analysis](#13-analysis)
15. [Canon](#14-canon)
16. [What-If](#15-what-if)
17. [Writing](#16-writing)
18. [Structure Templates](#17-structure-templates)
19. [AI Wand](#18-ai-wand)
20. [Export](#19-export)
21. [Collaboration](#20-collaboration)
22. [WebSocket Events](#websocket-events)

---

## Conventions

### Base URL

```
https://api.storyforge.app/v1
```

All routes below are relative to this base. For example, `POST /api/worlds` means `POST https://api.storyforge.app/v1/api/worlds`.

### Authentication

All authenticated endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <jwt_or_api_key>
```

Two token types are accepted:
- **JWT** — issued via login/register, short-lived (15 min access, 7 day refresh).
- **API Key** — issued via `/api/users/me/api-keys`, long-lived, prefixed with `sf_`.

### Roles

World-level roles control access:

| Role       | Description                                      |
|------------|--------------------------------------------------|
| `owner`    | Full control. Can delete world, manage members.  |
| `editor`   | Can create/edit all entities. Cannot delete world.|
| `viewer`   | Read-only access to all world data.              |

### Pagination (Cursor-Based)

All list endpoints use cursor-based pagination. Cursors are opaque base64-encoded strings.

```typescript
interface PaginationParams {
  cursor?: string;   // Opaque cursor from previous response
  limit?: number;    // Items per page. Default: 25, Max: 100
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;  // null when no more results
    prevCursor: string | null;
    hasMore: boolean;
    totalCount: number;         // Total items matching query (cached, may be approximate for large sets)
  };
}
```

### Error Response Shape

All errors follow this shape. Every endpoint can return 500.

```typescript
interface ApiError {
  error: {
    code: string;           // Machine-readable, e.g. "WORLD_NOT_FOUND"
    message: string;        // Human-readable description
    details?: Record<string, unknown>;  // Validation errors, context
    requestId: string;      // For support/debugging
  };
}

// Validation errors include field-level detail:
interface ValidationError extends ApiError {
  error: {
    code: "VALIDATION_ERROR";
    message: string;
    details: {
      fields: Array<{
        field: string;       // JSON path, e.g. "body.name"
        message: string;
        rule: string;        // e.g. "required", "maxLength"
      }>;
    };
    requestId: string;
  };
}
```

#### Standard Error Codes

| Status | Code                    | When                                     |
|--------|-------------------------|------------------------------------------|
| 400    | `VALIDATION_ERROR`      | Invalid request body or query params     |
| 401    | `UNAUTHORIZED`          | Missing or invalid auth token            |
| 403    | `FORBIDDEN`             | Insufficient role for this operation     |
| 404    | `NOT_FOUND`             | Resource does not exist                  |
| 409    | `CONFLICT`              | Duplicate or conflicting state           |
| 413    | `PAYLOAD_TOO_LARGE`     | Upload exceeds size limit                |
| 422    | `UNPROCESSABLE_ENTITY`  | Semantically invalid (e.g. circular ref) |
| 429    | `RATE_LIMITED`           | Too many requests                        |
| 500    | `INTERNAL_ERROR`        | Server error                             |

### Rate Limiting

Rate limits are applied per-user and communicated via headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1711584000
```

| Tier             | Limit               |
|------------------|----------------------|
| Standard         | 100 req/min          |
| AI endpoints     | 20 req/min           |
| File uploads     | 10 req/min           |
| Export endpoints  | 5 req/min            |

When rate limited, response includes `Retry-After` header (seconds).

### Common Types

```typescript
type UUID = string;         // UUIDv7
type ISODateTime = string;  // ISO 8601, e.g. "2026-03-28T12:00:00Z"
type Cursor = string;       // Opaque base64 cursor

interface Timestamps {
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

interface SoftDeletable extends Timestamps {
  deletedAt: ISODateTime | null;
}
```

---

## 1. Auth & Users

### `POST /api/auth/register`

Create a new account.

- **Auth**: None
- **Request Body**:
  ```typescript
  interface RegisterRequest {
    email: string;           // required, valid email
    password: string;        // required, min 8 chars
    displayName: string;     // required, 1-100 chars
  }
  ```
- **Response** `201`:
  ```typescript
  interface RegisterResponse {
    user: User;
    tokens: TokenPair;
  }

  interface User {
    id: UUID;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    createdAt: ISODateTime;
    updatedAt: ISODateTime;
  }

  interface TokenPair {
    accessToken: string;    // JWT, 15 min expiry
    refreshToken: string;   // opaque, 7 day expiry
    expiresAt: ISODateTime;
  }
  ```
- **Errors**: `400 VALIDATION_ERROR`, `409 CONFLICT` (email taken)

---

### `POST /api/auth/login`

- **Auth**: None
- **Request Body**:
  ```typescript
  interface LoginRequest {
    email: string;      // required
    password: string;   // required
  }
  ```
- **Response** `200`:
  ```typescript
  interface LoginResponse {
    user: User;
    tokens: TokenPair;
  }
  ```
- **Errors**: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED` (bad credentials)

---

### `POST /api/auth/refresh`

Exchange a refresh token for a new token pair.

- **Auth**: None
- **Request Body**:
  ```typescript
  interface RefreshRequest {
    refreshToken: string;   // required
  }
  ```
- **Response** `200`: `{ tokens: TokenPair }`
- **Errors**: `401 UNAUTHORIZED` (expired or invalid refresh token)

---

### `POST /api/auth/logout`

Revoke the current refresh token.

- **Auth**: Required
- **Request Body**:
  ```typescript
  interface LogoutRequest {
    refreshToken: string;   // required
  }
  ```
- **Response** `204`: No content
- **Errors**: `401 UNAUTHORIZED`

---

### `GET /api/users/me`

Get current user profile.

- **Auth**: Required
- **Response** `200`: `{ user: User }`
- **Errors**: `401 UNAUTHORIZED`

---

### `PATCH /api/users/me`

Update current user profile.

- **Auth**: Required
- **Request Body**:
  ```typescript
  interface UpdateUserRequest {
    displayName?: string;       // 1-100 chars
    avatarUrl?: string | null;  // valid URL or null to remove
  }
  ```
- **Response** `200`: `{ user: User }`
- **Errors**: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`

---

### `PUT /api/users/me/password`

Change password.

- **Auth**: Required
- **Request Body**:
  ```typescript
  interface ChangePasswordRequest {
    currentPassword: string;   // required
    newPassword: string;       // required, min 8 chars
  }
  ```
- **Response** `204`: No content
- **Errors**: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED` (wrong current password)

---

### `POST /api/users/me/api-keys`

Create an API key.

- **Auth**: Required
- **Request Body**:
  ```typescript
  interface CreateApiKeyRequest {
    name: string;              // required, 1-100 chars
    expiresAt?: ISODateTime;   // optional, defaults to 1 year
    scopes?: string[];         // optional, defaults to ["read", "write"]. Valid: "read", "write", "admin"
  }
  ```
- **Response** `201`:
  ```typescript
  interface CreateApiKeyResponse {
    apiKey: {
      id: UUID;
      name: string;
      key: string;           // Only returned on creation. Prefixed "sf_"
      prefix: string;        // First 8 chars for identification
      scopes: string[];
      expiresAt: ISODateTime;
      createdAt: ISODateTime;
    };
  }
  ```
- **Errors**: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`

---

### `GET /api/users/me/api-keys`

List API keys (key values are masked).

- **Auth**: Required
- **Response** `200`:
  ```typescript
  interface ListApiKeysResponse {
    data: Array<{
      id: UUID;
      name: string;
      prefix: string;
      scopes: string[];
      expiresAt: ISODateTime;
      lastUsedAt: ISODateTime | null;
      createdAt: ISODateTime;
    }>;
  }
  ```

---

### `DELETE /api/users/me/api-keys/:keyId`

Revoke an API key.

- **Auth**: Required
- **Response** `204`: No content
- **Errors**: `401 UNAUTHORIZED`, `404 NOT_FOUND`

---

## 2. Story Worlds

### `POST /api/worlds`

Create a new story world.

- **Auth**: Required
- **Request Body**:
  ```typescript
  interface CreateWorldRequest {
    name: string;                  // required, 1-200 chars
    description?: string;         // max 5000 chars
    genre?: string;               // e.g. "fantasy", "sci-fi", "thriller"
    setting?: string;             // e.g. "medieval Europe", "near-future Mars"
    timelineStart?: ISODateTime;  // in-world timeline start
    timelineEnd?: ISODateTime;    // in-world timeline end
    tags?: string[];              // max 20 tags, each max 50 chars
    isPublic?: boolean;           // default false
  }
  ```
- **Response** `201`:
  ```typescript
  interface World extends Timestamps {
    id: UUID;
    name: string;
    description: string | null;
    genre: string | null;
    setting: string | null;
    timelineStart: ISODateTime | null;
    timelineEnd: ISODateTime | null;
    tags: string[];
    isPublic: boolean;
    ownerId: UUID;
    memberCount: number;
    entityCounts: {
      characters: number;
      events: number;
      scenes: number;
      locations: number;
      arcs: number;
      factions: number;
    };
  }

  interface CreateWorldResponse {
    world: World;
  }
  ```
- **Errors**: `400 VALIDATION_ERROR`, `401 UNAUTHORIZED`

---

### `GET /api/worlds`

List worlds the current user has access to.

- **Auth**: Required
- **Query Parameters**:
  ```typescript
  interface ListWorldsParams extends PaginationParams {
    role?: "owner" | "editor" | "viewer";  // filter by user's role
    search?: string;                        // search name/description
    sort?: "name" | "createdAt" | "updatedAt";  // default: "updatedAt"
    order?: "asc" | "desc";                // default: "desc"
  }
  ```
- **Response** `200`: `PaginatedResponse<World>`

---

### `GET /api/worlds/:worldId`

Get a single world.

- **Auth**: Required (viewer+)
- **Response** `200`: `{ world: World }`
- **Errors**: `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`

---

### `PATCH /api/worlds/:worldId`

Update world settings.

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface UpdateWorldRequest {
    name?: string;
    description?: string | null;
    genre?: string | null;
    setting?: string | null;
    timelineStart?: ISODateTime | null;
    timelineEnd?: ISODateTime | null;
    tags?: string[];
    isPublic?: boolean;
  }
  ```
- **Response** `200`: `{ world: World }`
- **Errors**: `400 VALIDATION_ERROR`, `403 FORBIDDEN`, `404 NOT_FOUND`

---

### `DELETE /api/worlds/:worldId`

Permanently delete a world and all its entities.

- **Auth**: Required (owner only)
- **Response** `204`: No content
- **Errors**: `403 FORBIDDEN`, `404 NOT_FOUND`

---

### `GET /api/worlds/:worldId/members`

List world members.

- **Auth**: Required (viewer+)
- **Query Parameters**: `PaginationParams`
- **Response** `200`:
  ```typescript
  interface WorldMember {
    userId: UUID;
    displayName: string;
    avatarUrl: string | null;
    role: "owner" | "editor" | "viewer";
    joinedAt: ISODateTime;
  }
  ```
  `PaginatedResponse<WorldMember>`

---

### `POST /api/worlds/:worldId/members`

Invite a user to the world.

- **Auth**: Required (owner only)
- **Request Body**:
  ```typescript
  interface InviteMemberRequest {
    email: string;                          // required
    role: "editor" | "viewer";             // required
  }
  ```
- **Response** `201`:
  ```typescript
  interface InviteMemberResponse {
    invitation: {
      id: UUID;
      email: string;
      role: "editor" | "viewer";
      status: "pending";
      expiresAt: ISODateTime;
      createdAt: ISODateTime;
    };
  }
  ```
- **Errors**: `400 VALIDATION_ERROR`, `403 FORBIDDEN`, `409 CONFLICT` (already a member)

---

### `PATCH /api/worlds/:worldId/members/:userId`

Change a member's role.

- **Auth**: Required (owner only)
- **Request Body**:
  ```typescript
  interface UpdateMemberRequest {
    role: "editor" | "viewer";   // required. Cannot change owner role via this endpoint.
  }
  ```
- **Response** `200`: `{ member: WorldMember }`
- **Errors**: `403 FORBIDDEN`, `404 NOT_FOUND`, `422 UNPROCESSABLE_ENTITY` (cannot demote owner)

---

### `DELETE /api/worlds/:worldId/members/:userId`

Remove a member from the world.

- **Auth**: Required (owner only, or self-removal by any member)
- **Response** `204`: No content
- **Errors**: `403 FORBIDDEN`, `404 NOT_FOUND`, `422 UNPROCESSABLE_ENTITY` (owner cannot remove self)

---

## 3. Characters

### `POST /api/worlds/:worldId/characters`

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface CreateCharacterRequest {
    name: string;                       // required, 1-200 chars
    aliases?: string[];                 // alternative names, max 20
    role?: "protagonist" | "antagonist" | "supporting" | "minor" | "mentioned";
    description?: string;              // max 10000 chars
    biography?: string;                // max 50000 chars
    traits?: string[];                 // max 50
    motivations?: string[];            // max 20
    flaws?: string[];                  // max 20
    physicalDescription?: string;      // max 5000 chars
    backstory?: string;                // max 50000 chars
    internalConflict?: string;         // max 5000 chars
    externalGoal?: string;             // max 5000 chars
    archetypeId?: UUID;                // reference to an archetype
    imageUrl?: string | null;
    tags?: string[];
    customFields?: Record<string, string>;  // user-defined key-value pairs, max 50 entries

    // Voice profile
    voiceProfile?: {
      speechPatterns?: string;         // max 2000 chars. e.g. "uses short sentences, avoids contractions"
      vocabulary?: string;             // max 2000 chars. e.g. "formal, academic, avoids slang"
      tone?: string;                   // max 1000 chars. e.g. "sardonic, detached"
      dialect?: string;               // max 500 chars
      sampleDialogue?: string[];       // max 10 samples, each max 1000 chars
    };
  }
  ```
- **Response** `201`:
  ```typescript
  interface Character extends Timestamps {
    id: UUID;
    worldId: UUID;
    name: string;
    aliases: string[];
    role: "protagonist" | "antagonist" | "supporting" | "minor" | "mentioned" | null;
    description: string | null;
    biography: string | null;
    traits: string[];
    motivations: string[];
    flaws: string[];
    physicalDescription: string | null;
    backstory: string | null;
    internalConflict: string | null;
    externalGoal: string | null;
    archetypeId: UUID | null;
    imageUrl: string | null;
    tags: string[];
    customFields: Record<string, string>;
    voiceProfile: VoiceProfile | null;
    relationshipCount: number;
    sceneCount: number;
  }

  interface VoiceProfile {
    speechPatterns: string | null;
    vocabulary: string | null;
    tone: string | null;
    dialect: string | null;
    sampleDialogue: string[];
  }

  interface CreateCharacterResponse {
    character: Character;
  }
  ```
- **Errors**: `400 VALIDATION_ERROR`, `403 FORBIDDEN`, `404 NOT_FOUND` (world)

---

### `GET /api/worlds/:worldId/characters`

- **Auth**: Required (viewer+)
- **Query Parameters**:
  ```typescript
  interface ListCharactersParams extends PaginationParams {
    role?: "protagonist" | "antagonist" | "supporting" | "minor" | "mentioned";
    search?: string;              // search name, aliases, description
    tags?: string[];              // filter by tags (AND logic)
    factionId?: UUID;             // filter by faction membership
    sceneId?: UUID;               // filter by scene participation
    sort?: "name" | "createdAt" | "updatedAt" | "role";
    order?: "asc" | "desc";
  }
  ```
- **Response** `200`: `PaginatedResponse<Character>`

---

### `GET /api/worlds/:worldId/characters/:characterId`

- **Auth**: Required (viewer+)
- **Response** `200`: `{ character: Character }`
- **Errors**: `403 FORBIDDEN`, `404 NOT_FOUND`

---

### `PATCH /api/worlds/:worldId/characters/:characterId`

- **Auth**: Required (editor+)
- **Request Body**: All fields from `CreateCharacterRequest`, all optional.
- **Response** `200`: `{ character: Character }`
- **Errors**: `400 VALIDATION_ERROR`, `403 FORBIDDEN`, `404 NOT_FOUND`

---

### `DELETE /api/worlds/:worldId/characters/:characterId`

- **Auth**: Required (editor+)
- **Response** `204`: No content
- **Errors**: `403 FORBIDDEN`, `404 NOT_FOUND`

---

### `GET /api/worlds/:worldId/characters/:characterId/relationships`

List relationships for a character.

- **Auth**: Required (viewer+)
- **Query Parameters**: `PaginationParams`
- **Response** `200`:
  ```typescript
  interface CharacterRelationship extends Timestamps {
    id: UUID;
    sourceCharacterId: UUID;
    targetCharacterId: UUID;
    targetCharacterName: string;
    type: string;                  // e.g. "sibling", "rival", "mentor", "lover", "ally"
    description: string | null;
    bidirectional: boolean;
    strength: number;              // 1-10
    startEventId: UUID | null;     // event that started the relationship
    endEventId: UUID | null;       // event that ended it
    evolutionNotes: string | null; // how it changes over time
  }
  ```
  `PaginatedResponse<CharacterRelationship>`

---

### `POST /api/worlds/:worldId/characters/:characterId/relationships`

Create a relationship between two characters.

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface CreateRelationshipRequest {
    targetCharacterId: UUID;       // required
    type: string;                  // required, 1-100 chars
    description?: string;         // max 2000 chars
    bidirectional?: boolean;       // default: true
    strength?: number;             // 1-10, default: 5
    startEventId?: UUID;
    endEventId?: UUID;
    evolutionNotes?: string;       // max 5000 chars
  }
  ```
- **Response** `201`: `{ relationship: CharacterRelationship }`
- **Errors**: `400 VALIDATION_ERROR`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 CONFLICT` (relationship exists), `422 UNPROCESSABLE_ENTITY` (self-reference)

---

### `PATCH /api/worlds/:worldId/characters/:characterId/relationships/:relationshipId`

- **Auth**: Required (editor+)
- **Request Body**: All fields from `CreateRelationshipRequest`, all optional.
- **Response** `200`: `{ relationship: CharacterRelationship }`
- **Errors**: `400 VALIDATION_ERROR`, `403 FORBIDDEN`, `404 NOT_FOUND`

---

### `DELETE /api/worlds/:worldId/characters/:characterId/relationships/:relationshipId`

- **Auth**: Required (editor+)
- **Response** `204`: No content
- **Errors**: `403 FORBIDDEN`, `404 NOT_FOUND`

---

### `POST /api/worlds/:worldId/characters/:characterId/interview`

Generate an AI-powered interview response in the character's voice.

- **Auth**: Required (editor+)
- **Rate Limit**: AI tier (20 req/min)
- **Request Body**:
  ```typescript
  interface CharacterInterviewRequest {
    question: string;             // required, 1-2000 chars
    context?: string;             // additional story context, max 5000 chars
    sceneId?: UUID;               // optionally anchor to a scene for context
  }
  ```
- **Response** `200`:
  ```typescript
  interface CharacterInterviewResponse {
    response: string;             // the character's in-voice answer
    confidence: number;           // 0-1, how well the voice profile supported the answer
    usageTokens: number;
  }
  ```
- **Errors**: `400 VALIDATION_ERROR`, `403 FORBIDDEN`, `404 NOT_FOUND`, `429 RATE_LIMITED`

---

## 4. Events

### `POST /api/worlds/:worldId/events`

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface CreateEventRequest {
    title: string;                     // required, 1-300 chars
    description?: string;             // max 10000 chars
    type?: "action" | "revelation" | "decision" | "consequence" | "turning_point" | "climax" | "resolution";

    // Fabula position: the chronological position in the story world's timeline
    fabulaDate?: ISODateTime;          // when this event "actually" occurred in-world
    fabulaOrder?: number;              // explicit ordering among events at same timestamp

    // Sjuzhet position: the order in which the audience encounters this event
    sjuzhetOrder?: number;             // narrative presentation order

    significance?: number;             // 1-10, how important to overall narrative
    characterIds?: UUID[];             // characters involved
    locationId?: UUID;                 // where it takes place
    sceneId?: UUID;                    // linked scene
    tags?: string[];
    customFields?: Record<string, string>;
  }
  ```
- **Response** `201`:
  ```typescript
  interface StoryEvent extends Timestamps {
    id: UUID;
    worldId: UUID;
    title: string;
    description: string | null;
    type: string | null;
    fabulaDate: ISODateTime | null;
    fabulaOrder: number | null;
    sjuzhetOrder: number | null;
    significance: number | null;
    characterIds: UUID[];
    locationId: UUID | null;
    sceneId: UUID | null;
    tags: string[];
    customFields: Record<string, string>;
    causalRelations: CausalRelation[];
  }

  interface CreateEventResponse {
    event: StoryEvent;
  }
  ```
- **Errors**: `400 VALIDATION_ERROR`, `403 FORBIDDEN`, `404 NOT_FOUND`

---

### `GET /api/worlds/:worldId/events`

- **Auth**: Required (viewer+)
- **Query Parameters**:
  ```typescript
  interface ListEventsParams extends PaginationParams {
    type?: string;
    characterId?: UUID;             // events involving this character
    locationId?: UUID;
    sceneId?: UUID;
    fabulaDateAfter?: ISODateTime;  // chronological range filter
    fabulaDateBefore?: ISODateTime;
    search?: string;
    sort?: "fabulaDate" | "fabulaOrder" | "sjuzhetOrder" | "createdAt" | "significance";
    order?: "asc" | "desc";
    tags?: string[];
  }
  ```
- **Response** `200`: `PaginatedResponse<StoryEvent>`

---

### `GET /api/worlds/:worldId/events/:eventId`

- **Auth**: Required (viewer+)
- **Response** `200`: `{ event: StoryEvent }`

---

### `PATCH /api/worlds/:worldId/events/:eventId`

- **Auth**: Required (editor+)
- **Request Body**: All fields from `CreateEventRequest`, all optional.
- **Response** `200`: `{ event: StoryEvent }`

---

### `DELETE /api/worlds/:worldId/events/:eventId`

- **Auth**: Required (editor+)
- **Response** `204`: No content

---

### `POST /api/worlds/:worldId/events/:eventId/causal-relations`

Define a causal link between events ("this event caused that event").

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface CreateCausalRelationRequest {
    effectEventId: UUID;          // required, the event caused by this event
    type: "causes" | "enables" | "prevents" | "influences";  // required
    description?: string;        // max 2000 chars
    strength?: number;           // 1-10, default 5
  }
  ```
- **Response** `201`:
  ```typescript
  interface CausalRelation extends Timestamps {
    id: UUID;
    causeEventId: UUID;
    effectEventId: UUID;
    type: "causes" | "enables" | "prevents" | "influences";
    description: string | null;
    strength: number;
  }
  ```
  `{ causalRelation: CausalRelation }`
- **Errors**: `400 VALIDATION_ERROR`, `403 FORBIDDEN`, `404 NOT_FOUND`, `422 UNPROCESSABLE_ENTITY` (circular dependency)

---

### `DELETE /api/worlds/:worldId/events/:eventId/causal-relations/:relationId`

- **Auth**: Required (editor+)
- **Response** `204`: No content

---

## 5. Scenes & Beats

### Scenes

#### `POST /api/worlds/:worldId/scenes`

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface CreateSceneRequest {
    title: string;                    // required, 1-300 chars
    description?: string;            // max 10000 chars
    purpose?: string;                // max 5000 chars. Why does this scene exist?
    arcId?: UUID;                    // which arc this belongs to
    locationId?: UUID;
    order?: number;                  // position in sequence. Auto-assigned to end if omitted.
    characterIds?: UUID[];           // characters present
    pointOfViewCharacterId?: UUID;   // POV character
    timeOfDay?: string;              // e.g. "dawn", "night"
    duration?: string;               // e.g. "2 hours", "3 days"
    mood?: string;                   // e.g. "tense", "melancholic"
    tags?: string[];
    status?: "outline" | "draft" | "revision" | "final";  // default: "outline"
  }
  ```
- **Response** `201`:
  ```typescript
  interface Scene extends Timestamps {
    id: UUID;
    worldId: UUID;
    title: string;
    description: string | null;
    purpose: string | null;
    arcId: UUID | null;
    locationId: UUID | null;
    order: number;
    characterIds: UUID[];
    pointOfViewCharacterId: UUID | null;
    timeOfDay: string | null;
    duration: string | null;
    mood: string | null;
    tags: string[];
    status: "outline" | "draft" | "revision" | "final";
    beatCount: number;
    valueChanges: ValueChange[];
  }

  interface CreateSceneResponse {
    scene: Scene;
  }
  ```

---

#### `GET /api/worlds/:worldId/scenes`

- **Auth**: Required (viewer+)
- **Query Parameters**:
  ```typescript
  interface ListScenesParams extends PaginationParams {
    arcId?: UUID;
    locationId?: UUID;
    characterId?: UUID;
    status?: "outline" | "draft" | "revision" | "final";
    search?: string;
    tags?: string[];
    sort?: "order" | "title" | "createdAt" | "updatedAt";
    order?: "asc" | "desc";      // default for sort=order: "asc"
  }
  ```
- **Response** `200`: `PaginatedResponse<Scene>`

---

#### `GET /api/worlds/:worldId/scenes/:sceneId`

- **Auth**: Required (viewer+)
- **Response** `200`: `{ scene: Scene }`

---

#### `PATCH /api/worlds/:worldId/scenes/:sceneId`

- **Auth**: Required (editor+)
- **Request Body**: All fields from `CreateSceneRequest`, all optional.
- **Response** `200`: `{ scene: Scene }`

---

#### `DELETE /api/worlds/:worldId/scenes/:sceneId`

- **Auth**: Required (editor+)
- **Response** `204`: No content

---

#### `PUT /api/worlds/:worldId/scenes/reorder`

Batch reorder scenes.

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface ReorderScenesRequest {
    orderings: Array<{
      sceneId: UUID;
      order: number;
    }>;  // required, all scenes need not be included — unlisted scenes retain relative order
  }
  ```
- **Response** `200`:
  ```typescript
  interface ReorderScenesResponse {
    scenes: Array<{ id: UUID; order: number }>;
  }
  ```

---

#### `POST /api/worlds/:worldId/scenes/:sceneId/value-changes`

Record a value change within a scene (e.g., "trust: high -> low").

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface CreateValueChangeRequest {
    dimension: string;      // required, 1-100 chars, e.g. "trust", "power", "freedom"
    fromValue: string;      // required, 1-100 chars
    toValue: string;        // required, 1-100 chars
    characterId?: UUID;     // which character experiences this shift
    description?: string;   // max 2000 chars
  }
  ```
- **Response** `201`:
  ```typescript
  interface ValueChange extends Timestamps {
    id: UUID;
    sceneId: UUID;
    dimension: string;
    fromValue: string;
    toValue: string;
    characterId: UUID | null;
    description: string | null;
  }
  ```
  `{ valueChange: ValueChange }`

---

#### `DELETE /api/worlds/:worldId/scenes/:sceneId/value-changes/:valueChangeId`

- **Auth**: Required (editor+)
- **Response** `204`: No content

---

### Beats

#### `POST /api/worlds/:worldId/scenes/:sceneId/beats`

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface CreateBeatRequest {
    title: string;                   // required, 1-300 chars
    description?: string;           // max 10000 chars
    type?: "action" | "dialogue" | "revelation" | "decision" | "reaction" | "transition" | "description";
    order?: number;                 // auto-assigned to end if omitted
    characterIds?: UUID[];
    eventId?: UUID;                  // linked event

    // Beat card fields
    starRating?: number;            // 0-5, half-stars allowed (0, 0.5, 1, ... 5)
    tags?: string[];                // max 20
    color?: string;                 // hex color, e.g. "#FF5733"
    notes?: string;                 // private working notes, max 5000 chars

    // Structure mapping
    templateBeatId?: UUID;           // link to a beat in a structure template

    // Content
    dialogueText?: string;          // max 50000 chars
    actionText?: string;            // max 50000 chars
    emotionalTone?: string;         // max 200 chars
    pacing?: "slow" | "medium" | "fast";
  }
  ```
- **Response** `201`:
  ```typescript
  interface Beat extends Timestamps {
    id: UUID;
    sceneId: UUID;
    worldId: UUID;
    title: string;
    description: string | null;
    type: string | null;
    order: number;
    characterIds: UUID[];
    eventId: UUID | null;
    starRating: number | null;
    tags: string[];
    color: string | null;
    notes: string | null;
    templateBeatId: UUID | null;
    dialogueText: string | null;
    actionText: string | null;
    emotionalTone: string | null;
    pacing: "slow" | "medium" | "fast" | null;
  }

  interface CreateBeatResponse {
    beat: Beat;
  }
  ```

---

#### `GET /api/worlds/:worldId/scenes/:sceneId/beats`

- **Auth**: Required (viewer+)
- **Query Parameters**:
  ```typescript
  interface ListBeatsParams extends PaginationParams {
    type?: string;
    characterId?: UUID;
    minStarRating?: number;
    tags?: string[];
    color?: string;
    sort?: "order" | "createdAt" | "starRating";
    order?: "asc" | "desc";
  }
  ```
- **Response** `200`: `PaginatedResponse<Beat>`

---

#### `GET /api/worlds/:worldId/scenes/:sceneId/beats/:beatId`

- **Auth**: Required (viewer+)
- **Response** `200`: `{ beat: Beat }`

---

#### `PATCH /api/worlds/:worldId/scenes/:sceneId/beats/:beatId`

- **Auth**: Required (editor+)
- **Request Body**: All fields from `CreateBeatRequest`, all optional.
- **Response** `200`: `{ beat: Beat }`

---

#### `DELETE /api/worlds/:worldId/scenes/:sceneId/beats/:beatId`

- **Auth**: Required (editor+)
- **Response** `204`: No content

---

#### `PUT /api/worlds/:worldId/scenes/:sceneId/beats/reorder`

Batch reorder beats within a scene.

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface ReorderBeatsRequest {
    orderings: Array<{
      beatId: UUID;
      order: number;
    }>;
  }
  ```
- **Response** `200`:
  ```typescript
  interface ReorderBeatsResponse {
    beats: Array<{ id: UUID; order: number }>;
  }
  ```

---

## 6. Arcs

### `POST /api/worlds/:worldId/arcs`

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface CreateArcRequest {
    name: string;                    // required, 1-200 chars
    description?: string;           // max 10000 chars
    type?: "character" | "plot" | "thematic" | "relationship";
    characterId?: UUID;              // primary character for character arcs
    status?: "planning" | "active" | "complete";  // default: "planning"
    tags?: string[];

    // Arc phases
    phases?: Array<{
      name: string;                  // required, 1-200 chars
      description?: string;         // max 5000 chars
      order: number;                 // required
      sceneIds?: UUID[];             // scenes belonging to this phase
    }>;
  }
  ```
- **Response** `201`:
  ```typescript
  interface Arc extends Timestamps {
    id: UUID;
    worldId: UUID;
    name: string;
    description: string | null;
    type: "character" | "plot" | "thematic" | "relationship" | null;
    characterId: UUID | null;
    status: "planning" | "active" | "complete";
    tags: string[];
    phases: ArcPhase[];
    sceneCount: number;
  }

  interface ArcPhase extends Timestamps {
    id: UUID;
    arcId: UUID;
    name: string;
    description: string | null;
    order: number;
    sceneIds: UUID[];
  }

  interface CreateArcResponse {
    arc: Arc;
  }
  ```

---

### `GET /api/worlds/:worldId/arcs`

- **Auth**: Required (viewer+)
- **Query Parameters**:
  ```typescript
  interface ListArcsParams extends PaginationParams {
    type?: "character" | "plot" | "thematic" | "relationship";
    characterId?: UUID;
    status?: "planning" | "active" | "complete";
    search?: string;
    sort?: "name" | "createdAt" | "updatedAt";
    order?: "asc" | "desc";
  }
  ```
- **Response** `200`: `PaginatedResponse<Arc>`

---

### `GET /api/worlds/:worldId/arcs/:arcId`

- **Auth**: Required (viewer+)
- **Response** `200`: `{ arc: Arc }`

---

### `PATCH /api/worlds/:worldId/arcs/:arcId`

- **Auth**: Required (editor+)
- **Request Body**: All fields from `CreateArcRequest`, all optional.
- **Response** `200`: `{ arc: Arc }`

---

### `DELETE /api/worlds/:worldId/arcs/:arcId`

- **Auth**: Required (editor+)
- **Response** `204`: No content

---

### `POST /api/worlds/:worldId/arcs/:arcId/phases`

Add a phase to an arc.

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface CreateArcPhaseRequest {
    name: string;            // required
    description?: string;
    order?: number;          // auto-assigned to end if omitted
    sceneIds?: UUID[];
  }
  ```
- **Response** `201`: `{ phase: ArcPhase }`

---

### `PATCH /api/worlds/:worldId/arcs/:arcId/phases/:phaseId`

- **Auth**: Required (editor+)
- **Request Body**: All fields from `CreateArcPhaseRequest`, all optional.
- **Response** `200`: `{ phase: ArcPhase }`

---

### `DELETE /api/worlds/:worldId/arcs/:arcId/phases/:phaseId`

- **Auth**: Required (editor+)
- **Response** `204`: No content

---

### `POST /api/worlds/:worldId/arcs/:arcId/structure-mapping`

Map an arc to a narrative structure template.

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface MapArcToStructureRequest {
    templateId: UUID;        // required, the structure template to map to
    phaseMappings: Array<{
      phaseId: UUID;         // arc phase
      templateBeatId: UUID;  // structure template beat
    }>;
  }
  ```
- **Response** `200`:
  ```typescript
  interface StructureMappingResponse {
    arcId: UUID;
    templateId: UUID;
    mappings: Array<{
      phaseId: UUID;
      phaseName: string;
      templateBeatId: UUID;
      templateBeatName: string;
    }>;
  }
  ```

---

## 7. Locations

### `POST /api/worlds/:worldId/locations`

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface CreateLocationRequest {
    name: string;                  // required, 1-200 chars
    description?: string;         // max 10000 chars
    type?: string;                // e.g. "city", "building", "room", "wilderness", "planet"
    parentLocationId?: UUID;       // for nested locations (room inside building)
    significance?: string;        // max 5000 chars. Why is this place important?
    atmosphere?: string;          // max 5000 chars
    tags?: string[];
    imageUrl?: string | null;

    // Map coordinates (for visual map placement)
    coordinates?: {
      x: number;                  // 0-10000
      y: number;                  // 0-10000
      mapLayerId?: UUID;          // optional, for multi-layer maps
    };

    customFields?: Record<string, string>;
  }
  ```
- **Response** `201`:
  ```typescript
  interface Location extends Timestamps {
    id: UUID;
    worldId: UUID;
    name: string;
    description: string | null;
    type: string | null;
    parentLocationId: UUID | null;
    significance: string | null;
    atmosphere: string | null;
    tags: string[];
    imageUrl: string | null;
    coordinates: { x: number; y: number; mapLayerId: UUID | null } | null;
    customFields: Record<string, string>;
    childLocations: Array<{ id: UUID; name: string }>;
    sceneCount: number;
    eventCount: number;
  }

  interface CreateLocationResponse {
    location: Location;
  }
  ```

---

### `GET /api/worlds/:worldId/locations`

- **Auth**: Required (viewer+)
- **Query Parameters**:
  ```typescript
  interface ListLocationsParams extends PaginationParams {
    type?: string;
    parentLocationId?: UUID | "root";  // "root" returns only top-level locations
    search?: string;
    tags?: string[];
    sort?: "name" | "createdAt" | "type";
    order?: "asc" | "desc";
  }
  ```
- **Response** `200`: `PaginatedResponse<Location>`

---

### `GET /api/worlds/:worldId/locations/:locationId`

- **Auth**: Required (viewer+)
- **Response** `200`: `{ location: Location }`

---

### `PATCH /api/worlds/:worldId/locations/:locationId`

- **Auth**: Required (editor+)
- **Request Body**: All fields from `CreateLocationRequest`, all optional.
- **Response** `200`: `{ location: Location }`

---

### `DELETE /api/worlds/:worldId/locations/:locationId`

- **Auth**: Required (editor+)
- **Response** `204`: No content
- **Errors**: `422 UNPROCESSABLE_ENTITY` (has child locations — must delete or reparent children first)

---

## 8. Themes & Motifs

### `POST /api/worlds/:worldId/themes`

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface CreateThemeRequest {
    name: string;                    // required, 1-200 chars
    description?: string;           // max 5000 chars
    type: "theme" | "motif";         // required
    tags?: string[];

    // Opposition pairs (for thematic exploration)
    oppositionPairs?: Array<{
      positive: string;             // e.g. "freedom"
      negative: string;             // e.g. "imprisonment"
      description?: string;        // how this opposition manifests
    }>;
  }
  ```
- **Response** `201`:
  ```typescript
  interface Theme extends Timestamps {
    id: UUID;
    worldId: UUID;
    name: string;
    description: string | null;
    type: "theme" | "motif";
    tags: string[];
    oppositionPairs: OppositionPair[];
    linkedSceneCount: number;
  }

  interface OppositionPair {
    id: UUID;
    positive: string;
    negative: string;
    description: string | null;
  }

  interface CreateThemeResponse {
    theme: Theme;
  }
  ```

---

### `GET /api/worlds/:worldId/themes`

- **Auth**: Required (viewer+)
- **Query Parameters**:
  ```typescript
  interface ListThemesParams extends PaginationParams {
    type?: "theme" | "motif";
    search?: string;
    sort?: "name" | "createdAt";
    order?: "asc" | "desc";
  }
  ```
- **Response** `200`: `PaginatedResponse<Theme>`

---

### `GET /api/worlds/:worldId/themes/:themeId`

- **Auth**: Required (viewer+)
- **Response** `200`: `{ theme: Theme }`

---

### `PATCH /api/worlds/:worldId/themes/:themeId`

- **Auth**: Required (editor+)
- **Request Body**: All fields from `CreateThemeRequest`, all optional.
- **Response** `200`: `{ theme: Theme }`

---

### `DELETE /api/worlds/:worldId/themes/:themeId`

- **Auth**: Required (editor+)
- **Response** `204`: No content

---

### `POST /api/worlds/:worldId/themes/:themeId/scene-links`

Link a theme/motif to a scene.

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface CreateThemeSceneLinkRequest {
    sceneId: UUID;               // required
    manifestation?: string;     // max 2000 chars. How does the theme appear in this scene?
    intensity?: number;          // 1-10, how strongly it manifests
  }
  ```
- **Response** `201`:
  ```typescript
  interface ThemeSceneLink extends Timestamps {
    id: UUID;
    themeId: UUID;
    sceneId: UUID;
    sceneName: string;
    manifestation: string | null;
    intensity: number;
  }
  ```
  `{ link: ThemeSceneLink }`
- **Errors**: `409 CONFLICT` (link already exists)

---

### `GET /api/worlds/:worldId/themes/:themeId/scene-links`

- **Auth**: Required (viewer+)
- **Query Parameters**: `PaginationParams`
- **Response** `200`: `PaginatedResponse<ThemeSceneLink>`

---

### `DELETE /api/worlds/:worldId/themes/:themeId/scene-links/:linkId`

- **Auth**: Required (editor+)
- **Response** `204`: No content

---

## 9. Factions

### `POST /api/worlds/:worldId/factions`

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface CreateFactionRequest {
    name: string;                  // required, 1-200 chars
    description?: string;         // max 10000 chars
    type?: string;                // e.g. "political", "military", "religious", "criminal", "corporate"
    ideology?: string;            // max 5000 chars
    goals?: string[];             // max 20
    headquarters?: UUID;           // location ID
    foundedAt?: ISODateTime;       // in-world date
    disbandedAt?: ISODateTime;     // in-world date, null if active
    symbolism?: string;           // max 2000 chars. Colors, emblems, etc.
    tags?: string[];
    imageUrl?: string | null;
  }
  ```
- **Response** `201`:
  ```typescript
  interface Faction extends Timestamps {
    id: UUID;
    worldId: UUID;
    name: string;
    description: string | null;
    type: string | null;
    ideology: string | null;
    goals: string[];
    headquarters: UUID | null;
    foundedAt: ISODateTime | null;
    disbandedAt: ISODateTime | null;
    symbolism: string | null;
    tags: string[];
    imageUrl: string | null;
    memberCount: number;
    currentPowerLevel: number | null;
  }

  interface CreateFactionResponse {
    faction: Faction;
  }
  ```

---

### `GET /api/worlds/:worldId/factions`

- **Auth**: Required (viewer+)
- **Query Parameters**:
  ```typescript
  interface ListFactionsParams extends PaginationParams {
    type?: string;
    search?: string;
    active?: boolean;                 // null = all, true = no disbandedAt, false = has disbandedAt
    sort?: "name" | "createdAt" | "powerLevel";
    order?: "asc" | "desc";
  }
  ```
- **Response** `200`: `PaginatedResponse<Faction>`

---

### `GET /api/worlds/:worldId/factions/:factionId`

- **Auth**: Required (viewer+)
- **Response** `200`: `{ faction: Faction }`

---

### `PATCH /api/worlds/:worldId/factions/:factionId`

- **Auth**: Required (editor+)
- **Request Body**: All fields from `CreateFactionRequest`, all optional.
- **Response** `200`: `{ faction: Faction }`

---

### `DELETE /api/worlds/:worldId/factions/:factionId`

- **Auth**: Required (editor+)
- **Response** `204`: No content

---

### `POST /api/worlds/:worldId/factions/:factionId/allegiances`

Define a relationship between two factions.

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface CreateAllegianceRequest {
    targetFactionId: UUID;          // required
    type: "allied" | "neutral" | "rival" | "hostile" | "vassal" | "overlord";  // required
    description?: string;          // max 2000 chars
    since?: ISODateTime;            // in-world date
    strength?: number;              // 1-10
  }
  ```
- **Response** `201`:
  ```typescript
  interface Allegiance extends Timestamps {
    id: UUID;
    sourceFactionId: UUID;
    targetFactionId: UUID;
    targetFactionName: string;
    type: string;
    description: string | null;
    since: ISODateTime | null;
    strength: number;
  }
  ```
  `{ allegiance: Allegiance }`

---

### `GET /api/worlds/:worldId/factions/:factionId/allegiances`

- **Auth**: Required (viewer+)
- **Query Parameters**: `PaginationParams`
- **Response** `200`: `PaginatedResponse<Allegiance>`

---

### `DELETE /api/worlds/:worldId/factions/:factionId/allegiances/:allegianceId`

- **Auth**: Required (editor+)
- **Response** `204`: No content

---

### `POST /api/worlds/:worldId/factions/:factionId/members`

Add a character to a faction.

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface AddFactionMemberRequest {
    characterId: UUID;            // required
    rank?: string;               // max 200 chars
    role?: string;               // max 200 chars, e.g. "leader", "spy", "enforcer"
    joinedAt?: ISODateTime;      // in-world date
    leftAt?: ISODateTime;        // in-world date
    loyalty?: number;            // 1-10
  }
  ```
- **Response** `201`:
  ```typescript
  interface FactionMembership extends Timestamps {
    id: UUID;
    factionId: UUID;
    characterId: UUID;
    characterName: string;
    rank: string | null;
    role: string | null;
    joinedAt: ISODateTime | null;
    leftAt: ISODateTime | null;
    loyalty: number | null;
  }
  ```
  `{ membership: FactionMembership }`

---

### `GET /api/worlds/:worldId/factions/:factionId/members`

- **Auth**: Required (viewer+)
- **Query Parameters**: `PaginationParams & { active?: boolean }`
- **Response** `200`: `PaginatedResponse<FactionMembership>`

---

### `DELETE /api/worlds/:worldId/factions/:factionId/members/:membershipId`

- **Auth**: Required (editor+)
- **Response** `204`: No content

---

### `POST /api/worlds/:worldId/factions/:factionId/power-levels`

Record a faction's power level at a point in time.

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface RecordPowerLevelRequest {
    level: number;             // required, 1-100
    date: ISODateTime;         // required, in-world date
    reason?: string;           // max 2000 chars, what caused the change
    eventId?: UUID;            // linked event
  }
  ```
- **Response** `201`:
  ```typescript
  interface PowerLevel extends Timestamps {
    id: UUID;
    factionId: UUID;
    level: number;
    date: ISODateTime;
    reason: string | null;
    eventId: UUID | null;
  }
  ```
  `{ powerLevel: PowerLevel }`

---

### `GET /api/worlds/:worldId/factions/:factionId/power-levels`

Time-series data for faction power.

- **Auth**: Required (viewer+)
- **Query Parameters**:
  ```typescript
  interface ListPowerLevelsParams {
    dateAfter?: ISODateTime;
    dateBefore?: ISODateTime;
    sort?: "date";
    order?: "asc" | "desc";    // default: "asc"
  }
  ```
- **Response** `200`: `{ data: PowerLevel[] }` (not paginated — expected to be small)

---

## 10. Source Materials

### `POST /api/worlds/:worldId/sources`

Upload a source material for ingestion.

- **Auth**: Required (editor+)
- **Content-Type**: `multipart/form-data`
- **Rate Limit**: File upload tier (10 req/min)
- **Request Body**:
  ```typescript
  interface UploadSourceRequest {
    file: File;                   // required. Max 50MB. Accepted: .pdf, .docx, .txt, .epub, .fountain, .fdx, .md, .rtf
    title?: string;              // defaults to filename
    type?: "manuscript" | "outline" | "treatment" | "notes" | "research" | "screenplay" | "other";
    description?: string;        // max 2000 chars
    tags?: string[];
  }
  ```
- **Response** `201`:
  ```typescript
  interface SourceMaterial extends Timestamps {
    id: UUID;
    worldId: UUID;
    title: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    type: string | null;
    description: string | null;
    tags: string[];
    processingStatus: "pending" | "processing" | "completed" | "failed";
    pageCount: number | null;
    wordCount: number | null;
    downloadUrl: string;          // pre-signed URL, expires in 1 hour
  }

  interface UploadSourceResponse {
    source: SourceMaterial;
  }
  ```
- **Errors**: `400 VALIDATION_ERROR`, `413 PAYLOAD_TOO_LARGE`

---

### `GET /api/worlds/:worldId/sources`

- **Auth**: Required (viewer+)
- **Query Parameters**:
  ```typescript
  interface ListSourcesParams extends PaginationParams {
    type?: string;
    processingStatus?: "pending" | "processing" | "completed" | "failed";
    search?: string;
    sort?: "title" | "createdAt" | "sizeBytes";
    order?: "asc" | "desc";
  }
  ```
- **Response** `200`: `PaginatedResponse<SourceMaterial>`

---

### `GET /api/worlds/:worldId/sources/:sourceId`

- **Auth**: Required (viewer+)
- **Response** `200`: `{ source: SourceMaterial }`

---

### `DELETE /api/worlds/:worldId/sources/:sourceId`

- **Auth**: Required (editor+)
- **Response** `204`: No content

---

### `GET /api/worlds/:worldId/sources/:sourceId/annotations`

Get entity annotations extracted from the source material.

- **Auth**: Required (viewer+)
- **Query Parameters**:
  ```typescript
  interface ListAnnotationsParams extends PaginationParams {
    entityType?: "character" | "location" | "event" | "faction" | "theme";
    status?: "pending" | "confirmed" | "rejected";
  }
  ```
- **Response** `200`:
  ```typescript
  interface SourceAnnotation {
    id: UUID;
    sourceId: UUID;
    entityType: "character" | "location" | "event" | "faction" | "theme";
    extractedName: string;
    extractedText: string;         // the passage where the entity was found
    pageNumber: number | null;
    charOffset: number;
    charLength: number;
    confidence: number;            // 0-1
    status: "pending" | "confirmed" | "rejected";
    linkedEntityId: UUID | null;   // linked to a confirmed entity
  }
  ```
  `PaginatedResponse<SourceAnnotation>`

---

## 11. Ingestion

### `POST /api/worlds/:worldId/ingestion/trigger`

Trigger ingestion processing for a source material. Extracts characters, locations, events, themes, and factions.

- **Auth**: Required (editor+)
- **Rate Limit**: AI tier (20 req/min)
- **Request Body**:
  ```typescript
  interface TriggerIngestionRequest {
    sourceId: UUID;               // required
    entityTypes?: Array<"character" | "location" | "event" | "faction" | "theme">;  // default: all
    options?: {
      mergeThreshold?: number;    // 0-1, confidence threshold for auto-merging with existing entities. Default 0.9
      extractRelationships?: boolean;  // default: true
    };
  }
  ```
- **Response** `202`:
  ```typescript
  interface TriggerIngestionResponse {
    ingestionJobId: UUID;
    status: "queued";
    estimatedDurationSeconds: number | null;
  }
  ```

---

### `GET /api/worlds/:worldId/ingestion/:jobId`

Poll ingestion job status.

- **Auth**: Required (viewer+)
- **Response** `200`:
  ```typescript
  interface IngestionJob {
    id: UUID;
    worldId: UUID;
    sourceId: UUID;
    status: "queued" | "processing" | "review" | "completed" | "failed";
    progress: number;               // 0-100
    startedAt: ISODateTime | null;
    completedAt: ISODateTime | null;
    error: string | null;
    extractedCounts: {
      characters: number;
      locations: number;
      events: number;
      factions: number;
      themes: number;
      relationships: number;
    };
    pendingReviewCount: number;     // entities awaiting confirm/reject
  }
  ```
  `{ job: IngestionJob }`

---

### `GET /api/worlds/:worldId/ingestion/:jobId/entities`

List extracted entities pending review.

- **Auth**: Required (editor+)
- **Query Parameters**:
  ```typescript
  interface ListExtractedEntitiesParams extends PaginationParams {
    entityType?: "character" | "location" | "event" | "faction" | "theme";
    status?: "pending" | "confirmed" | "rejected";
    minConfidence?: number;       // 0-1
  }
  ```
- **Response** `200`:
  ```typescript
  interface ExtractedEntity {
    id: UUID;
    jobId: UUID;
    entityType: "character" | "location" | "event" | "faction" | "theme";
    name: string;
    extractedData: Record<string, unknown>;  // type-specific fields
    confidence: number;
    status: "pending" | "confirmed" | "rejected";
    mergeCandidate: {               // existing entity this might be a duplicate of
      entityId: UUID;
      entityName: string;
      similarity: number;
    } | null;
    sourceExcerpts: string[];       // passages where this entity was detected
  }
  ```
  `PaginatedResponse<ExtractedEntity>`

---

### `POST /api/worlds/:worldId/ingestion/:jobId/entities/:entityId/confirm`

Confirm an extracted entity, creating it in the world.

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface ConfirmEntityRequest {
    mergeWithEntityId?: UUID;      // merge into existing entity instead of creating new
    overrides?: Record<string, unknown>;  // override extracted fields before saving
  }
  ```
- **Response** `200`:
  ```typescript
  interface ConfirmEntityResponse {
    entity: {
      id: UUID;
      entityType: string;
      name: string;
      merged: boolean;
    };
  }
  ```

---

### `POST /api/worlds/:worldId/ingestion/:jobId/entities/:entityId/reject`

Reject an extracted entity.

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface RejectEntityRequest {
    reason?: string;              // max 500 chars
  }
  ```
- **Response** `204`: No content

---

### `POST /api/worlds/:worldId/ingestion/:jobId/entities/batch`

Batch confirm/reject multiple entities.

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface BatchEntityDecisionRequest {
    decisions: Array<{
      entityId: UUID;
      action: "confirm" | "reject";
      mergeWithEntityId?: UUID;
      overrides?: Record<string, unknown>;
      reason?: string;
    }>;  // max 100 per batch
  }
  ```
- **Response** `200`:
  ```typescript
  interface BatchEntityDecisionResponse {
    results: Array<{
      entityId: UUID;
      action: "confirm" | "reject";
      success: boolean;
      error?: string;
      createdEntityId?: UUID;
    }>;
  }
  ```

---

## 12. Search

### `POST /api/worlds/:worldId/search`

Full-text search across all entities in a world.

- **Auth**: Required (viewer+)
- **Request Body**:
  ```typescript
  interface SearchRequest {
    query: string;                     // required, 1-500 chars
    entityTypes?: Array<"character" | "location" | "event" | "scene" | "beat" | "arc" | "faction" | "theme" | "source">;
    tags?: string[];                   // filter by tags
    limit?: number;                    // default 25, max 100
    cursor?: string;
  }
  ```
- **Response** `200`:
  ```typescript
  interface SearchResult {
    entityId: UUID;
    entityType: string;
    name: string;
    excerpt: string;                   // highlighted matching text
    score: number;                     // relevance score, 0-1
    updatedAt: ISODateTime;
  }

  interface SearchResponse {
    results: SearchResult[];
    pagination: {
      nextCursor: string | null;
      hasMore: boolean;
      totalCount: number;
    };
  }
  ```

---

### `POST /api/worlds/:worldId/search/semantic`

AI-powered semantic search using creative intent. Finds entities by meaning rather than keyword match.

- **Auth**: Required (viewer+)
- **Rate Limit**: AI tier (20 req/min)
- **Request Body**:
  ```typescript
  interface SemanticSearchRequest {
    query: string;                     // required, natural language. e.g. "scenes where trust is broken"
    entityTypes?: Array<"character" | "location" | "event" | "scene" | "beat" | "arc" | "faction" | "theme">;
    limit?: number;                    // default 25, max 50
  }
  ```
- **Response** `200`:
  ```typescript
  interface SemanticSearchResult {
    entityId: UUID;
    entityType: string;
    name: string;
    excerpt: string;
    relevanceScore: number;           // 0-1
    explanation: string;              // why this result matched the intent
  }

  interface SemanticSearchResponse {
    results: SemanticSearchResult[];
    queryInterpretation: string;      // how the AI interpreted the query
  }
  ```

---

## 13. Analysis

### `POST /api/worlds/:worldId/analysis/consistency`

Trigger a consistency check across the world's entities.

- **Auth**: Required (editor+)
- **Rate Limit**: AI tier (20 req/min)
- **Request Body**:
  ```typescript
  interface ConsistencyCheckRequest {
    scope?: Array<"timeline" | "characters" | "locations" | "relationships" | "causality">;  // default: all
    characterIds?: UUID[];         // limit check to specific characters
    sceneIds?: UUID[];             // limit check to specific scenes
  }
  ```
- **Response** `202`:
  ```typescript
  interface ConsistencyCheckResponse {
    analysisId: UUID;
    status: "queued";
  }
  ```

---

### `GET /api/worlds/:worldId/analysis/:analysisId`

Get analysis results.

- **Auth**: Required (viewer+)
- **Response** `200`:
  ```typescript
  interface AnalysisResult {
    id: UUID;
    worldId: UUID;
    type: "consistency" | "pacing" | "voice";
    status: "queued" | "processing" | "completed" | "failed";
    startedAt: ISODateTime | null;
    completedAt: ISODateTime | null;
    results: ConsistencyResult | PacingResult | VoiceAnalysisResult | null;
  }
  ```

---

### `GET /api/worlds/:worldId/analysis/contradictions`

List all detected contradictions.

- **Auth**: Required (viewer+)
- **Query Parameters**:
  ```typescript
  interface ListContradictionsParams extends PaginationParams {
    severity?: "low" | "medium" | "high" | "critical";
    category?: "timeline" | "character" | "location" | "relationship" | "causality";
    resolved?: boolean;
  }
  ```
- **Response** `200`:
  ```typescript
  interface Contradiction {
    id: UUID;
    analysisId: UUID;
    severity: "low" | "medium" | "high" | "critical";
    category: string;
    description: string;
    entities: Array<{
      entityId: UUID;
      entityType: string;
      entityName: string;
    }>;
    evidence: Array<{
      field: string;
      value: string;
      sourceEntityId: UUID;
    }>;
    suggestion: string;              // AI-suggested resolution
    resolved: boolean;
    resolvedAt: ISODateTime | null;
    createdAt: ISODateTime;
  }
  ```
  `PaginatedResponse<Contradiction>`

---

### `PATCH /api/worlds/:worldId/analysis/contradictions/:contradictionId`

Mark a contradiction as resolved.

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface ResolveContradictionRequest {
    resolved: boolean;
    resolutionNote?: string;        // max 2000 chars
  }
  ```
- **Response** `200`: `{ contradiction: Contradiction }`

---

### `POST /api/worlds/:worldId/analysis/pacing`

Trigger pacing analysis.

- **Auth**: Required (editor+)
- **Rate Limit**: AI tier (20 req/min)
- **Request Body**:
  ```typescript
  interface PacingAnalysisRequest {
    arcId?: UUID;                    // analyze specific arc, or whole world
    sceneIds?: UUID[];               // specific scenes
  }
  ```
- **Response** `202`: `{ analysisId: UUID; status: "queued" }`

---

### `GET /api/worlds/:worldId/analysis/pacing/:analysisId`

- **Auth**: Required (viewer+)
- **Response** `200`:
  ```typescript
  interface PacingResult {
    overallPace: "slow" | "moderate" | "fast" | "uneven";
    tensionCurve: Array<{
      sceneId: UUID;
      sceneName: string;
      order: number;
      tensionLevel: number;          // 0-10
      pacingNote: string;
    }>;
    insights: string[];
    recommendations: string[];
  }
  ```
  `{ analysis: AnalysisResult & { results: PacingResult } }`

---

### `POST /api/worlds/:worldId/analysis/voice`

Analyze a character's voice consistency.

- **Auth**: Required (editor+)
- **Rate Limit**: AI tier (20 req/min)
- **Request Body**:
  ```typescript
  interface VoiceAnalysisRequest {
    characterId: UUID;              // required
    sceneIds?: UUID[];              // limit to specific scenes
  }
  ```
- **Response** `202`: `{ analysisId: UUID; status: "queued" }`

---

### `GET /api/worlds/:worldId/analysis/voice/:analysisId`

- **Auth**: Required (viewer+)
- **Response** `200`:
  ```typescript
  interface VoiceAnalysisResult {
    characterId: UUID;
    characterName: string;
    overallConsistency: number;      // 0-1
    voiceTraits: Array<{
      trait: string;
      frequency: number;            // how often it appears
      examples: string[];
    }>;
    inconsistencies: Array<{
      sceneId: UUID;
      sceneName: string;
      beatId: UUID | null;
      excerpt: string;
      issue: string;
      suggestion: string;
    }>;
    recommendations: string[];
  }
  ```
  `{ analysis: AnalysisResult & { results: VoiceAnalysisResult } }`

---

## 14. Canon

### `POST /api/worlds/:worldId/canon/snapshots`

Create a canon snapshot (version) of the world.

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface CreateSnapshotRequest {
    name: string;                   // required, 1-200 chars. e.g. "v1.0 - Pre-production draft"
    description?: string;          // max 2000 chars
    tags?: string[];
  }
  ```
- **Response** `201`:
  ```typescript
  interface CanonSnapshot extends Timestamps {
    id: UUID;
    worldId: UUID;
    name: string;
    description: string | null;
    tags: string[];
    version: number;                 // auto-incrementing
    createdBy: UUID;
    entityCounts: {
      characters: number;
      events: number;
      scenes: number;
      beats: number;
      locations: number;
      arcs: number;
      factions: number;
      themes: number;
    };
    sizeBytes: number;
  }

  interface CreateSnapshotResponse {
    snapshot: CanonSnapshot;
  }
  ```

---

### `GET /api/worlds/:worldId/canon/snapshots`

- **Auth**: Required (viewer+)
- **Query Parameters**:
  ```typescript
  interface ListSnapshotsParams extends PaginationParams {
    search?: string;
    sort?: "version" | "createdAt" | "name";
    order?: "asc" | "desc";
  }
  ```
- **Response** `200`: `PaginatedResponse<CanonSnapshot>`

---

### `GET /api/worlds/:worldId/canon/snapshots/:snapshotId`

- **Auth**: Required (viewer+)
- **Response** `200`: `{ snapshot: CanonSnapshot }`

---

### `GET /api/worlds/:worldId/canon/diff`

Compare two canon versions.

- **Auth**: Required (viewer+)
- **Query Parameters**:
  ```typescript
  interface DiffParams {
    fromSnapshotId: UUID;           // required
    toSnapshotId: UUID;             // required
    entityTypes?: string[];          // filter diff to specific types
  }
  ```
- **Response** `200`:
  ```typescript
  interface CanonDiff {
    fromSnapshot: { id: UUID; name: string; version: number };
    toSnapshot: { id: UUID; name: string; version: number };
    changes: Array<{
      entityType: string;
      entityId: UUID;
      entityName: string;
      changeType: "added" | "modified" | "deleted";
      fieldChanges?: Array<{
        field: string;
        oldValue: unknown;
        newValue: unknown;
      }>;
    }>;
    summary: {
      added: number;
      modified: number;
      deleted: number;
    };
  }

  interface DiffResponse {
    diff: CanonDiff;
  }
  ```

---

### `POST /api/worlds/:worldId/canon/snapshots/:snapshotId/restore`

Restore the world to a previous canon snapshot.

- **Auth**: Required (owner only)
- **Request Body**:
  ```typescript
  interface RestoreSnapshotRequest {
    createBackupFirst?: boolean;   // default: true. Creates a snapshot of current state before restoring.
  }
  ```
- **Response** `200`:
  ```typescript
  interface RestoreSnapshotResponse {
    restoredFrom: { id: UUID; name: string; version: number };
    backupSnapshot: CanonSnapshot | null;
  }
  ```

---

## 15. What-If

### `POST /api/worlds/:worldId/what-if/branches`

Create a what-if branch (a speculative fork of the world).

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface CreateBranchRequest {
    name: string;                     // required, 1-200 chars
    description?: string;            // max 5000 chars
    divergencePoint?: {
      snapshotId?: UUID;              // branch from a snapshot
      sceneId?: UUID;                 // branch from a specific scene
      eventId?: UUID;                 // branch from a specific event
    };
    hypothesis?: string;              // max 5000 chars. "What if Gandalf never arrived?"
  }
  ```
- **Response** `201`:
  ```typescript
  interface WhatIfBranch extends Timestamps {
    id: UUID;
    worldId: UUID;
    name: string;
    description: string | null;
    hypothesis: string | null;
    divergencePoint: {
      snapshotId: UUID | null;
      sceneId: UUID | null;
      eventId: UUID | null;
    };
    status: "active" | "merged" | "archived";
    entityCounts: {
      modified: number;
      added: number;
      deleted: number;
    };
    createdBy: UUID;
  }

  interface CreateBranchResponse {
    branch: WhatIfBranch;
  }
  ```

---

### `GET /api/worlds/:worldId/what-if/branches`

- **Auth**: Required (viewer+)
- **Query Parameters**:
  ```typescript
  interface ListBranchesParams extends PaginationParams {
    status?: "active" | "merged" | "archived";
    search?: string;
    sort?: "name" | "createdAt";
    order?: "asc" | "desc";
  }
  ```
- **Response** `200`: `PaginatedResponse<WhatIfBranch>`

---

### `GET /api/worlds/:worldId/what-if/branches/:branchId`

- **Auth**: Required (viewer+)
- **Response** `200`: `{ branch: WhatIfBranch }`

---

### `POST /api/worlds/:worldId/what-if/branches/:branchId/simulate`

AI-simulate the impact of the what-if scenario.

- **Auth**: Required (editor+)
- **Rate Limit**: AI tier (20 req/min)
- **Request Body**:
  ```typescript
  interface SimulateImpactRequest {
    changes: Array<{
      entityType: "character" | "event" | "scene" | "location" | "faction";
      entityId: UUID;
      modification: Record<string, unknown>;  // the hypothetical changes
    }>;
    depth?: "shallow" | "medium" | "deep";  // how many downstream effects to trace. Default "medium"
  }
  ```
- **Response** `202`:
  ```typescript
  interface SimulateImpactResponse {
    simulationId: UUID;
    status: "queued";
  }
  ```

---

### `GET /api/worlds/:worldId/what-if/branches/:branchId/simulations/:simulationId`

- **Auth**: Required (viewer+)
- **Response** `200`:
  ```typescript
  interface SimulationResult {
    id: UUID;
    branchId: UUID;
    status: "queued" | "processing" | "completed" | "failed";
    completedAt: ISODateTime | null;
    impacts: Array<{
      entityType: string;
      entityId: UUID;
      entityName: string;
      impactType: "direct" | "downstream";
      description: string;
      severity: "minor" | "moderate" | "major";
      affectedFields: string[];
    }>;
    narrativeSummary: string;        // AI-generated summary of overall impact
    confidenceScore: number;         // 0-1
  }
  ```
  `{ simulation: SimulationResult }`

---

### `GET /api/worlds/:worldId/what-if/compare`

Compare a what-if branch to the main world (or another branch).

- **Auth**: Required (viewer+)
- **Query Parameters**:
  ```typescript
  interface CompareBranchesParams {
    branchId: UUID;                  // required
    compareTo?: UUID;               // another branch ID. Default: main world
    entityTypes?: string[];
  }
  ```
- **Response** `200`: `{ diff: CanonDiff }` (same shape as canon diff)

---

### `POST /api/worlds/:worldId/what-if/branches/:branchId/merge`

Merge a what-if branch's changes into the main world.

- **Auth**: Required (owner only)
- **Request Body**:
  ```typescript
  interface MergeBranchRequest {
    createSnapshotFirst?: boolean;   // default: true
    conflictResolution?: "branch" | "main" | "manual";  // default: "manual"
    manualResolutions?: Array<{
      entityType: string;
      entityId: UUID;
      keepVersion: "branch" | "main";
    }>;
  }
  ```
- **Response** `200`:
  ```typescript
  interface MergeBranchResponse {
    merged: boolean;
    conflicts: Array<{
      entityType: string;
      entityId: UUID;
      entityName: string;
      branchValue: unknown;
      mainValue: unknown;
    }> | null;                       // null if no conflicts
    backupSnapshotId: UUID | null;
  }
  ```

---

### `DELETE /api/worlds/:worldId/what-if/branches/:branchId`

Archive/delete a what-if branch.

- **Auth**: Required (editor+)
- **Response** `204`: No content

---

## 16. Writing

### `POST /api/worlds/:worldId/manuscripts`

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface CreateManuscriptRequest {
    title: string;                    // required, 1-300 chars
    type?: "screenplay" | "novel" | "treatment" | "pilot" | "series_bible";
    description?: string;            // max 5000 chars
    arcId?: UUID;                     // link to a narrative arc
    tags?: string[];
  }
  ```
- **Response** `201`:
  ```typescript
  interface Manuscript extends Timestamps {
    id: UUID;
    worldId: UUID;
    title: string;
    type: string | null;
    description: string | null;
    arcId: UUID | null;
    tags: string[];
    sectionCount: number;
    wordCount: number;
    status: "draft" | "revision" | "final";
  }

  interface CreateManuscriptResponse {
    manuscript: Manuscript;
  }
  ```

---

### `GET /api/worlds/:worldId/manuscripts`

- **Auth**: Required (viewer+)
- **Query Parameters**:
  ```typescript
  interface ListManuscriptsParams extends PaginationParams {
    type?: string;
    status?: "draft" | "revision" | "final";
    search?: string;
    sort?: "title" | "createdAt" | "updatedAt" | "wordCount";
    order?: "asc" | "desc";
  }
  ```
- **Response** `200`: `PaginatedResponse<Manuscript>`

---

### `GET /api/worlds/:worldId/manuscripts/:manuscriptId`

- **Auth**: Required (viewer+)
- **Response** `200`: `{ manuscript: Manuscript }`

---

### `PATCH /api/worlds/:worldId/manuscripts/:manuscriptId`

- **Auth**: Required (editor+)
- **Request Body**: All fields from `CreateManuscriptRequest`, all optional. Plus: `status?: "draft" | "revision" | "final"`.
- **Response** `200`: `{ manuscript: Manuscript }`

---

### `DELETE /api/worlds/:worldId/manuscripts/:manuscriptId`

- **Auth**: Required (editor+)
- **Response** `204`: No content

---

### `POST /api/worlds/:worldId/manuscripts/:manuscriptId/sections`

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface CreateSectionRequest {
    title: string;                   // required, 1-300 chars
    type?: "chapter" | "act" | "sequence" | "scene_heading" | "custom";
    content?: string;               // max 500000 chars (rich text / markdown)
    order?: number;                 // auto-assigned to end if omitted
    parentSectionId?: UUID;          // for nested sections (act > chapter > scene)
    sceneId?: UUID;                  // link to a world scene
    notes?: string;                 // max 5000 chars
  }
  ```
- **Response** `201`:
  ```typescript
  interface ManuscriptSection extends Timestamps {
    id: UUID;
    manuscriptId: UUID;
    title: string;
    type: string | null;
    content: string | null;
    order: number;
    parentSectionId: UUID | null;
    sceneId: UUID | null;
    notes: string | null;
    wordCount: number;
  }

  interface CreateSectionResponse {
    section: ManuscriptSection;
  }
  ```

---

### `GET /api/worlds/:worldId/manuscripts/:manuscriptId/sections`

- **Auth**: Required (viewer+)
- **Query Parameters**:
  ```typescript
  interface ListSectionsParams extends PaginationParams {
    parentSectionId?: UUID | "root";
    type?: string;
    sort?: "order" | "title";
    order?: "asc" | "desc";
  }
  ```
- **Response** `200`: `PaginatedResponse<ManuscriptSection>`

---

### `PATCH /api/worlds/:worldId/manuscripts/:manuscriptId/sections/:sectionId`

- **Auth**: Required (editor+)
- **Request Body**: All fields from `CreateSectionRequest`, all optional.
- **Response** `200`: `{ section: ManuscriptSection }`

---

### `DELETE /api/worlds/:worldId/manuscripts/:manuscriptId/sections/:sectionId`

- **Auth**: Required (editor+)
- **Response** `204`: No content

---

### `PUT /api/worlds/:worldId/manuscripts/:manuscriptId/sections/reorder`

Batch reorder sections.

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface ReorderSectionsRequest {
    orderings: Array<{
      sectionId: UUID;
      order: number;
      parentSectionId?: UUID | null;  // also allows reparenting
    }>;
  }
  ```
- **Response** `200`:
  ```typescript
  interface ReorderSectionsResponse {
    sections: Array<{ id: UUID; order: number; parentSectionId: UUID | null }>;
  }
  ```

---

### `POST /api/worlds/:worldId/manuscripts/:manuscriptId/generate-treatment`

AI-generate a treatment from linked scenes and arcs.

- **Auth**: Required (editor+)
- **Rate Limit**: AI tier (20 req/min)
- **Request Body**:
  ```typescript
  interface GenerateTreatmentRequest {
    style?: "detailed" | "concise";      // default "detailed"
    includeCharacterArcs?: boolean;      // default true
    includeThematicAnalysis?: boolean;   // default true
    arcIds?: UUID[];                      // specific arcs to cover
  }
  ```
- **Response** `200`:
  ```typescript
  interface GenerateTreatmentResponse {
    content: string;                     // generated treatment text
    wordCount: number;
    usageTokens: number;
    sections: Array<{
      title: string;
      content: string;
      linkedSceneIds: UUID[];
    }>;
  }
  ```

---

## 17. Structure Templates

### `GET /api/structure-templates`

List available narrative structure templates. These are system-level, not per-world.

- **Auth**: Required
- **Query Parameters**:
  ```typescript
  interface ListTemplatesParams extends PaginationParams {
    category?: "film" | "television" | "novel" | "short_story" | "universal";
    search?: string;
    sort?: "name" | "popularity";
    order?: "asc" | "desc";
  }
  ```
- **Response** `200`:
  ```typescript
  interface StructureTemplate {
    id: UUID;
    name: string;                     // e.g. "Save the Cat", "Hero's Journey", "Three Act Structure"
    description: string;
    category: "film" | "television" | "novel" | "short_story" | "universal";
    author: string;                   // e.g. "Blake Snyder", "Joseph Campbell"
    beats: TemplateBeat[];
    isBuiltIn: boolean;              // system template vs user-created
  }

  interface TemplateBeat {
    id: UUID;
    name: string;                     // e.g. "Opening Image", "Catalyst", "All Is Lost"
    description: string;
    order: number;
    percentageStart: number;          // 0-100, position in the story
    percentageEnd: number;            // 0-100
    isRequired: boolean;
  }
  ```
  `PaginatedResponse<StructureTemplate>`

---

### `GET /api/structure-templates/:templateId`

- **Auth**: Required
- **Response** `200`: `{ template: StructureTemplate }`

---

### `POST /api/worlds/:worldId/structure-mappings`

Map scenes to template beats.

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface CreateStructureMappingRequest {
    templateId: UUID;                 // required
    name?: string;                   // optional label for this mapping
    mappings: Array<{
      templateBeatId: UUID;          // required
      sceneId?: UUID;
      beatId?: UUID;
      notes?: string;               // max 2000 chars
    }>;
  }
  ```
- **Response** `201`:
  ```typescript
  interface StructureMapping extends Timestamps {
    id: UUID;
    worldId: UUID;
    templateId: UUID;
    templateName: string;
    name: string | null;
    mappings: Array<{
      id: UUID;
      templateBeatId: UUID;
      templateBeatName: string;
      sceneId: UUID | null;
      sceneName: string | null;
      beatId: UUID | null;
      beatName: string | null;
      notes: string | null;
    }>;
    coverage: number;               // 0-1, percentage of template beats mapped
  }

  interface CreateStructureMappingResponse {
    mapping: StructureMapping;
  }
  ```

---

### `GET /api/worlds/:worldId/structure-mappings`

- **Auth**: Required (viewer+)
- **Query Parameters**: `PaginationParams`
- **Response** `200`: `PaginatedResponse<StructureMapping>`

---

### `GET /api/worlds/:worldId/structure-mappings/:mappingId`

- **Auth**: Required (viewer+)
- **Response** `200`: `{ mapping: StructureMapping }`

---

### `PATCH /api/worlds/:worldId/structure-mappings/:mappingId`

- **Auth**: Required (editor+)
- **Request Body**: Same as `CreateStructureMappingRequest`, all optional.
- **Response** `200`: `{ mapping: StructureMapping }`

---

### `DELETE /api/worlds/:worldId/structure-mappings/:mappingId`

- **Auth**: Required (editor+)
- **Response** `204`: No content

---

## 18. AI Wand

General-purpose AI generation endpoints. All use AI rate limits.

### `POST /api/worlds/:worldId/ai/generate-beat`

Generate a beat description from context.

- **Auth**: Required (editor+)
- **Rate Limit**: AI tier (20 req/min)
- **Request Body**:
  ```typescript
  interface GenerateBeatRequest {
    sceneId: UUID;                    // required, context scene
    beatType?: "action" | "dialogue" | "revelation" | "decision" | "reaction" | "transition" | "description";
    characterIds?: UUID[];           // characters involved
    prompt?: string;                 // additional direction, max 2000 chars
    previousBeatId?: UUID;           // for continuity
    tone?: string;                   // max 200 chars
    length?: "short" | "medium" | "long";  // default "medium"
  }
  ```
- **Response** `200`:
  ```typescript
  interface GenerateBeatResponse {
    suggestions: Array<{
      title: string;
      description: string;
      dialogueText: string | null;
      actionText: string | null;
      emotionalTone: string;
    }>;  // returns 3 suggestions
    usageTokens: number;
  }
  ```

---

### `POST /api/worlds/:worldId/ai/generate-script`

Generate a script section (dialogue + action lines) for a scene.

- **Auth**: Required (editor+)
- **Rate Limit**: AI tier (20 req/min)
- **Request Body**:
  ```typescript
  interface GenerateScriptRequest {
    sceneId: UUID;                    // required
    format: "fountain" | "prose" | "outline";  // required
    beatIds?: UUID[];                 // specific beats to script
    characterIds?: UUID[];           // focus characters
    styleNotes?: string;             // max 2000 chars
    maxWords?: number;               // default 1000
  }
  ```
- **Response** `200`:
  ```typescript
  interface GenerateScriptResponse {
    content: string;
    format: string;
    wordCount: number;
    usageTokens: number;
  }
  ```

---

### `POST /api/worlds/:worldId/ai/expand-synopsis`

Expand a short synopsis into a fuller description.

- **Auth**: Required (editor+)
- **Rate Limit**: AI tier (20 req/min)
- **Request Body**:
  ```typescript
  interface ExpandSynopsisRequest {
    synopsis: string;                // required, 1-5000 chars
    targetLength?: "paragraph" | "page" | "detailed";  // default "page"
    entityContext?: {
      characterIds?: UUID[];
      locationIds?: UUID[];
      eventIds?: UUID[];
    };
    tone?: string;                   // max 200 chars
  }
  ```
- **Response** `200`:
  ```typescript
  interface ExpandSynopsisResponse {
    expanded: string;
    wordCount: number;
    usageTokens: number;
    suggestedScenes: Array<{
      title: string;
      description: string;
      characterIds: UUID[];
    }> | null;
  }
  ```

---

## 19. Export

All export endpoints return files. Rate-limited to export tier (5 req/min).

### `POST /api/worlds/:worldId/export/series-bible`

Generate and download a series bible PDF.

- **Auth**: Required (viewer+)
- **Rate Limit**: Export tier (5 req/min)
- **Request Body**:
  ```typescript
  interface ExportSeriesBibleRequest {
    sections?: Array<"overview" | "characters" | "locations" | "arcs" | "themes" | "factions" | "timeline" | "relationships">;  // default: all
    includeImages?: boolean;         // default true
    style?: "professional" | "creative";  // default "professional"
    characterIds?: UUID[];            // limit to specific characters
    arcIds?: UUID[];                   // limit to specific arcs
  }
  ```
- **Response** `202`:
  ```typescript
  interface ExportJobResponse {
    exportId: UUID;
    status: "queued";
    estimatedDurationSeconds: number | null;
  }
  ```

---

### `POST /api/worlds/:worldId/export/pitch-deck`

Generate a pitch deck PDF.

- **Auth**: Required (viewer+)
- **Rate Limit**: Export tier (5 req/min)
- **Request Body**:
  ```typescript
  interface ExportPitchDeckRequest {
    title?: string;                  // override world name
    logline?: string;                // max 500 chars
    comparables?: string[];          // e.g. ["Breaking Bad meets The Wire"]
    targetAudience?: string;         // max 500 chars
    episodeCount?: number;           // for series
    seasonCount?: number;
    includeCharacterCards?: boolean;  // default true
    includeArcSummary?: boolean;     // default true
  }
  ```
- **Response** `202`: `ExportJobResponse`

---

### `POST /api/worlds/:worldId/export/fountain`

Export screenplay in Fountain format.

- **Auth**: Required (viewer+)
- **Rate Limit**: Export tier (5 req/min)
- **Request Body**:
  ```typescript
  interface ExportFountainRequest {
    manuscriptId?: UUID;             // specific manuscript, or auto-generate from scenes
    sceneIds?: UUID[];               // specific scenes
    includeNotes?: boolean;          // default false
    includeSceneNumbers?: boolean;   // default true
  }
  ```
- **Response** `202`: `ExportJobResponse`

---

### `POST /api/worlds/:worldId/export/fdx`

Export in Final Draft (FDX) format.

- **Auth**: Required (viewer+)
- **Rate Limit**: Export tier (5 req/min)
- **Request Body**:
  ```typescript
  interface ExportFdxRequest {
    manuscriptId?: UUID;
    sceneIds?: UUID[];
    includeNotes?: boolean;          // default false
    includeSceneNumbers?: boolean;   // default true
  }
  ```
- **Response** `202`: `ExportJobResponse`

---

### `GET /api/worlds/:worldId/export/:exportId`

Check export job status and get download URL.

- **Auth**: Required (viewer+)
- **Response** `200`:
  ```typescript
  interface ExportJob {
    id: UUID;
    worldId: UUID;
    type: "series_bible" | "pitch_deck" | "fountain" | "fdx";
    status: "queued" | "processing" | "completed" | "failed";
    progress: number;               // 0-100
    downloadUrl: string | null;      // pre-signed URL, available when completed. Expires in 1 hour.
    filename: string | null;
    sizeBytes: number | null;
    error: string | null;
    createdAt: ISODateTime;
    completedAt: ISODateTime | null;
  }
  ```
  `{ export: ExportJob }`

---

## 20. Collaboration

### Comments

#### `POST /api/worlds/:worldId/comments`

Add a comment to any entity.

- **Auth**: Required (viewer+)
- **Request Body**:
  ```typescript
  interface CreateCommentRequest {
    entityType: "character" | "event" | "scene" | "beat" | "arc" | "location" | "faction" | "theme" | "manuscript" | "section";  // required
    entityId: UUID;                  // required
    content: string;                // required, 1-5000 chars, supports markdown
    parentCommentId?: UUID;          // for threaded replies
    mentions?: UUID[];               // user IDs to @mention
  }
  ```
- **Response** `201`:
  ```typescript
  interface Comment extends Timestamps {
    id: UUID;
    worldId: UUID;
    entityType: string;
    entityId: UUID;
    content: string;
    authorId: UUID;
    authorDisplayName: string;
    authorAvatarUrl: string | null;
    parentCommentId: UUID | null;
    mentions: Array<{ userId: UUID; displayName: string }>;
    replyCount: number;
    resolved: boolean;
  }

  interface CreateCommentResponse {
    comment: Comment;
  }
  ```

---

#### `GET /api/worlds/:worldId/comments`

List comments, filterable by entity.

- **Auth**: Required (viewer+)
- **Query Parameters**:
  ```typescript
  interface ListCommentsParams extends PaginationParams {
    entityType?: string;
    entityId?: UUID;
    authorId?: UUID;
    resolved?: boolean;
    parentCommentId?: UUID | "root";  // "root" = only top-level comments
    sort?: "createdAt" | "updatedAt";
    order?: "asc" | "desc";
  }
  ```
- **Response** `200`: `PaginatedResponse<Comment>`

---

#### `PATCH /api/worlds/:worldId/comments/:commentId`

Edit a comment (author only) or resolve it (editor+).

- **Auth**: Required (author or editor+)
- **Request Body**:
  ```typescript
  interface UpdateCommentRequest {
    content?: string;               // 1-5000 chars, only by author
    resolved?: boolean;             // editor+ can resolve/unresolve
  }
  ```
- **Response** `200`: `{ comment: Comment }`

---

#### `DELETE /api/worlds/:worldId/comments/:commentId`

Delete a comment (author or editor+).

- **Auth**: Required (author or editor+)
- **Response** `204`: No content

---

### Annotations

#### `POST /api/worlds/:worldId/annotations`

Create an inline annotation on entity content (like a highlight + note).

- **Auth**: Required (editor+)
- **Request Body**:
  ```typescript
  interface CreateAnnotationRequest {
    entityType: "scene" | "beat" | "section" | "character";  // required
    entityId: UUID;                  // required
    field: string;                   // which text field, e.g. "description", "content", "dialogueText"
    startOffset: number;             // character offset start
    endOffset: number;               // character offset end
    content: string;                // annotation text, 1-2000 chars
    type?: "note" | "suggestion" | "question" | "issue";  // default "note"
    mentions?: UUID[];               // user IDs
  }
  ```
- **Response** `201`:
  ```typescript
  interface Annotation extends Timestamps {
    id: UUID;
    worldId: UUID;
    entityType: string;
    entityId: UUID;
    field: string;
    startOffset: number;
    endOffset: number;
    highlightedText: string;
    content: string;
    type: "note" | "suggestion" | "question" | "issue";
    authorId: UUID;
    authorDisplayName: string;
    mentions: Array<{ userId: UUID; displayName: string }>;
    resolved: boolean;
  }

  interface CreateAnnotationResponse {
    annotation: Annotation;
  }
  ```

---

#### `GET /api/worlds/:worldId/annotations`

- **Auth**: Required (viewer+)
- **Query Parameters**:
  ```typescript
  interface ListAnnotationsParams extends PaginationParams {
    entityType?: string;
    entityId?: UUID;
    type?: "note" | "suggestion" | "question" | "issue";
    resolved?: boolean;
    authorId?: UUID;
  }
  ```
- **Response** `200`: `PaginatedResponse<Annotation>`

---

#### `PATCH /api/worlds/:worldId/annotations/:annotationId`

- **Auth**: Required (author or editor+)
- **Request Body**:
  ```typescript
  interface UpdateAnnotationRequest {
    content?: string;
    resolved?: boolean;
  }
  ```
- **Response** `200`: `{ annotation: Annotation }`

---

#### `DELETE /api/worlds/:worldId/annotations/:annotationId`

- **Auth**: Required (author or editor+)
- **Response** `204`: No content

---

### World Membership Management

See [Story Worlds](#2-story-worlds) section for:
- `GET /api/worlds/:worldId/members`
- `POST /api/worlds/:worldId/members`
- `PATCH /api/worlds/:worldId/members/:userId`
- `DELETE /api/worlds/:worldId/members/:userId`

### Invitations

#### `GET /api/users/me/invitations`

List pending invitations for the current user.

- **Auth**: Required
- **Response** `200`:
  ```typescript
  interface Invitation {
    id: UUID;
    worldId: UUID;
    worldName: string;
    role: "editor" | "viewer";
    invitedBy: { userId: UUID; displayName: string };
    expiresAt: ISODateTime;
    createdAt: ISODateTime;
  }
  ```
  `PaginatedResponse<Invitation>`

---

#### `POST /api/users/me/invitations/:invitationId/accept`

- **Auth**: Required
- **Response** `200`: `{ member: WorldMember }`

---

#### `POST /api/users/me/invitations/:invitationId/decline`

- **Auth**: Required
- **Response** `204`: No content

---

## WebSocket Events

Connect via: `wss://api.storyforge.app/v1/ws?token=<jwt>&worldId=<worldId>`

The WebSocket connection requires a valid JWT and world membership. Messages use JSON with this envelope:

```typescript
interface WsMessage {
  type: string;
  payload: Record<string, unknown>;
  timestamp: ISODateTime;
  userId: UUID;           // who triggered the event
}
```

### Client -> Server Events

```typescript
// Subscribe to entity changes
{ type: "subscribe", payload: { entityType: string; entityId: UUID } }

// Unsubscribe
{ type: "unsubscribe", payload: { entityType: string; entityId: UUID } }

// Presence: signal that user is viewing/editing an entity
{ type: "presence", payload: { entityType: string; entityId: UUID; status: "viewing" | "editing" } }

// Heartbeat (send every 30s to maintain connection)
{ type: "ping" }
```

### Server -> Client Events

```typescript
// Heartbeat response
{ type: "pong" }

// Entity CRUD events
{ type: "entity.created", payload: { entityType: string; entityId: UUID; entity: unknown } }
{ type: "entity.updated", payload: { entityType: string; entityId: UUID; changes: Record<string, { old: unknown; new: unknown }> } }
{ type: "entity.deleted", payload: { entityType: string; entityId: UUID } }

// Beat reordering (real-time drag-and-drop sync)
{ type: "beats.reordered", payload: { sceneId: UUID; orderings: Array<{ beatId: UUID; order: number }> } }

// Scene reordering
{ type: "scenes.reordered", payload: { orderings: Array<{ sceneId: UUID; order: number }> } }

// Section reordering
{ type: "sections.reordered", payload: { manuscriptId: UUID; orderings: Array<{ sectionId: UUID; order: number; parentSectionId: UUID | null }> } }

// Collaborative editing — OT/CRDT cursor and content events
{ type: "editing.cursor", payload: { entityType: string; entityId: UUID; field: string; userId: UUID; displayName: string; position: number } }
{ type: "editing.content", payload: { entityType: string; entityId: UUID; field: string; userId: UUID; operations: Array<{ type: "insert" | "delete"; position: number; text?: string; length?: number }> } }

// Presence updates
{ type: "presence.update", payload: { userId: UUID; displayName: string; entityType: string; entityId: UUID; status: "viewing" | "editing" | "left" } }

// Comments & annotations in real-time
{ type: "comment.created", payload: { comment: Comment } }
{ type: "annotation.created", payload: { annotation: Annotation } }

// Ingestion progress
{ type: "ingestion.progress", payload: { jobId: UUID; sourceId: UUID; status: string; progress: number; message: string } }
{ type: "ingestion.completed", payload: { jobId: UUID; sourceId: UUID; extractedCounts: Record<string, number> } }
{ type: "ingestion.failed", payload: { jobId: UUID; sourceId: UUID; error: string } }

// Analysis progress
{ type: "analysis.progress", payload: { analysisId: UUID; type: string; status: string; progress: number } }
{ type: "analysis.completed", payload: { analysisId: UUID; type: string } }

// Export progress
{ type: "export.progress", payload: { exportId: UUID; type: string; status: string; progress: number } }
{ type: "export.completed", payload: { exportId: UUID; type: string; downloadUrl: string } }

// What-If simulation progress
{ type: "simulation.progress", payload: { simulationId: UUID; branchId: UUID; status: string; progress: number } }
{ type: "simulation.completed", payload: { simulationId: UUID; branchId: UUID } }

// Member events
{ type: "member.joined", payload: { userId: UUID; displayName: string; role: string } }
{ type: "member.left", payload: { userId: UUID } }
{ type: "member.roleChanged", payload: { userId: UUID; oldRole: string; newRole: string } }
```

### Connection Management

- Server sends `ping` every 30 seconds; client must respond with `pong` within 10 seconds or be disconnected.
- On disconnect, client should reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s).
- Maximum 5 concurrent WebSocket connections per user.
- Messages are delivered at-least-once. Clients should deduplicate by `timestamp + type + entityId`.

---

## Appendix: Endpoint Summary

| # | Method | Route | Auth | Rate Tier |
|---|--------|-------|------|-----------|
| 1 | POST | `/api/auth/register` | None | Standard |
| 2 | POST | `/api/auth/login` | None | Standard |
| 3 | POST | `/api/auth/refresh` | None | Standard |
| 4 | POST | `/api/auth/logout` | Required | Standard |
| 5 | GET | `/api/users/me` | Required | Standard |
| 6 | PATCH | `/api/users/me` | Required | Standard |
| 7 | PUT | `/api/users/me/password` | Required | Standard |
| 8 | POST | `/api/users/me/api-keys` | Required | Standard |
| 9 | GET | `/api/users/me/api-keys` | Required | Standard |
| 10 | DELETE | `/api/users/me/api-keys/:keyId` | Required | Standard |
| 11 | GET | `/api/users/me/invitations` | Required | Standard |
| 12 | POST | `/api/users/me/invitations/:id/accept` | Required | Standard |
| 13 | POST | `/api/users/me/invitations/:id/decline` | Required | Standard |
| 14 | POST | `/api/worlds` | Required | Standard |
| 15 | GET | `/api/worlds` | Required | Standard |
| 16 | GET | `/api/worlds/:worldId` | viewer+ | Standard |
| 17 | PATCH | `/api/worlds/:worldId` | editor+ | Standard |
| 18 | DELETE | `/api/worlds/:worldId` | owner | Standard |
| 19 | GET | `/api/worlds/:worldId/members` | viewer+ | Standard |
| 20 | POST | `/api/worlds/:worldId/members` | owner | Standard |
| 21 | PATCH | `/api/worlds/:worldId/members/:userId` | owner | Standard |
| 22 | DELETE | `/api/worlds/:worldId/members/:userId` | owner/self | Standard |
| 23 | POST | `/api/worlds/:worldId/characters` | editor+ | Standard |
| 24 | GET | `/api/worlds/:worldId/characters` | viewer+ | Standard |
| 25 | GET | `/api/worlds/:worldId/characters/:characterId` | viewer+ | Standard |
| 26 | PATCH | `/api/worlds/:worldId/characters/:characterId` | editor+ | Standard |
| 27 | DELETE | `/api/worlds/:worldId/characters/:characterId` | editor+ | Standard |
| 28 | GET | `/api/worlds/:worldId/characters/:characterId/relationships` | viewer+ | Standard |
| 29 | POST | `/api/worlds/:worldId/characters/:characterId/relationships` | editor+ | Standard |
| 30 | PATCH | `/api/worlds/:worldId/characters/:cId/relationships/:rId` | editor+ | Standard |
| 31 | DELETE | `/api/worlds/:worldId/characters/:cId/relationships/:rId` | editor+ | Standard |
| 32 | POST | `/api/worlds/:worldId/characters/:characterId/interview` | editor+ | AI |
| 33 | POST | `/api/worlds/:worldId/events` | editor+ | Standard |
| 34 | GET | `/api/worlds/:worldId/events` | viewer+ | Standard |
| 35 | GET | `/api/worlds/:worldId/events/:eventId` | viewer+ | Standard |
| 36 | PATCH | `/api/worlds/:worldId/events/:eventId` | editor+ | Standard |
| 37 | DELETE | `/api/worlds/:worldId/events/:eventId` | editor+ | Standard |
| 38 | POST | `/api/worlds/:worldId/events/:eventId/causal-relations` | editor+ | Standard |
| 39 | DELETE | `/api/worlds/:worldId/events/:eId/causal-relations/:rId` | editor+ | Standard |
| 40 | POST | `/api/worlds/:worldId/scenes` | editor+ | Standard |
| 41 | GET | `/api/worlds/:worldId/scenes` | viewer+ | Standard |
| 42 | GET | `/api/worlds/:worldId/scenes/:sceneId` | viewer+ | Standard |
| 43 | PATCH | `/api/worlds/:worldId/scenes/:sceneId` | editor+ | Standard |
| 44 | DELETE | `/api/worlds/:worldId/scenes/:sceneId` | editor+ | Standard |
| 45 | PUT | `/api/worlds/:worldId/scenes/reorder` | editor+ | Standard |
| 46 | POST | `/api/worlds/:worldId/scenes/:sceneId/value-changes` | editor+ | Standard |
| 47 | DELETE | `/api/worlds/:worldId/scenes/:sId/value-changes/:vId` | editor+ | Standard |
| 48 | POST | `/api/worlds/:worldId/scenes/:sceneId/beats` | editor+ | Standard |
| 49 | GET | `/api/worlds/:worldId/scenes/:sceneId/beats` | viewer+ | Standard |
| 50 | GET | `/api/worlds/:worldId/scenes/:sceneId/beats/:beatId` | viewer+ | Standard |
| 51 | PATCH | `/api/worlds/:worldId/scenes/:sceneId/beats/:beatId` | editor+ | Standard |
| 52 | DELETE | `/api/worlds/:worldId/scenes/:sceneId/beats/:beatId` | editor+ | Standard |
| 53 | PUT | `/api/worlds/:worldId/scenes/:sceneId/beats/reorder` | editor+ | Standard |
| 54 | POST | `/api/worlds/:worldId/arcs` | editor+ | Standard |
| 55 | GET | `/api/worlds/:worldId/arcs` | viewer+ | Standard |
| 56 | GET | `/api/worlds/:worldId/arcs/:arcId` | viewer+ | Standard |
| 57 | PATCH | `/api/worlds/:worldId/arcs/:arcId` | editor+ | Standard |
| 58 | DELETE | `/api/worlds/:worldId/arcs/:arcId` | editor+ | Standard |
| 59 | POST | `/api/worlds/:worldId/arcs/:arcId/phases` | editor+ | Standard |
| 60 | PATCH | `/api/worlds/:worldId/arcs/:arcId/phases/:phaseId` | editor+ | Standard |
| 61 | DELETE | `/api/worlds/:worldId/arcs/:arcId/phases/:phaseId` | editor+ | Standard |
| 62 | POST | `/api/worlds/:worldId/arcs/:arcId/structure-mapping` | editor+ | Standard |
| 63 | POST | `/api/worlds/:worldId/locations` | editor+ | Standard |
| 64 | GET | `/api/worlds/:worldId/locations` | viewer+ | Standard |
| 65 | GET | `/api/worlds/:worldId/locations/:locationId` | viewer+ | Standard |
| 66 | PATCH | `/api/worlds/:worldId/locations/:locationId` | editor+ | Standard |
| 67 | DELETE | `/api/worlds/:worldId/locations/:locationId` | editor+ | Standard |
| 68 | POST | `/api/worlds/:worldId/themes` | editor+ | Standard |
| 69 | GET | `/api/worlds/:worldId/themes` | viewer+ | Standard |
| 70 | GET | `/api/worlds/:worldId/themes/:themeId` | viewer+ | Standard |
| 71 | PATCH | `/api/worlds/:worldId/themes/:themeId` | editor+ | Standard |
| 72 | DELETE | `/api/worlds/:worldId/themes/:themeId` | editor+ | Standard |
| 73 | POST | `/api/worlds/:worldId/themes/:themeId/scene-links` | editor+ | Standard |
| 74 | GET | `/api/worlds/:worldId/themes/:themeId/scene-links` | viewer+ | Standard |
| 75 | DELETE | `/api/worlds/:worldId/themes/:tId/scene-links/:lId` | editor+ | Standard |
| 76 | POST | `/api/worlds/:worldId/factions` | editor+ | Standard |
| 77 | GET | `/api/worlds/:worldId/factions` | viewer+ | Standard |
| 78 | GET | `/api/worlds/:worldId/factions/:factionId` | viewer+ | Standard |
| 79 | PATCH | `/api/worlds/:worldId/factions/:factionId` | editor+ | Standard |
| 80 | DELETE | `/api/worlds/:worldId/factions/:factionId` | editor+ | Standard |
| 81 | POST | `/api/worlds/:worldId/factions/:factionId/allegiances` | editor+ | Standard |
| 82 | GET | `/api/worlds/:worldId/factions/:factionId/allegiances` | viewer+ | Standard |
| 83 | DELETE | `/api/worlds/:worldId/factions/:fId/allegiances/:aId` | editor+ | Standard |
| 84 | POST | `/api/worlds/:worldId/factions/:factionId/members` | editor+ | Standard |
| 85 | GET | `/api/worlds/:worldId/factions/:factionId/members` | viewer+ | Standard |
| 86 | DELETE | `/api/worlds/:worldId/factions/:fId/members/:mId` | editor+ | Standard |
| 87 | POST | `/api/worlds/:worldId/factions/:factionId/power-levels` | editor+ | Standard |
| 88 | GET | `/api/worlds/:worldId/factions/:factionId/power-levels` | viewer+ | Standard |
| 89 | POST | `/api/worlds/:worldId/sources` | editor+ | Upload |
| 90 | GET | `/api/worlds/:worldId/sources` | viewer+ | Standard |
| 91 | GET | `/api/worlds/:worldId/sources/:sourceId` | viewer+ | Standard |
| 92 | DELETE | `/api/worlds/:worldId/sources/:sourceId` | editor+ | Standard |
| 93 | GET | `/api/worlds/:worldId/sources/:sourceId/annotations` | viewer+ | Standard |
| 94 | POST | `/api/worlds/:worldId/ingestion/trigger` | editor+ | AI |
| 95 | GET | `/api/worlds/:worldId/ingestion/:jobId` | viewer+ | Standard |
| 96 | GET | `/api/worlds/:worldId/ingestion/:jobId/entities` | editor+ | Standard |
| 97 | POST | `/api/worlds/:worldId/ingestion/:jId/entities/:eId/confirm` | editor+ | Standard |
| 98 | POST | `/api/worlds/:worldId/ingestion/:jId/entities/:eId/reject` | editor+ | Standard |
| 99 | POST | `/api/worlds/:worldId/ingestion/:jobId/entities/batch` | editor+ | Standard |
| 100 | POST | `/api/worlds/:worldId/search` | viewer+ | Standard |
| 101 | POST | `/api/worlds/:worldId/search/semantic` | viewer+ | AI |
| 102 | POST | `/api/worlds/:worldId/analysis/consistency` | editor+ | AI |
| 103 | GET | `/api/worlds/:worldId/analysis/:analysisId` | viewer+ | Standard |
| 104 | GET | `/api/worlds/:worldId/analysis/contradictions` | viewer+ | Standard |
| 105 | PATCH | `/api/worlds/:worldId/analysis/contradictions/:id` | editor+ | Standard |
| 106 | POST | `/api/worlds/:worldId/analysis/pacing` | editor+ | AI |
| 107 | GET | `/api/worlds/:worldId/analysis/pacing/:analysisId` | viewer+ | Standard |
| 108 | POST | `/api/worlds/:worldId/analysis/voice` | editor+ | AI |
| 109 | GET | `/api/worlds/:worldId/analysis/voice/:analysisId` | viewer+ | Standard |
| 110 | POST | `/api/worlds/:worldId/canon/snapshots` | editor+ | Standard |
| 111 | GET | `/api/worlds/:worldId/canon/snapshots` | viewer+ | Standard |
| 112 | GET | `/api/worlds/:worldId/canon/snapshots/:snapshotId` | viewer+ | Standard |
| 113 | GET | `/api/worlds/:worldId/canon/diff` | viewer+ | Standard |
| 114 | POST | `/api/worlds/:worldId/canon/snapshots/:sId/restore` | owner | Standard |
| 115 | POST | `/api/worlds/:worldId/what-if/branches` | editor+ | Standard |
| 116 | GET | `/api/worlds/:worldId/what-if/branches` | viewer+ | Standard |
| 117 | GET | `/api/worlds/:worldId/what-if/branches/:branchId` | viewer+ | Standard |
| 118 | POST | `/api/worlds/:worldId/what-if/branches/:bId/simulate` | editor+ | AI |
| 119 | GET | `/api/worlds/:worldId/what-if/branches/:bId/simulations/:sId` | viewer+ | Standard |
| 120 | GET | `/api/worlds/:worldId/what-if/compare` | viewer+ | Standard |
| 121 | POST | `/api/worlds/:worldId/what-if/branches/:branchId/merge` | owner | Standard |
| 122 | DELETE | `/api/worlds/:worldId/what-if/branches/:branchId` | editor+ | Standard |
| 123 | POST | `/api/worlds/:worldId/manuscripts` | editor+ | Standard |
| 124 | GET | `/api/worlds/:worldId/manuscripts` | viewer+ | Standard |
| 125 | GET | `/api/worlds/:worldId/manuscripts/:manuscriptId` | viewer+ | Standard |
| 126 | PATCH | `/api/worlds/:worldId/manuscripts/:manuscriptId` | editor+ | Standard |
| 127 | DELETE | `/api/worlds/:worldId/manuscripts/:manuscriptId` | editor+ | Standard |
| 128 | POST | `/api/worlds/:worldId/manuscripts/:mId/sections` | editor+ | Standard |
| 129 | GET | `/api/worlds/:worldId/manuscripts/:mId/sections` | viewer+ | Standard |
| 130 | PATCH | `/api/worlds/:worldId/manuscripts/:mId/sections/:sId` | editor+ | Standard |
| 131 | DELETE | `/api/worlds/:worldId/manuscripts/:mId/sections/:sId` | editor+ | Standard |
| 132 | PUT | `/api/worlds/:worldId/manuscripts/:mId/sections/reorder` | editor+ | Standard |
| 133 | POST | `/api/worlds/:worldId/manuscripts/:mId/generate-treatment` | editor+ | AI |
| 134 | GET | `/api/structure-templates` | Required | Standard |
| 135 | GET | `/api/structure-templates/:templateId` | Required | Standard |
| 136 | POST | `/api/worlds/:worldId/structure-mappings` | editor+ | Standard |
| 137 | GET | `/api/worlds/:worldId/structure-mappings` | viewer+ | Standard |
| 138 | GET | `/api/worlds/:worldId/structure-mappings/:mappingId` | viewer+ | Standard |
| 139 | PATCH | `/api/worlds/:worldId/structure-mappings/:mappingId` | editor+ | Standard |
| 140 | DELETE | `/api/worlds/:worldId/structure-mappings/:mappingId` | editor+ | Standard |
| 141 | POST | `/api/worlds/:worldId/ai/generate-beat` | editor+ | AI |
| 142 | POST | `/api/worlds/:worldId/ai/generate-script` | editor+ | AI |
| 143 | POST | `/api/worlds/:worldId/ai/expand-synopsis` | editor+ | AI |
| 144 | POST | `/api/worlds/:worldId/export/series-bible` | viewer+ | Export |
| 145 | POST | `/api/worlds/:worldId/export/pitch-deck` | viewer+ | Export |
| 146 | POST | `/api/worlds/:worldId/export/fountain` | viewer+ | Export |
| 147 | POST | `/api/worlds/:worldId/export/fdx` | viewer+ | Export |
| 148 | GET | `/api/worlds/:worldId/export/:exportId` | viewer+ | Standard |
| 149 | POST | `/api/worlds/:worldId/comments` | viewer+ | Standard |
| 150 | GET | `/api/worlds/:worldId/comments` | viewer+ | Standard |
| 151 | PATCH | `/api/worlds/:worldId/comments/:commentId` | author/editor+ | Standard |
| 152 | DELETE | `/api/worlds/:worldId/comments/:commentId` | author/editor+ | Standard |
| 153 | POST | `/api/worlds/:worldId/annotations` | editor+ | Standard |
| 154 | GET | `/api/worlds/:worldId/annotations` | viewer+ | Standard |
| 155 | PATCH | `/api/worlds/:worldId/annotations/:annotationId` | author/editor+ | Standard |
| 156 | DELETE | `/api/worlds/:worldId/annotations/:annotationId` | author/editor+ | Standard |
