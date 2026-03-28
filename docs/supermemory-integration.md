# SuperMemory Integration Specification

## 1. Overview

### What SuperMemory Is

SuperMemory is an open-source (MIT licensed, 19.9K GitHub stars) semantic memory SDK that provides a persistent knowledge graph with built-in semantic search and contradiction detection. It stores information as "memories" -- discrete units of knowledge with content, metadata, and typed relationships to other memories -- and exposes them through a semantic query interface backed by vector embeddings.

### Why We Chose It

StoryForge needs a layer that goes beyond what PostgreSQL alone can provide. While Postgres handles relational data and full-text search well, it cannot natively perform:

- **Semantic similarity search** -- finding scenes that "feel like betrayal" rather than containing the word "betrayal"
- **Automatic contradiction detection** -- flagging when a new fact conflicts with established world rules
- **Knowledge graph traversal with semantic understanding** -- following typed edges (updates, extends, derives) across a web of story facts while understanding their meaning

SuperMemory fills this gap. It is not a replacement for PostgreSQL; it is a complementary semantic layer that sits alongside the relational database. PostgreSQL remains the authoritative data store for structured entities (characters, scenes, arcs, relationships with their full attribute sets). SuperMemory stores the semantic representations of those entities -- their facts, rules, and narrative significance -- enabling the kinds of queries that relational databases cannot answer.

### Role in StoryForge Architecture

SuperMemory serves three primary roles:

1. **Semantic search engine** -- Powers Creative Intent Search (Tier 2), enabling writers to search by emotion, tone, thematic intent, or narrative function rather than keywords alone. Target: sub-300ms query latency.

2. **Contradiction detection engine** -- Powers the Consistency & Contradiction Checker (Tier 2) by automatically detecting when newly stored facts conflict with existing memories within a story world.

3. **Knowledge graph for narrative intelligence** -- Maintains a web of typed relationships between story facts, enabling Revision Impact Analysis, entity resolution across ingestion sources, and causal chain traversal.

### Key Capabilities

| Capability | StoryForge Use |
|---|---|
| Semantic search (sub-300ms) | Creative Intent Search, entity resolution |
| Contradiction detection | Consistency Checker, world rule enforcement |
| Knowledge graph with typed edges | Impact analysis, causality chains, foreshadowing tracking |
| Metadata filtering | Scoping queries to specific characters, arcs, chapters, scenes |
| File ingestion (PDF, DOCX, video, audio, images) | Ingestion pipeline acceleration |
| Container isolation | Per-StoryWorld data separation |

---

## 2. Architecture

### System Context

```
+------------------+      +------------------+      +------------------+
|                  |      |                  |      |                  |
|   Next.js App    |----->|  Next.js API     |----->|   PostgreSQL     |
|   (Frontend)     |      |  Routes          |      |   (Prisma ORM)   |
|                  |      |                  |      |   Primary store  |
+------------------+      +--------+---------+      +------------------+
                                   |
                          +--------+---------+
                          |                  |
                          |  src/lib/        |
                          |  analysis/       |
                          |  consistency/    |
                          |  embeddings/     |
                          |  graph/          |
                          |                  |
                          +--------+---------+
                                   |
                    +--------------+--------------+
                    |                             |
           +--------+---------+         +--------+---------+
           |                  |         |                  |
           |   SuperMemory    |         |   Claude API     |
           |   SDK            |         |   (via lib/ai/)  |
           |                  |         |                  |
           +------------------+         +------------------+
```

### SDK Integration Points

The `supermemory` SDK is used in the following `src/lib/` modules:

| Module | SuperMemory Usage |
|---|---|
| `src/lib/analysis/` | Store extracted entities and relationships as memories after Claude API analysis |
| `src/lib/consistency/` | Query memories for contradiction detection; store world rules as checkable facts |
| `src/lib/embeddings/` | Semantic search queries against SuperMemory; combine with pgvector results |
| `src/lib/graph/` | Traverse typed edges for impact analysis, causality chains, dependency resolution |
| `src/lib/ingestion/` | Feed parsed content into SuperMemory for automatic memory creation |

### Vercel AI SDK Integration

The `@supermemory/tools` package integrates with the Vercel AI SDK to provide Claude-powered analysis that is automatically memory-aware. This means Claude API calls made through this integration can:

- Read relevant memories as context before analysis
- Write new memories as a result of analysis
- Detect contradictions against existing memories during entity extraction

This integration lives in `src/lib/ai/` and wraps the raw Claude API calls with SuperMemory tool bindings.

```typescript
// src/lib/ai/memory-aware-client.ts
import { createSuperMemoryTools } from '@supermemory/tools';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const memoryTools = createSuperMemoryTools({
  apiKey: process.env.SUPERMEMORY_API_KEY!,
});

export async function analyzeWithMemoryContext(
  worldId: string,
  prompt: string,
) {
  const result = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    tools: memoryTools,
    toolChoice: 'auto',
    system: `You are analyzing story content for StoryForge world ${worldId}.
Use the memory tools to read existing world knowledge and store new findings.
Container: storyforge_world_${worldId}`,
    prompt,
  });

  return result;
}
```

### Container Isolation

Every StoryWorld gets its own isolated container within SuperMemory. This ensures that:

- Queries for World A never return results from World B
- Contradiction detection only checks within the same world
- Deleting a world cleanly removes all associated memories

**Container tag convention**: `storyforge_world_{worldId}`

Where `worldId` is the PostgreSQL primary key (UUID) of the StoryWorld record.

```typescript
function getContainerTag(worldId: string): string {
  return `storyforge_world_${worldId}`;
}
```

### What Lives Where: PostgreSQL vs. SuperMemory

| Data | PostgreSQL (Prisma) | SuperMemory |
|---|---|---|
| Character records (full attributes, IDs, relations) | Primary store | Semantic representation of character facts |
| Scene records (structured fields, ordering, FK links) | Primary store | Scene summaries, emotional content, thematic tags |
| Relationships (typed, weighted, temporal) | Primary store | Semantic description of relationship dynamics |
| World rules and constraints | Stored as WorldRule records | Stored as checkable memories for contradiction detection |
| Source material files | File references and metadata | Parsed content as searchable memories |
| Timeline events (fabula/sjuzhet positions) | Primary store with ordering columns | Event descriptions for semantic search |
| Narrative codes, value changes | Primary store | Semantic content for thematic search |
| User-facing CRUD operations | All reads/writes | Never directly exposed to frontend |
| Semantic/creative intent queries | Full-text search (tsvector) | Semantic similarity search |
| Contradiction checks | N/A | Primary engine |

**Rule of thumb**: PostgreSQL is the system of record. SuperMemory is the semantic index. Every entity that exists in SuperMemory has a corresponding authoritative record in PostgreSQL. If they diverge, PostgreSQL wins, and the SuperMemory entry is resynced.

---

## 3. Memory Operations

### Storing Memories

#### What Gets Stored

Every significant narrative fact extracted from story content becomes a memory. Specifically:

- **Entity facts**: "Elena Vasquez is a 34-year-old former intelligence officer with a prosthetic left hand"
- **Relationship facts**: "Marcus and Elena were partners at the Agency from 2019-2022; their relationship turned adversarial after the Berlin incident"
- **Event facts**: "In Chapter 7, Elena discovers the encrypted files in Marcus's apartment, which contradicts his claim of ignorance"
- **World rules**: "In this world, magic requires physical contact with a lodestone to activate"
- **Thematic observations**: "The recurring motif of locked doors symbolizes Elena's inability to access her past"
- **Causal links**: "Elena's discovery of the files (Ch 7) directly motivates her decision to go to Berlin (Ch 9)"

#### Memory Structure

