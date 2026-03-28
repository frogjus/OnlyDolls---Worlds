# StoryForge Database Schema — Design Decisions

## Overview

This document explains the architectural decisions behind StoryForge's Prisma/PostgreSQL schema. The schema models ~40 entity types across seven conceptual layers:

1. **Collaboration** — Users, memberships, comments, annotations, tags
2. **Core World** — StoryWorld, characters, events, locations, objects, factions
3. **Narrative Structure** — Scenes, beats, sequences, acts
4. **Dual Timelines** — Fabula (chronological) and sjuzhet (narrative) orderings
5. **Structure Templates** — Data-driven story structures (Save the Cat, Hero's Journey, etc.)
6. **Analytical Annotations** — Narratological analysis tools (value changes, codes, pacing, etc.)
7. **Writing Surface** — Manuscripts, sections, treatments

---

## Critical Design Decisions

### 1. Temporal Relationships

**Problem:** A character relationship (ally, enemy, lover) is not static. It changes over the course of the story. Two characters can be allies in Act 1 and enemies in Act 3.

**Solution:** The `Relationship` model includes `validFromEventId` and `validToEventId` foreign keys pointing to `Event`. Each row represents a relationship *state* valid during a span of story events. To query "who are Character A's allies at Event X?", you filter relationships where `validFromEvent.fabulaPosition <= X.fabulaPosition` and (`validToEventId IS NULL` or `validToEvent.fabulaPosition > X.fabulaPosition`).

Multiple `Relationship` rows can exist between the same pair of characters — each with different time scopes. This is intentional: the progression ally → rival → enemy is three rows, not one row mutated over time.

**Why not a single row with a JSON history?** Because:
- Each state needs its own queryable type, intensity, and metadata
- Junction to Events enables timeline visualization joins
- Simpler indexing and filtering

### 2. Dual Timeline (Fabula vs. Sjuzhet)

**Problem:** Events exist in two orderings:
- **Fabula** — chronological order within the story world (what actually happened)
- **Sjuzhet** — the order in which the narrative presents events to the audience

A flashback appears late in the sjuzhet but early in the fabula.

**Solution:** Two-layer approach:

1. **Inline field:** `Event.fabulaPosition` (Float) gives a quick chronological sort without a join.
2. **Junction tables:** `FabulaTimelineEvent` and `SjuzhetTimelineEvent` place events at positions on named timelines. This supports:
   - Multiple fabula timelines (parallel storylines in different locations)
   - Multiple sjuzhet timelines (different adaptation orderings — novel vs. film)
   - An event appearing in multiple timelines at different positions

The Float position type (rather than Int) allows inserting between existing items without reindexing (e.g., position 1.5 between 1 and 2).

### 3. Per-Scene Character Roles (CharacterSceneRole)

**Problem:** A character's narrative role (protagonist, mentor, trickster) and actant function (Greimas: subject, object, helper, opponent) changes per scene. The mentor in Scene 5 might be the opponent in Scene 20.

**Solution:** `CharacterSceneRole` is a junction table: Character × Scene → roleType + actant. This is separate from `SceneCharacter` (simple presence) because not every character in a scene has a named narrative function.

The `@@unique([characterId, sceneId])` constraint means one role assignment per character per scene. If a character fills multiple actant roles simultaneously, use the JSON `metadata` field or create a separate row after removing the unique constraint.

### 4. Data-Driven Structure Templates

**Problem:** Story structures like "Save the Cat", "Hero's Journey", "Kishoutenketsu", and "Five-Act" must be stored as data, not hardcoded. Users should be able to create custom templates.

**Solution:** Three models:

- `StructureTemplate` — the named structure (e.g., "Save the Cat")
- `StructureBeat` — individual beats within it (e.g., "Opening Image", "Catalyst", "All Is Lost"), with hierarchical nesting via `parentBeatId` and percentage-of-story positioning
- `StructureMapping` — maps a template beat to an actual entity in the story (Scene, Beat, Event, Sequence) via polymorphic `targetType + targetId`

Built-in templates have `isBuiltIn: true` and `storyWorldId: null`. User-created templates are scoped to a world.

### 5. Canon Snapshots (JSON Blob Approach)

**Problem:** How do you capture "the state of the world at this point in the story"? Full relational copies would be expensive and create schema-coupling nightmares.

**Solution:** `CanonSnapshot.state` is a JSONB column containing a serialized snapshot. The `scope` field indicates what's captured ("full", "characters", "relationships", "factions").

**Trade-offs:**
- **Pro:** Extremely cheap to create, no schema coupling, naturally immutable
- **Pro:** JSONB is queryable in PostgreSQL (`state->'characters'->>'name'`)
- **Con:** Not referentially integrity-checked — snapshots can drift from schema changes
- **Mitigation:** Application code validates snapshot shape on read; a version field in metadata tracks the schema version used

`Branch` extends this: it stores a diff from its parent `CanonSnapshot`, enabling "what-if" exploration without duplicating the entire world.

### 6. Multi-Tenancy

Every entity includes a `storyWorldId` foreign key. `StoryWorld` has an `ownerId` pointing to `User`. Access control is layered:

- `WorldMembership` assigns roles (OWNER, EDITOR, VIEWER) per user per world
- The `@@unique([userId, storyWorldId])` constraint prevents duplicate memberships
- All queries must filter by `storyWorldId` — this is enforced at the application layer (Prisma middleware or row-level security)

### 7. Soft Deletes

All primary entities include `deletedAt DateTime?`. A null value means the record is active. Indexes on `deletedAt` support efficient filtering.

Application-level query middleware should automatically add `WHERE deletedAt IS NULL` to all reads. Hard deletes are reserved for GDPR compliance or data retention policies executed via background jobs.

### 8. Polymorphic Relations (Comment, Annotation, Tag, StoryPattern, etc.)

Several entities can attach to *any* other entity type:

```
targetType String   // e.g., "Character", "Scene", "Event"
targetId   String   // the CUID of the target
```

**Why not Prisma relations?** Prisma doesn't support polymorphic foreign keys. The `targetType + targetId` pattern:
- Avoids N nullable foreign key columns (one per possible target)
- Scales to new entity types without schema migration
- Is indexed as a composite: `@@index([targetType, targetId])`

**Trade-off:** No database-level referential integrity on polymorphic refs. Application code must validate targetType and existence.

---

## PostgreSQL-Specific Features

### pgvector Embeddings

Text-heavy entities (`StoryWorld`, `Character`, `Event`, `Scene`, `Location`, `StoryObject`, `Theme`, `Faction`, `SourceMaterial`, `VoiceProfile`) include:

```prisma
embedding Unsupported("vector(1536)")?
```

These store OpenAI-compatible 1536-dimensional embeddings for semantic search. Usage:
- "Find characters similar to this description"
- "Which events are thematically related?"
- Creative intent search across the world

Indexes should be created via raw SQL migration:
```sql
CREATE INDEX idx_character_embedding ON "Character"
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### tsvector Full-Text Search

Text-heavy entities include `searchBody Unsupported("tsvector")?` columns. These are populated via triggers or application code:

```sql
CREATE OR REPLACE FUNCTION update_character_search() RETURNS trigger AS $$
BEGIN
  NEW."searchBody" := to_tsvector('english',
    coalesce(NEW.name, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(NEW.backstory, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Full-text search queries:
```sql
SELECT * FROM "Character"
WHERE "searchBody" @@ plainto_tsquery('english', 'reluctant hero dark past');
```

### JSONB Columns

Used strategically for:
- **Extensible metadata:** Every entity has `metadata Json @default("{}")` for user-defined attributes
- **Structured lists:** `Character.goals`, `Character.traits`, `Faction.resources`, `WorldRule.exceptions`
- **Flexible state:** `CanonSnapshot.state`, `Branch.state`
- **Positional data:** `Annotation.anchor`, `Location.coordinates`

JSONB supports indexing:
```sql
CREATE INDEX idx_character_metadata ON "Character" USING gin (metadata);
```

---

## Entity Count Summary

| Layer | Models | Count |
|-------|--------|-------|
| Collaboration | User, WorldMembership, Comment, Annotation, Tag | 5 |
| Core World | StoryWorld, Character, CharacterSceneRole, SceneCharacter, Event, EventParticipant, Location, StoryObject, Theme, Motif, Theme_Motif, Faction, FactionMember, Relationship, SourceMaterial | 15 |
| Narrative Structure | Scene, Beat, Sequence, Act | 4 |
| Dual Timelines | FabulaTimeline, FabulaTimelineEvent, SjuzhetTimeline, SjuzhetTimelineEvent | 4 |
| Structure Templates | StructureTemplate, StructureBeat, StructureMapping | 3 |
| Arcs & Canon | Arc, ArcPhase, CanonSnapshot, Branch | 4 |
| Analytical Annotations | ValueChange, NarrativeCode, Enigma, SetupPayoff, ThematicOpposition, PacingMetric, EmotionalState, CausalRelation, VoiceProfile, AudienceKnowledge | 10 |
| World Systems | CalendarSystem, MagicSystem, WorldRule | 3 |
| Meta-Structural | Narrator, Focalization, NarrativeLevel, GenreType, StoryPattern | 5 |
| Writing Surface | Manuscript, ManuscriptSection, Treatment | 3 |
| **Total** | | **56** |

(56 models total: ~40 primary entities + ~16 junction/support tables)

---

## Enum Usage

Only one enum is defined: `WorldRole` (OWNER, EDITOR, VIEWER). All other "type" fields use `String` rather than enums because:
- Narrative terminology varies by tradition and user preference
- New values can be added without migration
- Enum migrations in PostgreSQL are painful (no removal, ordering issues)

Type validation happens at the application layer with TypeScript union types.

---

## Indexing Strategy

Every model includes indexes on:
1. **Foreign keys** — all `*Id` fields are indexed for join performance
2. **`deletedAt`** — for efficient soft-delete filtering
3. **`storyWorldId`** — multi-tenancy filter (appears on every world-scoped entity)
4. **Position/order fields** — `fabulaPosition`, `sjuzhetPosition`, `position` for sorted queries
5. **Polymorphic refs** — composite `@@index([targetType, targetId])`
6. **Common filters** — `type`, `status`, `category`, `codeType`, `valueName`

---

## Migration Notes

### Required Raw SQL (post-Prisma migration)

Prisma cannot manage `Unsupported` column indexes or triggers. After running `prisma migrate`, execute:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Vector similarity indexes (adjust lists count based on row volume)
CREATE INDEX idx_character_embedding ON "Character" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_event_embedding ON "Event" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_scene_embedding ON "Scene" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_storyworld_embedding ON "StoryWorld" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
CREATE INDEX idx_location_embedding ON "Location" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_storyobject_embedding ON "story_object" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_theme_embedding ON "Theme" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
CREATE INDEX idx_faction_embedding ON "Faction" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
CREATE INDEX idx_sourcematerial_embedding ON "SourceMaterial" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
CREATE INDEX idx_voiceprofile_embedding ON "VoiceProfile" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- tsvector GIN indexes
CREATE INDEX idx_character_search ON "Character" USING gin ("searchBody");
CREATE INDEX idx_event_search ON "Event" USING gin ("searchBody");
CREATE INDEX idx_scene_search ON "Scene" USING gin ("searchBody");
CREATE INDEX idx_storyworld_search ON "StoryWorld" USING gin ("searchBody");
CREATE INDEX idx_sourcematerial_search ON "SourceMaterial" USING gin ("searchBody");
CREATE INDEX idx_manuscript_search ON "Manuscript" USING gin ("searchBody");
CREATE INDEX idx_manuscriptsection_search ON "ManuscriptSection" USING gin ("searchBody");
CREATE INDEX idx_treatment_search ON "Treatment" USING gin ("searchBody");

-- tsvector update triggers (example for Character — replicate for other models)
CREATE OR REPLACE FUNCTION update_character_search() RETURNS trigger AS $$
BEGIN
  NEW."searchBody" := to_tsvector('english',
    coalesce(NEW.name, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(NEW.backstory, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_character_search
  BEFORE INSERT OR UPDATE ON "Character"
  FOR EACH ROW EXECUTE FUNCTION update_character_search();

-- JSONB GIN indexes for metadata columns on high-query entities
CREATE INDEX idx_character_metadata ON "Character" USING gin (metadata);
CREATE INDEX idx_event_metadata ON "Event" USING gin (metadata);
CREATE INDEX idx_scene_metadata ON "Scene" USING gin (metadata);
```

---

## Future Considerations

- **Row-Level Security (RLS):** For true multi-tenancy isolation, PostgreSQL RLS policies can enforce `storyWorldId` filtering at the database level, removing reliance on application middleware.
- **Partitioning:** If a single world grows very large (100K+ events), table partitioning by `storyWorldId` could improve query performance.
- **Audit Log:** A separate `AuditLog` table with `entityType`, `entityId`, `action`, `diff`, `userId`, `timestamp` for tracking all changes.
- **Real-time Collaboration:** Consider PostgreSQL NOTIFY/LISTEN or a change-data-capture system for live collaboration features.
