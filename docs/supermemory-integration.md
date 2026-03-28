# StoryForge SuperMemory Integration Architecture

> **Version**: 1.0.0-draft
> **Last Updated**: 2026-03-28
> **Purpose**: Comprehensive architecture for integrating SuperMemory as the semantic intelligence layer alongside PostgreSQL as the relational source of truth.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Container Strategy](#2-container-strategy)
3. [Data Ownership: PostgreSQL vs SuperMemory](#3-data-ownership-postgresql-vs-supermemory)
4. [Sync Pipeline](#4-sync-pipeline)
5. [Creative Intent Search](#5-creative-intent-search)
6. [Consistency & Contradiction Checking](#6-consistency--contradiction-checking)
7. [AI Wand Context Assembly](#7-ai-wand-context-assembly)
8. [Ingestion Flow](#8-ingestion-flow)
9. [Performance & Cost Considerations](#9-performance--cost-considerations)
10. [Error Handling & Resilience](#10-error-handling--resilience)

---

## 1. Architecture Overview

StoryForge uses a **dual-storage architecture**:

```
+-----------------------------------------------------------+
|                     StoryForge App                         |
|                                                            |
|  +------------------+          +------------------------+  |
|  |  PostgreSQL       |          |  SuperMemory           |  |
|  |  (Prisma ORM)     |          |  (supermemory SDK)     |  |
|  |                   |          |                        |  |
|  |  - Source of truth |         |  - Semantic search     |  |
|  |  - Relational data |         |  - Contradiction detect|  |
|  |  - ACID txns       |         |  - Knowledge graph     |  |
|  |  - Auth & access   |         |  - Embeddings          |  |
|  |  - Full-text search|         |  - File ingestion      |  |
|  |  - Audit trail     |         |  - Creative intent     |  |
|  +--------+----------+          +----------+-------------+  |
|           |                                |                |
|           +---------- Sync Layer ----------+                |
|                    (Event-Driven)                           |
+-----------------------------------------------------------+
```

**Guiding principle**: PostgreSQL owns all data. SuperMemory is a derived semantic index. If SuperMemory were wiped entirely, a full rebuild from PostgreSQL would restore it. SuperMemory never holds data that does not exist in or derive from PostgreSQL.

---

## 2. Container Strategy

### One Container Per StoryWorld

Every `StoryWorld` in StoryForge gets its own isolated SuperMemory container via the `containerTag` parameter. This provides hard isolation between worlds so that:

- Semantic searches never leak across worlds
- Contradiction detection is scoped to a single narrative universe
- Deleting a world can cleanly purge its SuperMemory container
- Different worlds can have different knowledge graph topologies without interference

### Naming Convention

```
storyforge_world_{worldId}
```

Where `worldId` is the CUID from PostgreSQL (e.g., `storyforge_world_cm1a2b3c4d5e6f7g8h9i`).

### TypeScript Implementation

```typescript
// src/lib/memory/client.ts

import { SuperMemory } from 'supermemory';

// Singleton SuperMemory client
let client: SuperMemory | null = null;

export function getSuperMemoryClient(): SuperMemory {
  if (!client) {
    client = new SuperMemory({
      apiKey: process.env.SUPERMEMORY_API_KEY!,
    });
  }
  return client;
}

/**
 * Build the containerTag for a given StoryWorld.
 * This is the ONLY function that should produce container tags.
 * All SuperMemory calls must use this to scope operations.
 */
export function worldContainerTag(worldId: string): string {
  return `storyforge_world_${worldId}`;
}
```

```typescript
// src/lib/memory/containers.ts

import { getSuperMemoryClient, worldContainerTag } from './client';

/**
 * Initialize a SuperMemory container for a newly created StoryWorld.
 * Called once during world creation. Seeds the container with the
 * world's synopsis and metadata as the foundational memory.
 */
export async function initializeWorldContainer(
  worldId: string,
  worldName: string,
  synopsis: string,
): Promise<void> {
  const sm = getSuperMemoryClient();
  const containerTag = worldContainerTag(worldId);

  // Seed with world-level context
  await sm.add({
    content: [
      `Story World: ${worldName}`,
      `Synopsis: ${synopsis}`,
      `This is the foundational context for the story world "${worldName}".`,
    ].join('\n'),
    containerTag,
    metadata: {
      entityType: 'storyworld',
      entityId: worldId,
      category: 'foundation',
    },
  });
}

/**
 * Purge all SuperMemory data for a deleted StoryWorld.
 * Called during world hard-delete (not soft-delete).
 */
export async function destroyWorldContainer(worldId: string): Promise<void> {
  const sm = getSuperMemoryClient();
  const containerTag = worldContainerTag(worldId);

  // Delete all memories in this container
  const allMemories = await sm.search({
    query: '*',
    containerTag,
    limit: 1000,
  });

  for (const memory of allMemories.results) {
    await sm.delete(memory.id);
  }
}
```

### Container Lifecycle

| World Event | SuperMemory Action |
|---|---|
| `StoryWorld` created | `initializeWorldContainer()` — seed with synopsis |
| `StoryWorld` soft-deleted | No action (container preserved for undo) |
| `StoryWorld` hard-deleted | `destroyWorldContainer()` — purge all memories |
| `StoryWorld` restored from soft-delete | No action (container was never touched) |
| `StoryWorld` cloned/forked | New container created with copied memories |

---

## 3. Data Ownership: PostgreSQL vs SuperMemory

### The Rule

> **PostgreSQL is the source of truth. SuperMemory is the semantic layer.**

If there is ever a conflict between what PG says and what SM says, PG wins. SM is a projection optimized for semantic queries, not a primary data store.

### What Lives Where

| Data | PostgreSQL (Source of Truth) | SuperMemory (Semantic Layer) |
|---|---|---|
| **Character profiles** | Full record: name, aliases, backstory, traits, goals, 100+ attributes, relationships, metadata | Semantic document: name, description, backstory, key traits, goals — optimized for search and context retrieval |
| **Events** | Full record: type, fabula/sjuzhet position, participants, location, significance, value changes | Semantic document: description, participants, emotional tone, causal context |
| **Scenes** | Full record: title, goal/conflict/outcome, beats, characters, location, ordering | Semantic document: description, value changes, emotional arc summary, thematic content |
| **Locations** | Full record: name, description, coordinates, type, properties, history | Semantic document: name, description, atmosphere, significance to story |
| **Relationships** | Full record: source, target, type, intensity, temporal scope, metadata | Semantic document: relationship description with temporal context, emotional dynamics |
| **Themes / Motifs** | Full record: name, description, opposition pairs, linked entities | Semantic document: thematic statement, how it manifests, linked motifs |
| **Source materials** | Full record: file reference, parsed text, sections, time-codes, processing status | Semantic documents: chunked content with time-code metadata for retrieval |
| **Factions** | Full record: name, type, hierarchy, power level, members, resources | Semantic document: description, allegiances, power dynamics summary |
| **World rules** | Full record: name, scope, description, exceptions, enforcement level | Semantic document: rule statement with scope context (for contradiction detection) |
| **Beats** | Full record: title, description, type, ordering, scene link, ratings | Semantic document: description with scene context |
| **Arcs** | Full record: name, type, phases, linked entities, start/end | Semantic document: arc description, trajectory summary |
| **User auth / roles** | Full record | Never stored in SM |
| **File blobs** | S3 / filesystem | SM may receive files for its own extraction pipeline |
| **Audit logs** | Full record | Never stored in SM |
| **UI state / preferences** | Full record | Never stored in SM |

### What SuperMemory Adds That PG Cannot

| Capability | Why PG Cannot Do This | How SM Does It |
|---|---|---|
| **Semantic search** | `tsvector` is keyword-based; `pgvector` requires manual embedding management | Built-in embeddings with semantic understanding |
| **Contradiction detection** | Would require custom NLP pipeline on every entity pair | Native knowledge graph with automatic contradiction flagging |
| **Creative intent queries** | "scenes where tension builds" has no keyword match | Understands narrative concepts semantically |
| **Cross-entity reasoning** | Requires complex multi-join queries with NLP | Knowledge graph traversal with typed edges |
| **Automatic fact extraction** | Would require Claude API calls on every query | Extracts and indexes facts from stored content |

---

## 4. Sync Pipeline

### Architecture: Event-Driven Sync

Entity changes in PostgreSQL trigger asynchronous sync jobs to SuperMemory via BullMQ. This keeps SM eventually consistent without blocking the main request path.

```
  API Route           Prisma              BullMQ              SuperMemory
     |                  |                   |                      |
     |-- create/update ->|                   |                      |
     |                  |-- write to PG ---->|                      |
     |                  |-- enqueue job ---->|                      |
     |<-- 200 OK -------|                   |                      |
     |                  |                   |-- process job ------->|
     |                  |                   |   (add/update memory) |
     |                  |                   |<----- ack ------------|
```

### Sync Job Types

```typescript
// src/lib/memory/sync-types.ts

export type SyncAction = 'upsert' | 'delete';

export interface MemorySyncJob {
  action: SyncAction;
  worldId: string;
  entityType: EntityType;
  entityId: string;
  /** ISO timestamp of the PG update that triggered this sync */
  pgUpdatedAt: string;
  /** For upserts: the content to sync. For deletes: omitted. */
  payload?: MemoryPayload;
}

export type EntityType =
  | 'character'
  | 'event'
  | 'scene'
  | 'beat'
  | 'location'
  | 'relationship'
  | 'theme'
  | 'motif'
  | 'faction'
  | 'arc'
  | 'storyobject'
  | 'worldrule'
  | 'sourcematerial';

export interface MemoryPayload {
  content: string;
  metadata: Record<string, string | string[] | number | boolean>;
}
```

### Content Serializers

Each entity type has a serializer that converts its PG record into the optimal text representation for SuperMemory's semantic understanding.

```typescript
// src/lib/memory/serializers.ts

import type { Character, Event, Scene, Location, Relationship } from '@prisma/client';

/**
 * Serialize a Character into a SuperMemory document.
 * Includes all semantically relevant fields for search and contradiction detection.
 */
export function serializeCharacter(char: Character & {
  relationships?: Relationship[];
  factions?: { name: string }[];
}): MemoryPayload {
  const lines: string[] = [
    `Character: ${char.name}`,
  ];

  if (char.aliases?.length) {
    lines.push(`Also known as: ${(char.aliases as string[]).join(', ')}`);
  }
  if (char.role) {
    lines.push(`Role: ${char.role}`);
  }
  if (char.description) {
    lines.push(`Description: ${char.description}`);
  }
  if (char.backstory) {
    lines.push(`Backstory: ${char.backstory}`);
  }

  const traits = char.traits as Record<string, string> | null;
  if (traits && Object.keys(traits).length > 0) {
    lines.push(`Traits: ${Object.entries(traits).map(([k, v]) => `${k}: ${v}`).join('; ')}`);
  }

  const goals = char.goals as string[] | null;
  if (goals?.length) {
    lines.push(`Goals: ${goals.join('; ')}`);
  }

  if (char.factions?.length) {
    lines.push(`Factions: ${char.factions.map(f => f.name).join(', ')}`);
  }

  return {
    content: lines.join('\n'),
    metadata: {
      entityType: 'character',
      entityId: char.id,
      name: char.name,
      role: char.role ?? '',
      status: char.status ?? 'alive',
    },
  };
}

/**
 * Serialize an Event for SuperMemory.
 * Includes temporal positioning and causal context.
 */
export function serializeEvent(event: Event & {
  participants?: { name: string; id: string }[];
  location?: { name: string } | null;
  causalParents?: { name: string }[];
}): MemoryPayload {
  const lines: string[] = [
    `Event: ${event.name}`,
    `Type: ${event.type}`,
  ];

  if (event.description) {
    lines.push(`Description: ${event.description}`);
  }
  if (event.significance) {
    lines.push(`Significance: ${event.significance}`);
  }
  if (event.location) {
    lines.push(`Location: ${event.location.name}`);
  }
  if (event.participants?.length) {
    lines.push(`Participants: ${event.participants.map(p => p.name).join(', ')}`);
  }
  if (event.fabulaDate) {
    lines.push(`Chronological date: ${event.fabulaDate}`);
  }
  if (event.causalParents?.length) {
    lines.push(`Caused by: ${event.causalParents.map(e => e.name).join(', ')}`);
  }

  return {
    content: lines.join('\n'),
    metadata: {
      entityType: 'event',
      entityId: event.id,
      eventType: event.type,
      fabulaPosition: event.fabulaPosition ?? 0,
      locationId: event.locationId ?? '',
      participantIds: event.participants?.map(p => p.id) ?? [],
    },
  };
}

/**
 * Serialize a Scene for SuperMemory.
 * Captures the scene's narrative function: goal, conflict, outcome, and value change.
 */
export function serializeScene(scene: Scene & {
  characters?: { name: string; id: string }[];
  location?: { name: string } | null;
  beats?: { title: string; description: string }[];
  valueChanges?: { valueName: string; direction: string }[];
}): MemoryPayload {
  const lines: string[] = [
    `Scene: ${scene.title}`,
  ];

  if (scene.description) {
    lines.push(`Description: ${scene.description}`);
  }
  if (scene.goal) {
    lines.push(`Goal: ${scene.goal}`);
  }
  if (scene.conflict) {
    lines.push(`Conflict: ${scene.conflict}`);
  }
  if (scene.outcome) {
    lines.push(`Outcome: ${scene.outcome}`);
  }
  if (scene.location) {
    lines.push(`Location: ${scene.location.name}`);
  }
  if (scene.characters?.length) {
    lines.push(`Characters: ${scene.characters.map(c => c.name).join(', ')}`);
  }
  if (scene.valueChanges?.length) {
    lines.push(`Value changes: ${scene.valueChanges.map(v => `${v.valueName} ${v.direction}`).join(', ')}`);
  }
  if (scene.beats?.length) {
    lines.push(`Beats:\n${scene.beats.map(b => `  - ${b.title}: ${b.description}`).join('\n')}`);
  }

  return {
    content: lines.join('\n'),
    metadata: {
      entityType: 'scene',
      entityId: scene.id,
      status: scene.status ?? '',
      locationId: scene.locationId ?? '',
      characterIds: scene.characters?.map(c => c.id) ?? [],
    },
  };
}

/**
 * Serialize a Location for SuperMemory.
 */
export function serializeLocation(loc: Location): MemoryPayload {
  const lines: string[] = [
    `Location: ${loc.name}`,
  ];

  if (loc.type) lines.push(`Type: ${loc.type}`);
  if (loc.description) lines.push(`Description: ${loc.description}`);
  if (loc.history) lines.push(`History: ${loc.history}`);
  if (loc.significance) lines.push(`Significance: ${loc.significance}`);
  if (loc.atmosphere) lines.push(`Atmosphere: ${loc.atmosphere}`);

  return {
    content: lines.join('\n'),
    metadata: {
      entityType: 'location',
      entityId: loc.id,
      locationType: loc.type ?? '',
      parentLocationId: loc.parentLocationId ?? '',
    },
  };
}

/**
 * Serialize a Relationship for SuperMemory.
 * Critical for contradiction detection — temporal scope is key.
 */
export function serializeRelationship(rel: Relationship & {
  source: { name: string };
  target: { name: string };
  validFromEvent?: { name: string; fabulaPosition: number | null } | null;
  validToEvent?: { name: string; fabulaPosition: number | null } | null;
}): MemoryPayload {
  const lines: string[] = [
    `Relationship: ${rel.source.name} → ${rel.target.name}`,
    `Type: ${rel.type}`,
  ];

  if (rel.description) lines.push(`Description: ${rel.description}`);
  if (rel.intensity) lines.push(`Intensity: ${rel.intensity}/10`);
  if (rel.validFromEvent) {
    lines.push(`Valid from: ${rel.validFromEvent.name}`);
  }
  if (rel.validToEvent) {
    lines.push(`Valid until: ${rel.validToEvent.name}`);
  }

  return {
    content: lines.join('\n'),
    metadata: {
      entityType: 'relationship',
      entityId: rel.id,
      relationshipType: rel.type,
      sourceEntityId: rel.sourceEntityId,
      targetEntityId: rel.targetEntityId,
      fromFabulaPosition: rel.validFromEvent?.fabulaPosition ?? 0,
      toFabulaPosition: rel.validToEvent?.fabulaPosition ?? -1,
    },
  };
}

/**
 * Serialize a WorldRule for SuperMemory.
 * World rules are critical for contradiction detection.
 */
export function serializeWorldRule(rule: {
  id: string;
  name: string;
  scope: string;
  description: string;
  exceptions: string[];
  enforcementLevel: string;
}): MemoryPayload {
  const lines: string[] = [
    `World Rule: ${rule.name}`,
    `Scope: ${rule.scope}`,
    `Rule: ${rule.description}`,
    `Enforcement: ${rule.enforcementLevel}`,
  ];

  if (rule.exceptions.length) {
    lines.push(`Exceptions: ${rule.exceptions.join('; ')}`);
  }

  return {
    content: lines.join('\n'),
    metadata: {
      entityType: 'worldrule',
      entityId: rule.id,
      scope: rule.scope,
      enforcementLevel: rule.enforcementLevel,
    },
  };
}
```

### BullMQ Job Processor

```typescript
// src/lib/memory/sync-worker.ts

import { Worker, Job } from 'bullmq';
import { getSuperMemoryClient, worldContainerTag } from './client';
import type { MemorySyncJob } from './sync-types';
import { logger } from '../utils/logger';

const QUEUE_NAME = 'supermemory-sync';

/**
 * BullMQ worker that processes SuperMemory sync jobs.
 * Runs as a background worker process alongside the main app.
 */
export function createSyncWorker(redisConnection: { host: string; port: number }) {
  const worker = new Worker<MemorySyncJob>(
    QUEUE_NAME,
    async (job: Job<MemorySyncJob>) => {
      const { action, worldId, entityType, entityId, payload } = job.data;
      const sm = getSuperMemoryClient();
      const containerTag = worldContainerTag(worldId);

      // Deterministic memory ID: ensures upsert semantics
      const memoryId = `${entityType}_${entityId}`;

      if (action === 'upsert' && payload) {
        await sm.add({
          id: memoryId,
          content: payload.content,
          containerTag,
          metadata: {
            ...payload.metadata,
            worldId,
            pgSyncedAt: new Date().toISOString(),
          },
        });

        logger.info('SuperMemory upsert', {
          worldId,
          entityType,
          entityId,
          memoryId,
        });
      } else if (action === 'delete') {
        try {
          await sm.delete(memoryId);
          logger.info('SuperMemory delete', { worldId, entityType, entityId });
        } catch (err: unknown) {
          // Tolerate "not found" on delete — idempotent
          if (err instanceof Error && err.message.includes('not found')) {
            logger.warn('SuperMemory delete: memory not found (already deleted)', {
              memoryId,
            });
          } else {
            throw err;
          }
        }
      }
    },
    {
      connection: redisConnection,
      concurrency: 10,
      limiter: {
        max: 50,
        duration: 1000, // 50 ops/sec to avoid rate limits
      },
    },
  );

  worker.on('failed', (job, err) => {
    logger.error('SuperMemory sync job failed', {
      jobId: job?.id,
      data: job?.data,
      error: err.message,
      stack: err.stack,
    });
  });

  worker.on('completed', (job) => {
    logger.debug('SuperMemory sync job completed', { jobId: job.id });
  });

  return worker;
}
```

### Enqueueing Sync Jobs from API Routes

```typescript
// src/lib/memory/sync-enqueue.ts

import { Queue } from 'bullmq';
import type { MemorySyncJob, EntityType, MemoryPayload } from './sync-types';

const QUEUE_NAME = 'supermemory-sync';

let syncQueue: Queue<MemorySyncJob> | null = null;

function getQueue(): Queue<MemorySyncJob> {
  if (!syncQueue) {
    syncQueue = new Queue<MemorySyncJob>(QUEUE_NAME, {
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379'),
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });
  }
  return syncQueue;
}

/**
 * Enqueue an entity upsert to SuperMemory.
 * Call this after any Prisma create/update that should be reflected in SM.
 */
export async function enqueueSyncUpsert(
  worldId: string,
  entityType: EntityType,
  entityId: string,
  payload: MemoryPayload,
): Promise<void> {
  await getQueue().add(
    `sync-${entityType}-${entityId}`,
    {
      action: 'upsert',
      worldId,
      entityType,
      entityId,
      pgUpdatedAt: new Date().toISOString(),
      payload,
    },
    {
      // Deduplicate rapid updates: only keep the latest
      jobId: `upsert-${entityType}-${entityId}`,
    },
  );
}

/**
 * Enqueue an entity deletion from SuperMemory.
 * Call this on soft-delete or hard-delete.
 */
export async function enqueueSyncDelete(
  worldId: string,
  entityType: EntityType,
  entityId: string,
): Promise<void> {
  await getQueue().add(
    `delete-${entityType}-${entityId}`,
    {
      action: 'delete',
      worldId,
      entityType,
      entityId,
      pgUpdatedAt: new Date().toISOString(),
    },
  );
}
```

### Integration with API Routes

```typescript
// src/app/api/worlds/[worldId]/characters/route.ts (excerpt)

import { db } from '@/lib/db/client';
import { serializeCharacter } from '@/lib/memory/serializers';
import { enqueueSyncUpsert } from '@/lib/memory/sync-enqueue';

export async function POST(req: Request, { params }: { params: { worldId: string } }) {
  const { worldId } = params;
  const body = await req.json();

  // 1. Create in PostgreSQL (source of truth)
  const character = await db.character.create({
    data: {
      storyWorldId: worldId,
      name: body.name,
      aliases: body.aliases ?? [],
      role: body.role,
      description: body.description,
      backstory: body.backstory,
      traits: body.traits ?? {},
      goals: body.goals ?? [],
    },
    include: {
      factions: { select: { name: true } },
    },
  });

  // 2. Enqueue async sync to SuperMemory (non-blocking)
  const payload = serializeCharacter(character);
  await enqueueSyncUpsert(worldId, 'character', character.id, payload);

  return Response.json({ character }, { status: 201 });
}

export async function PATCH(req: Request, { params }: { params: { worldId: string; characterId: string } }) {
  const { worldId, characterId } = params;
  const body = await req.json();

  // 1. Update in PostgreSQL
  const character = await db.character.update({
    where: { id: characterId, storyWorldId: worldId },
    data: body,
    include: {
      factions: { select: { name: true } },
    },
  });

  // 2. Enqueue sync — same upsert, SM will overwrite
  const payload = serializeCharacter(character);
  await enqueueSyncUpsert(worldId, 'character', character.id, payload);

  return Response.json({ character });
}
```

### Prisma Middleware Alternative (Automatic Sync)

For teams that prefer automatic sync over explicit enqueue calls, a Prisma middleware can intercept all writes:

```typescript
// src/lib/db/supermemory-middleware.ts

import { Prisma } from '@prisma/client';
import { enqueueSyncUpsert, enqueueSyncDelete } from '../memory/sync-enqueue';
import { getSerializerForModel } from '../memory/serializers';
import type { EntityType } from '../memory/sync-types';

/**
 * Models that should be synced to SuperMemory.
 * Maps Prisma model name → SuperMemory entityType.
 */
const SYNCED_MODELS: Record<string, EntityType> = {
  Character: 'character',
  Event: 'event',
  Scene: 'scene',
  Beat: 'beat',
  Location: 'location',
  Relationship: 'relationship',
  Theme: 'theme',
  Motif: 'motif',
  Faction: 'faction',
  Arc: 'arc',
  StoryObject: 'storyobject',
  WorldRule: 'worldrule',
  SourceMaterial: 'sourcematerial',
};

export const superMemorySyncMiddleware: Prisma.Middleware = async (params, next) => {
  const result = await next(params);

  // Only process models we care about
  const entityType = params.model ? SYNCED_MODELS[params.model] : undefined;
  if (!entityType || !result) return result;

  // Skip read operations
  if (['findUnique', 'findFirst', 'findMany', 'count', 'aggregate'].includes(params.action)) {
    return result;
  }

  // Handle soft-deletes (update where deletedAt is set)
  if (params.action === 'update' && params.args?.data?.deletedAt) {
    const worldId = result.storyWorldId;
    if (worldId) {
      await enqueueSyncDelete(worldId, entityType, result.id).catch(() => {});
    }
    return result;
  }

  // Handle creates and updates
  if (['create', 'update', 'upsert'].includes(params.action)) {
    const worldId = result.storyWorldId;
    if (worldId) {
      const serializer = getSerializerForModel(params.model!);
      if (serializer) {
        const payload = serializer(result);
        await enqueueSyncUpsert(worldId, entityType, result.id, payload).catch(() => {});
      }
    }
  }

  // Handle hard deletes
  if (params.action === 'delete') {
    const worldId = result.storyWorldId;
    if (worldId) {
      await enqueueSyncDelete(worldId, entityType, result.id).catch(() => {});
    }
  }

  return result;
};
```

### Full Rebuild

When SM needs to be rebuilt from scratch (data corruption, schema migration, or first-time deployment):

```typescript
// src/lib/memory/rebuild.ts

import { db } from '../db/client';
import { getSuperMemoryClient, worldContainerTag } from './client';
import { serializeCharacter, serializeEvent, serializeScene, serializeLocation } from './serializers';
import { logger } from '../utils/logger';

/**
 * Full rebuild of SuperMemory for a single world.
 * Iterates every entity in PG and upserts to SM.
 *
 * Use with caution: this can be expensive for large worlds.
 * Designed to be run as a background job via BullMQ.
 */
export async function rebuildWorldMemory(worldId: string): Promise<{
  entitiesSynced: number;
  durationMs: number;
}> {
  const start = Date.now();
  const sm = getSuperMemoryClient();
  const containerTag = worldContainerTag(worldId);
  let synced = 0;

  // Characters
  const characters = await db.character.findMany({
    where: { storyWorldId: worldId, deletedAt: null },
    include: { factions: { select: { name: true } } },
  });
  for (const char of characters) {
    const { content, metadata } = serializeCharacter(char);
    await sm.add({
      id: `character_${char.id}`,
      content,
      containerTag,
      metadata: { ...metadata, worldId },
    });
    synced++;
  }

  // Events
  const events = await db.event.findMany({
    where: { storyWorldId: worldId, deletedAt: null },
    include: {
      participants: { select: { character: { select: { name: true, id: true } } } },
      location: { select: { name: true } },
    },
  });
  for (const event of events) {
    const mapped = {
      ...event,
      participants: event.participants.map((p: { character: { name: string; id: string } }) => p.character),
    };
    const { content, metadata } = serializeEvent(mapped);
    await sm.add({
      id: `event_${event.id}`,
      content,
      containerTag,
      metadata: { ...metadata, worldId },
    });
    synced++;
  }

  // Scenes
  const scenes = await db.scene.findMany({
    where: { storyWorldId: worldId, deletedAt: null },
    include: {
      characters: { select: { character: { select: { name: true, id: true } } } },
      location: { select: { name: true } },
      beats: { select: { title: true, description: true } },
      valueChanges: { select: { valueName: true, direction: true } },
    },
  });
  for (const scene of scenes) {
    const mapped = {
      ...scene,
      characters: scene.characters.map((sc: { character: { name: string; id: string } }) => sc.character),
    };
    const { content, metadata } = serializeScene(mapped);
    await sm.add({
      id: `scene_${scene.id}`,
      content,
      containerTag,
      metadata: { ...metadata, worldId },
    });
    synced++;
  }

  // Locations
  const locations = await db.location.findMany({
    where: { storyWorldId: worldId, deletedAt: null },
  });
  for (const loc of locations) {
    const { content, metadata } = serializeLocation(loc);
    await sm.add({
      id: `location_${loc.id}`,
      content,
      containerTag,
      metadata: { ...metadata, worldId },
    });
    synced++;
  }

  // ... repeat for remaining entity types ...

  const durationMs = Date.now() - start;
  logger.info('World memory rebuild complete', { worldId, synced, durationMs });

  return { entitiesSynced: synced, durationMs };
}
```

---

## 5. Creative Intent Search

### The Problem

Traditional keyword search fails for narrative queries. A writer asking "scenes where tension builds between the protagonist and mentor" cannot be answered by `tsvector` or even basic embedding similarity on isolated records. This requires understanding narrative concepts like "tension," "builds," and character relationship dynamics.

### How SuperMemory Solves This

SuperMemory's semantic search understands the intent behind queries. When documents are stored with rich narrative context (goal, conflict, outcome, emotional tone, value changes), SM can match conceptual queries against that semantic content.

### Search API Route Implementation

```typescript
// src/app/api/worlds/[worldId]/search/semantic/route.ts

import { getSuperMemoryClient, worldContainerTag } from '@/lib/memory/client';
import { db } from '@/lib/db/client';

interface SemanticSearchRequest {
  query: string;
  entityTypes?: string[];
  limit?: number;
  filters?: {
    characterIds?: string[];
    locationIds?: string[];
    arcIds?: string[];
    sceneStatus?: string;
  };
}

interface SemanticSearchResult {
  entityId: string;
  entityType: string;
  name: string;
  excerpt: string;
  relevanceScore: number;
  explanation: string;
  sourceReference?: {
    sourceId: string;
    timeCode?: string;
    chapterSection?: string;
  };
}

export async function POST(
  req: Request,
  { params }: { params: { worldId: string } },
) {
  const { worldId } = params;
  const body: SemanticSearchRequest = await req.json();

  if (!body.query || body.query.length < 1 || body.query.length > 500) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Query must be 1-500 characters' } },
      { status: 400 },
    );
  }

  const sm = getSuperMemoryClient();
  const containerTag = worldContainerTag(worldId);
  const limit = Math.min(body.limit ?? 25, 50);

  // Build metadata filters for scoping
  const metadataFilters: Record<string, unknown> = {};
  if (body.entityTypes?.length) {
    metadataFilters.entityType = body.entityTypes;
  }
  if (body.filters?.characterIds?.length) {
    metadataFilters.characterIds = body.filters.characterIds;
  }

  // Execute semantic search against SuperMemory
  const smResults = await sm.search({
    query: body.query,
    containerTag,
    limit,
    filters: Object.keys(metadataFilters).length > 0 ? metadataFilters : undefined,
  });

  // Hydrate results with PG data for full entity details
  const results: SemanticSearchResult[] = [];

  for (const hit of smResults.results) {
    const entityType = hit.metadata?.entityType as string;
    const entityId = hit.metadata?.entityId as string;

    if (!entityType || !entityId) continue;

    // Fetch the canonical name from PG
    const name = await resolveEntityName(entityType, entityId);
    if (!name) continue; // Entity was deleted in PG but not yet removed from SM

    // Build source reference if this came from ingested material
    let sourceReference: SemanticSearchResult['sourceReference'];
    if (hit.metadata?.sourceId) {
      sourceReference = {
        sourceId: hit.metadata.sourceId as string,
        timeCode: hit.metadata.timeCode as string | undefined,
        chapterSection: hit.metadata.chapterSection as string | undefined,
      };
    }

    results.push({
      entityId,
      entityType,
      name,
      excerpt: hit.content.substring(0, 300),
      relevanceScore: hit.score ?? 0,
      explanation: hit.metadata?.matchReason as string ?? '',
      sourceReference,
    });
  }

  return Response.json({
    results,
    queryInterpretation: `Semantic search for: "${body.query}"`,
  });
}

async function resolveEntityName(entityType: string, entityId: string): Promise<string | null> {
  const modelMap: Record<string, string> = {
    character: 'character',
    event: 'event',
    scene: 'scene',
    beat: 'beat',
    location: 'location',
    theme: 'theme',
    faction: 'faction',
    arc: 'arc',
  };

  const model = modelMap[entityType];
  if (!model) return null;

  try {
    const record = await (db as Record<string, any>)[model].findUnique({
      where: { id: entityId },
      select: { name: true, title: true, deletedAt: true },
    });

    if (!record || record.deletedAt) return null;
    return record.name ?? record.title ?? entityId;
  } catch {
    return null;
  }
}
```

### Creative Intent Query Examples

| User Query | What SM Matches | Why Keyword Search Fails |
|---|---|---|
| "scenes where tension builds" | Scenes with rising conflict, escalating value changes, antagonist confrontations | No literal "tension builds" in scene descriptions |
| "moments of betrayal" | Events where allies become enemies, relationship type changes, trust-breaking actions | "Betrayal" may never appear as a keyword |
| "quiet character moments" | Scenes with low action density, dialogue-heavy, introspective beats, character-alone scenes | "Quiet" and "moment" are too generic for keyword match |
| "foreshadowing of the climax" | SetupPayoff links, early scenes with symbolic objects, prophetic dialogue | Foreshadowing is implicit, not explicitly labeled |
| "power shifts between factions" | Events where faction power levels change, allegiance shifts, leadership changes | Requires understanding "power shift" as a concept |
| "where does the protagonist lose hope?" | Emotional state entries with hope declining, scenes with negative outcomes for protagonist | "Lose hope" requires emotional arc understanding |

### Time-Coded Results for Media Sources

When source material originates from audio or video, SM search results include time-code metadata enabling direct navigation to the relevant moment:

```typescript
// src/lib/memory/source-search.ts

import { getSuperMemoryClient, worldContainerTag } from './client';

interface TimeCodedResult {
  sourceId: string;
  sourceName: string;
  sourceType: 'audio' | 'video' | 'text';
  content: string;
  relevanceScore: number;
  timeCode?: {
    startMs: number;
    endMs: number;
    /** Formatted for display: "01:23:45" */
    startFormatted: string;
    endFormatted: string;
  };
  textPosition?: {
    chapterIndex: number;
    chapterTitle: string;
    startOffset: number;
    endOffset: number;
  };
}

/**
 * Search source materials semantically, returning time-coded results
 * for audio/video and positional results for text.
 */
export async function searchSourceMaterials(
  worldId: string,
  query: string,
  options?: {
    sourceIds?: string[];
    sourceTypes?: ('audio' | 'video' | 'text')[];
    limit?: number;
  },
): Promise<TimeCodedResult[]> {
  const sm = getSuperMemoryClient();
  const containerTag = worldContainerTag(worldId);

  const filters: Record<string, unknown> = {
    entityType: 'sourcematerial',
  };
  if (options?.sourceIds?.length) {
    filters.sourceId = options.sourceIds;
  }
  if (options?.sourceTypes?.length) {
    filters.sourceType = options.sourceTypes;
  }

  const smResults = await sm.search({
    query,
    containerTag,
    limit: options?.limit ?? 25,
    filters,
  });

  return smResults.results.map((hit) => {
    const result: TimeCodedResult = {
      sourceId: hit.metadata?.sourceId as string,
      sourceName: hit.metadata?.sourceName as string ?? '',
      sourceType: hit.metadata?.sourceType as 'audio' | 'video' | 'text',
      content: hit.content,
      relevanceScore: hit.score ?? 0,
    };

    // Attach time-code for audio/video sources
    if (hit.metadata?.startMs !== undefined) {
      const startMs = hit.metadata.startMs as number;
      const endMs = hit.metadata.endMs as number;
      result.timeCode = {
        startMs,
        endMs,
        startFormatted: formatTimeCode(startMs),
        endFormatted: formatTimeCode(endMs),
      };
    }

    // Attach text position for text sources
    if (hit.metadata?.chapterIndex !== undefined) {
      result.textPosition = {
        chapterIndex: hit.metadata.chapterIndex as number,
        chapterTitle: hit.metadata.chapterTitle as string ?? '',
        startOffset: hit.metadata.startOffset as number,
        endOffset: hit.metadata.endOffset as number,
      };
    }

    return result;
  });
}

function formatTimeCode(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
```

---

## 6. Consistency & Contradiction Checking

### How It Works

SuperMemory's knowledge graph automatically detects contradictions between stored facts. StoryForge leverages this by:

1. Storing all entity facts (character traits, event outcomes, relationship states, world rules) as structured memories in SM
2. Querying SM for contradictions within a world's container
3. Classifying contradictions by severity and type
4. Presenting results in the Consistency Checker dashboard

### Contradiction Categories

| Category | Example | Severity | Detection Method |
|---|---|---|---|
| **Temporal paradox** | Character dies in Scene 5, speaks in Scene 12 | Critical | SM detects "dead" status contradicting "alive" action |
| **Location impossibility** | Character in Paris and Tokyo in the same scene | Critical | SM detects conflicting location assertions |
| **Relationship inconsistency** | "A and B are strangers" in Scene 3, but "A and B had a long friendship" in Scene 1 | High | SM detects conflicting relationship descriptions |
| **Trait contradiction** | "Character is illiterate" but later "reads the ancient scroll fluently" | High | SM detects capability contradiction |
| **World rule violation** | Magic system says "no teleportation" but character teleports | High | SM matches action against stored world rules |
| **Motivational inconsistency** | Character's stated goal contradicts their actions | Medium | SM flags goal-action misalignment |
| **Tonal inconsistency** | Comedic scene in otherwise tragic sequence without tonal transition | Low | SM detects mood/tone shifts |

### Consistency Check Implementation

```typescript
// src/lib/consistency/checker.ts

import { getSuperMemoryClient, worldContainerTag } from '../memory/client';
import { db } from '../db/client';
import { logger } from '../utils/logger';

export interface Contradiction {
  id: string;
  type: 'temporal' | 'location' | 'relationship' | 'trait' | 'rule_violation' | 'motivation' | 'tonal';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  entities: Array<{
    entityId: string;
    entityType: string;
    name: string;
    relevantText: string;
  }>;
  suggestion: string;
  confidence: number;
}

interface ConsistencyCheckOptions {
  scope?: ('timeline' | 'characters' | 'locations' | 'relationships' | 'causality')[];
  characterIds?: string[];
  sceneIds?: string[];
}

/**
 * Run a full consistency check for a StoryWorld.
 * Combines SuperMemory contradiction detection with targeted PG queries.
 */
export async function runConsistencyCheck(
  worldId: string,
  options: ConsistencyCheckOptions = {},
): Promise<Contradiction[]> {
  const sm = getSuperMemoryClient();
  const containerTag = worldContainerTag(worldId);
  const contradictions: Contradiction[] = [];

  const scopes = options.scope ?? ['timeline', 'characters', 'locations', 'relationships', 'causality'];

  // --- Phase 1: Character-level contradictions ---
  if (scopes.includes('characters')) {
    const characterContradictions = await checkCharacterConsistency(
      sm, containerTag, worldId, options.characterIds,
    );
    contradictions.push(...characterContradictions);
  }

  // --- Phase 2: Timeline contradictions ---
  if (scopes.includes('timeline')) {
    const timelineContradictions = await checkTimelineConsistency(
      sm, containerTag, worldId,
    );
    contradictions.push(...timelineContradictions);
  }

  // --- Phase 3: World rule violations ---
  if (scopes.includes('causality')) {
    const ruleViolations = await checkWorldRuleViolations(
      sm, containerTag, worldId,
    );
    contradictions.push(...ruleViolations);
  }

  // --- Phase 4: Relationship contradictions ---
  if (scopes.includes('relationships')) {
    const relationshipContradictions = await checkRelationshipConsistency(
      sm, containerTag, worldId,
    );
    contradictions.push(...relationshipContradictions);
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  contradictions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return contradictions;
}

/**
 * Check character-level contradictions:
 * - Status changes that conflict (alive/dead)
 * - Trait contradictions across scenes
 * - Capability mismatches
 */
async function checkCharacterConsistency(
  sm: ReturnType<typeof getSuperMemoryClient>,
  containerTag: string,
  worldId: string,
  characterIds?: string[],
): Promise<Contradiction[]> {
  const contradictions: Contradiction[] = [];

  // Get all characters to check
  const characters = await db.character.findMany({
    where: {
      storyWorldId: worldId,
      deletedAt: null,
      ...(characterIds?.length ? { id: { in: characterIds } } : {}),
    },
    select: { id: true, name: true },
  });

  for (const character of characters) {
    // Ask SM to find contradictions about this character
    const contradictionQuery = `Find any contradictions, inconsistencies, or impossible facts about the character "${character.name}". Look for conflicting traits, impossible timelines, status changes that don't make sense, and capability mismatches.`;

    const results = await sm.search({
      query: contradictionQuery,
      containerTag,
      limit: 20,
      filters: {
        characterIds: [character.id],
      },
    });

    // Cross-reference all memories about this character for conflicts
    const characterMemories = await sm.search({
      query: `All facts about ${character.name}`,
      containerTag,
      limit: 50,
      filters: {
        entityType: ['character', 'event', 'scene', 'relationship'],
      },
    });

    // Use SM's built-in contradiction detection
    // The knowledge graph automatically flags when stored facts conflict
    if (characterMemories.contradictions?.length) {
      for (const c of characterMemories.contradictions) {
        contradictions.push({
          id: `char_${character.id}_${contradictions.length}`,
          type: classifyContradictionType(c.description),
          severity: classifyContradictionSeverity(c.description),
          description: c.description,
          entities: [
            {
              entityId: character.id,
              entityType: 'character',
              name: character.name,
              relevantText: c.sourceText ?? '',
            },
          ],
          suggestion: c.suggestedResolution ?? 'Review and reconcile conflicting information.',
          confidence: c.confidence ?? 0.5,
        });
      }
    }
  }

  return contradictions;
}

/**
 * Check timeline contradictions using SM knowledge graph.
 * Detects impossible event sequences and temporal paradoxes.
 */
async function checkTimelineConsistency(
  sm: ReturnType<typeof getSuperMemoryClient>,
  containerTag: string,
  worldId: string,
): Promise<Contradiction[]> {
  const contradictions: Contradiction[] = [];

  // Query SM for temporal inconsistencies
  const timelineQuery = 'Find any events that happen in an impossible order, characters who appear after they should be dead, or locations that are described differently at the same point in the story timeline.';

  const results = await sm.search({
    query: timelineQuery,
    containerTag,
    limit: 50,
    filters: { entityType: ['event', 'scene'] },
  });

  // Additionally, use PG to find hard temporal violations
  const events = await db.event.findMany({
    where: { storyWorldId: worldId, deletedAt: null },
    orderBy: { fabulaPosition: 'asc' },
    include: {
      participants: {
        select: { character: { select: { id: true, name: true, status: true } } },
      },
    },
  });

  // Check for dead characters appearing after death events
  const deathEvents = new Map<string, { eventName: string; position: number }>();

  for (const event of events) {
    // Track death events
    if (event.type === 'death' || (event.description?.toLowerCase().includes('dies') && event.significance === 'major')) {
      for (const p of event.participants) {
        deathEvents.set(p.character.id, {
          eventName: event.name,
          position: event.fabulaPosition ?? 0,
        });
      }
    }

    // Check if any participant was marked dead before this event
    for (const p of event.participants) {
      const death = deathEvents.get(p.character.id);
      if (death && (event.fabulaPosition ?? 0) > death.position && event.type !== 'flashback') {
        contradictions.push({
          id: `timeline_death_${p.character.id}_${event.id}`,
          type: 'temporal',
          severity: 'critical',
          description: `Character "${p.character.name}" participates in event "${event.name}" (position ${event.fabulaPosition}) but died in "${death.eventName}" (position ${death.position}).`,
          entities: [
            {
              entityId: p.character.id,
              entityType: 'character',
              name: p.character.name,
              relevantText: `Dies in: ${death.eventName}`,
            },
            {
              entityId: event.id,
              entityType: 'event',
              name: event.name,
              relevantText: `Appears alive in: ${event.name}`,
            },
          ],
          suggestion: `Either mark "${event.name}" as a flashback, remove ${p.character.name} from the event, or reconsider the death in "${death.eventName}".`,
          confidence: 0.95,
        });
      }
    }
  }

  return contradictions;
}

/**
 * Check world rule violations by querying SM for actions
 * that contradict established world rules.
 */
async function checkWorldRuleViolations(
  sm: ReturnType<typeof getSuperMemoryClient>,
  containerTag: string,
  worldId: string,
): Promise<Contradiction[]> {
  const contradictions: Contradiction[] = [];

  // Get all world rules
  const rules = await db.worldRule.findMany({
    where: { storyWorldId: worldId, deletedAt: null },
  });

  for (const rule of rules) {
    // Ask SM if any stored events violate this rule
    const violationQuery = `Find any events, scenes, or character actions that violate or contradict this world rule: "${rule.description}". The rule scope is: ${rule.scope}. Known exceptions: ${(rule.exceptions as string[] ?? []).join(', ') || 'none'}.`;

    const results = await sm.search({
      query: violationQuery,
      containerTag,
      limit: 20,
    });

    // SM results with high relevance to a violation query indicate potential violations
    for (const hit of results.results) {
      if ((hit.score ?? 0) > 0.75) {
        contradictions.push({
          id: `rule_${rule.id}_${hit.metadata?.entityId}`,
          type: 'rule_violation',
          severity: rule.enforcementLevel === 'hard' ? 'critical' : 'medium',
          description: `Potential violation of world rule "${rule.name}": ${hit.content.substring(0, 200)}`,
          entities: [
            {
              entityId: rule.id,
              entityType: 'worldrule',
              name: rule.name,
              relevantText: rule.description,
            },
            {
              entityId: hit.metadata?.entityId as string ?? '',
              entityType: hit.metadata?.entityType as string ?? '',
              name: '',
              relevantText: hit.content.substring(0, 300),
            },
          ],
          suggestion: `Review whether this action is consistent with the rule "${rule.name}". If intentional, add an exception to the rule.`,
          confidence: hit.score ?? 0.5,
        });
      }
    }
  }

  return contradictions;
}

async function checkRelationshipConsistency(
  sm: ReturnType<typeof getSuperMemoryClient>,
  containerTag: string,
  worldId: string,
): Promise<Contradiction[]> {
  // Query SM for conflicting relationship states
  const query = 'Find any character relationships that are described inconsistently - for example, characters described as strangers in one place but old friends in another at the same point in the story, or relationships that change without any event to explain the change.';

  const results = await sm.search({
    query,
    containerTag,
    limit: 30,
    filters: { entityType: ['relationship'] },
  });

  // SM contradiction detection handles the heavy lifting here
  const contradictions: Contradiction[] = [];
  if (results.contradictions?.length) {
    for (const c of results.contradictions) {
      contradictions.push({
        id: `rel_${contradictions.length}`,
        type: 'relationship',
        severity: 'high',
        description: c.description,
        entities: (c.entities ?? []).map((e: { id: string; type: string; text: string }) => ({
          entityId: e.id,
          entityType: e.type,
          name: '',
          relevantText: e.text,
        })),
        suggestion: c.suggestedResolution ?? 'Review the conflicting relationship descriptions.',
        confidence: c.confidence ?? 0.5,
      });
    }
  }

  return contradictions;
}

function classifyContradictionType(description: string): Contradiction['type'] {
  const lower = description.toLowerCase();
  if (lower.includes('timeline') || lower.includes('temporal') || lower.includes('after death')) return 'temporal';
  if (lower.includes('location') || lower.includes('place')) return 'location';
  if (lower.includes('relationship') || lower.includes('ally') || lower.includes('enemy')) return 'relationship';
  if (lower.includes('trait') || lower.includes('ability') || lower.includes('capability')) return 'trait';
  if (lower.includes('rule') || lower.includes('law') || lower.includes('system')) return 'rule_violation';
  if (lower.includes('motive') || lower.includes('goal') || lower.includes('want')) return 'motivation';
  return 'tonal';
}

function classifyContradictionSeverity(description: string): Contradiction['severity'] {
  const lower = description.toLowerCase();
  if (lower.includes('dead') || lower.includes('impossible') || lower.includes('paradox')) return 'critical';
  if (lower.includes('contradict') || lower.includes('inconsisten')) return 'high';
  if (lower.includes('unusual') || lower.includes('unexpected')) return 'medium';
  return 'low';
}
```

### Incremental Contradiction Checking

Rather than running full-world checks, incremental checks run when a single entity is updated:

```typescript
// src/lib/consistency/incremental.ts

import { getSuperMemoryClient, worldContainerTag } from '../memory/client';

/**
 * Check a single entity against the existing knowledge graph
 * for contradictions. Called after entity create/update.
 * Returns immediately relevant contradictions only.
 */
export async function checkEntityConsistency(
  worldId: string,
  entityType: string,
  entityId: string,
  entityContent: string,
): Promise<Contradiction[]> {
  const sm = getSuperMemoryClient();
  const containerTag = worldContainerTag(worldId);

  // Search for related memories that might conflict
  const relatedMemories = await sm.search({
    query: `Facts that might contradict: ${entityContent}`,
    containerTag,
    limit: 30,
  });

  const contradictions: Contradiction[] = [];

  // If SM's knowledge graph detects contradictions during search,
  // they are returned as part of the search response
  if (relatedMemories.contradictions?.length) {
    for (const c of relatedMemories.contradictions) {
      contradictions.push({
        id: `incr_${entityId}_${contradictions.length}`,
        type: classifyContradictionType(c.description),
        severity: classifyContradictionSeverity(c.description),
        description: c.description,
        entities: [{
          entityId,
          entityType,
          name: '',
          relevantText: entityContent.substring(0, 200),
        }],
        suggestion: c.suggestedResolution ?? 'Review for consistency.',
        confidence: c.confidence ?? 0.5,
      });
    }
  }

  return contradictions;
}
```

---

## 7. AI Wand Context Assembly

### The Problem

When the AI Wand generates suggestions (beat descriptions, script drafts, synopsis expansions), it needs rich context from the story world. Sending the entire world to Claude is impractical. SuperMemory enables intelligent context retrieval: pull only the most relevant facts for the specific generation task.

### Context Assembly Pipeline

```
User triggers AI Wand
        |
        v
+-------------------+     +------------------+
| Determine context |     | Fetch fixed      |
| query from task   |---->| context from PG  |
+-------------------+     +------------------+
        |                          |
        v                          v
+-------------------+     +------------------+
| SM semantic search|     | World synopsis   |
| for relevant      |     | Character basics |
| memories          |     | Scene structure  |
+-------------------+     +------------------+
        |                          |
        v                          v
+---------------------------------------+
| Assemble context window               |
| (prioritize by relevance, fit in      |
|  token budget)                        |
+---------------------------------------+
        |
        v
+---------------------------------------+
| Claude API call with assembled context|
+---------------------------------------+
        |
        v
+---------------------------------------+
| Return suggestions to user            |
+---------------------------------------+
```

### Context Assembly Implementation

```typescript
// src/lib/ai/context-assembly.ts

import { getSuperMemoryClient, worldContainerTag } from '../memory/client';
import { db } from '../db/client';

/**
 * Maximum tokens to allocate for context in a Claude API call.
 * Leaves room for the system prompt, user prompt, and response.
 */
const MAX_CONTEXT_TOKENS = 12_000;
const APPROX_CHARS_PER_TOKEN = 4;
const MAX_CONTEXT_CHARS = MAX_CONTEXT_TOKENS * APPROX_CHARS_PER_TOKEN;

interface ContextAssemblyOptions {
  worldId: string;
  /** The specific task driving this context request */
  task: WandTask;
  /** Maximum characters for the assembled context */
  maxChars?: number;
}

type WandTask =
  | { type: 'generate-beat'; sceneId: string; previousBeatId?: string; characterIds?: string[] }
  | { type: 'generate-script'; sceneId: string; beatIds?: string[]; characterIds?: string[] }
  | { type: 'expand-synopsis'; currentSynopsis: string }
  | { type: 'refine-character'; characterId: string; aspect: string };

interface AssembledContext {
  /** The full context string to include in the Claude prompt */
  contextText: string;
  /** How many characters were used */
  charCount: number;
  /** Breakdown of what's included */
  sections: { label: string; charCount: number }[];
}

/**
 * Assemble the optimal context window for a Claude API call.
 * Combines fixed PG data (world synopsis, character profiles) with
 * semantically relevant SM memories.
 */
export async function assembleWandContext(
  options: ContextAssemblyOptions,
): Promise<AssembledContext> {
  const { worldId, task } = options;
  const maxChars = options.maxChars ?? MAX_CONTEXT_CHARS;
  const sections: { label: string; content: string }[] = [];

  // --- Layer 1: Fixed context from PostgreSQL (always included) ---

  const world = await db.storyWorld.findUnique({
    where: { id: worldId },
    select: { name: true, synopsis: true, genre: true },
  });

  if (world?.synopsis) {
    sections.push({
      label: 'World Synopsis',
      content: `# Story World: ${world.name}\n${world.synopsis}${world.genre ? `\nGenre: ${world.genre}` : ''}`,
    });
  }

  // --- Layer 2: Task-specific fixed context from PG ---

  if (task.type === 'generate-beat' || task.type === 'generate-script') {
    const scene = await db.scene.findUnique({
      where: { id: task.sceneId },
      include: {
        characters: {
          include: { character: { select: { id: true, name: true, description: true, role: true } } },
        },
        location: { select: { name: true, description: true } },
        beats: {
          orderBy: { position: 'asc' },
          select: { id: true, title: true, description: true, type: true },
        },
        valueChanges: { select: { valueName: true, direction: true } },
      },
    });

    if (scene) {
      let sceneContext = `# Current Scene: ${scene.title}\n`;
      if (scene.goal) sceneContext += `Goal: ${scene.goal}\n`;
      if (scene.conflict) sceneContext += `Conflict: ${scene.conflict}\n`;
      if (scene.outcome) sceneContext += `Outcome: ${scene.outcome}\n`;
      if (scene.location) {
        sceneContext += `Location: ${scene.location.name} — ${scene.location.description ?? ''}\n`;
      }

      // Characters in this scene
      if (scene.characters.length) {
        sceneContext += `\n## Characters in Scene\n`;
        for (const sc of scene.characters) {
          const c = sc.character;
          sceneContext += `- **${c.name}** (${c.role ?? 'unspecified role'}): ${c.description ?? ''}\n`;
        }
      }

      // Existing beats (for continuity)
      if (scene.beats.length) {
        sceneContext += `\n## Existing Beats\n`;
        for (const beat of scene.beats) {
          sceneContext += `- [${beat.type ?? 'beat'}] ${beat.title}: ${beat.description ?? ''}\n`;
        }
      }

      sections.push({ label: 'Current Scene', content: sceneContext });
    }
  }

  if (task.type === 'refine-character') {
    const character = await db.character.findUnique({
      where: { id: task.characterId },
      include: {
        factions: { select: { name: true } },
      },
    });

    if (character) {
      let charContext = `# Character: ${character.name}\n`;
      charContext += `Role: ${character.role ?? 'unspecified'}\n`;
      if (character.description) charContext += `Description: ${character.description}\n`;
      if (character.backstory) charContext += `Backstory: ${character.backstory}\n`;
      const traits = character.traits as Record<string, string> | null;
      if (traits) {
        charContext += `Traits: ${Object.entries(traits).map(([k, v]) => `${k}: ${v}`).join(', ')}\n`;
      }
      sections.push({ label: 'Target Character', content: charContext });
    }
  }

  // --- Layer 3: Semantic context from SuperMemory ---
  // Build a search query based on the task

  const semanticQuery = buildSemanticQuery(task, world);
  if (semanticQuery) {
    const sm = getSuperMemoryClient();
    const containerTag = worldContainerTag(worldId);

    const smResults = await sm.search({
      query: semanticQuery,
      containerTag,
      limit: 15,
    });

    if (smResults.results.length) {
      let semanticContext = `# Relevant World Context\n`;
      semanticContext += `(Retrieved via semantic search for: "${semanticQuery}")\n\n`;

      for (const hit of smResults.results) {
        semanticContext += `---\n${hit.content}\n`;
      }

      sections.push({ label: 'Semantic Context (SuperMemory)', content: semanticContext });
    }
  }

  // --- Layer 4: Trim to fit token budget ---
  return trimToFit(sections, maxChars);
}

function buildSemanticQuery(task: WandTask, world: { name: string; synopsis: string | null } | null): string {
  switch (task.type) {
    case 'generate-beat':
      return 'Recent story events, character motivations, active conflicts, and narrative momentum relevant to the current scene';
    case 'generate-script':
      return 'Character voice patterns, dialogue style, scene atmosphere, and emotional tone for writing this scene as script';
    case 'expand-synopsis':
      return `Key themes, character arcs, major plot points, and world details for expanding the synopsis of ${world?.name ?? 'this story'}`;
    case 'refine-character':
      return `Character relationships, key moments, motivations, internal conflicts, and growth trajectory for character refinement`;
    default:
      return '';
  }
}

function trimToFit(
  sections: { label: string; content: string }[],
  maxChars: number,
): AssembledContext {
  const result: { label: string; content: string }[] = [];
  let totalChars = 0;

  for (const section of sections) {
    const available = maxChars - totalChars;
    if (available <= 0) break;

    if (section.content.length <= available) {
      result.push(section);
      totalChars += section.content.length;
    } else {
      // Truncate the last section to fit
      result.push({
        label: section.label,
        content: section.content.substring(0, available - 50) + '\n\n[...context truncated for token budget]',
      });
      totalChars += available;
      break;
    }
  }

  return {
    contextText: result.map(s => s.content).join('\n\n'),
    charCount: totalChars,
    sections: result.map(s => ({ label: s.label, charCount: s.content.length })),
  };
}
```

### Using Assembled Context in AI Wand Routes

```typescript
// src/app/api/worlds/[worldId]/ai/generate-beat/route.ts

import Anthropic from '@anthropic-ai/sdk';
import { assembleWandContext } from '@/lib/ai/context-assembly';
import { db } from '@/lib/db/client';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(
  req: Request,
  { params }: { params: { worldId: string } },
) {
  const { worldId } = params;
  const body = await req.json();

  // Verify synopsis exists (prerequisite for AI Wand)
  const world = await db.storyWorld.findUnique({
    where: { id: worldId },
    select: { synopsis: true },
  });

  if (!world?.synopsis) {
    return Response.json(
      {
        error: {
          code: 'PREREQUISITE_MISSING',
          message: 'Synopsis must be filled in Story Sidebar before AI Wand can be used.',
        },
      },
      { status: 422 },
    );
  }

  // Assemble context using PG + SuperMemory
  const context = await assembleWandContext({
    worldId,
    task: {
      type: 'generate-beat',
      sceneId: body.sceneId,
      previousBeatId: body.previousBeatId,
      characterIds: body.characterIds,
    },
  });

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: `You are a story development assistant for the StoryForge platform. You help writers develop beat descriptions for their stories. You SUGGEST, never auto-write. Always present options, not mandates.

Your suggestions should be consistent with the established world, characters, and narrative arc provided in the context below.

${context.contextText}`,
    messages: [
      {
        role: 'user',
        content: `Generate 3 beat suggestions for the current scene.${body.beatType ? ` Beat type: ${body.beatType}.` : ''}${body.tone ? ` Desired tone: ${body.tone}.` : ''}${body.prompt ? `\n\nAdditional direction: ${body.prompt}` : ''}

For each suggestion, provide:
- title: A concise beat title
- description: 2-3 sentences describing the beat action
- dialogueText: Key dialogue if applicable (null if no dialogue)
- actionText: Key action/movement if applicable
- emotionalTone: The emotional register of this beat`,
      },
    ],
  });

  // Parse Claude's response into structured suggestions
  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  return Response.json({
    suggestions: parseBeatSuggestions(responseText),
    usageTokens: message.usage.input_tokens + message.usage.output_tokens,
    contextStats: {
      charCount: context.charCount,
      sections: context.sections,
    },
  });
}

function parseBeatSuggestions(text: string): Array<{
  title: string;
  description: string;
  dialogueText: string | null;
  actionText: string | null;
  emotionalTone: string;
}> {
  // Implementation: parse Claude's structured response
  // This would use JSON mode or structured output parsing
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : parsed.suggestions ?? [];
  } catch {
    // Fallback: extract from freeform text
    return [{
      title: 'Generated Beat',
      description: text.substring(0, 500),
      dialogueText: null,
      actionText: null,
      emotionalTone: 'neutral',
    }];
  }
}
```

---

## 8. Ingestion Flow

### End-to-End Pipeline: Source File to PG + SM

The ingestion pipeline processes uploaded source material (text, audio, video) through a multi-stage pipeline that populates both PostgreSQL and SuperMemory.

```
+-------------------+
| User uploads file |
| (.pdf, .mp4, etc) |
+--------+----------+
         |
         v
+--------+----------+     +-------------------+
| BullMQ Job:       |     | SM File Ingestion |
| Format detection  |---->| (for supported    |
| + parsing         |     |  formats: PDF,    |
+--------+----------+     |  DOCX, video)     |
         |                +--------+----------+
         v                         |
+--------+----------+              |
| Structure-aware   |              |
| chunking          |              v
+--------+----------+     +--------+----------+
         |                | SM extracts facts, |
         v                | builds knowledge   |
+--------+----------+     | graph entries      |
| Claude API entity |     +--------+----------+
| extraction        |              |
+--------+----------+              |
         |                         |
         v                         v
+--------+----------+     +--------+----------+
| Entity resolution |     | SM-extracted facts |
| (fuzzy match +    |     | (proposed)         |
| dedup)            |     +--------+----------+
+--------+----------+              |
         |                         |
         v                         v
+--------+--------------------------+----------+
|        User Review UI                        |
|  - Confirm / Reject / Merge entities         |
|  - See proposed facts from both Claude + SM  |
|  - Resolve conflicts between extractions     |
+---------+------------------------------------+
          |
          v
+---------+---------+     +-------------------+
| Confirmed entities|---->| Sync to SM with   |
| written to PG     |     | confirmed status  |
| (source of truth) |     | and rich metadata |
+-------------------+     +-------------------+
```

### SuperMemory Document Ingestion

SuperMemory can directly process certain file types (PDF, DOCX, video with transcription) to extract facts and build knowledge graph entries. StoryForge uses this as a **supplementary extraction path** alongside its own Claude API pipeline.

```typescript
// src/lib/ingestion/supermemory-ingest.ts

import { getSuperMemoryClient, worldContainerTag } from '../memory/client';
import { logger } from '../utils/logger';

interface SMIngestionResult {
  memoryIds: string[];
  extractedFacts: Array<{
    content: string;
    confidence: number;
    sourcePosition?: { startMs?: number; endMs?: number; startOffset?: number; endOffset?: number };
  }>;
}

/**
 * Ingest a source file directly into SuperMemory for its own extraction.
 * SM will process the file, extract facts, and build knowledge graph entries.
 *
 * This runs IN PARALLEL with StoryForge's own Claude API extraction pipeline.
 * Results from both are merged in the user review step.
 */
export async function ingestFileToSuperMemory(
  worldId: string,
  sourceId: string,
  file: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  },
  options?: {
    chunkSize?: number;
    extractEntities?: boolean;
  },
): Promise<SMIngestionResult> {
  const sm = getSuperMemoryClient();
  const containerTag = worldContainerTag(worldId);
  const memoryIds: string[] = [];

  // For file types SM can process natively
  if (isSMSupportedFormat(file.mimeType)) {
    const result = await sm.addFile({
      file: new Blob([file.buffer], { type: file.mimeType }),
      filename: file.filename,
      containerTag,
      metadata: {
        entityType: 'sourcematerial',
        sourceId,
        worldId,
        originalFilename: file.filename,
        mimeType: file.mimeType,
        ingestedAt: new Date().toISOString(),
      },
    });

    if (result.id) {
      memoryIds.push(result.id);
    }

    logger.info('File ingested to SuperMemory', {
      worldId,
      sourceId,
      filename: file.filename,
      memoryId: result.id,
    });

    return {
      memoryIds,
      extractedFacts: result.extractedFacts ?? [],
    };
  }

  // For unsupported formats: chunk the text and add manually
  // (This handles .fountain, .fdx, and other niche formats)
  return {
    memoryIds: [],
    extractedFacts: [],
  };
}

function isSMSupportedFormat(mimeType: string): boolean {
  const supported = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'image/png',
    'image/jpeg',
  ];
  return supported.includes(mimeType);
}
```

### Chunked Text Ingestion for Source Material

For text-based source material, StoryForge chunks the parsed content and stores each chunk in SM with positional metadata:

```typescript
// src/lib/ingestion/chunk-to-supermemory.ts

import { getSuperMemoryClient, worldContainerTag } from '../memory/client';

interface TextChunk {
  index: number;
  content: string;
  section?: {
    type: string;
    title: string;
  };
  startOffset: number;
  endOffset: number;
  /** For audio/video sources: time-code boundaries */
  timeCode?: {
    startMs: number;
    endMs: number;
  };
}

/**
 * Store pre-chunked source material text in SuperMemory.
 * Each chunk becomes a separate memory with positional metadata
 * for retrieval and source-linking.
 */
export async function storeChunksInSuperMemory(
  worldId: string,
  sourceId: string,
  sourceName: string,
  sourceType: 'text' | 'audio' | 'video',
  chunks: TextChunk[],
): Promise<string[]> {
  const sm = getSuperMemoryClient();
  const containerTag = worldContainerTag(worldId);
  const memoryIds: string[] = [];

  for (const chunk of chunks) {
    const memoryId = `source_${sourceId}_chunk_${chunk.index}`;

    const metadata: Record<string, unknown> = {
      entityType: 'sourcematerial',
      sourceId,
      sourceName,
      sourceType,
      chunkIndex: chunk.index,
      startOffset: chunk.startOffset,
      endOffset: chunk.endOffset,
    };

    if (chunk.section) {
      metadata.chapterTitle = chunk.section.title;
      metadata.sectionType = chunk.section.type;
    }

    if (chunk.timeCode) {
      metadata.startMs = chunk.timeCode.startMs;
      metadata.endMs = chunk.timeCode.endMs;
    }

    await sm.add({
      id: memoryId,
      content: chunk.content,
      containerTag,
      metadata,
    });

    memoryIds.push(memoryId);
  }

  return memoryIds;
}
```

### Merging Extraction Results

When both the Claude API pipeline and SuperMemory's built-in extraction produce entity candidates, they must be merged before user review:

```typescript
// src/lib/ingestion/merge-extractions.ts

interface ExtractionCandidate {
  source: 'claude_api' | 'supermemory';
  type: string;
  name: string;
  description: string;
  confidence: number;
  evidence: string[];
}

interface MergedCandidate extends ExtractionCandidate {
  mergedFrom: ExtractionCandidate[];
  combinedConfidence: number;
}

/**
 * Merge entity candidates from Claude API extraction and SuperMemory extraction.
 * Deduplicates by fuzzy name matching and combines evidence.
 */
export function mergeExtractionResults(
  claudeEntities: ExtractionCandidate[],
  smEntities: ExtractionCandidate[],
): MergedCandidate[] {
  const merged: MergedCandidate[] = [];
  const smUsed = new Set<number>();

  for (const claude of claudeEntities) {
    // Try to find a matching SM entity
    let bestMatch: { index: number; score: number } | null = null;

    for (let i = 0; i < smEntities.length; i++) {
      if (smUsed.has(i)) continue;
      if (smEntities[i].type !== claude.type) continue;

      const similarity = fuzzyNameSimilarity(claude.name, smEntities[i].name);
      if (similarity > 0.8 && (!bestMatch || similarity > bestMatch.score)) {
        bestMatch = { index: i, score: similarity };
      }
    }

    if (bestMatch) {
      const sm = smEntities[bestMatch.index];
      smUsed.add(bestMatch.index);

      // Merge: combine evidence, boost confidence
      merged.push({
        source: 'claude_api',
        type: claude.type,
        name: claude.name, // Prefer Claude's name (usually more accurate)
        description: claude.description.length > sm.description.length
          ? claude.description
          : sm.description,
        confidence: claude.confidence,
        evidence: [...claude.evidence, ...sm.evidence],
        mergedFrom: [claude, sm],
        combinedConfidence: Math.min(1.0, (claude.confidence + sm.confidence) / 1.5),
      });
    } else {
      // Claude-only entity
      merged.push({
        ...claude,
        mergedFrom: [claude],
        combinedConfidence: claude.confidence,
      });
    }
  }

  // Add SM-only entities that didn't match any Claude entity
  for (let i = 0; i < smEntities.length; i++) {
    if (smUsed.has(i)) continue;
    merged.push({
      ...smEntities[i],
      mergedFrom: [smEntities[i]],
      combinedConfidence: smEntities[i].confidence * 0.9, // Slight penalty for single-source
    });
  }

  return merged.sort((a, b) => b.combinedConfidence - a.combinedConfidence);
}

function fuzzyNameSimilarity(a: string, b: string): number {
  const aNorm = a.toLowerCase().trim();
  const bNorm = b.toLowerCase().trim();

  if (aNorm === bNorm) return 1.0;
  if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) return 0.9;

  // Levenshtein-based similarity
  const maxLen = Math.max(aNorm.length, bNorm.length);
  if (maxLen === 0) return 1.0;
  const distance = levenshteinDistance(aNorm, bNorm);
  return 1.0 - distance / maxLen;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[a.length][b.length];
}
```

### Post-Confirmation Sync

After the user confirms entities in the review UI, confirmed entities are written to PG (source of truth) and then synced to SM with their confirmed status:

```typescript
// src/lib/ingestion/confirm-entities.ts

import { db } from '../db/client';
import { enqueueSyncUpsert } from '../memory/sync-enqueue';
import { serializeCharacter, serializeEvent, serializeLocation } from '../memory/serializers';

interface ConfirmationDecision {
  entityId: string;
  action: 'confirm' | 'reject';
  mergeWithEntityId?: string;
  overrides?: Record<string, unknown>;
}

/**
 * Process user confirmation decisions for extracted entities.
 * Writes confirmed entities to PG, then syncs to SM.
 */
export async function processConfirmations(
  worldId: string,
  sourceId: string,
  decisions: ConfirmationDecision[],
): Promise<void> {
  for (const decision of decisions) {
    if (decision.action === 'reject') {
      // Mark as rejected in PG, remove from SM if it was there
      await db.proposedEntity.update({
        where: { id: decision.entityId },
        data: { status: 'rejected', reviewedAt: new Date() },
      });
      continue;
    }

    if (decision.action === 'confirm') {
      const proposed = await db.proposedEntity.findUnique({
        where: { id: decision.entityId },
      });
      if (!proposed) continue;

      // Apply any user overrides
      const finalData = { ...proposed.data, ...decision.overrides } as Record<string, unknown>;

      if (decision.mergeWithEntityId) {
        // Merge with existing entity — update PG record
        await mergeWithExisting(worldId, decision.mergeWithEntityId, proposed.type, finalData);
      } else {
        // Create new entity in PG
        const created = await createConfirmedEntity(worldId, sourceId, proposed.type, finalData);

        // Sync to SM
        const serializer = getSerializerForType(proposed.type);
        if (serializer && created) {
          const payload = serializer(created);
          await enqueueSyncUpsert(worldId, proposed.type, created.id, payload);
        }
      }

      // Mark proposed entity as confirmed
      await db.proposedEntity.update({
        where: { id: decision.entityId },
        data: { status: 'confirmed', reviewedAt: new Date() },
      });
    }
  }
}

async function createConfirmedEntity(
  worldId: string,
  sourceId: string,
  type: string,
  data: Record<string, unknown>,
): Promise<any> {
  switch (type) {
    case 'character':
      return db.character.create({
        data: {
          storyWorldId: worldId,
          name: data.name as string,
          description: data.description as string,
          aliases: (data.aliases as string[]) ?? [],
          traits: data.traits ?? {},
          goals: (data.goals as string[]) ?? [],
          backstory: data.backstory as string ?? '',
          status: 'confirmed',
        },
      });
    case 'location':
      return db.location.create({
        data: {
          storyWorldId: worldId,
          name: data.name as string,
          description: data.description as string,
          type: data.type as string ?? 'unspecified',
        },
      });
    case 'event':
      return db.event.create({
        data: {
          storyWorldId: worldId,
          name: data.name as string,
          description: data.description as string,
          type: data.type as string ?? 'action',
        },
      });
    default:
      return null;
  }
}

async function mergeWithExisting(
  worldId: string,
  existingId: string,
  type: string,
  newData: Record<string, unknown>,
): Promise<void> {
  // Merge logic: append aliases, extend descriptions, combine traits
  // Implementation depends on entity type
  switch (type) {
    case 'character': {
      const existing = await db.character.findUnique({ where: { id: existingId } });
      if (!existing) return;

      const mergedAliases = [
        ...new Set([
          ...(existing.aliases as string[] ?? []),
          ...(newData.aliases as string[] ?? []),
        ]),
      ];

      await db.character.update({
        where: { id: existingId },
        data: {
          aliases: mergedAliases,
          description: existing.description
            ? `${existing.description}\n\nAdditional context: ${newData.description ?? ''}`
            : (newData.description as string),
        },
      });
      break;
    }
    // ... similar for other types
  }
}

function getSerializerForType(type: string) {
  const map: Record<string, Function> = {
    character: serializeCharacter,
    event: serializeEvent,
    location: serializeLocation,
  };
  return map[type] ?? null;
}
```

---

## 9. Performance & Cost Considerations

### SuperMemory API Costs

| Operation | Estimated Cost | Frequency |
|---|---|---|
| `add` (store memory) | ~$0.001 per call | Per entity create/update |
| `search` (semantic query) | ~$0.005 per call | Per user search, per AI Wand use, per consistency check |
| `addFile` (file ingestion) | ~$0.01-0.05 per file | Per source material upload |
| `delete` | Free | Per entity delete |

### Cost Optimization Strategies

1. **Debounce rapid updates**: The sync queue uses `jobId` deduplication so rapid edits to the same entity produce only one SM sync.

2. **Batch consistency checks**: Run full-world checks as scheduled background jobs (e.g., nightly), not on every edit. Use incremental checks for real-time feedback.

3. **Cache semantic search results**: Cache SM search results in Redis with a short TTL (60 seconds) keyed by `{worldId}:{query_hash}`. Invalidate on entity changes.

4. **Limit context assembly searches**: Cap SM search calls during context assembly to 2-3 queries max per AI Wand invocation.

5. **Lazy sync for low-priority entities**: Not all entity types need real-time SM sync. Beats and minor annotations can sync on a slower schedule.

```typescript
// src/lib/memory/cache.ts

import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);
const SEARCH_CACHE_TTL = 60; // seconds