```typescript
interface StoryMemory {
  // Content: the natural-language fact or observation
  content: string;

  // Container tag: isolates to a single StoryWorld
  containerTag: string; // e.g., "storyforge_world_abc123"

  // Tags: categorical labels for filtering
  tags: string[];

  // Metadata: structured fields for precise filtering
  metadata: StoryMemoryMetadata;
}

interface StoryMemoryMetadata {
  // Which entity type this memory describes
  entityType: 'character' | 'location' | 'event' | 'relationship' | 'worldRule'
    | 'theme' | 'motif' | 'faction' | 'object' | 'scene' | 'arc'
    | 'causalLink' | 'setupPayoff' | 'narrativeCode';

  // PostgreSQL entity IDs for cross-referencing
  entityId: string;          // Primary entity this fact is about
  relatedEntityIds: string[]; // Other entities mentioned or involved

  // Scoping fields for filtered queries
  characterIds?: string[];   // Characters involved
  arcIds?: string[];         // Arcs this fact belongs to
  chapterNumber?: number;    // Chapter where this fact is established
  sceneId?: string;          // Scene where this fact is established
  sceneRange?: {             // Valid scene range (for temporal facts)
    from: string;            // Scene ID where fact becomes true
    to?: string;             // Scene ID where fact ceases to be true (null = still true)
  };

  // Classification
  canonStatus: 'canon' | 'draft' | 'speculative' | 'deprecated';
  confidence: number;        // 0.0 - 1.0, how confident the extraction was
  source: 'extraction' | 'user' | 'analysis'; // How this memory was created
  sourceRef?: {              // Link back to source material
    sourceMaterialId: string;
    position?: number;       // Character offset in text
    timeCode?: number;       // Seconds offset in audio/video
  };

  // Temporal metadata
  createdAt: string;         // ISO timestamp
  updatedAt: string;         // ISO timestamp
}
```

#### Typed Edges

Memories are connected to other memories via typed edges that encode how facts relate:

| Edge Type | Meaning | Example |
|---|---|---|
| `updates` | This memory supersedes an older version of the same fact | "Elena is 35" updates "Elena is 34" (birthday scene) |
| `extends` | This memory adds detail to an existing fact | "Elena's prosthetic hand was made by Dr. Okafor" extends "Elena has a prosthetic left hand" |
| `derives` | This memory is a consequence or inference from another | "Elena distrusts Marcus" derives from "Elena discovered Marcus's hidden files" |
| `contradicts` | This memory conflicts with another (flagged for review) | "Marcus was in Berlin on June 5" contradicts "Marcus was in London on June 5" |
| `supports` | This memory provides evidence for another | "Elena saw Marcus at the Berlin airport" supports "Marcus was in Berlin on June 5" |
| `causallyPrecedes` | This fact causally leads to another | "Elena stole the keycard" causallyPrecedes "Elena accessed the vault" |

```typescript
interface MemoryEdge {
  fromMemoryId: string;
  toMemoryId: string;
  edgeType: 'updates' | 'extends' | 'derives' | 'contradicts' | 'supports' | 'causallyPrecedes';
  metadata?: {
    confidence: number;
    reason?: string; // Natural-language explanation of why this edge exists
  };
}
```

#### Memory Lifecycle

| Event | Action |
|---|---|
| **Content ingested** | Claude extracts entities/facts -> each fact stored as a memory with `source: 'extraction'`, `confidence` from Claude, `canonStatus: 'draft'` |
| **User confirms entity** | Memory `confidence` set to 1.0, `canonStatus` updated to `'canon'` if user approves |
| **User edits entity in Postgres** | Corresponding SuperMemory entry is updated (content rewritten, `source: 'user'`) |
| **Canon snapshot created** | All `canon` memories tagged with snapshot ID in metadata |
| **Entity deleted** | Memory marked `canonStatus: 'deprecated'`, not hard-deleted (preserves history) |
| **What-if branch created** | Branched memories created with `canonStatus: 'speculative'` and a `branchId` in metadata |
| **Contradiction detected** | `contradicts` edge created between the two memories; flagged in Consistency Checker |

---

### Querying Memories

#### Semantic Search

SuperMemory's core query mechanism is semantic similarity search. Given a natural-language query, it returns memories ranked by semantic relevance.

```typescript
import { SuperMemory } from 'supermemory';

const client = new SuperMemory({
  apiKey: process.env.SUPERMEMORY_API_KEY!,
});

// Basic semantic search within a world
const results = await client.search({
  query: "moments where the protagonist feels betrayed",
  containerTag: `storyforge_world_${worldId}`,
  limit: 20,
});
```

**Latency target**: Sub-300ms for queries against worlds with up to 50K memories.

#### Metadata Filtering

Queries can be scoped using metadata filters to narrow results before semantic ranking:

```typescript
// Search only within a specific character's facts
const results = await client.search({
  query: "emotional turning points",
  containerTag: `storyforge_world_${worldId}`,
  filters: {
    characterIds: { contains: characterId },
    canonStatus: 'canon',
  },
  limit: 10,
});

// Search within a chapter range
const results = await client.search({
  query: "foreshadowing of the villain's plan",
  containerTag: `storyforge_world_${worldId}`,
  filters: {
    chapterNumber: { gte: 1, lte: 10 },
    entityType: { in: ['event', 'setupPayoff', 'narrativeCode'] },
  },
  limit: 15,
});
```

#### Query Patterns by Use Case

| Use Case | Query Strategy |
|---|---|
| Creative Intent Search | Semantic query with broad filters (canon status, optionally scoped by arc/character) |
| Consistency check | Query all memories for a specific entity, then run contradiction detection |
| Entity resolution | Semantic similarity between candidate entity description and existing character memories |
| Impact analysis | Start from a specific memory, traverse edges (derives, causallyPrecedes, extends) |
| Foreshadowing tracking | Query memories with `entityType: 'setupPayoff'`, filter by payoff presence |
| Scene context loading | Query all memories scoped to a specific sceneId for full context |
| AI Wand context | Query semantically similar memories to provide Claude with relevant world context |

---

## 4. Feature Integrations

### Creative Intent Search

Creative Intent Search (Tier 2) lets writers search their story world by meaning rather than keywords. "Find me scenes where hope dies" should return the scene where the protagonist learns their mentor betrayed them, even if the words "hope" and "dies" never appear.

#### How It Works

The search pipeline combines SuperMemory semantic search with PostgreSQL full-text search, then merges and re-ranks results.

```
User query: "moments of comic relief after tense scenes"
        |
        v
+-------+-------+
|               |
v               v
SuperMemory     PostgreSQL
semantic        tsvector
search          full-text
|               |
v               v
Ranked by       Ranked by
semantic        keyword
similarity      relevance
|               |
v               v
+-------+-------+
        |
        v
  Merge & re-rank
  (weighted fusion)
        |
        v
  Deduplicate by
  entityId
        |
        v
  Return top N
  with snippets
```

#### Query Construction

User intent queries are sent directly to SuperMemory as-is. The SDK handles embedding generation and similarity computation internally. However, for better results, the query is augmented with world context:

```typescript
// src/lib/embeddings/creative-search.ts

interface CreativeSearchOptions {
  worldId: string;
  query: string;          // Raw user query
  filters?: {
    characterIds?: string[];
    arcIds?: string[];
    chapterRange?: { from: number; to: number };
    entityTypes?: string[];
    canonStatus?: 'canon' | 'draft' | 'speculative';
  };
  limit?: number;         // Default 20
}

interface CreativeSearchResult {
  memoryId: string;
  entityId: string;
  entityType: string;
  content: string;
  relevanceScore: number; // 0.0 - 1.0
  source: 'semantic' | 'fulltext' | 'both';
  highlights?: string[];  // Relevant text snippets
}

async function creativeIntentSearch(
  options: CreativeSearchOptions,
): Promise<CreativeSearchResult[]> {
  const { worldId, query, filters, limit = 20 } = options;

  // 1. SuperMemory semantic search
  const semanticResults = await superMemoryClient.search({
    query,
    containerTag: getContainerTag(worldId),
    filters: buildSupermemoryFilters(filters),
    limit: limit * 2, // Over-fetch for merge
  });

  // 2. PostgreSQL full-text search (parallel)
  const fulltextResults = await prisma.$queryRaw`
    SELECT id, entity_type, content,
           ts_rank(search_vector, plainto_tsquery('english', ${query})) as rank
    FROM story_entities
    WHERE world_id = ${worldId}
      AND search_vector @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC
    LIMIT ${limit * 2}
  `;

  // 3. Merge and re-rank
  return mergeAndRank(semanticResults, fulltextResults, limit);
}
```

