# StoryForge Database Schema Architecture

## Overview

The StoryForge database schema is a comprehensive **narrative ontology** -- a relational model capable of representing any story across any narrative framework. It is implemented in PostgreSQL via Prisma ORM with extensions for vector similarity search (pgvector) and trigram matching (pg_trgm).

The schema contains **45+ entity types** organized into six domains:

| Domain | Entity Count | Purpose |
|---|---|---|
| Auth & User | 3 | Authentication, sessions, accounts |
| Core Entities | 15+ | Fundamental story building blocks |
| Structural Layers | 9+ | Narrative framework overlays |
| Analytical Annotations | 10 | Deep narrative analysis data |
| World Systems | 3 | Custom world rules, calendars, magic |
| Meta-structural | 5 | Narration, genre, pattern |
| Writing & Collaboration | 5+ | Manuscripts, treatments, wiki, comments |

---

## Data Model Philosophy

### 1. Story-as-Data

Narratives are not flat documents -- they are structured relational knowledge graphs. Every character, event, location, theme, and relationship is a first-class entity with typed connections to other entities. This enables programmatic querying ("show me every scene where Character A and Character B are in the same location") that is impossible with document-based tools.

### 2. World-Scoped Isolation

Every entity belongs to a `StoryWorld`. This is the top-level container that provides complete data isolation. A user can maintain multiple story worlds without any cross-contamination. The `worldId` foreign key appears on every content entity and is indexed for fast scoped queries. For the SuperMemory integration, each world maps to its own `containerTag`.

### 3. Temporal Relationships

Relationships between characters are not static. In a long-running narrative, allies become enemies, lovers become strangers, mentors die. The `Relationship` model includes `validFromSceneId` and `validToSceneId` fields that scope a relationship to a specific range of the narrative. Querying "what is the relationship between A and B during Act 2?" becomes a direct database query rather than application-level inference.