interface CachedSearchResult {
  results: unknown[];
  cachedAt: string;
}

/**
 * Cache wrapper for SuperMemory search results.
 * Reduces API calls for repeated queries within a short window.
 */
export async function cachedSearch(
  cacheKey: string,
  searchFn: () => Promise<unknown>,
): Promise<unknown> {
  const cached = await redis.get(`sm_search:${cacheKey}`);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await searchFn();
  await redis.setex(
    `sm_search:${cacheKey}`,
    SEARCH_CACHE_TTL,
    JSON.stringify(result),
  );

  return result;
}

/**
 * Invalidate all cached searches for a world.
 * Called when entities in the world are modified.
 */
export async function invalidateWorldSearchCache(worldId: string): Promise<void> {
  const keys = await redis.keys(`sm_search:${worldId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

### Performance Benchmarks (Target)

| Operation | Target Latency | Notes |
|---|---|---|
| SM `add` (single entity) | < 200ms | Async via BullMQ, does not block API response |
| SM `search` (semantic) | < 300ms | SuperMemory's stated SLA |
| SM `search` (with metadata filter) | < 250ms | Filters reduce search space |
| Context assembly (PG + SM) | < 500ms | 1 PG query + 1-2 SM queries |
| Full consistency check (100 entities) | < 10s | Background job, not user-blocking |
| Full consistency check (1000 entities) | < 60s | Background job with progress reporting |
| World rebuild (500 entities) | < 5 min | Background job, rate-limited |

### Scaling Considerations

| Scale Threshold | Mitigation |
|---|---|
| **> 500 entities per world** | Increase SM search `limit` judiciously; use metadata filters aggressively |
| **> 5,000 entities per world** | Shard SM queries by entity type; paginate consistency checks |
| **> 100 concurrent users** | Add SM search result caching layer; rate-limit consistency checks |
| **> 1,000 worlds** | Each world is already isolated by `containerTag`; no cross-world scaling concern |
| **Large source files (> 10MB)** | Chunk before SM ingestion; process in background; stream progress to UI |

### Rate Limiting Integration

```typescript
// src/lib/memory/rate-limiter.ts

import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

/**
 * Sliding window rate limiter for SuperMemory API calls.
 * Prevents hitting SM rate limits during bulk operations.
 */
export async function checkSMRateLimit(
  operation: 'add' | 'search' | 'delete',
  maxPerMinute: number = 100,
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const key = `sm_ratelimit:${operation}`;
  const now = Date.now();
  const windowStart = now - 60_000;

  // Remove expired entries
  await redis.zremrangebyscore(key, 0, windowStart);

  // Count current window
  const count = await redis.zcard(key);

  if (count >= maxPerMinute) {
    const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
    const retryAfterMs = oldest.length >= 2
      ? 60_000 - (now - parseInt(oldest[1]))
      : 1000;
    return { allowed: false, retryAfterMs };
  }

  // Record this call
  await redis.zadd(key, now, `${now}-${Math.random()}`);
  await redis.expire(key, 120);

  return { allowed: true, retryAfterMs: 0 };
}
```

---

## 10. Error Handling & Resilience

### SuperMemory is Non-Critical

The most important architectural decision: **SuperMemory failures must never break core functionality.** If SM is down, the app should still work for all CRUD operations. Semantic search and contradiction detection degrade gracefully.

### Failure Modes and Handling

| Failure | Impact | Handling |
|---|---|---|
| SM API timeout | Sync job fails | BullMQ retries with exponential backoff (3 attempts) |
| SM API 500 error | Sync job fails | Same retry strategy; alert after 3rd failure |
| SM API rate limit (429) | Sync job delayed | Backoff per `Retry-After` header |
| SM search timeout | Semantic search unavailable | Fall back to PG `tsvector` full-text search |
| SM search returns empty | No semantic results | Return empty results with message; do not error |
| SM container corrupted | World's SM data invalid | Trigger full rebuild from PG |
| SM completely down | All SM features unavailable | App continues with PG-only mode; SM features show "temporarily unavailable" |

### Graceful Degradation

```typescript
// src/lib/memory/resilient-search.ts

import { getSuperMemoryClient, worldContainerTag } from './client';
import { db } from '../db/client';
import { logger } from '../utils/logger';

interface SearchOptions {
  worldId: string;
  query: string;
  entityTypes?: string[];
  limit?: number;
}

/**
 * Resilient search that falls back to PG full-text search
 * when SuperMemory is unavailable.
 */
export async function resilientSemanticSearch(options: SearchOptions) {
  const { worldId, query, entityTypes, limit = 25 } = options;

  try {
    // Try SuperMemory first
    const sm = getSuperMemoryClient();
    const containerTag = worldContainerTag(worldId);

    const results = await Promise.race([
      sm.search({
        query,
        containerTag,
        limit,
        filters: entityTypes?.length ? { entityType: entityTypes } : undefined,
      }),
      // 5-second timeout
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('SM search timeout')), 5000),
      ),
    ]);

    return {
      source: 'supermemory' as const,
      results: results.results,
    };
  } catch (err) {
    logger.warn('SuperMemory search failed, falling back to PG full-text', {
      worldId,
      query,
      error: err instanceof Error ? err.message : String(err),
    });

    // Fallback: PostgreSQL full-text search
    const pgResults = await db.$queryRaw`
      SELECT id, 'character' as entity_type, name, description as excerpt,
             ts_rank("searchBody", plainto_tsquery('english', ${query})) as score
      FROM "Character"
      WHERE "storyWorldId" = ${worldId}
        AND "deletedAt" IS NULL
        AND "searchBody" @@ plainto_tsquery('english', ${query})

      UNION ALL

      SELECT id, 'event' as entity_type, name, description as excerpt,
             ts_rank("searchBody", plainto_tsquery('english', ${query})) as score
      FROM "Event"
      WHERE "storyWorldId" = ${worldId}
        AND "deletedAt" IS NULL
        AND "searchBody" @@ plainto_tsquery('english', ${query})

      UNION ALL

      SELECT id, 'scene' as entity_type, title as name, description as excerpt,
             ts_rank("searchBody", plainto_tsquery('english', ${query})) as score
      FROM "Scene"
      WHERE "storyWorldId" = ${worldId}
        AND "deletedAt" IS NULL
        AND "searchBody" @@ plainto_tsquery('english', ${query})

      ORDER BY score DESC
      LIMIT ${limit}
    `;

    return {
      source: 'postgresql_fallback' as const,
      results: pgResults as any[],
    };
  }
}
```

### Health Check

```typescript
// src/app/api/health/supermemory/route.ts