#### Ranking and Relevance Scoring

Results from both sources are merged using Reciprocal Rank Fusion (RRF):

```typescript
function mergeAndRank(
  semanticResults: SearchResult[],
  fulltextResults: SearchResult[],
  limit: number,
): CreativeSearchResult[] {
  const k = 60; // RRF constant
  const scores = new Map<string, number>();

  // Score semantic results
  semanticResults.forEach((result, index) => {
    const entityId = result.metadata.entityId;
    const currentScore = scores.get(entityId) ?? 0;
    // Semantic results weighted 2x relative to full-text
    scores.set(entityId, currentScore + (2 / (k + index + 1)));
  });

  // Score full-text results
  fulltextResults.forEach((result, index) => {
    const entityId = result.id;
    const currentScore = scores.get(entityId) ?? 0;
    scores.set(entityId, currentScore + (1 / (k + index + 1)));
  });

  // Sort by combined score, deduplicate, take top N
  return Array.from(scores.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([entityId, score]) => buildResult(entityId, score, semanticResults, fulltextResults));
}
```

Semantic results are weighted 2x because Creative Intent Search is specifically about meaning-based queries where keyword matching is insufficient.

#### Example Queries

| User Query | What SuperMemory Returns |
|---|---|
| "scenes where the protagonist feels betrayed" | Memories describing trust violations, deception reveals, emotional reactions to lies -- even if "betrayal" is never mentioned |
| "moments of comic relief" | Memories tagged with humor, levity, or ironic situations; scenes with tonal contrast |
| "foreshadowing of the villain's plan" | Setup memories linked to the antagonist's arc; early clues and subtle hints |
| "quiet character moments in act 2" | Low-action, high-emotional-depth scenes in the middle section of the narrative |
| "themes of isolation and loneliness" | Memories across characters, scenes, and motifs related to solitude, disconnection, abandonment |

---

### Consistency & Contradiction Detection

The Consistency Checker (Tier 2) uses SuperMemory's built-in contradiction detection to automatically flag inconsistencies in the story world. This operates at two tiers of confidence.

#### How SuperMemory Contradiction Detection Works

When a new memory is stored, SuperMemory automatically compares it against existing memories in the same container. If the semantic content of the new memory conflicts with an existing memory, a `contradicts` edge is created between them, along with a confidence score.

```typescript
// Storing a memory that triggers contradiction detection
const result = await superMemoryClient.add({
  content: "Marcus was in London on June 5th, meeting with the Prime Minister",
  containerTag: getContainerTag(worldId),
  metadata: {
    entityType: 'event',
    entityId: eventId,
    characterIds: [marcusId],
    chapterNumber: 12,
    canonStatus: 'canon',
    confidence: 1.0,
    source: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
});

// If a contradiction is detected (e.g., existing memory says
// "Marcus was in Berlin on June 5th"), the result includes:
if (result.contradictions && result.contradictions.length > 0) {
  for (const contradiction of result.contradictions) {
    // contradiction.existingMemoryId -- the memory that conflicts
    // contradiction.confidence -- how confident the detection is
    // contradiction.explanation -- natural-language description
    await flagContradiction(worldId, result.id, contradiction);
  }
}
```

#### Tiered Confidence Model

Not all contradictions are equal. The system uses a tiered model that matches the risk assessment from CLAUDE.md:

**Hard contradictions (automated, high confidence)**:
- Timeline paradoxes: character in two locations at the same time
- State violations: dead character performing actions, destroyed location being visited
- Numerical inconsistencies: character age does not match birth year and current date
- Direct factual conflicts: "Elena has blue eyes" vs. "Elena has brown eyes"

**Soft contradictions (flagged as suggestions, lower confidence)**:
- Behavioral inconsistencies: a character acting out of established personality patterns
- Thematic contradictions: a scene's tone contradicting its stated thematic purpose
- Motivational gaps: a character making a decision without sufficient established motivation
- Voice drift: a character's dialogue patterns diverging from their established voice profile

```typescript
interface ContradictionFlag {
  id: string;
  worldId: string;
  memoryIdA: string;           // First conflicting memory
  memoryIdB: string;           // Second conflicting memory
  tier: 'hard' | 'soft';
  category: ContradictionCategory;
  confidence: number;          // 0.0 - 1.0
  explanation: string;         // Natural-language description
  suggestedResolution?: string;
  status: 'open' | 'resolved' | 'dismissed' | 'wontfix';
  resolvedBy?: string;         // User ID who resolved it
  resolvedAt?: string;
  createdAt: string;
}

type ContradictionCategory =
  | 'timeline_paradox'
  | 'state_violation'
  | 'numerical_inconsistency'
  | 'factual_conflict'
  | 'behavioral_inconsistency'
  | 'thematic_contradiction'
  | 'motivational_gap'
  | 'voice_drift';
```

#### World Rules as Checkable Facts

World rules from the WorldRule entity in PostgreSQL are stored as memories with `entityType: 'worldRule'`. This makes them part of the contradiction detection surface.

```typescript
// When a user defines a world rule
async function storeWorldRule(worldId: string, rule: WorldRule): Promise<void> {
  await superMemoryClient.add({
    content: `WORLD RULE: ${rule.description}. ${rule.constraints}`,
    containerTag: getContainerTag(worldId),
    tags: ['world-rule', rule.category],
    metadata: {
      entityType: 'worldRule',
      entityId: rule.id,
      relatedEntityIds: rule.affectedEntityIds,
      canonStatus: 'canon',
      confidence: 1.0,
      source: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
}

// Example: "WORLD RULE: Magic requires physical contact with a lodestone.
// Any scene depicting magic use must include lodestone contact."
// -> If a memory is later stored describing magic being used without
//    a lodestone, SuperMemory flags the contradiction.
```

#### Automated Checking Pipeline

Consistency checks are triggered at specific points rather than running continuously:

| Trigger | What Gets Checked |
|---|---|
| **New memory stored** | Automatic: SuperMemory's built-in contradiction detection runs against all memories in the container |
| **Entity edited by user** | The updated memory is re-checked against its connected memories (via edges) |
| **Content ingested** | All newly extracted memories are batch-checked after ingestion completes |
| **User requests full check** | Background job (BullMQ) runs a comprehensive sweep of all canon memories in the world |
| **Canon snapshot creation** | Full consistency check is mandatory before a snapshot can be finalized |

```typescript
// src/lib/consistency/checker.ts

async function runFullConsistencyCheck(worldId: string): Promise<ConsistencyReport> {
  const containerTag = getContainerTag(worldId);

  // 1. Fetch all canon memories for the world
  const memories = await superMemoryClient.list({
    containerTag,
    filters: { canonStatus: 'canon' },
  });

  // 2. Group by entity for targeted checking
  const byEntity = groupBy(memories, (m) => m.metadata.entityId);

  // 3. For each entity, check its memories against related entities
  const contradictions: ContradictionFlag[] = [];

  for (const [entityId, entityMemories] of Object.entries(byEntity)) {
    // Get all related entity IDs from edges and metadata
    const relatedIds = collectRelatedIds(entityMemories);

    for (const relatedId of relatedIds) {
      const relatedMemories = byEntity[relatedId] ?? [];
      const conflicts = await superMemoryClient.checkContradictions({
        memories: entityMemories,
        against: relatedMemories,
        containerTag,
      });

      contradictions.push(
        ...conflicts.map((c) => buildContradictionFlag(worldId, c)),
      );
    }
  }

  // 4. Store results and return report
  await storeContradictionFlags(contradictions);

  return {
    worldId,
    checkedAt: new Date().toISOString(),
    totalMemoriesChecked: memories.length,
    hardContradictions: contradictions.filter((c) => c.tier === 'hard').length,
    softContradictions: contradictions.filter((c) => c.tier === 'soft').length,
    contradictions,
  };
}
```