This pattern extends to `NarrativeRole` (a character's archetype changes per scene), `FactionMember` (characters join and leave organizations), and `FactionRelation` (alliances shift over time).

### 4. Dual Timeline (Fabula / Sjuzhet)

The schema enforces the fundamental narratological distinction between:

- **Fabula** (chronological truth): What actually happened, in the order it actually happened within the story world.
- **Sjuzhet** (narrative presentation): The order in which the reader/viewer encounters events.

Every `Event` has both `fabulaOrder` and `sjuzhetOrder` fields. The `FabulaTimeline` and `SjuzhetTimeline` models with their respective `Entry` tables provide detailed timeline management. The sjuzhet entries include Genette's narrative time categories (order type, duration, frequency) for precise narratological analysis.

### 5. Structure-Agnostic Framework Overlays

The `StructureTemplate` / `StructureBeat` / `StructureMapping` trio allows ANY narrative framework to be applied as a lens on the same story data. A Hero's Journey template, a Save the Cat template, and a Kishotenketsu template can all simultaneously map to the same scenes and beats. Templates are data-driven (JSON definitions), not hardcoded. Built-in templates ship with the platform; users can create custom templates.

### 6. Proposed-then-Confirmed Entity Flow

AI-extracted entities (characters, locations, events, relationships) start in a `PROPOSED` state. Users review and move them to `CONFIRMED` or `REJECTED`. The `EntityConfirmationStatus` enum gates this workflow, ensuring the human always has final authority over what enters the story world.

### 7. Polymorphic Annotations

Several models use polymorphic patterns to attach to multiple entity types:

- `EntityAnnotation`: Links source material spans to characters, locations, events, or objects via optional foreign keys.
- `Comment`: Uses `entityType` + `entityId` string fields to attach to any entity in the system.
- `SetupPayoff`: Links to events or objects on both the setup and payoff side.

---

## Entity Relationship Diagram (Text-Based)

```
USER DOMAIN
===========
User
 |-- owns --> StoryWorld (1:N)
 |-- collaborates --> WorldCollaborator (1:N) --> StoryWorld
 |-- has --> Session (1:N)
 |-- has --> Account (1:N)
 |-- writes --> Comment (1:N)


STORYWORLD (Top-Level Container)
================================
StoryWorld
 |
 |-- CORE ENTITIES
 |    |-- Character (1:N)
 |    |    |-- NarrativeRole (1:N, temporal)
 |    |    |-- SceneCharacter (N:M junction with Scene)
 |    |    |-- BeatCharacter (N:M junction with Beat)
 |    |    |-- EmotionalState (1:N, per scene)
 |    |    |-- VoiceProfile (1:1)
 |    |    |-- FactionMember (N:M junction with Faction)
 |    |    |-- Relationship as source (1:N)
 |    |    |-- Relationship as target (1:N)
 |    |    |-- Focalization (1:N)
 |    |    |-- AudienceKnowledge (1:N)
 |    |    |-- EntityAnnotation (1:N)
 |    |
 |    |-- Event (1:N)
 |    |    |-- FabulaEntry (N:M with FabulaTimeline)
 |    |    |-- SjuzhetEntry (N:M with SjuzhetTimeline)
 |    |    |-- CausalRelation as cause (1:N)
 |    |    |-- CausalRelation as effect (1:N)
 |    |    |-- SetupPayoff as setup (1:N)
 |    |    |-- SetupPayoff as payoff (1:N)
 |    |    |-- AudienceKnowledge reveals (1:N)
 |    |    |-- EntityAnnotation (1:N)
 |    |
 |    |-- Scene (1:N)
 |    |    |-- Event (1:N)
 |    |    |-- Beat (1:N)
 |    |    |-- SceneCharacter (junction)
 |    |    |-- SceneTheme (junction)
 |    |    |-- ValueChange (1:N)
 |    |    |-- PacingMetric (1:1)
 |    |    |-- EmotionalState (1:N per character)
 |    |    |-- NarrativeCode (1:N)
 |    |    |-- Focalization (1:N)
 |    |    |-- StructureMapping (1:N)
 |    |    |-- [temporal scope target for: NarrativeRole, Relationship, ArcPhase]
 |    |
 |    |-- Beat (1:N)
 |    |    |-- BeatCharacter (junction)
 |    |    |-- StructureMapping (1:N)
 |    |
 |    |-- Sequence (1:N) --> contains Scene (1:N)
 |    |-- Act (1:N) --> contains Sequence (1:N)
 |    |
 |    |-- Location (1:N, self-referencing hierarchy)
 |    |    |-- Event (1:N)
 |    |    |-- Scene (1:N)
 |    |    |-- EntityAnnotation (1:N)
 |    |
 |    |-- StoryObject (1:N)
 |    |    |-- SetupPayoff as setup/payoff (1:N each)
 |    |    |-- EntityAnnotation (1:N)
 |    |
 |    |-- Theme (1:N)
 |    |    |-- SceneTheme (junction)
 |    |    |-- Motif (1:N)
 |    |    |-- ThematicOpposition (1:N)
 |    |
 |    |-- Motif (1:N) --> belongs to Theme
 |    |
 |    |-- Faction (1:N)
 |    |    |-- FactionMember (junction with Character)
 |    |    |-- FactionRelation as source/target (1:N each)
 |    |
 |    |-- Relationship (1:N, temporal, between Characters)
 |    |-- SourceMaterial (1:N) --> EntityAnnotation (1:N)
 |
 |-- STRUCTURAL LAYERS
 |    |-- FabulaTimeline (1:1) --> FabulaEntry (1:N) --> Event
 |    |-- SjuzhetTimeline (1:1) --> SjuzhetEntry (1:N) --> Event
 |    |-- StructureTemplate (1:N) --> StructureBeat (1:N)
 |    |-- StructureMapping (1:N) --> links StructureBeat to Scene/Beat
 |    |-- Arc (1:N) --> ArcPhase (1:N, references start/end Scene)
 |    |-- CanonSnapshot (1:N) --> Branch (1:N) --> Event (1:N)
 |
 |-- ANALYTICAL ANNOTATIONS
 |    |-- ValueChange (1:N, per Scene)
 |    |-- NarrativeCode (1:N, per Scene)
 |    |-- Enigma (1:N)
 |    |-- SetupPayoff (1:N, links Event/Object pairs)
 |    |-- ThematicOpposition (1:N, per Theme)
 |    |-- PacingMetric (1:1 per Scene)
 |    |-- EmotionalState (1:1 per Character per Scene)
 |    |-- CausalRelation (1:N, between Events)
 |    |-- VoiceProfile (1:1 per Character)
 |    |-- AudienceKnowledge (1:N)
 |
 |-- WORLD SYSTEMS
 |    |-- CalendarSystem (1:N)
 |    |-- MagicSystem (1:N)
 |    |-- WorldRule (1:N)
 |
 |-- META-STRUCTURAL
 |    |-- Narrator (1:N)
 |    |-- Focalization (1:N, per Scene, links to Character)
 |    |-- NarrativeLevel (1:N, self-referencing hierarchy)
 |    |-- GenreType (1:N)
 |    |-- StoryPattern (1:N)
 |
 |-- WRITING & WIKI
 |    |-- Manuscript (1:N) --> Chapter (1:N)
 |    |-- Treatment (1:N)
 |    |-- WikiArticle (1:N)
 |    |-- Comment (1:N, polymorphic)
```

---

## Key Design Decisions

### 1. PostgreSQL as Single Database

Rather than splitting between a relational database and a separate graph database (Neo4j, etc.), the schema uses PostgreSQL for everything. Graph traversals (impact analysis, causality chains, relationship paths) are handled via recursive CTEs. This eliminates operational complexity (one database to back up, monitor, and scale) while PostgreSQL's recursive CTE performance is adequate for story worlds up to the "Game of Thrones" scale (~1000 characters, ~100K relationships).

For graphs exceeding this scale, the application layer pre-computes dependency indexes via BullMQ background jobs.

### 2. JSON Fields for Flexible Sub-structures

Several entities use `Json` columns for data that is inherently schema-flexible:

- `Character.physicalTraits` / `psychologicalProfile`: Supports 100+ configurable attributes without 100 columns.
- `StructureTemplate.definition`: Each framework has different beat structures.
- `CalendarSystem.definition`: Custom calendars vary wildly (different day counts, month names, eras).
- `MagicSystem.rules/costs/limitations`: Every magic system is unique.
- `SourceMaterial.transcript`: Time-coded segments with variable structure.
- `Enigma.clues`: Variable-length array of clue entries.

These fields trade strict schema enforcement for flexibility. The application layer validates JSON shapes via TypeScript types and Zod schemas.

### 3. Unsupported Types for pgvector and tsvector

Prisma does not natively support PostgreSQL's `vector` (pgvector) or `tsvector` types. These are declared as `Unsupported("vector(1536)")` and `Unsupported("tsvector")` respectively. They are managed via raw SQL in migrations and populated by application-level code (the embedding pipeline and full-text indexing triggers).

- **vector(1536)**: Used on Character, Event, Location, and WikiArticle for semantic / creative intent search.
- **tsvector**: Used on StoryWorld, Character, Event, Location, Scene, Beat, SourceMaterial, Faction, MagicSystem, Manuscript, and WikiArticle for full-text keyword search.

### 4. Polymorphic Comments via String Type + ID

The `Comment` model uses `entityType` (string) + `entityId` (string) rather than separate foreign keys for every possible target entity. This avoids adding dozens of nullable FKs and allows comments on any entity in the system. The trade-off is that referential integrity is enforced at the application level rather than the database level.

### 5. Entity Annotations via Optional FKs

The `EntityAnnotation` model (linking source material spans to extracted entities) uses optional foreign keys (`characterId`, `locationId`, `eventId`, `storyObjectId`) rather than a polymorphic string approach. This preserves referential integrity while allowing an annotation to point to any one entity type.

### 6. Separate Junction Tables for N:M Relations

Rather than using implicit many-to-many relations, explicit junction tables (`SceneCharacter`, `BeatCharacter`, `FactionMember`, `SceneTheme`) are used. This allows storing additional data on the relationship (e.g., `SceneCharacter.sceneRole`, `FactionMember.rank`, `SceneTheme.intensity`).

### 7. One-to-One Timelines per World

Each `StoryWorld` has exactly one `FabulaTimeline` and one `SjuzhetTimeline` (enforced by `@unique` on `worldId`). Events are linked to entries in each timeline, and entries carry additional metadata (Genette's narrative time categories for sjuzhet entries, in-world dates for fabula entries).

---

## Indexing Strategy

### Primary Access Patterns

The most common queries in StoryForge are world-scoped: "give me all characters in world X", "give me all scenes in world X sorted by order." Every content entity has a composite index on `[worldId]` at minimum.

### Composite Indexes

| Index | Purpose |
|---|---|
| `Character(worldId, name)` | Look up characters by name within a world |
| `Event(worldId, fabulaOrder)` | Chronological event listing |
| `Event(worldId, sjuzhetOrder)` | Narrative-order event listing |
| `Scene(worldId, sortOrder)` | Ordered scene listing |
| `Beat(worldId, sortOrder)` | Beat sheet ordering |
| `Sequence(worldId, sortOrder)` | Sequence ordering |
| `Act(worldId, sortOrder)` | Act ordering |
| `Relationship(worldId, relationshipType)` | Filter relationships by type |
| `FabulaEntry(timelineId, sortOrder)` | Timeline entry ordering |
| `SjuzhetEntry(timelineId, sortOrder)` | Timeline entry ordering |
| `StructureBeat(templateId, sortOrder)` | Template beat ordering |
| `CanonSnapshot(worldId, createdAt)` | Snapshot history |
| `WikiArticle(worldId, title)` | Wiki article lookup |
| `Manuscript(worldId, sortOrder)` | Manuscript ordering |
| `Chapter(manuscriptId, sortOrder)` | Chapter ordering |
| `ArcPhase(arcId, sortOrder)` | Arc phase ordering |

### Foreign Key Indexes

Every foreign key column has a dedicated index. This is critical for:

- Cascade deletes (deleting a world must efficiently find all child entities).
- Join performance (character relationship lookups, scene-character lookups).
- Temporal scope lookups (`validFromSceneId`, `validToSceneId`).

### Search Indexes

Full-text and vector indexes are created via raw SQL migrations, not in the Prisma schema (due to `Unsupported` type limitations):

```sql
-- Full-text search indexes (created in migration)
CREATE INDEX idx_character_search ON "Character" USING GIN ("searchVector");
CREATE INDEX idx_event_search ON "Event" USING GIN ("searchVector");
CREATE INDEX idx_scene_search ON "Scene" USING GIN ("searchVector");
CREATE INDEX idx_source_material_search ON "SourceMaterial" USING GIN ("searchVector");
CREATE INDEX idx_wiki_search ON "WikiArticle" USING GIN ("searchVector");

-- Vector similarity indexes (created in migration)
CREATE INDEX idx_character_embedding ON "Character" USING ivfflat ("embedding" vector_cosine_ops);
CREATE INDEX idx_event_embedding ON "Event" USING ivfflat ("embedding" vector_cosine_ops);
CREATE INDEX idx_location_embedding ON "Location" USING ivfflat ("embedding" vector_cosine_ops);
CREATE INDEX idx_wiki_embedding ON "WikiArticle" USING ivfflat ("embedding" vector_cosine_ops);
```

### Unique Constraints as Indexes

Several unique constraints double as indexes:

| Constraint | Purpose |
|---|---|
| `SceneCharacter(sceneId, characterId)` | Prevent duplicate character-scene links |
| `BeatCharacter(beatId, characterId)` | Prevent duplicate character-beat links |
| `FactionMember(factionId, characterId)` | One membership per character per faction |
| `SceneTheme(sceneId, themeId)` | One theme entry per scene |
| `EmotionalState(characterId, sceneId)` | One emotional state per character per scene |
| `PacingMetric(sceneId)` | One pacing metric per scene |
| `VoiceProfile(characterId)` | One voice profile per character |
| `WikiArticle(worldId, slug)` | Unique slugs within a world |
| `WorldCollaborator(userId, worldId)` | One collaboration record per user per world |

---

## Migration Strategy

### Initial Migration

The initial migration is generated via `npx prisma migrate dev --name init`. Because the schema uses `Unsupported` types, post-migration raw SQL is required to:

1. Enable the `vector` and `pg_trgm` extensions.
2. Add `tsvector` column triggers for automatic full-text index updates.
3. Create GIN indexes on `tsvector` columns.
4. Create IVFFlat indexes on `vector` columns.
5. Seed built-in `StructureTemplate` records (Hero's Journey, Save the Cat, etc.).

### Ongoing Migrations

- Always use `npx prisma migrate dev --name descriptive_name`.
- Never modify a migration that has been applied to any shared environment.
- For `Unsupported` columns, create companion raw SQL migration files.
- Test migrations against a copy of production data before applying.

### Seeding

Built-in data seeded on first migration:

1. **Structure Templates**: Hero's Journey (17 beats), Save the Cat (15 beats), Dan Harmon Story Circle (8 beats), Kishotenketsu (4 beats), Freytag's Pyramid (5 beats), Seven-Point (7 beats), Todorov Equilibrium (5 beats), Dramatica (4 throughlines), Propp Morphology (31 functions).
2. **Genre Types**: All 10 Blake Snyder classifications with required components.

---

## Performance Considerations for Large Worlds

The schema is designed to support "Game of Thrones"-scale worlds: 1000+ characters, 10K+ events, 100K+ relationships. Here are the strategies for each bottleneck.

### 1. Character Relationship Queries

**Problem**: A world with 1000 characters and 100K relationships makes naive "get all relationships" queries expensive.

**Solution**:
- Relationships are indexed by `worldId`, `sourceCharacterId`, `targetCharacterId`, and `relationshipType`.
- The application layer implements progressive disclosure: load only the top N characters by `importance` field, then expand on user interaction.
- Temporal filtering (`validFromSceneId`/`validToSceneId`) allows querying only relationships active at a specific narrative point.

### 2. Cascade / Impact Analysis

**Problem**: "What happens if I change Character X's backstory?" requires traversing the entire dependency graph.

**Solution**:
- `CausalRelation` provides explicit, indexed causal links between events.
- Recursive CTEs traverse the causal graph:
  ```sql
  WITH RECURSIVE impact AS (
    SELECT "effectEventId" as "eventId", 1 as depth
    FROM "CausalRelation"
    WHERE "causeEventId" = $1
    UNION
    SELECT cr."effectEventId", i.depth + 1
    FROM "CausalRelation" cr
    JOIN impact i ON cr."causeEventId" = i."eventId"
    WHERE i.depth < 10  -- depth limit
  )
  SELECT * FROM impact;
  ```
- For worlds exceeding ~10K events, a pre-computed dependency index is maintained by BullMQ background workers and stored in Redis for sub-second lookups.

### 3. Timeline Rendering

**Problem**: Rendering a dual timeline with thousands of events is slow.

**Solution**:
- `FabulaEntry` and `SjuzhetEntry` have composite indexes on `(timelineId, sortOrder)` for efficient range queries.
- The application implements zoom-level pagination: at the series level, only show acts; at the episode level, show scenes; at the scene level, show beats.
- Events have a `significance` field (0.0-1.0) allowing low-significance events to be filtered out at high zoom levels.

### 4. Full-Text Search

**Problem**: Searching across all entities in a large world must be fast.

**Solution**:
- `tsvector` columns with GIN indexes provide sub-100ms full-text search.
- Search is scoped by `worldId` first (using the B-tree index), then filtered by tsvector match.
- For creative intent / semantic search, pgvector embeddings with IVFFlat indexes provide approximate nearest neighbor search in sub-300ms.

### 5. Canon Snapshots

**Problem**: Serializing an entire world state for a snapshot could be gigabytes.

**Solution**:
- `CanonSnapshot.snapshotData` stores a JSON delta, not a full copy. The full state is reconstructed by replaying deltas from a base snapshot.
- Alternatively, snapshots store only entity IDs and their version hashes; full data is read from the current tables with version filtering.
- Snapshot creation is a background job via BullMQ.

### 6. Concurrent Collaboration

**Problem**: Multiple writers editing the same world simultaneously.

**Solution**:
- Text editing uses Yjs (CRDT-based) for conflict-free merging at the character level.
- Entity-level changes use optimistic concurrency via `updatedAt` timestamps. If two writers modify the same character, the second writer receives a conflict notification.
- `WorldCollaborator.role` and `visibleEntityIds` (fog-of-war) limit what each collaborator can see and edit, reducing contention.

### 7. Ingestion Pipeline

**Problem**: Ingesting a 500K-word novel generates thousands of entity extraction API calls.

**Solution**:
- All ingestion runs asynchronously via BullMQ job queues (tracked by `SourceMaterial.ingestionJobId`).
- The pipeline chunks source material with overlap for context continuity.
- Extracted entities start as `PROPOSED` and are batched for user review.
- `EntityAnnotation` preserves the exact source span for each extraction, enabling user verification.

---

## Entity Count Summary

| Category | Models |
|---|---|
| Auth | User, Account, Session |
| Core | StoryWorld, Character, NarrativeRole, Event, Scene, Beat, Sequence, Act, Location, StoryObject, Theme, Motif, Faction, Relationship, SourceMaterial |
| Junctions | SceneCharacter, BeatCharacter, FactionMember, FactionRelation, SceneTheme, EntityAnnotation |
| Structural | FabulaTimeline, FabulaEntry, SjuzhetTimeline, SjuzhetEntry, StructureTemplate, StructureBeat, StructureMapping, Arc, ArcPhase, CanonSnapshot, Branch |
| Analytical | ValueChange, NarrativeCode, Enigma, SetupPayoff, ThematicOpposition, PacingMetric, EmotionalState, CausalRelation, VoiceProfile, AudienceKnowledge |
| World Systems | CalendarSystem, MagicSystem, WorldRule |
| Meta-structural | Narrator, Focalization, NarrativeLevel, GenreType, StoryPattern |
| Writing | Manuscript, Chapter, Treatment |
| Wiki & Collab | WikiArticle, Comment, WorldCollaborator |

**Total: 50 models** (including junction tables and auth models).