import { getSuperMemoryClient } from '@/lib/memory/client';

/**
 * Health check endpoint for SuperMemory connectivity.
 * Used by monitoring and the UI to show SM status.
 */
export async function GET() {
  try {
    const sm = getSuperMemoryClient();
    const start = Date.now();

    // Lightweight search to test connectivity
    await Promise.race([
      sm.search({ query: 'health check', containerTag: 'storyforge_healthcheck', limit: 1 }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 3000),
      ),
    ]);

    const latencyMs = Date.now() - start;

    return Response.json({
      status: 'healthy',
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json(
      {
        status: 'unhealthy',
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
```

---

## Appendix: Environment Variables

```bash
# .env (required for SuperMemory integration)

# SuperMemory API key from https://supermemory.com/dashboard
SUPERMEMORY_API_KEY=sm_key_xxxxxxxxxxxxxxxxxxxx

# Redis connection for BullMQ sync queue
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379

# Anthropic API key for Claude (AI Wand + entity extraction)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```

## Appendix: Module Dependency Map

```
src/lib/memory/
  ├── client.ts              # SuperMemory client singleton + worldContainerTag()
  ├── containers.ts          # World container lifecycle (init, destroy)
  ├── serializers.ts         # PG entity → SM document converters
  ├── sync-types.ts          # Shared types for sync jobs
  ├── sync-enqueue.ts        # BullMQ queue producer
  ├── sync-worker.ts         # BullMQ queue consumer (background process)
  ├── rebuild.ts             # Full world rebuild from PG
  ├── cache.ts               # Redis cache for SM search results
  ├── rate-limiter.ts        # Sliding window rate limiter
  └── resilient-search.ts    # SM search with PG fallback

src/lib/ai/
  └── context-assembly.ts    # PG + SM context window for Claude API calls

src/lib/consistency/
  ├── checker.ts             # Full consistency check (SM + PG)
  └── incremental.ts         # Per-entity consistency check

src/lib/ingestion/
  ├── supermemory-ingest.ts  # File → SM ingestion
  ├── chunk-to-supermemory.ts # Chunked text → SM memories
  ├── merge-extractions.ts   # Claude + SM extraction merging
  └── confirm-entities.ts    # User review → PG + SM commit
```