#### Integration with Consistency Checker Dashboard

The Consistency Checker dashboard (`/world/[id]/consistency`) reads contradiction flags from PostgreSQL (where they are persisted after detection) and displays them with:

- Severity indicators (red for hard, yellow for soft)
- Side-by-side view of the two conflicting memories
- One-click navigation to the source entities in the story world
- Resolution actions: fix entity A, fix entity B, dismiss, mark as intentional

---

### Entity Resolution

When content is ingested from multiple sources, the same character may be referenced as "Elena," "Agent Vasquez," "E.V.," or "the woman with the prosthetic hand." Entity resolution uses SuperMemory's semantic similarity to detect these duplicates.

#### Detection Flow

```typescript
// src/lib/analysis/entity-resolution.ts

async function resolveEntity(
  worldId: string,
  candidateDescription: string,
  entityType: string,
): Promise<EntityResolutionResult> {
  // Search for semantically similar existing entities
  const matches = await superMemoryClient.search({
    query: candidateDescription,
    containerTag: getContainerTag(worldId),
    filters: {
      entityType: entityType,
      canonStatus: { in: ['canon', 'draft'] },
    },
    limit: 5,
  });

  if (matches.length === 0 || matches[0].score < SIMILARITY_THRESHOLD) {
    return { action: 'create_new', matches: [] };
  }

  if (matches[0].score > HIGH_CONFIDENCE_THRESHOLD) {
    return {
      action: 'merge_suggested',
      targetEntityId: matches[0].metadata.entityId,
      confidence: matches[0].score,
      matches: matches.map(formatMatch),
    };
  }

  return {
    action: 'review_required',
    matches: matches.map(formatMatch),
  };
}

const SIMILARITY_THRESHOLD = 0.65;      // Below this, treat as new entity
const HIGH_CONFIDENCE_THRESHOLD = 0.90; // Above this, suggest auto-merge
```

#### Merge and Split Operations

When entities are merged, their SuperMemory entries are consolidated:

```typescript
async function mergeEntities(
  worldId: string,
  primaryEntityId: string,
  duplicateEntityId: string,
): Promise<void> {
  const containerTag = getContainerTag(worldId);

  // 1. Fetch all memories for the duplicate entity
  const duplicateMemories = await superMemoryClient.search({
    query: '*',
    containerTag,
    filters: { entityId: duplicateEntityId },
    limit: 1000,
  });

  // 2. Re-associate each memory with the primary entity
  for (const memory of duplicateMemories) {
    await superMemoryClient.update(memory.id, {
      metadata: {
        ...memory.metadata,
        entityId: primaryEntityId,
        relatedEntityIds: memory.metadata.relatedEntityIds
          .map((id) => (id === duplicateEntityId ? primaryEntityId : id)),
      },
    });
  }

  // 3. Update all memories that reference the duplicate in relatedEntityIds
  const referencingMemories = await superMemoryClient.search({
    query: '*',
    containerTag,
    filters: { relatedEntityIds: { contains: duplicateEntityId } },
    limit: 5000,
  });

  for (const memory of referencingMemories) {
    await superMemoryClient.update(memory.id, {
      metadata: {
        ...memory.metadata,
        relatedEntityIds: memory.metadata.relatedEntityIds
          .map((id) => (id === duplicateEntityId ? primaryEntityId : id)),
      },
    });
  }

  // 4. Update PostgreSQL (handled by the calling service)
  // 5. Deprecate the duplicate entity's primary memory
}
```

---

### Revision Impact Analysis

When a writer changes a fact about their story world (e.g., changes a character's backstory), Revision Impact Analysis uses SuperMemory's knowledge graph to compute the cascade of affected entities.

#### Graph Traversal for Dependencies

```typescript
// src/lib/graph/impact-analysis.ts

interface ImpactResult {
  directlyAffected: AffectedEntity[];   // Entities connected by edges
  transitivelyAffected: AffectedEntity[]; // Entities reachable through edge chains
  totalAffected: number;
  severityBreakdown: {
    high: number;   // Direct dependency, will break
    medium: number; // Indirect dependency, may need review
    low: number;    // Tangentially related
  };
}

async function analyzeRevisionImpact(
  worldId: string,
  changedMemoryId: string,
): Promise<ImpactResult> {
  const containerTag = getContainerTag(worldId);

  // 1. Get the changed memory and its edges
  const memory = await superMemoryClient.get(changedMemoryId);
  const edges = await superMemoryClient.getEdges(changedMemoryId);

  // 2. BFS traversal through the knowledge graph
  const visited = new Set<string>();
  const queue: Array<{ memoryId: string; depth: number }> = [];
  const affected: AffectedEntity[] = [];

  // Seed with directly connected memories
  for (const edge of edges) {
    const targetId = edge.fromMemoryId === changedMemoryId
      ? edge.toMemoryId
      : edge.fromMemoryId;

    if (!visited.has(targetId)) {
      visited.add(targetId);
      queue.push({ memoryId: targetId, depth: 1 });
    }
  }

  // Traverse up to MAX_DEPTH levels
  const MAX_DEPTH = 4;

  while (queue.length > 0) {
    const { memoryId, depth } = queue.shift()!;
    const targetMemory = await superMemoryClient.get(memoryId);

    affected.push({
      memoryId,
      entityId: targetMemory.metadata.entityId,
      entityType: targetMemory.metadata.entityType,
      depth,
      severity: depthToSeverity(depth),
      reason: buildImpactReason(memory, targetMemory, depth),
    });

    if (depth < MAX_DEPTH) {
      const nextEdges = await superMemoryClient.getEdges(memoryId);
      for (const edge of nextEdges) {
        const nextId = edge.fromMemoryId === memoryId
          ? edge.toMemoryId
          : edge.fromMemoryId;

        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push({ memoryId: nextId, depth: depth + 1 });
        }
      }
    }
  }

  return buildImpactResult(affected);
}

function depthToSeverity(depth: number): 'high' | 'medium' | 'low' {
  if (depth <= 1) return 'high';
  if (depth <= 2) return 'medium';
  return 'low';
}
```

#### What-If Simulation

The What-If Scenario Engine (Tier 3) builds on impact analysis by creating speculative memory branches:

```typescript
async function createWhatIfBranch(
  worldId: string,
  branchName: string,
  changedFacts: Array<{ memoryId: string; newContent: string }>,
): Promise<WhatIfBranch> {
  const containerTag = getContainerTag(worldId);
  const branchId = generateId();

  // 1. For each changed fact, create a speculative memory
  for (const change of changedFacts) {
    const original = await superMemoryClient.get(change.memoryId);

    await superMemoryClient.add({
      content: change.newContent,
      containerTag,
      tags: ['what-if', `branch:${branchId}`],
      metadata: {
        ...original.metadata,
        canonStatus: 'speculative',
        branchId,
        originalMemoryId: change.memoryId,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  // 2. Run impact analysis on each changed fact
  // 3. Run contradiction detection for the speculative memories
  // 4. Return branch with impact report

  return { branchId, branchName, worldId, impacts: [] /* populated above */ };
}
```

---

## 5. Ingestion Pipeline Integration

### How Ingested Content Becomes Memories

The ingestion pipeline (`src/lib/ingestion/`) processes uploaded files through parsing, analysis, and memory creation.

```
File uploaded
     |
     v
Parse to text (with structure markers)
     |
     v
Chunk into segments (with overlap)
     |
     v
Claude API: entity extraction per chunk
     |
     v
Entity resolution (deduplicate against existing)
     |
     v
Store entities in PostgreSQL (authoritative records)
     |
     v
Store facts as SuperMemory memories (semantic layer)
     |
     v
Run contradiction detection on new memories
     |
     v
Queue for embedding generation (pgvector)
     |
     v
Index for full-text search (tsvector)
```

### SuperMemory Native File Ingestion

SuperMemory natively supports ingesting PDF, DOCX, video (via transcription), audio, and images (via OCR). StoryForge uses this as a complementary path for rapid memory creation, especially for large files:

```typescript
// src/lib/ingestion/supermemory-ingest.ts

async function ingestFileViaSupermemory(
  worldId: string,
  filePath: string,
  sourceMaterialId: string,
): Promise<IngestResult> {
  const containerTag = getContainerTag(worldId);

  // SuperMemory handles parsing, chunking, and memory creation
  const result = await superMemoryClient.ingestFile({
    filePath,
    containerTag,
    metadata: {
      entityType: 'scene', // Default; refined during analysis pass
      sourceRef: { sourceMaterialId },
      canonStatus: 'draft',
      confidence: 0.7, // Lower confidence until user review
      source: 'extraction',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });

  return {
    memoriesCreated: result.memories.length,
    memoriesWithContradictions: result.contradictions.length,
    sourceMaterialId,
  };
}
```

### Chunking Strategy

For large documents processed through the StoryForge pipeline (not SuperMemory native ingestion), the chunking strategy is:

| Content Type | Chunk Strategy | Overlap |
|---|---|---|
| Novel / prose | By chapter, with scene-level sub-chunks | 2 paragraphs overlap between chunks |
| Screenplay | By scene (slug line boundaries) | 1 beat overlap between scenes |
| Transcript (audio/video) | By speaker turn blocks (5-minute windows) | 30 seconds overlap |
| Short text (< 10K tokens) | Single chunk | N/A |

Overlap ensures that entities spanning chunk boundaries are not missed by the extraction model.

### Maintaining Source References

Every memory created from ingested content preserves a link back to its source material:

```typescript
// The sourceRef in memory metadata enables:
// 1. Click-to-source: jump from a memory to the exact position in source material
// 2. Re-extraction: re-run analysis on a specific source passage
// 3. Provenance: track which source contributed which facts

interface SourceReference {
  sourceMaterialId: string;  // FK to SourceMaterial in PostgreSQL
  position?: number;         // Character offset in parsed text
  timeCode?: number;         // Seconds offset for audio/video
  chunkIndex?: number;       // Which chunk this came from
  pageNumber?: number;       // For PDFs
}
```

---

## 6. Data Model

### TypeScript Interfaces

```typescript
// src/types/supermemory.ts

// ---- Core Memory Types ----

export interface StoryMemory {
  id: string;
  content: string;
  containerTag: string;
  tags: string[];
  metadata: StoryMemoryMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface StoryMemoryMetadata {
  entityType: MemoryEntityType;
  entityId: string;
  relatedEntityIds: string[];
  characterIds?: string[];
  arcIds?: string[];
  chapterNumber?: number;
  sceneId?: string;
  sceneRange?: SceneRange;
  canonStatus: CanonStatus;
  confidence: number;
  source: MemorySource;
  sourceRef?: SourceReference;
  branchId?: string;
  originalMemoryId?: string;
}

export type MemoryEntityType =
  | 'character'
  | 'location'
  | 'event'
  | 'relationship'
  | 'worldRule'
  | 'theme'
  | 'motif'
  | 'faction'
  | 'object'
  | 'scene'
  | 'arc'
  | 'causalLink'
  | 'setupPayoff'
  | 'narrativeCode';

export type CanonStatus = 'canon' | 'draft' | 'speculative' | 'deprecated';

export type MemorySource = 'extraction' | 'user' | 'analysis';

export interface SceneRange {
  from: string;
  to?: string;
}

export interface SourceReference {
  sourceMaterialId: string;
  position?: number;
  timeCode?: number;
  chunkIndex?: number;
  pageNumber?: number;
}

// ---- Edge Types ----

export interface MemoryEdge {
  id: string;
  fromMemoryId: string;
  toMemoryId: string;
  edgeType: MemoryEdgeType;
  metadata?: EdgeMetadata;
  createdAt: string;
}

export type MemoryEdgeType =
  | 'updates'
  | 'extends'
  | 'derives'
  | 'contradicts'
  | 'supports'
  | 'causallyPrecedes';

export interface EdgeMetadata {
  confidence: number;
  reason?: string;
}

// ---- Contradiction Types ----

export interface ContradictionFlag {
  id: string;
  worldId: string;
  memoryIdA: string;
  memoryIdB: string;
  tier: 'hard' | 'soft';
  category: ContradictionCategory;
  confidence: number;
  explanation: string;
  suggestedResolution?: string;
  status: ContradictionStatus;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export type ContradictionCategory =
  | 'timeline_paradox'
  | 'state_violation'
  | 'numerical_inconsistency'
  | 'factual_conflict'
  | 'behavioral_inconsistency'
  | 'thematic_contradiction'
  | 'motivational_gap'
  | 'voice_drift';

export type ContradictionStatus = 'open' | 'resolved' | 'dismissed' | 'wontfix';

// ---- Search Types ----

export interface CreativeSearchOptions {
  worldId: string;
  query: string;
  filters?: SearchFilters;
  limit?: number;
}

export interface SearchFilters {
  characterIds?: string[];
  arcIds?: string[];
  chapterRange?: { from: number; to: number };
  entityTypes?: MemoryEntityType[];
  canonStatus?: CanonStatus | CanonStatus[];
  sceneId?: string;
  tags?: string[];
}

export interface CreativeSearchResult {
  memoryId: string;
  entityId: string;
  entityType: MemoryEntityType;
  content: string;
  relevanceScore: number;
  source: 'semantic' | 'fulltext' | 'both';
  highlights?: string[];
}

// ---- Impact Analysis Types ----

export interface AffectedEntity {
  memoryId: string;
  entityId: string;
  entityType: MemoryEntityType;
  depth: number;
  severity: 'high' | 'medium' | 'low';
  reason: string;
}

export interface ImpactResult {
  directlyAffected: AffectedEntity[];
  transitivelyAffected: AffectedEntity[];
  totalAffected: number;
  severityBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
}

// ---- Entity Resolution Types ----

export interface EntityResolutionResult {
  action: 'create_new' | 'merge_suggested' | 'review_required';
  targetEntityId?: string;
  confidence?: number;
  matches: EntityMatch[];
}

export interface EntityMatch {
  entityId: string;
  entityType: MemoryEntityType;
  content: string;
  similarityScore: number;
}

// ---- Ingestion Types ----

export interface IngestResult {
  memoriesCreated: number;
  memoriesWithContradictions: number;
  sourceMaterialId: string;
}

// ---- What-If Branch Types ----

export interface WhatIfBranch {
  branchId: string;
  branchName: string;
  worldId: string;
  changedMemoryIds: string[];
  impacts: ImpactResult;
  contradictions: ContradictionFlag[];
  createdAt: string;
}
```

### Metadata Schemas by Entity Type

Each entity type uses the common `StoryMemoryMetadata` schema but with conventions for which fields are populated:

| Entity Type | Required Metadata | Typical Tags |
|---|---|---|
| `character` | `entityId`, `characterIds` (self) | `character`, character name, aliases |
| `location` | `entityId` | `location`, location name, region |
| `event` | `entityId`, `sceneId`, `characterIds` | `event`, event type (action, dialogue, etc.) |
| `relationship` | `entityId`, `characterIds` (both parties), `sceneRange` | `relationship`, relationship type |
| `worldRule` | `entityId`, `relatedEntityIds` | `world-rule`, rule category |
| `theme` | `entityId`, `arcIds` | `theme`, theme name |
| `setupPayoff` | `entityId`, `relatedEntityIds` (setup + payoff events) | `foreshadowing`, status (orphan, complete) |
| `causalLink` | `entityId`, `relatedEntityIds` (cause + effect) | `causality`, causality type |
| `narrativeCode` | `entityId`, `sceneId` | `narrative-code`, Barthes code type |

### Container Tag Naming Convention

```
storyforge_world_{uuid}                    -- Production world
storyforge_world_{uuid}_branch_{branchId}  -- What-if branch (future extension)
storyforge_world_{uuid}_snapshot_{snapId}  -- Canon snapshot (read-only, future extension)
```

---

## 7. Performance & Scaling

### Latency Requirements

| Operation | Target Latency | Acceptable Max |
|---|---|---|
| Semantic search (Creative Intent) | < 200ms | 300ms |
| Memory storage (single) | < 100ms | 200ms |
| Contradiction check (on store) | < 500ms | 1000ms |
| Full consistency check (1K memories) | < 10s | 30s |
| Full consistency check (10K memories) | < 60s | 180s |
| Impact analysis (4-level BFS) | < 2s | 5s |
| Entity resolution (single candidate) | < 300ms | 500ms |

### Handling Large Worlds (10K+ Memories)

For Game-of-Thrones-scale worlds with thousands of characters and tens of thousands of facts:

1. **Query scoping**: Always pass the most restrictive metadata filters possible. Never query the entire container unfiltered.

2. **Pagination**: All list and search operations use cursor-based pagination with a maximum page size of 100.

3. **Background processing**: Full consistency checks run as BullMQ background jobs, not in the request thread. Progress is reported via WebSocket.

4. **Pre-computed indexes**: For frequently accessed relationships (e.g., "all memories for character X"), maintain a local cache that is invalidated on memory updates.

5. **Progressive loading**: Impact analysis starts with depth 1 results immediately, then progressively expands to depth 2, 3, 4 as results arrive.

### Caching Strategy

```typescript
// src/lib/embeddings/cache.ts

// Layer 1: In-memory LRU cache for hot queries (search results)
// TTL: 60 seconds, max 500 entries per world
const searchCache = new LRUCache<string, CreativeSearchResult[]>({
  max: 500,
  ttl: 60_000,
});

// Layer 2: Redis cache for computed results (impact analysis, consistency reports)
// TTL: 5 minutes, invalidated on memory writes
async function getCachedImpact(memoryId: string): Promise<ImpactResult | null> {
  const cached = await redis.get(`impact:${memoryId}`);
  return cached ? JSON.parse(cached) : null;
}

// Cache invalidation: when a memory is created/updated/deleted,
// invalidate all caches that could be affected
async function invalidateCachesForMemory(
  worldId: string,
  memoryId: string,
): Promise<void> {
  // Clear search cache for the world (broad invalidation)
  searchCache.clear(); // Could be more targeted with tag-based invalidation

  // Clear impact cache for this memory and its neighbors
  const edges = await superMemoryClient.getEdges(memoryId);
  const keysToDelete = [
    `impact:${memoryId}`,
    ...edges.map((e) => `impact:${e.fromMemoryId === memoryId ? e.toMemoryId : e.fromMemoryId}`),
  ];
  await redis.del(...keysToDelete);
}
```

### Background Indexing

When new content is ingested, memory creation and indexing happen asynchronously via BullMQ:

```typescript
// src/lib/ingestion/jobs.ts

import { Queue, Worker } from 'bullmq';

const memoryQueue = new Queue('memory-indexing', { connection: redis });

// Producer: enqueue memory creation after entity extraction
async function enqueueMemoryCreation(
  worldId: string,
  extractedFacts: ExtractedFact[],
): Promise<void> {
  await memoryQueue.add('create-memories', {
    worldId,
    facts: extractedFacts,
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  });
}

// Consumer: process memory creation in the background
const memoryWorker = new Worker('memory-indexing', async (job) => {
  const { worldId, facts } = job.data;

  for (const fact of facts) {
    await superMemoryClient.add({
      content: fact.content,
      containerTag: getContainerTag(worldId),
      tags: fact.tags,
      metadata: fact.metadata,
    });

    // Report progress
    await job.updateProgress((facts.indexOf(fact) + 1) / facts.length * 100);
  }
}, { connection: redis, concurrency: 5 });
```

### Rate Limiting for SuperMemory API

```typescript
// src/lib/embeddings/rate-limiter.ts

import Bottleneck from 'bottleneck';

// SuperMemory rate limits (adjust based on plan)
const limiter = new Bottleneck({
  maxConcurrent: 10,    // Max concurrent requests
  minTime: 50,          // Min 50ms between requests (20 req/sec max)
  reservoir: 1000,      // Max 1000 requests per window
  reservoirRefreshAmount: 1000,
  reservoirRefreshInterval: 60_000, // Window: 1 minute
});

export async function rateLimitedSearch(
  params: SearchParams,
): Promise<SearchResult[]> {
  return limiter.schedule(() => superMemoryClient.search(params));
}

export async function rateLimitedAdd(
  params: AddParams,
): Promise<AddResult> {
  return limiter.schedule(() => superMemoryClient.add(params));
}
```

---

## 8. Configuration

### Environment Variables

```bash
# .env.local

# SuperMemory
SUPERMEMORY_API_KEY=sm_live_xxxxxxxxxxxx  # API key from SuperMemory dashboard
SUPERMEMORY_BASE_URL=https://api.supermemory.com  # Default; override for self-hosted
SUPERMEMORY_TIMEOUT=10000  # Request timeout in ms (default: 10s)

# SuperMemory performance tuning
SUPERMEMORY_MAX_CONCURRENT=10  # Max concurrent API requests
SUPERMEMORY_RATE_LIMIT_PER_MIN=1000  # Requests per minute ceiling
SUPERMEMORY_SEARCH_CACHE_TTL=60  # Search cache TTL in seconds
SUPERMEMORY_SEARCH_CACHE_MAX=500  # Max cached search results

# Feature flags (disable SuperMemory features gracefully)
FEATURE_CREATIVE_SEARCH=true  # Enable Creative Intent Search
FEATURE_CONSISTENCY_CHECK=true  # Enable Consistency Checker
FEATURE_IMPACT_ANALYSIS=true  # Enable Revision Impact Analysis
```

### SDK Initialization

```typescript
// src/lib/supermemory/client.ts

import { SuperMemory } from 'supermemory';

let clientInstance: SuperMemory | null = null;

export function getSuperMemoryClient(): SuperMemory {
  if (!clientInstance) {
    const apiKey = process.env.SUPERMEMORY_API_KEY;

    if (!apiKey) {
      throw new Error(
        'SUPERMEMORY_API_KEY is not set. SuperMemory features will be unavailable. '
        + 'Set the environment variable or disable SuperMemory features via feature flags.',
      );
    }

    clientInstance = new SuperMemory({
      apiKey,
      baseUrl: process.env.SUPERMEMORY_BASE_URL || undefined,
      timeout: parseInt(process.env.SUPERMEMORY_TIMEOUT || '10000', 10),
    });
  }

  return clientInstance;
}

// For testing: allow injecting a mock client
export function setSuperMemoryClient(client: SuperMemory): void {
  clientInstance = client;
}

export function resetSuperMemoryClient(): void {
  clientInstance = null;
}
```

### Error Handling and Retry Strategy

```typescript
// src/lib/supermemory/resilient-client.ts

import { getSuperMemoryClient } from './client';

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 5000,
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Do not retry client errors (4xx)
      if (isClientError(error)) {
        throw error;
      }

      // Do not retry on final attempt
      if (attempt === config.maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        config.baseDelayMs * Math.pow(2, attempt) + Math.random() * 500,
        config.maxDelayMs,
      );

      await sleep(delay);
    }
  }

  throw new SuperMemoryError(
    `Operation failed after ${config.maxRetries + 1} attempts: ${lastError?.message}`,
    lastError,
  );
}

function isClientError(error: unknown): boolean {
  return error instanceof Error && 'status' in error
    && typeof (error as any).status === 'number'
    && (error as any).status >= 400
    && (error as any).status < 500;
}

class SuperMemoryError extends Error {
  constructor(message: string, public readonly cause: Error | null) {
    super(message);
    this.name = 'SuperMemoryError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

### Fallback Behavior When SuperMemory Is Unavailable

If SuperMemory is down or misconfigured, the application degrades gracefully rather than failing entirely:

```typescript
// src/lib/supermemory/fallback.ts

import { getSuperMemoryClient } from './client';
import { withRetry } from './resilient-client';

export async function searchWithFallback(
  worldId: string,
  query: string,
  filters?: SearchFilters,
  limit?: number,
): Promise<CreativeSearchResult[]> {
  try {
    const client = getSuperMemoryClient();
    const results = await withRetry(() =>
      client.search({
        query,
        containerTag: getContainerTag(worldId),
        filters: buildSupermemoryFilters(filters),
        limit: limit ?? 20,
      }),
    );
    return mapToCreativeResults(results, 'semantic');
  } catch (error) {
    console.error('[SuperMemory] Search unavailable, falling back to full-text:', error);

    // Fall back to PostgreSQL full-text search only
    const fulltextResults = await postgresFullTextSearch(worldId, query, filters, limit);
    return mapToCreativeResults(fulltextResults, 'fulltext');
  }
}

export async function storeWithFallback(
  memory: Omit<StoryMemory, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<{ id: string; contradictions: ContradictionFlag[] }> {
  try {
    const client = getSuperMemoryClient();
    const result = await withRetry(() => client.add(memory));
    return { id: result.id, contradictions: result.contradictions ?? [] };
  } catch (error) {
    console.error('[SuperMemory] Store unavailable, queuing for retry:', error);

    // Queue for background retry via BullMQ
    await enqueueMemoryRetry(memory);

    // Return a placeholder -- the memory will be stored when SuperMemory recovers
    return { id: `pending_${Date.now()}`, contradictions: [] };
  }
}
```

| Feature | Behavior When SuperMemory Is Down |
|---|---|
| Creative Intent Search | Falls back to PostgreSQL full-text search only (keyword-based, no semantic) |
| Consistency Checker | Disabled; UI shows "Semantic checking unavailable" banner |
| Entity Resolution | Falls back to Prisma-based fuzzy matching (Levenshtein on names/aliases) |
| Impact Analysis | Disabled; pre-computed results from cache still served if available |
| Ingestion | Memories queued for creation when SuperMemory recovers; extraction proceeds normally |

---

## 9. Code Examples

### Storing a Character Entity as a Memory

```typescript
// src/lib/analysis/store-character.ts

import { getSuperMemoryClient } from '../supermemory/client';
import { withRetry } from '../supermemory/resilient-client';
import { getContainerTag } from '../supermemory/utils';
import type { StoryMemoryMetadata } from '@/types/supermemory';

interface CharacterData {
  id: string;
  worldId: string;
  name: string;
  aliases: string[];
  physicalDescription: string;
  psychologicalProfile: string;
  backstory: string;
  arcIds: string[];
}

async function storeCharacterMemory(character: CharacterData): Promise<string> {
  const client = getSuperMemoryClient();

  // Compose the character's semantic representation
  const content = [
    `Character: ${character.name}`,
    character.aliases.length > 0
      ? `Also known as: ${character.aliases.join(', ')}`
      : null,
    `Physical description: ${character.physicalDescription}`,
    `Psychological profile: ${character.psychologicalProfile}`,
    `Backstory: ${character.backstory}`,
  ]
    .filter(Boolean)
    .join('\n');

  const metadata: StoryMemoryMetadata = {
    entityType: 'character',
    entityId: character.id,
    relatedEntityIds: [],
    characterIds: [character.id],
    arcIds: character.arcIds,
    canonStatus: 'canon',
    confidence: 1.0,
    source: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const result = await withRetry(() =>
    client.add({
      content,
      containerTag: getContainerTag(character.worldId),
      tags: ['character', character.name, ...character.aliases],
      metadata,
    }),
  );

  // Check for contradictions with existing character data
  if (result.contradictions && result.contradictions.length > 0) {
    console.warn(
      `[SuperMemory] ${result.contradictions.length} contradiction(s) detected for character ${character.name}`,
    );
    // Contradictions are automatically flagged; the Consistency Checker will display them
  }

  return result.id;
}
```

### Querying for Semantically Similar Scenes

```typescript
// src/lib/embeddings/scene-search.ts

import { getSuperMemoryClient } from '../supermemory/client';
import { getContainerTag } from '../supermemory/utils';

interface SceneSearchOptions {
  worldId: string;
  query: string;
  characterId?: string;
  chapterRange?: { from: number; to: number };
  limit?: number;
}

interface SceneSearchResult {
  sceneId: string;
  content: string;
  relevanceScore: number;
  chapterNumber?: number;
  characterIds: string[];
}

async function findSimilarScenes(
  options: SceneSearchOptions,
): Promise<SceneSearchResult[]> {
  const { worldId, query, characterId, chapterRange, limit = 10 } = options;
  const client = getSuperMemoryClient();

  const filters: Record<string, any> = {
    entityType: { in: ['scene', 'event'] },
    canonStatus: 'canon',
  };

  if (characterId) {
    filters.characterIds = { contains: characterId };
  }

  if (chapterRange) {
    filters.chapterNumber = {
      gte: chapterRange.from,
      lte: chapterRange.to,
    };
  }

  const results = await client.search({
    query,
    containerTag: getContainerTag(worldId),
    filters,
    limit,
  });

  return results.map((r) => ({
    sceneId: r.metadata.sceneId ?? r.metadata.entityId,
    content: r.content,
    relevanceScore: r.score,
    chapterNumber: r.metadata.chapterNumber,
    characterIds: r.metadata.characterIds ?? [],
  }));
}

// Usage examples:

// Find scenes with emotional similarity
// findSimilarScenes({
//   worldId: 'abc-123',
//   query: 'quiet desperation and acceptance of fate',
//   limit: 5,
// });

// Find scenes for a specific character
// findSimilarScenes({
//   worldId: 'abc-123',
//   query: 'confrontation and power struggle',
//   characterId: 'char-456',
//   chapterRange: { from: 5, to: 15 },
// });
```

### Running a Contradiction Check

```typescript
// src/lib/consistency/run-check.ts

import { getSuperMemoryClient } from '../supermemory/client';
import { getContainerTag } from '../supermemory/utils';
import type { ContradictionFlag, ContradictionCategory } from '@/types/supermemory';
import { prisma } from '../db/client';

interface ConsistencyReport {
  worldId: string;
  checkedAt: string;
  totalMemoriesChecked: number;
  hardContradictions: number;
  softContradictions: number;
  contradictions: ContradictionFlag[];
}

async function runConsistencyCheck(worldId: string): Promise<ConsistencyReport> {
  const client = getSuperMemoryClient();
  const containerTag = getContainerTag(worldId);

  // Fetch all canon memories
  let allMemories: any[] = [];
  let cursor: string | undefined;

  do {
    const page = await client.list({
      containerTag,
      filters: { canonStatus: 'canon' },
      limit: 100,
      cursor,
    });
    allMemories = allMemories.concat(page.results);
    cursor = page.nextCursor;
  } while (cursor);

  // Run pairwise contradiction detection on related entities
  const contradictions: ContradictionFlag[] = [];

  // Group memories by primary entity
  const byEntity = new Map<string, any[]>();
  for (const memory of allMemories) {
    const entityId = memory.metadata.entityId;
    if (!byEntity.has(entityId)) {
      byEntity.set(entityId, []);
    }
    byEntity.get(entityId)!.push(memory);
  }

  // Check each entity's memories against related entities' memories
  for (const [entityId, memories] of byEntity) {
    const relatedIds = new Set<string>();
    for (const m of memories) {
      for (const rid of m.metadata.relatedEntityIds ?? []) {
        relatedIds.add(rid);
      }
    }

    for (const relatedId of relatedIds) {
      const relatedMemories = byEntity.get(relatedId) ?? [];
      if (relatedMemories.length === 0) continue;

      const result = await client.checkContradictions({
        memories,
        against: relatedMemories,
        containerTag,
      });

      for (const c of result) {
        contradictions.push({
          id: crypto.randomUUID(),
          worldId,
          memoryIdA: c.memoryIdA,
          memoryIdB: c.memoryIdB,
          tier: c.confidence > 0.8 ? 'hard' : 'soft',
          category: classifyContradiction(c),
          confidence: c.confidence,
          explanation: c.explanation,
          suggestedResolution: c.suggestion ?? undefined,
          status: 'open',
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  // Persist contradiction flags to PostgreSQL for dashboard display
  if (contradictions.length > 0) {
    await prisma.contradictionFlag.createMany({
      data: contradictions.map((c) => ({
        id: c.id,
        worldId: c.worldId,
        memoryIdA: c.memoryIdA,
        memoryIdB: c.memoryIdB,
        tier: c.tier,
        category: c.category,
        confidence: c.confidence,
        explanation: c.explanation,
        suggestedResolution: c.suggestedResolution,
        status: c.status,
      })),
      skipDuplicates: true,
    });
  }

  const report: ConsistencyReport = {
    worldId,
    checkedAt: new Date().toISOString(),
    totalMemoriesChecked: allMemories.length,
    hardContradictions: contradictions.filter((c) => c.tier === 'hard').length,
    softContradictions: contradictions.filter((c) => c.tier === 'soft').length,
    contradictions,
  };

  return report;
}

function classifyContradiction(
  contradiction: any,
): ContradictionCategory {
  const explanation = contradiction.explanation.toLowerCase();

  if (explanation.includes('timeline') || explanation.includes('date') || explanation.includes('time')) {
    return 'timeline_paradox';
  }
  if (explanation.includes('dead') || explanation.includes('alive') || explanation.includes('destroyed')) {
    return 'state_violation';
  }
  if (explanation.includes('age') || explanation.includes('number') || explanation.includes('count')) {
    return 'numerical_inconsistency';
  }
  if (explanation.includes('behavior') || explanation.includes('personality') || explanation.includes('character')) {
    return 'behavioral_inconsistency';
  }
  if (explanation.includes('theme') || explanation.includes('tone') || explanation.includes('mood')) {
    return 'thematic_contradiction';
  }
  if (explanation.includes('motivation') || explanation.includes('reason') || explanation.includes('why')) {
    return 'motivational_gap';
  }
  if (explanation.includes('voice') || explanation.includes('dialogue') || explanation.includes('speech')) {
    return 'voice_drift';
  }

  return 'factual_conflict';
}
```

### Performing Creative Intent Search

```typescript
// src/lib/embeddings/creative-search.ts

import { getSuperMemoryClient } from '../supermemory/client';
import { getContainerTag } from '../supermemory/utils';
import { prisma } from '../db/client';
import type {
  CreativeSearchOptions,
  CreativeSearchResult,
  SearchFilters,
} from '@/types/supermemory';

export async function creativeIntentSearch(
  options: CreativeSearchOptions,
): Promise<CreativeSearchResult[]> {
  const { worldId, query, filters, limit = 20 } = options;

  // 1. SuperMemory semantic search
  const semanticPromise = semanticSearch(worldId, query, filters, limit * 2);

  // 2. PostgreSQL full-text search (run in parallel)
  const fulltextPromise = fullTextSearch(worldId, query, filters, limit * 2);

  const [semanticResults, fulltextResults] = await Promise.all([
    semanticPromise,
    fulltextPromise,
  ]);

  // 3. Merge using Reciprocal Rank Fusion
  return mergeResults(semanticResults, fulltextResults, limit);
}

async function semanticSearch(
  worldId: string,
  query: string,
  filters?: SearchFilters,
  limit?: number,
): Promise<Array<{ entityId: string; content: string; score: number; entityType: string }>> {
  const client = getSuperMemoryClient();

  const smFilters: Record<string, any> = {
    canonStatus: 'canon',
  };

  if (filters?.characterIds?.length) {
    smFilters.characterIds = { containsAny: filters.characterIds };
  }
  if (filters?.arcIds?.length) {
    smFilters.arcIds = { containsAny: filters.arcIds };
  }
  if (filters?.chapterRange) {
    smFilters.chapterNumber = {
      gte: filters.chapterRange.from,
      lte: filters.chapterRange.to,
    };
  }
  if (filters?.entityTypes?.length) {
    smFilters.entityType = { in: filters.entityTypes };
  }
  if (filters?.canonStatus) {
    smFilters.canonStatus = Array.isArray(filters.canonStatus)
      ? { in: filters.canonStatus }
      : filters.canonStatus;
  }

  const results = await client.search({
    query,
    containerTag: getContainerTag(worldId),
    filters: smFilters,
    limit: limit ?? 40,
  });

  return results.map((r) => ({
    entityId: r.metadata.entityId,
    content: r.content,
    score: r.score,
    entityType: r.metadata.entityType,
  }));
}

async function fullTextSearch(
  worldId: string,
  query: string,
  filters?: SearchFilters,
  limit?: number,
): Promise<Array<{ entityId: string; content: string; rank: number; entityType: string }>> {
  // Build WHERE clauses based on filters
  const whereConditions = [`world_id = '${worldId}'`];
  whereConditions.push(`search_vector @@ plainto_tsquery('english', '${query}')`);

  if (filters?.entityTypes?.length) {
    whereConditions.push(
      `entity_type IN (${filters.entityTypes.map((t) => `'${t}'`).join(', ')})`,
    );
  }

  const results = await prisma.$queryRawUnsafe<
    Array<{ id: string; entity_type: string; content: string; rank: number }>
  >(
    `SELECT id, entity_type, content,
            ts_rank(search_vector, plainto_tsquery('english', $1)) as rank
     FROM story_entities
     WHERE ${whereConditions.join(' AND ')}
     ORDER BY rank DESC
     LIMIT $2`,
    query,
    limit ?? 40,
  );

  return results.map((r) => ({
    entityId: r.id,
    content: r.content,
    rank: r.rank,
    entityType: r.entity_type,
  }));
}

function mergeResults(
  semanticResults: Array<{ entityId: string; content: string; score: number; entityType: string }>,
  fulltextResults: Array<{ entityId: string; content: string; rank: number; entityType: string }>,
  limit: number,
): CreativeSearchResult[] {
  const K = 60; // RRF constant
  const scores = new Map<string, { score: number; content: string; entityType: string; source: Set<string> }>();

  // Semantic results (weighted 2x)
  semanticResults.forEach((result, index) => {
    const existing = scores.get(result.entityId);
    const rrf = 2 / (K + index + 1);
    if (existing) {
      existing.score += rrf;
      existing.source.add('semantic');
    } else {
      scores.set(result.entityId, {
        score: rrf,
        content: result.content,
        entityType: result.entityType,
        source: new Set(['semantic']),
      });
    }
  });

  // Full-text results (weighted 1x)
  fulltextResults.forEach((result, index) => {
    const existing = scores.get(result.entityId);
    const rrf = 1 / (K + index + 1);
    if (existing) {
      existing.score += rrf;
      existing.source.add('fulltext');
    } else {
      scores.set(result.entityId, {
        score: rrf,
        content: result.content,
        entityType: result.entityType,
        source: new Set(['fulltext']),
      });
    }
  });

  // Sort and return top N
  return Array.from(scores.entries())
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, limit)
    .map(([entityId, data]) => ({
      memoryId: entityId, // Will be resolved to actual memory ID if needed
      entityId,
      entityType: data.entityType as any,
      content: data.content,
      relevanceScore: data.score,
      source: data.source.size === 2
        ? 'both' as const
        : (data.source.has('semantic') ? 'semantic' as const : 'fulltext' as const),
    }));
}

// ---- API Route Handler ----

// src/app/api/search/creative/route.ts
// export async function POST(request: Request) {
//   const body = await request.json();
//   const { worldId, query, filters, limit } = body;
//
//   if (!worldId || !query) {
//     return Response.json(
//       { error: 'worldId and query are required', code: 'MISSING_PARAMS' },
//       { status: 400 },
//     );
//   }
//
//   const results = await creativeIntentSearch({ worldId, query, filters, limit });
//   return Response.json({ results });
// }
```
