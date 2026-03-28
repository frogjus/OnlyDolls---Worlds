# StoryForge Ingestion Pipeline Specification

## 1. Overview

### Purpose

The ingestion pipeline converts narrative material in any supported format -- text, audio, video, and images -- into structured story world entities stored in the StoryForge knowledge graph. It is the primary entry point for getting existing creative work into the platform.

The pipeline takes raw files (a novel manuscript, a podcast recording, a film cut, concept art) and produces a set of **proposed entities**: characters, locations, events, relationships, themes, objects, and factions. These proposed entities are presented to the user for review and confirmation before becoming part of the canonical story world.

### Key Principles

1. **Everything is async.** All ingestion runs through the BullMQ job queue backed by Redis. No API route ever blocks on file parsing, transcription, or AI extraction. The request thread creates the job and returns immediately with a job ID. The client polls or subscribes via WebSocket for progress updates.

2. **All AI-extracted entities are "proposed" until user confirms.** The pipeline never silently adds entities to the canonical story world. Every extraction is tagged with a confidence score and placed in a review queue. The user sees proposed entities, approves, edits, merges, or dismisses them. This is non-negotiable -- the human is always the authority on their story.

3. **Source material is preserved.** The original file is stored intact. Parsed text, transcripts, and annotations reference back to the source via character offsets or time codes. Nothing is lost or overwritten.

4. **Idempotent re-processing.** A file can be re-ingested (e.g., after a parser upgrade or to re-run extraction with improved prompts). The pipeline detects existing entities and presents merge/update candidates rather than creating duplicates.

5. **World isolation.** Every ingestion job is scoped to a single StoryWorld. Extracted entities are stored in SuperMemory with a `containerTag` of `storyforge_world_{worldId}`. There is no cross-world contamination.

### Architecture Summary

```
User Upload (API Route)
       |
       v
  BullMQ: ingestion queue
       |
       v
  Stage 1: Upload & Validation
       |
       v
  Stage 2: Parsing (format-specific)
       |
       v
  Stage 3: Chunking
       |
       v
  Stage 4: Entity Extraction (Claude API)
       |
       v
  Stage 5: Entity Resolution (dedup + merge)
       |
       v
  Stage 6: Relationship Mapping
       |
       v
  Stage 7: Knowledge Graph Update (SuperMemory)
       |
       v
  Stage 8: Embedding Generation (pgvector)
       |
       v
  Stage 9: Full-Text Indexing (tsvector)
       |
       v
  Stage 10: User Review Queue
```

Files are processed sequentially through stages; multiple files are processed in parallel up to the configured concurrency limit.

---

## 2. Supported Formats & Parsing

### 2.1 Text Ingestion

#### Supported Formats

| Format | Extension(s) | Parser Library | Notes |
|---|---|---|---|
| Plain text | `.txt` | Direct read (UTF-8) | No structural markers assumed; paragraph breaks inferred from blank lines |
| Markdown | `.md` | Direct read + `remark` for heading-based structure | H1 = acts/parts, H2 = chapters, H3 = scenes (configurable) |
| Word document | `.docx` | `mammoth` | Preserves heading hierarchy for structural detection; ignores formatting |
| PDF | `.pdf` | `pdf-parse` | Extracts text layer; falls back to OCR via Claude Vision for scanned PDFs |
| Final Draft | `.fdx` | Custom XML parser (`fast-xml-parser`) | FDX is XML; extract elements by type (Scene Heading, Action, Character, Dialogue, Parenthetical, Transition) |
| Fountain | `.fountain` | `Fountain.js` + `betterfountain` | Screenplay format; character names extracted directly from format conventions |
| EPUB | `.epub` | `epub-parser` | Extract chapters from spine order; strip HTML to plain text with structural markers |

#### Structural Marker Detection

The parser produces a normalized intermediate representation regardless of input format:

```typescript
interface ParsedDocument {
  /** Unique ID for this parse result */
  parseId: string;

  /** Reference back to the SourceMaterial record */
  sourceId: string;

  /** The full plain text (for full-text indexing) */
  fullText: string;

  /** Ordered list of structural segments */
  segments: DocumentSegment[];

  /** Format-specific metadata */
  formatMetadata: TextFormatMetadata | ScreenplayFormatMetadata;
}

interface DocumentSegment {
  /** Segment type detected from format conventions */
  type: 'part' | 'act' | 'chapter' | 'scene' | 'beat' | 'paragraph';

  /** Heading or label if present (e.g., "Chapter 12: The Storm") */
  label: string | null;

  /** Character offset range in fullText */
  startOffset: number;
  endOffset: number;

  /** The text content of this segment */
  content: string;

  /** Nested child segments (e.g., scenes within a chapter) */
  children: DocumentSegment[];

  /** Screenplay-specific: element type */
  screenplayElement?: 'scene-heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition';
}

interface TextFormatMetadata {
  format: 'txt' | 'md' | 'docx' | 'pdf' | 'epub';
  wordCount: number;
  characterCount: number;
  detectedLanguage: string;
  hasTableOfContents: boolean;
}

interface ScreenplayFormatMetadata {
  format: 'fdx' | 'fountain';
  wordCount: number;
  pageCount: number;
  /** Character names extracted directly from screenplay format */
  speakingCharacters: string[];
  sceneCount: number;
  /** Scene headings in order */
  sceneHeadings: string[];
}
```

#### Screenplay-Specific Extraction

For `.fdx` and `.fountain` files, the parser performs additional structural extraction before the AI stage:

- **Character names**: Extracted from dialogue attribution (CHARACTER NAME above dialogue blocks). These are high-confidence character candidates that skip fuzzy matching.
- **Scene headings**: Parsed as location candidates (INT./EXT. + location name + time of day).
- **Dialogue blocks**: Preserved with character attribution for downstream voice analysis.
- **Scene boundaries**: Definitive (marked by scene headings), unlike prose where they must be inferred.

### 2.2 Audio Ingestion

#### Supported Formats

| Format | Extension | Notes |
|---|---|---|
| MP3 | `.mp3` | Most common; lossy compression acceptable for transcription |
| WAV | `.wav` | Uncompressed; large files, best quality |
| M4A | `.m4a` | AAC container; common from Apple devices |
| OGG | `.ogg` | Vorbis/Opus codec; common from open-source tools |
| FLAC | `.flac` | Lossless compression; best quality-to-size ratio |

#### Transcription Pipeline

1. **Pre-processing**: Normalize audio to 16kHz mono WAV via FFmpeg (Whisper's expected input format). Split files longer than 30 minutes into overlapping segments (25 minutes with 1-minute overlap) to manage memory.

2. **Transcription**: Send to Whisper (OpenAI API) or Deepgram with the following configuration:
   - Language detection enabled (or user-specified language)
   - Speaker diarization enabled (identify distinct speakers)
   - Word-level timestamps enabled
   - Punctuation and formatting enabled

3. **Post-processing**: Merge overlapping segment transcripts, resolve speaker labels across segments, produce final transcript with time codes.

```typescript
interface TranscriptionResult {
  /** Full transcript text */
  fullText: string;

  /** Segments with speaker attribution and time codes */
  segments: TranscriptionSegment[];

  /** Detected language */
  language: string;

  /** Overall transcription confidence (0-1) */
  confidence: number;

  /** Distinct speakers identified */
  speakers: SpeakerInfo[];
}

interface TranscriptionSegment {
  /** Speaker identifier (e.g., "SPEAKER_01") */
  speakerId: string;

  /** The transcribed text */
  text: string;

  /** Start time in seconds */
  startTime: number;

  /** End time in seconds */
  endTime: number;

  /** Word-level timestamps */
  words: WordTimestamp[];

  /** Segment-level confidence (0-1) */
  confidence: number;
}

interface WordTimestamp {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

interface SpeakerInfo {
  speakerId: string;
  /** Total speaking duration in seconds */
  totalDuration: number;
  /** Number of segments attributed to this speaker */
  segmentCount: number;
  /** User-assigned character name (null until mapped) */
  mappedCharacterId: string | null;
}
```

#### Speaker-to-Character Mapping

After transcription, the pipeline presents identified speakers to the user for mapping to story world characters. If the world already has characters, the system suggests mappings based on:
- Name mentions near speaker transitions
- Speaking pattern similarity to existing voice profiles
- User's previous mappings for the same source series

### 2.3 Video Ingestion

#### Supported Formats

| Format | Extension | Notes |
|---|---|---|
| MP4 | `.mp4` | H.264/H.265; most universal |
| MKV | `.mkv` | Matroska container; common for high-quality archival |
| MOV | `.mov` | QuickTime; common from Apple/professional workflows |
| WebM | `.webm` | VP8/VP9; web-native |
| AVI | `.avi` | Legacy; supported for completeness |

#### Processing Pipeline

1. **Audio extraction**: FFmpeg extracts the audio track to WAV. This feeds into the audio ingestion pipeline (section 2.2) for transcription.

2. **Key frame extraction**: FFmpeg extracts frames at configurable intervals (default: 1 frame per 10 seconds, configurable from 1/sec to 1/60sec). Frames are stored as JPEGs for visual reference.

   ```bash
   ffmpeg -i input.mp4 -vf "fps=1/10" -q:v 2 frame_%05d.jpg
   ```

3. **Scene detection**: Analyze visual change between consecutive frames using histogram comparison. When the difference exceeds a threshold (configurable, default: 0.4 on normalized scale), mark a scene boundary. This produces scene cut timestamps that supplement the transcript-based scene detection.

4. **Transcript enrichment**: The transcript from step 1 is enriched with:
   - Scene cut timestamps from step 3
   - Key frame references (link time-coded transcript segments to their nearest key frame)

5. **Visual analysis (optional)**: For key frames at detected scene boundaries, optionally send to Claude Vision API for:
   - Location/setting description
   - Character identification (if recognizable)
   - Visual mood/tone annotation
   - Text on screen (titles, signs, captions)

```typescript
interface VideoProcessingResult {
  /** Transcription result from audio track */
  transcription: TranscriptionResult;

  /** Detected scene boundaries */
  sceneCuts: SceneCut[];

  /** Extracted key frames */
  keyFrames: KeyFrame[];

  /** Video metadata */
  metadata: VideoMetadata;
}

interface SceneCut {
  /** Timestamp in seconds where cut was detected */
  timestamp: number;

  /** Visual difference score that triggered the cut (0-1) */
  differenceScore: number;

  /** Key frame reference just after the cut */
  keyFrameId: string;
}

interface KeyFrame {
  id: string;

  /** Timestamp in seconds */
  timestamp: number;

  /** Storage path for the extracted frame image */
  storagePath: string;

  /** Claude Vision analysis result (if enabled) */
  visualAnalysis?: VisualAnalysis;
}

interface VisualAnalysis {
  description: string;
  detectedCharacters: string[];
  locationDescription: string;
  mood: string;
  onScreenText: string[];
  confidence: number;
}

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  fileSize: number;
}
```

### 2.4 Image Ingestion

#### Supported Formats

| Format | Extension | Notes |
|---|---|---|
| PNG | `.png` | Lossless; best for storyboards, UI screenshots |
| JPEG | `.jpg`, `.jpeg` | Lossy; common for concept art, photos |
| WebP | `.webp` | Modern format; good compression with quality |

#### Processing Pipeline

1. **Upload and store**: Image stored in file storage with metadata recorded.

2. **Claude Vision analysis**: Send image to Claude Vision API with a prompt tailored to narrative context extraction:
   - Character descriptions (appearance, clothing, posture, expression)
   - Location/setting descriptions
   - Objects of significance
   - Mood, tone, color palette
   - Any text visible in the image (captions, signs, handwritten notes)

3. **OCR extraction**: For images that contain significant text (storyboard panels with captions, whiteboard photos, handwritten outlines), extract text content via Claude Vision's text recognition capabilities.

4. **Entity linking**: Match extracted descriptions against existing story world entities. Present new entities as proposals and existing-entity matches as annotation candidates.

```typescript
interface ImageAnalysisResult {
  /** Natural language description of the image */
  description: string;

  /** Characters detected or described */
  characters: ImageCharacterDetection[];

  /** Location/setting information */
  location: {
    description: string;
    interiorExterior: 'interior' | 'exterior' | 'unknown';
    timeOfDay: string | null;
  } | null;

  /** Significant objects in the image */
  objects: Array<{
    name: string;
    description: string;
    significance: string;
  }>;

  /** Extracted text (OCR) */
  extractedText: string[];

  /** Visual mood and tone */
  mood: {
    description: string;
    colorPalette: string[];
    tone: string;
  };

  /** Overall analysis confidence (0-1) */
  confidence: number;

  /** Suggested links to existing world entities */
  suggestedLinks: Array<{
    entityType: EntityType;
    entityId: string | null;
    entityName: string;
    confidence: number;
  }>;
}

interface ImageCharacterDetection {
  /** Description of the character in the image */
  description: string;

  /** Suggested match to existing character (null if new) */
  suggestedCharacterId: string | null;
  suggestedCharacterName: string | null;

  /** Physical traits observed */
  physicalTraits: Record<string, string>;

  /** Confidence of the match (0-1) */
  matchConfidence: number;
}
```

---

## 3. Pipeline Architecture

### 3.1 Job Queue (BullMQ + Redis)

#### Queue Definitions

The pipeline uses five dedicated BullMQ queues, each with its own concurrency and retry configuration:

| Queue | Purpose | Default Concurrency | Max Retries |
|---|---|---|---|
| `ingestion` | Orchestrator queue: manages the full pipeline for a single file | 5 | 3 |
| `transcription` | Audio/video transcription via Whisper/Deepgram | 2 | 2 |
| `extraction` | Claude API entity extraction calls | 3 | 3 |
| `embedding` | Vector embedding generation | 10 | 2 |
| `indexing` | Full-text search index updates | 10 | 2 |

The `ingestion` queue is the top-level orchestrator. When a file is uploaded, a single job is created on the `ingestion` queue. That job's processor coordinates the remaining stages, spawning child jobs on the specialized queues as needed.

#### Job Lifecycle

```
CREATED  -->  WAITING  -->  ACTIVE  -->  COMPLETED
                                    \-->  FAILED  -->  (retry)  -->  ACTIVE
                                                  \-->  DEAD_LETTER (after max retries)
```

Every job transitions through these states. The client can query the current state and progress of any job by its ID.

#### Job Priority Levels

| Priority | Value | Use Case |
|---|---|---|
| Critical | 1 | Re-extraction triggered by user action (e.g., "re-analyze this chapter") |
| High | 5 | Single-file upload (user is actively waiting) |
| Normal | 10 | Batch upload files |
| Low | 20 | Background re-indexing, embedding regeneration |

Lower numeric values indicate higher priority. BullMQ processes higher-priority jobs first within each queue.

#### Retry Strategy

All queues use exponential backoff with jitter:

```typescript
const defaultRetryConfig = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,  // base delay: 2 seconds
  },
};

// Retry delays: ~2s, ~4s, ~8s (with jitter)
```

For Claude API extraction jobs, retries also handle rate limiting:

```typescript
const extractionRetryConfig = {
  attempts: 3,
  backoff: {
    type: 'custom' as const,
    delay: (attemptsMade: number, err: Error) => {
      // If rate limited, respect the Retry-After header
      if (err instanceof RateLimitError && err.retryAfter) {
        return err.retryAfter * 1000;
      }
      // Otherwise, exponential backoff
      return Math.pow(2, attemptsMade) * 2000;
    },
  },
};
```

#### Dead Letter Queue

Jobs that exhaust all retries are moved to a dead letter queue (`ingestion-dlq`). These are surfaced in the admin UI for manual investigation. Dead letter jobs retain their full payload and error history for debugging.

#### Progress Tracking

Each job reports progress as a percentage (0-100) plus a human-readable status message. The `ingestion` orchestrator job aggregates progress from its child stages:

| Stage | Weight | Description |
|---|---|---|
| Upload & Validation | 5% | File received and validated |
| Parsing | 10% | Format-specific parsing complete |
| Chunking | 5% | Text chunked for extraction |
| Entity Extraction | 40% | Claude API calls (heaviest stage) |
| Entity Resolution | 15% | Deduplication and merge |
| Relationship Mapping | 10% | Relationship inference |
| Knowledge Graph Update | 5% | SuperMemory persistence |
| Embedding Generation | 5% | Vector embeddings computed |
| Full-Text Indexing | 3% | Search index updated |
| Review Queue | 2% | Proposed entities queued for user review |

### 3.2 Pipeline Stages

#### Stage 1: Upload & Validation

**Input**: Raw file from client upload (multipart form data).

**Processing**:
1. Verify file extension against supported formats for the detected media type.
2. Verify file size against configured limits (see section 10).
3. Compute SHA-256 hash for deduplication (warn user if same file was previously ingested into this world).
4. Store file in file storage (see section 6).
5. Create `SourceMaterial` record in PostgreSQL with status `processing`.

**Output**: `SourceMaterial` record ID, file storage path.

**Failure modes**: Unsupported format (reject with 400), file too large (reject with 413), storage write failure (retry).

```typescript
interface UploadValidationResult {
  sourceId: string;
  storagePath: string;
  fileHash: string;
  fileSize: number;
  mimeType: string;
  mediaType: 'text' | 'audio' | 'video' | 'image';
  isDuplicate: boolean;
  duplicateSourceId?: string;
}
```

#### Stage 2: Parsing

**Input**: Validated file from storage.

**Processing**: Dispatch to the appropriate format-specific parser (see section 2). Produce the normalized `ParsedDocument` (for text), `TranscriptionResult` (for audio), `VideoProcessingResult` (for video), or `ImageAnalysisResult` (for images).

For audio and video, this stage spawns a child job on the `transcription` queue and waits for completion.

**Output**: Normalized parsed representation stored as JSON alongside the source material.

**Failure modes**: Corrupt file (report specific parser error), encoding issues (attempt fallback encodings for text), transcription API failure (retry via transcription queue).

#### Stage 3: Chunking

**Input**: Parsed text content (from stage 2; for audio/video, the transcript text).

**Processing**: Split the full text into chunks optimized for the Claude API context window.

Chunking strategy:
1. **Respect structural boundaries**: Prefer splitting at chapter, scene, or paragraph boundaries. Never split mid-sentence.
2. **Target chunk size**: 3,000-4,000 tokens per chunk (approximately 2,200-3,000 words). This leaves room for the system prompt and extraction schema within Claude's context window.
3. **Overlap**: Include ~500 tokens from the end of the previous chunk at the beginning of each chunk. This ensures entities that span a boundary are captured in at least one chunk.
4. **Context header**: Each chunk includes a brief context header: the document title, the current structural position (e.g., "Chapter 7, Scene 3"), and a summary of entities extracted from previous chunks (rolling context).

```typescript
interface TextChunk {
  /** Sequential chunk index (0-based) */
  chunkIndex: number;

  /** The chunk text content */
  content: string;

  /** Approximate token count */
  tokenCount: number;

  /** Character offset range in the full text */
  startOffset: number;
  endOffset: number;

  /** Structural context for this chunk */
  structuralContext: {
    /** e.g., "Part 2 > Chapter 7 > Scene 3" */
    breadcrumb: string;
    /** The segment types this chunk spans */
    segmentTypes: string[];
  };

  /** Overlap region from previous chunk */
  overlapTokenCount: number;

  /** Rolling context: entity names extracted from prior chunks */
  priorEntityContext: string[];
}
```

**Output**: Ordered array of `TextChunk` objects.

**Failure modes**: Empty document (report to user, skip remaining stages), tokenization failure (fall back to word-count-based splitting).

**Note**: Images skip this stage entirely. Their analysis is performed in a single Claude Vision API call during Stage 2.

#### Stage 4: Entity Extraction (Claude API)

**Input**: Array of text chunks from stage 3.

**Processing**: For each chunk, spawn a child job on the `extraction` queue. Each job sends a structured prompt to the Claude API requesting entity extraction. See section 4 for full prompt design and extraction schema.

Extraction jobs run in parallel up to the `extraction` queue's concurrency limit (default: 3). Rate limiting is managed by the queue -- if the Claude API returns a 429, the job is retried with the appropriate backoff.

**Output**: Per-chunk array of `ExtractionResult` objects (see section 4).

**Failure modes**: Claude API errors (retry with backoff), malformed response (retry with stricter prompt), partial extraction (accept what was extracted, flag chunk for re-extraction).

#### Stage 5: Entity Resolution

**Input**: All `ExtractionResult` objects across all chunks.

**Processing**: Merge and deduplicate extracted entities. This is critical because the same character may be referred to as "Elizabeth," "Liz," "Mrs. Bennet," and "she" across different chunks.

Resolution algorithm:
1. **Exact match**: Group entities with identical normalized names (case-insensitive, whitespace-trimmed).
2. **Fuzzy match**: For remaining entities of the same type, compute pairwise similarity using:
   - Levenshtein distance (normalized) on names -- threshold: 0.8 similarity
   - Semantic similarity via embeddings -- threshold: 0.85 cosine similarity
   - Contextual clues: shared relationships, co-occurring locations, attribute overlap
3. **Alias detection**: When a shorter name is a substring of a longer name (e.g., "Liz" / "Elizabeth Bennet") and they share context, flag as alias candidate.
4. **Merge candidates**: Present grouped candidates to the user with confidence scores. Auto-merge only when confidence exceeds 0.95 and the merge is exact-match or known-alias.

```typescript
interface EntityResolutionResult {
  /** Deduplicated entities, each with merged attributes from all chunks */
  resolvedEntities: ResolvedEntity[];

  /** Proposed merges requiring user confirmation */
  mergeProposals: MergeProposal[];

  /** Entities that could not be confidently resolved */
  ambiguousEntities: AmbiguousEntity[];
}

interface ResolvedEntity {
  /** Temporary ID for this resolved entity */
  resolvedId: string;

  /** Entity type */
  type: EntityType;

  /** Primary name (most frequently used or most complete) */
  primaryName: string;

  /** All name variants found */
  aliases: string[];

  /** Merged attributes from all chunk extractions */
  attributes: Record<string, unknown>;

  /** All source references where this entity was found */
  sourceReferences: SourceReference[];

  /** Highest confidence score across extractions */
  confidence: number;

  /** Resolution method that produced this entity */
  resolutionMethod: 'exact_match' | 'fuzzy_match' | 'alias_detection' | 'semantic_match' | 'singleton';
}

interface MergeProposal {
  /** The entities proposed to be merged */
  entityIds: string[];
  entityNames: string[];
  entityType: EntityType;

  /** Why we think these are the same entity */
  reason: string;

  /** Confidence in the merge (0-1) */
  confidence: number;

  /** Conflicting attributes that need user resolution */
  conflicts: Array<{
    attribute: string;
    values: Array<{ value: unknown; source: string }>;
  }>;
}

interface AmbiguousEntity {
  /** The extracted entity */
  entity: ExtractedEntity;

  /** Possible matches in the existing world */
  possibleMatches: Array<{
    existingEntityId: string;
    existingEntityName: string;
    similarity: number;
  }>;
}
```

**Failure modes**: This stage is deterministic and runs locally -- no external API calls. Failures are programming errors (report and halt).

#### Stage 6: Relationship Mapping

**Input**: Resolved entities from stage 5.

**Processing**: Build relationships between resolved entities based on:
1. **Explicitly extracted relationships**: The Claude API extraction (stage 4) directly identifies relationships ("Elizabeth is Mr. Bennet's daughter").
2. **Co-occurrence inference**: Entities that appear in the same scene/chapter are linked with a "co-occurs" relationship (low weight, informational).
3. **Dialogue attribution**: Characters who speak to each other in a scene have a "speaks-to" relationship for that scene.
4. **Structural relationships**: Characters associated with the same faction, location, or event are linked.

All relationships are **temporal** -- they are scoped to the scene or event range where they were observed. A relationship may have different attributes at different points in the narrative.

```typescript
interface MappedRelationship {
  /** Source entity */
  sourceEntityId: string;

  /** Target entity */
  targetEntityId: string;

  /** Relationship type */
  type: RelationshipType;

  /** Relationship label (human-readable) */
  label: string;

  /** Strength/weight (0-1) */
  weight: number;

  /** Whether this was explicitly extracted or inferred */
  inferenceMethod: 'explicit_extraction' | 'co_occurrence' | 'dialogue' | 'structural';

  /** Temporal scope: when in the narrative this relationship is observed */
  validFrom: SourceReference | null;
  validTo: SourceReference | null;

  /** Additional attributes (e.g., sentiment, power dynamic) */
  attributes: Record<string, unknown>;

  /** Confidence (0-1) */
  confidence: number;
}

type RelationshipType =
  | 'family'
  | 'romantic'
  | 'friendship'
  | 'rivalry'
  | 'professional'
  | 'allegiance'
  | 'mentorship'
  | 'antagonism'
  | 'co_occurrence'
  | 'dialogue'
  | 'custom';
```

**Output**: Array of `MappedRelationship` objects, added to the review queue alongside entities.

#### Stage 7: Knowledge Graph Update (SuperMemory)

**Input**: Resolved entities and mapped relationships from stages 5-6.

**Processing**: Store extracted data in SuperMemory with world-scoped isolation.

1. Each resolved entity is stored as a memory with:
   - `containerTag`: `storyforge_world_{worldId}`
   - Metadata: entity type, confidence, source reference, extraction timestamp
   - Content: serialized entity attributes as natural language for semantic search

2. Relationships are stored as typed edges between entity memories:
   - Edge types: `updates`, `extends`, `derives` (SuperMemory native) plus custom narrative types
   - Metadata includes temporal scope and confidence

3. For entities that match existing memories (re-ingestion scenario), the pipeline creates `updates` edges rather than duplicating. SuperMemory's contradiction detection flags conflicting attributes.

**Output**: SuperMemory memory IDs mapped to each resolved entity.

**Failure modes**: SuperMemory API failure (retry), containerTag conflict (log and investigate).

#### Stage 8: Embedding Generation

**Input**: Resolved entities and their textual descriptions, plus the full parsed text of the source material.

**Processing**: Generate vector embeddings for semantic search and creative intent search.

1. **Entity embeddings**: For each resolved entity, generate an embedding from its combined name + description + key attributes. Store in pgvector.
2. **Passage embeddings**: For each text chunk, generate an embedding of the chunk content. Store in pgvector with source reference metadata.
3. **Batch processing**: Embeddings are generated in batches of 50-100 items to optimize API calls to Voyage AI (or the configured embedding provider).

```typescript
interface EmbeddingRecord {
  /** The entity or passage this embedding represents */
  referenceType: 'entity' | 'passage';
  referenceId: string;

  /** The text that was embedded */
  embeddedText: string;

  /** The vector (stored in pgvector) */
  vector: number[];

  /** Embedding model used */
  model: string;

  /** Dimension count */
  dimensions: number;

  /** World scope */
  worldId: string;
}
```

**Output**: Embedding records persisted in PostgreSQL pgvector column.

**Failure modes**: Embedding API failure (retry), dimension mismatch (log error, skip item).

#### Stage 9: Full-Text Indexing

**Input**: Full text content from the parsed document and entity descriptions.

**Processing**: Update PostgreSQL tsvector indexes for keyword search.

1. Update the `SourceMaterial` record's tsvector column with the full document text.
2. For each proposed entity, prepare a tsvector from its name, aliases, and description.
3. Use `to_tsvector('english', content)` with language-appropriate configuration (auto-detected or user-specified).

**Output**: Updated tsvector indexes in PostgreSQL.

**Failure modes**: This is a local database operation. Failures indicate database issues (retry with backoff).

#### Stage 10: User Review Queue

**Input**: All resolved entities, merge proposals, ambiguous entities, and mapped relationships.

**Processing**: Assemble the review package and update the `SourceMaterial` record status to `review_pending`.

1. Group proposed entities by type (characters, locations, events, etc.).
2. Sort by confidence (highest first -- most certain entities at top).
3. Flag entities that conflict with existing world data (e.g., a character with the same name but different attributes).
4. Generate a summary: "Found X characters, Y locations, Z events, W relationships. N items need your review."
5. Emit a WebSocket event to the client: `ingestion:review_ready`.

```typescript
interface ReviewPackage {
  /** Source material this review is for */
  sourceId: string;
  worldId: string;

  /** Summary statistics */
  summary: {
    totalEntities: number;
    byType: Record<EntityType, number>;
    highConfidence: number;
    needsReview: number;
    conflicts: number;
  };

  /** Proposed entities grouped by type, sorted by confidence */
  proposedEntities: Record<EntityType, ResolvedEntity[]>;

  /** Merge proposals requiring user decision */
  mergeProposals: MergeProposal[];

  /** Ambiguous entities needing clarification */
  ambiguousEntities: AmbiguousEntity[];

  /** Proposed relationships */
  proposedRelationships: MappedRelationship[];

  /** Conflicts with existing world data */
  worldConflicts: WorldConflict[];
}

interface WorldConflict {
  /** The proposed entity */
  proposedEntity: ResolvedEntity;

  /** The existing entity it conflicts with */
  existingEntityId: string;
  existingEntityName: string;

  /** The conflicting attributes */
  conflicts: Array<{
    attribute: string;
    proposedValue: unknown;
    existingValue: unknown;
  }>;

  /** Suggested resolution */
  suggestedResolution: 'merge' | 'create_new' | 'skip';
}
```

**Output**: `SourceMaterial` status updated to `review_pending`. WebSocket notification sent. User can now review and confirm entities in the UI.

---

## 4. Entity Extraction (Claude API)

### 4.1 Prompt Design

Entity extraction uses a two-part prompt structure: a system prompt that establishes the extraction schema and behavioral constraints, and a user prompt that provides the chunk content with its context.

#### System Prompt

```
You are an entity extraction system for StoryForge, a narrative analysis platform.
Your task is to extract structured story entities from the provided text passage.

You MUST extract entities according to the following schema. Return ONLY valid JSON
matching the ExtractionResponse schema. Do not include any text outside the JSON.

Entity types to extract:
- Character: any named or clearly identified person/being in the narrative
- Location: any named or described place
- Event: any significant action, decision, revelation, or transformation
- Relationship: any connection between two characters (family, romantic, professional, etc.)
- Theme: any abstract idea or thematic concern present in the passage
- Object: any significant object (weapons, letters, symbols, heirlooms, etc.)
- Faction: any group, organization, family unit, or allegiance

For each entity, provide:
- A confidence score (0.0 to 1.0) reflecting how certain you are about the extraction
- Source references: the exact text span(s) that evidence this entity
- All observable attributes

Rules:
- Extract ONLY what is present in the text. Do not infer or hallucinate entities.
- If an entity is ambiguous, extract it with a lower confidence score and note the ambiguity.
- For relationships, always specify both participants and the relationship type.
- For events, classify the type: action, dialogue, discovery, transformation, revelation, decision.
- Prefer specific names over pronouns. If only a pronoun is available, note it as an alias.
- If a character is referred to by multiple names or titles, list all as aliases.
```

#### User Prompt Template

```
## Context
Document: {documentTitle}
Position: {structuralBreadcrumb}
World: {worldName}

## Previously Extracted Entities (for continuity)
{priorEntityContext}

## Text to Analyze
{chunkContent}

## Instructions
Extract all story entities from the text above. Return your response as a JSON object
matching the ExtractionResponse schema.
```

### 4.2 Extraction Schema

```typescript
/** The full response from a single chunk extraction */
interface ExtractionResponse {
  /** Characters found in this chunk */
  characters: ExtractedCharacter[];

  /** Locations found in this chunk */
  locations: ExtractedLocation[];

  /** Events found in this chunk */
  events: ExtractedEvent[];

  /** Relationships observed in this chunk */
  relationships: ExtractedRelationship[];

  /** Themes identified in this chunk */
  themes: ExtractedTheme[];

  /** Significant objects found in this chunk */
  objects: ExtractedObject[];

  /** Factions/groups found in this chunk */
  factions: ExtractedFaction[];
}

interface ExtractedCharacter {
  /** Primary name as it appears in the text */
  name: string;

  /** Alternative names, titles, nicknames */
  aliases: string[];

  /** Physical description attributes observed */
  physicalTraits: Record<string, string>;

  /** Psychological traits observed (brave, cunning, etc.) */
  psychologicalTraits: string[];

  /** Role in this passage (protagonist, antagonist, mentor, etc.) */
  narrativeRole: string | null;

  /** Dialogue spoken in this chunk (for voice analysis) */
  dialogueExcerpts: string[];

  /** Confidence of extraction (0-1) */
  confidence: number;

  /** Source text spans evidencing this entity */
  sourceSpans: SourceSpan[];
}

interface ExtractedLocation {
  name: string;
  description: string;
  locationType: 'interior' | 'exterior' | 'mixed' | 'unknown';
  parentLocation: string | null;
  attributes: Record<string, string>;
  confidence: number;
  sourceSpans: SourceSpan[];
}

interface ExtractedEvent {
  /** Brief title/summary of the event */
  title: string;

  /** Detailed description */
  description: string;

  /** Event type classification */
  type: 'action' | 'dialogue' | 'discovery' | 'transformation' | 'revelation' | 'decision';

  /** Characters involved */
  involvedCharacters: string[];

  /** Location where event occurs */
  location: string | null;

  /** Causal links: what caused this event (if mentioned) */
  causes: string[];

  /** Consequences mentioned or implied */
  consequences: string[];

  /** Temporal markers in the text ("three days later", "that morning") */
  temporalMarkers: string[];

  confidence: number;
  sourceSpans: SourceSpan[];
}

interface ExtractedRelationship {
  /** First participant name */
  sourceCharacter: string;

  /** Second participant name */
  targetCharacter: string;

  /** Relationship type */
  type: string;

  /** Relationship description/label */
  description: string;

  /** Sentiment: positive, negative, neutral, ambivalent */
  sentiment: 'positive' | 'negative' | 'neutral' | 'ambivalent';

  /** Whether this relationship changes in this passage */
  isChanging: boolean;

  /** Description of change if applicable */
  changeDescription: string | null;

  confidence: number;
  sourceSpans: SourceSpan[];
}

interface ExtractedTheme {
  /** Theme name (e.g., "justice", "redemption", "isolation") */
  name: string;

  /** How the theme manifests in this passage */
  manifestation: string;

  /** Thematic opposition if apparent (e.g., "justice vs. mercy") */
  opposition: string | null;

  confidence: number;
  sourceSpans: SourceSpan[];
}

interface ExtractedObject {
  name: string;
  description: string;

  /** Narrative significance (Chekhov's gun, MacGuffin, symbol, etc.) */
  significance: string;

  /** Owner or associated character */
  associatedCharacter: string | null;

  /** Whether this appears to be a setup for later payoff */
  isForeshadowing: boolean;

  confidence: number;
  sourceSpans: SourceSpan[];
}

interface ExtractedFaction {
  name: string;
  description: string;

  /** Members identified in this passage */
  members: string[];

  /** Leader if identified */
  leader: string | null;

  /** Allegiances or rivalries mentioned */
  allegiances: Array<{ factionName: string; type: 'ally' | 'rival' | 'neutral' }>;

  confidence: number;
  sourceSpans: SourceSpan[];
}

/** Reference to a specific span in the source text */
interface SourceSpan {
  /** The exact text that evidences the extraction */
  text: string;

  /** Character offset from the start of the chunk */
  startOffset: number;

  /** Character offset of the end of the span */
  endOffset: number;
}

/** Reference to a location in the original source material */
interface SourceReference {
  sourceId: string;

  /** Character offset in the full document text */
  startOffset: number;
  endOffset: number;

  /** For audio/video sources: time code in seconds */
  startTime?: number;
  endTime?: number;

  /** Structural context (e.g., "Chapter 5, Scene 2") */
  structuralContext: string;
}
```

### 4.3 Chunk Overlap Strategy

The overlap strategy ensures entities that span chunk boundaries are captured:

1. **Overlap size**: ~500 tokens at each boundary. This means the last ~500 tokens of chunk N appear as the first ~500 tokens of chunk N+1.

2. **Deduplication**: Entities extracted from the overlap region of chunk N+1 that match entities from chunk N (by name and source span proximity) are merged, not duplicated. The entity resolution stage (stage 5) handles this.

3. **Context window budget**: For a 200K-token Claude context window, the budget per extraction call is approximately:
   - System prompt: ~500 tokens
   - Prior entity context: ~500 tokens (grows with extraction progress, capped)
   - Chunk content: ~3,500 tokens
   - Overlap: ~500 tokens included in chunk content
   - Response reservation: ~2,000 tokens
   - Total: ~7,000 tokens per call (well within limits)

4. **Long document handling**: For documents exceeding 100 chunks (~350,000 words), the prior entity context is summarized rather than listed exhaustively. A rolling window of the most recent 50 unique entity names is used.

### 4.4 Example Extraction Request/Response

#### Request to Claude API

```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 2000,
  "system": "You are an entity extraction system for StoryForge...[full system prompt]",
  "messages": [
    {
      "role": "user",
      "content": "## Context\nDocument: Pride and Prejudice\nPosition: Volume 1 > Chapter 3\nWorld: Austen Universe\n\n## Previously Extracted Entities\nCharacters: Elizabeth Bennet, Mr. Bennet, Mrs. Bennet, Jane Bennet\nLocations: Longbourn, Meryton\n\n## Text to Analyze\nMr. Bingley was good-looking and gentlemanlike; he had a pleasant countenance, and easy, unaffected manners. His sisters were fine women, with an air of decided fashion. His friend Mr. Darcy soon drew the attention of the room by his fine, tall person, handsome features, noble mien, and the report which was in general circulation within five minutes after his entrance, of his having ten thousand a year. The gentlemen pronounced him to be a fine figure of a man, the ladies declared he was much handsomer than Mr. Bingley, and he was looked at with great admiration for about half the evening, till his manners gave a disgust which turned the tide of his popularity; for he was discovered to be proud; to be above his company, and above being pleased...\n\n## Instructions\nExtract all story entities from the text above. Return your response as a JSON object matching the ExtractionResponse schema."
    }
  ]
}
```

#### Expected Response

```json
{
  "characters": [
    {
      "name": "Mr. Bingley",
      "aliases": ["Bingley", "Charles Bingley"],
      "physicalTraits": {
        "appearance": "good-looking",
        "build": "gentlemanlike"
      },
      "psychologicalTraits": ["pleasant", "easy-going", "unaffected"],
      "narrativeRole": null,
      "dialogueExcerpts": [],
      "confidence": 0.95,
      "sourceSpans": [
        {
          "text": "Mr. Bingley was good-looking and gentlemanlike; he had a pleasant countenance, and easy, unaffected manners.",
          "startOffset": 0,
          "endOffset": 108
        }
      ]
    },
    {
      "name": "Mr. Darcy",
      "aliases": ["Darcy", "Fitzwilliam Darcy"],
      "physicalTraits": {
        "height": "tall",
        "appearance": "handsome",
        "bearing": "noble mien"
      },
      "psychologicalTraits": ["proud", "aloof", "reserved"],
      "narrativeRole": null,
      "dialogueExcerpts": [],
      "confidence": 0.97,
      "sourceSpans": [
        {
          "text": "His friend Mr. Darcy soon drew the attention of the room by his fine, tall person, handsome features, noble mien",
          "startOffset": 210,
          "endOffset": 323
        }
      ]
    }
  ],
  "locations": [],
  "events": [
    {
      "title": "Mr. Darcy's popularity reversal at the ball",
      "description": "Mr. Darcy initially admired for his appearance and wealth, then shunned for his proud, dismissive behavior.",
      "type": "transformation",
      "involvedCharacters": ["Mr. Darcy", "Mr. Bingley"],
      "location": null,
      "causes": ["Mr. Darcy's proud manners"],
      "consequences": ["Public opinion turns against Darcy"],
      "temporalMarkers": ["about half the evening"],
      "confidence": 0.88,
      "sourceSpans": [
        {
          "text": "he was looked at with great admiration for about half the evening, till his manners gave a disgust which turned the tide of his popularity",
          "startOffset": 485,
          "endOffset": 622
        }
      ]
    }
  ],
  "relationships": [
    {
      "sourceCharacter": "Mr. Bingley",
      "targetCharacter": "Mr. Darcy",
      "type": "friendship",
      "description": "Close friends; Darcy accompanies Bingley",
      "sentiment": "positive",
      "isChanging": false,
      "changeDescription": null,
      "confidence": 0.85,
      "sourceSpans": [
        {
          "text": "His friend Mr. Darcy",
          "startOffset": 210,
          "endOffset": 230
        }
      ]
    }
  ],
  "themes": [
    {
      "name": "pride",
      "manifestation": "Darcy's proud behavior alienates the social gathering despite his wealth and appearance.",
      "opposition": "pride vs. social acceptance",
      "confidence": 0.92,
      "sourceSpans": [
        {
          "text": "he was discovered to be proud; to be above his company, and above being pleased",
          "startOffset": 623,
          "endOffset": 702
        }
      ]
    }
  ],
  "objects": [],
  "factions": [
    {
      "name": "Bingley party",
      "description": "Mr. Bingley's social group at the ball, including his sisters and Mr. Darcy.",
      "members": ["Mr. Bingley", "Mr. Darcy"],
      "leader": "Mr. Bingley",
      "allegiances": [],
      "confidence": 0.7,
      "sourceSpans": [
        {
          "text": "His sisters were fine women, with an air of decided fashion.",
          "startOffset": 109,
          "endOffset": 168
        }
      ]
    }
  ]
}
```

---

## 5. Entity Resolution Pipeline

### 5.1 Overview

Entity resolution runs after all chunks have been extracted. Its purpose is to consolidate the many per-chunk extractions into a unified set of entities for the story world.

### 5.2 Resolution Algorithm

The algorithm runs in four passes:

#### Pass 1: Exact Match Grouping

Group all extracted entities of the same type by their normalized primary name:
- Lowercase
- Strip leading articles ("the", "a")
- Collapse whitespace
- Remove honorifics for comparison but preserve them as aliases ("Mr. Darcy" and "Darcy" group together; "Mr." is noted)

Merge all attributes from grouped entities. For conflicting attributes, keep the value with the highest confidence score and flag the conflict.

#### Pass 2: Fuzzy Match

For entities not grouped in Pass 1, compute pairwise similarity within each entity type:

```typescript
function computeSimilarity(a: ExtractedEntity, b: ExtractedEntity): number {
  const nameSimilarity = 1 - normalizedLevenshtein(a.name, b.name);
  const semanticSimilarity = cosineSimilarity(a.embedding, b.embedding);
  const contextOverlap = computeContextOverlap(a, b);

  // Weighted combination
  return (
    nameSimilarity * 0.4 +
    semanticSimilarity * 0.35 +
    contextOverlap * 0.25
  );
}

function computeContextOverlap(a: ExtractedEntity, b: ExtractedEntity): number {
  // Fraction of shared co-occurring entities (relationships, locations, events)
  const aContext = new Set(getRelatedEntityNames(a));
  const bContext = new Set(getRelatedEntityNames(b));
  const intersection = new Set([...aContext].filter(x => bContext.has(x)));
  const union = new Set([...aContext, ...bContext]);
  return union.size > 0 ? intersection.size / union.size : 0;
}
```

Pairs with similarity above 0.85 are flagged as merge candidates. Pairs between 0.70 and 0.85 are flagged as ambiguous and presented to the user for decision.

#### Pass 3: Alias Detection

Specific patterns that indicate aliases rather than distinct entities:
- **Substring match**: "Liz" is a substring of "Elizabeth" and they share context -> alias
- **Title/honorific variants**: "Dr. Watson" / "John Watson" / "Watson" -> same entity
- **Married name changes**: Detected when a character name changes after a marriage event in the same narrative
- **Nickname patterns**: Diminutives (Robert/Bob, William/Bill, Elizabeth/Liz/Beth)

A built-in dictionary of common English-language diminutives and title patterns is used. For non-English names, the system relies on semantic similarity and context overlap.

#### Pass 4: Existing World Match

For worlds that already have entities (re-ingestion or additional source material), check each resolved entity against existing world entities:
- Exact name match -> propose merge with existing entity
- Fuzzy match above 0.80 -> propose merge with existing entity
- No match -> propose as new entity

### 5.3 User Confirmation Flow

The review UI presents entities in three categories:

1. **Auto-accepted** (confidence >= 0.95, no conflicts): Shown as confirmed but user can override.
2. **Needs review** (0.70 <= confidence < 0.95 or has conflicts): User must approve, edit, or dismiss.
3. **Ambiguous** (confidence < 0.70 or multiple possible matches): User must make a decision.

User actions per entity:
- **Confirm**: Accept the entity as-is into the story world.
- **Edit**: Modify attributes before confirming.
- **Merge**: Combine with another proposed or existing entity.
- **Split**: Separate a single extraction into two distinct entities.
- **Dismiss**: Reject the entity (not added to the world).
- **Defer**: Skip for now, revisit later.

---

## 6. File Storage

### 6.1 Storage Architecture

| Environment | Backend | Configuration |
|---|---|---|
| Development | Local filesystem | `STORAGE_PATH` env var (default: `./storage`) |
| Production | S3-compatible (AWS S3, MinIO, Cloudflare R2) | `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` |

### 6.2 Directory Structure

```
{storagePath}/
  {worldId}/
    {sourceId}/
      original/
        {originalFilename}          # The uploaded file, unmodified
      parsed/
        parsed-document.json        # ParsedDocument or TranscriptionResult
        chunks.json                 # TextChunk array
      extraction/
        chunk-{index}.json          # Per-chunk ExtractionResult
        resolved-entities.json      # EntityResolutionResult
        relationships.json          # MappedRelationship array
      media/
        audio-track.wav             # Extracted audio (for video files)
        frames/
          frame-00001.jpg           # Extracted key frames (for video)
          frame-00002.jpg
          ...
      embeddings/
        entity-embeddings.json      # Embedding metadata (vectors in pgvector)
        passage-embeddings.json
```

### 6.3 Database Record

The `SourceMaterial` table in PostgreSQL stores metadata. The actual file content lives in file storage.

```typescript
interface SourceMaterialRecord {
  id: string;                       // UUID
  worldId: string;                  // FK to StoryWorld
  userId: string;                   // FK to User (who uploaded)

  /** Original filename as uploaded */
  originalFilename: string;

  /** MIME type */
  mimeType: string;

  /** Media category */
  mediaType: 'text' | 'audio' | 'video' | 'image';

  /** File size in bytes */
  fileSize: number;

  /** SHA-256 hash of the original file */
  fileHash: string;

  /** Storage path (relative to storage root) */
  storagePath: string;

  /** Processing status */
  status: 'uploading' | 'processing' | 'review_pending' | 'completed' | 'failed' | 'cancelled';

  /** Current pipeline stage (for progress tracking) */
  currentStage: string | null;

  /** Progress percentage (0-100) */
  progress: number;

  /** Error message if status is 'failed' */
  errorMessage: string | null;

  /** Number of entities extracted */
  entityCount: number;

  /** Number of entities confirmed by user */
  confirmedEntityCount: number;

  /** Full-text search vector */
  searchVector: string;            // tsvector column

  /** Parsed text content (stored for full-text search) */
  parsedText: string | null;

  /** Processing metadata (timing, token usage, etc.) */
  processingMetadata: Record<string, unknown> | null;

  createdAt: Date;
  updatedAt: Date;
}
```

### 6.4 Presigned URLs

In production, files are never served directly. The API generates short-lived presigned URLs (15-minute expiry) for:
- Source material downloads (original file)
- Key frame image display
- Audio/video playback in the Source Material Viewer

```typescript
interface PresignedUrlRequest {
  sourceId: string;
  filePath: string;       // relative path within the source's storage directory
  expiresIn?: number;     // seconds, default 900 (15 minutes)
}

interface PresignedUrlResponse {
  url: string;
  expiresAt: string;      // ISO 8601 timestamp
}
```

---

## 7. Progress Tracking & User Experience

### 7.1 Real-Time Progress via WebSocket

The ingestion pipeline emits progress events via Socket.io. Clients subscribe to a room scoped to their world:

```typescript
// Client-side subscription
socket.join(`world:${worldId}:ingestion`);

socket.on('ingestion:progress', (event: IngestionProgressEvent) => {
  // Update UI progress indicators
});

socket.on('ingestion:review_ready', (event: ReviewReadyEvent) => {
  // Show "Review Entities" notification
});

socket.on('ingestion:failed', (event: IngestionFailedEvent) => {
  // Show error message
});
```

#### Event Types

```typescript
interface IngestionProgressEvent {
  sourceId: string;
  worldId: string;
  stage: string;
  progress: number;          // 0-100
  message: string;           // Human-readable status, e.g., "Extracting entities from chunk 5 of 12..."
  estimatedTimeRemaining: number | null;  // seconds
}

interface ReviewReadyEvent {
  sourceId: string;
  worldId: string;
  summary: {
    totalEntities: number;
    byType: Record<string, number>;
    needsReview: number;
  };
}

interface IngestionFailedEvent {
  sourceId: string;
  worldId: string;
  stage: string;
  error: string;
  isRetryable: boolean;
}
```

### 7.2 Batch Upload

Users can upload multiple files at once. Each file gets its own `SourceMaterial` record and ingestion job. The UI shows:

- A list of all files in the batch with individual progress bars
- Overall batch progress (percentage of files completed)
- Per-file status: queued, processing (with stage), review pending, completed, failed
- Ability to cancel individual files without affecting the batch

### 7.3 Cancel & Retry

- **Cancel**: Sets the job state to `cancelled`. The current stage completes its current unit of work (e.g., finishes the current chunk extraction) then halts. Partial results are discarded. The `SourceMaterial` record is updated to `cancelled` status.
- **Retry**: Creates a new ingestion job for the same file. If partial results from a previous run exist, the pipeline can optionally resume from the last completed stage (configurable; default is to re-run from the beginning for consistency).

### 7.4 Error Reporting

Error messages are structured for both programmatic handling and user display:

```typescript
interface IngestionError {
  /** Machine-readable error code */
  code: string;

  /** Human-readable error message */
  message: string;

  /** The pipeline stage where the error occurred */
  stage: string;

  /** Whether the user can retry this operation */
  isRetryable: boolean;

  /** Suggested user action */
  suggestion: string;

  /** Technical details (for bug reports, not shown to user by default) */
  details?: string;
}
```

Example error messages:

| Code | Message | Suggestion |
|---|---|---|
| `PARSE_UNSUPPORTED_FORMAT` | "This file format is not supported." | "Supported formats: .txt, .md, .docx, .pdf, .fdx, .fountain, .epub" |
| `PARSE_CORRUPT_FILE` | "The file appears to be corrupt or unreadable." | "Try re-exporting the file from its source application." |
| `PARSE_EMPTY_DOCUMENT` | "No text content was found in this file." | "Ensure the file contains text content (not just images)." |
| `TRANSCRIPTION_FAILED` | "Audio transcription failed after multiple attempts." | "Check that the audio is clear and in a supported language." |
| `EXTRACTION_RATE_LIMITED` | "Entity extraction is temporarily rate-limited." | "Processing will resume automatically. No action needed." |
| `EXTRACTION_PARTIAL` | "Some sections could not be analyzed." | "You can re-process failed sections from the source material viewer." |
| `STORAGE_WRITE_FAILED` | "Failed to store the uploaded file." | "Please try uploading again. If the problem persists, contact support." |
| `FILE_TOO_LARGE` | "This file exceeds the maximum allowed size." | "Maximum file size: {maxSize}. Consider splitting the file." |

---

## 8. Error Handling

### 8.1 Parse Failures

Each parser has format-specific error handling:

| Format | Common Errors | Handling |
|---|---|---|
| `.docx` | Corrupt ZIP archive, password-protected | Report specific error; suggest re-export |
| `.pdf` | Scanned/image-only PDF, encrypted | Fall back to OCR via Claude Vision; report if encrypted |
| `.fdx` | Malformed XML, unsupported FDX version | Attempt lenient XML parsing; report specific validation errors |
| `.fountain` | Non-standard extensions, encoding issues | `Fountain.js` is lenient; report only total parse failures |
| `.epub` | DRM-protected, malformed spine | Report DRM; attempt partial extraction for malformed EPUBs |

For all text formats, encoding detection is attempted in order: UTF-8, UTF-16, ISO-8859-1, Windows-1252. If all fail, the file is reported as unreadable.

### 8.2 Transcription Failures

| Scenario | Handling |
|---|---|
| Whisper API timeout | Retry up to 2 times; if Whisper fails, attempt Deepgram as fallback |
| Low-quality audio | Complete transcription but report low confidence scores; flag segments below 0.5 confidence |
| Unsupported language | Report to user; suggest specifying the language manually |
| Empty audio | Detect silence; report "no speech detected" |
| Speaker diarization failure | Fall back to single-speaker mode; all text attributed to "SPEAKER_00" |

### 8.3 Extraction Failures

| Scenario | Handling |
|---|---|
| Claude API 429 (rate limit) | Respect `Retry-After` header; queue with appropriate delay |
| Claude API 500 (server error) | Retry with exponential backoff (up to 3 attempts) |
| Malformed JSON response | Retry with a stricter prompt that emphasizes JSON-only output; on second failure, attempt to parse partial JSON |
| Empty extraction (no entities found) | Accept as valid (some chunks may genuinely contain no extractable entities); log for review |
| Context window exceeded | Should not happen with proper chunking; if it does, re-chunk with smaller target size and retry |

### 8.4 Rate Limiting

The extraction queue manages Claude API rate limits:

1. **Concurrency limit**: Default 3 concurrent extraction jobs (configurable via `EXTRACTION_CONCURRENCY`).
2. **Token budget**: Track tokens consumed per minute. If approaching the API rate limit (based on `CLAUDE_RATE_LIMIT_TPM`), throttle new jobs by increasing the delay between job starts.
3. **Backpressure**: If the extraction queue depth exceeds 100 jobs, new ingestion jobs are queued at lower priority to prevent starvation.

### 8.5 Partial Success

The pipeline is designed for graceful degradation:

- If 3 out of 20 chunks fail extraction, the pipeline completes with 17 chunks of results. The 3 failed chunks are flagged in the review UI with a "Re-process" button.
- If embedding generation fails, entities are still created and searchable via full-text (just not via semantic search). The embedding job is queued for retry.
- If full-text indexing fails, entities are still created. The indexing job is queued for retry.

The `SourceMaterial` record tracks partial completion:

```typescript
interface ProcessingMetadata {
  /** Per-stage completion status */
  stages: Record<string, {
    status: 'pending' | 'in_progress' | 'completed' | 'partial' | 'failed';
    startedAt: string | null;
    completedAt: string | null;
    error: string | null;
    /** For chunked stages: how many units completed vs. total */
    progress: { completed: number; total: number } | null;
  }>;

  /** Total tokens consumed by Claude API calls */
  tokensUsed: {
    input: number;
    output: number;
  };

  /** Total processing time in milliseconds */
  totalProcessingTime: number;
}
```

---

## 9. Performance Considerations

### 9.1 Chunk Size Optimization

The chunk size directly impacts extraction quality, cost, and speed:

| Chunk Size | Quality | Cost | Speed | Use When |
|---|---|---|---|---|
| 1,500 tokens | Lower (less context per call) | Higher (more calls) | Slower | Short documents where precision matters |
| 3,500 tokens (default) | Good balance | Moderate | Moderate | General use |
| 6,000 tokens | Higher (more context) | Lower (fewer calls) | Faster | Long documents where entities are spread out |

The default of ~3,500 tokens is chosen because:
- It provides enough context for Claude to understand character relationships within a scene
- It keeps extraction calls fast (< 5 seconds typically)
- It balances cost: a 100,000-word novel produces ~50 chunks at this size

### 9.2 Parallel Processing

| Dimension | Default Concurrency | Notes |
|---|---|---|
| Files (ingestion queue) | 5 | Independent files processed in parallel |
| Transcription jobs | 2 | Whisper API rate limits are strict |
| Extraction jobs (Claude API) | 3 | Balances speed against rate limits |
| Embedding batch generation | 10 | Embedding APIs handle high concurrency |
| Indexing jobs | 10 | Local database operations; limited by DB connections |

Within a single file, stages are sequential (parsing must complete before chunking, etc.). Across files, processing is fully parallel up to queue concurrency limits.

### 9.3 Memory Management

For large files, the pipeline uses streaming where possible:

- **File upload**: Streamed to storage, never held entirely in memory.
- **PDF parsing**: `pdf-parse` loads the full PDF into memory. For PDFs > 50MB, a warning is shown. For PDFs > 200MB, the upload is rejected.
- **Audio/video**: FFmpeg processes files on disk via streaming. Only the current audio segment (25 minutes of WAV) is in memory during transcription.
- **Chunk processing**: Only the current chunk plus its context header is in memory during extraction.

Memory limits per queue worker:

| Queue | Max Memory per Worker |
|---|---|
| `ingestion` | 512 MB |
| `transcription` | 1 GB (audio segments can be large) |
| `extraction` | 256 MB |
| `embedding` | 512 MB (batches of vectors) |
| `indexing` | 256 MB |

### 9.4 Expected Processing Times

These are estimates for a single file with default configuration and no queue contention:

| Input | Size | Parsing | Extraction | Resolution | Total (approx.) |
|---|---|---|---|---|---|
| Novel (.txt) | 80,000 words | < 1s | ~2 min (30 chunks x 4s) | ~5s | ~3 min |
| Screenplay (.fountain) | 120 pages | < 1s | ~1 min (15 chunks x 4s) | ~3s | ~1.5 min |
| Short story (.docx) | 5,000 words | < 1s | ~8s (2 chunks x 4s) | ~1s | ~15s |
| Podcast (.mp3) | 60 minutes | ~3 min (transcription) | ~2 min | ~5s | ~6 min |
| Film (.mp4) | 120 minutes | ~8 min (transcode + transcribe) | ~4 min | ~10s | ~15 min |
| Concept art (.jpg) | 5 MB | < 1s (Vision API) | N/A | ~1s | ~5s |
| TV series bible (.pdf) | 200 pages | ~2s | ~5 min (60 chunks x 5s) | ~10s | ~6 min |

These times scale linearly with document size. Queue contention adds latency based on position in queue and concurrency limits.

---

## 10. Configuration

### 10.1 Environment Variables

#### Required

| Variable | Description | Example |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude API key for entity extraction and vision analysis | `sk-ant-...` |
| `REDIS_URL` | Redis connection URL for BullMQ | `redis://localhost:6379` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/storyforge` |

#### Storage

| Variable | Description | Default |
|---|---|---|
| `STORAGE_BACKEND` | Storage backend type | `local` |
| `STORAGE_PATH` | Local storage path (when `STORAGE_BACKEND=local`) | `./storage` |
| `S3_BUCKET` | S3 bucket name (when `STORAGE_BACKEND=s3`) | -- |
| `S3_REGION` | S3 region | `us-east-1` |
| `S3_ACCESS_KEY` | S3 access key ID | -- |
| `S3_SECRET_KEY` | S3 secret access key | -- |
| `S3_ENDPOINT` | Custom S3 endpoint (for MinIO, R2, etc.) | -- |

#### Transcription

| Variable | Description | Default |
|---|---|---|
| `TRANSCRIPTION_PROVIDER` | Whisper API provider | `openai` |
| `OPENAI_API_KEY` | OpenAI API key (for Whisper) | -- |
| `DEEPGRAM_API_KEY` | Deepgram API key (fallback transcription) | -- |

#### Embeddings

| Variable | Description | Default |
|---|---|---|
| `EMBEDDING_PROVIDER` | Embedding generation provider | `voyage` |
| `VOYAGE_API_KEY` | Voyage AI API key | -- |
| `EMBEDDING_MODEL` | Embedding model name | `voyage-3` |
| `EMBEDDING_DIMENSIONS` | Vector dimensions | `1024` |

#### SuperMemory

| Variable | Description | Default |
|---|---|---|
| `SUPERMEMORY_API_KEY` | SuperMemory SDK API key | -- |
| `SUPERMEMORY_ENDPOINT` | SuperMemory endpoint URL | -- |

### 10.2 Configurable Limits

| Setting | Environment Variable | Default | Description |
|---|---|---|---|
| Max file size (text) | `MAX_TEXT_FILE_SIZE` | `50MB` | Maximum upload size for text files |
| Max file size (audio) | `MAX_AUDIO_FILE_SIZE` | `500MB` | Maximum upload size for audio files |
| Max file size (video) | `MAX_VIDEO_FILE_SIZE` | `2GB` | Maximum upload size for video files |
| Max file size (image) | `MAX_IMAGE_FILE_SIZE` | `25MB` | Maximum upload size for images |
| Max concurrent ingestion jobs | `INGESTION_CONCURRENCY` | `5` | Max files processing simultaneously |
| Max concurrent transcription jobs | `TRANSCRIPTION_CONCURRENCY` | `2` | Max transcription API calls in parallel |
| Max concurrent extraction jobs | `EXTRACTION_CONCURRENCY` | `3` | Max Claude API extraction calls in parallel |
| Chunk size (tokens) | `CHUNK_SIZE_TOKENS` | `3500` | Target chunk size for text splitting |
| Chunk overlap (tokens) | `CHUNK_OVERLAP_TOKENS` | `500` | Overlap between adjacent chunks |
| Video key frame interval | `KEYFRAME_INTERVAL_SECONDS` | `10` | Seconds between key frame extractions |
| Video scene detection threshold | `SCENE_DETECTION_THRESHOLD` | `0.4` | Histogram difference threshold for scene cuts |
| Claude API rate limit (TPM) | `CLAUDE_RATE_LIMIT_TPM` | `100000` | Tokens per minute budget for extraction |
| Entity auto-accept threshold | `ENTITY_AUTO_ACCEPT_CONFIDENCE` | `0.95` | Confidence above which entities are auto-accepted |
| Entity review threshold | `ENTITY_REVIEW_CONFIDENCE` | `0.70` | Confidence below which entities are flagged as ambiguous |

### 10.3 Feature Flags

| Flag | Default | Description |
|---|---|---|
| `FF_TRANSCRIPTION_ENABLED` | `true` | Enable audio/video transcription (disable to save costs in dev) |
| `FF_VISION_ANALYSIS_ENABLED` | `true` | Enable Claude Vision for images and video key frames |
| `FF_VIDEO_SCENE_DETECTION` | `true` | Enable visual scene detection for video files |
| `FF_EMBEDDING_GENERATION` | `true` | Enable vector embedding generation |
| `FF_SUPERMEMORY_SYNC` | `true` | Enable SuperMemory knowledge graph sync |
| `FF_AUTO_ACCEPT_ENTITIES` | `false` | Auto-accept entities above confidence threshold (skip manual review) |
| `FF_DEEPGRAM_FALLBACK` | `true` | Fall back to Deepgram when Whisper fails |

---

## Appendix A: Job Payload Types

These TypeScript interfaces define the payloads for BullMQ jobs across all queues.

```typescript
// ─── Ingestion Queue ─────────────────────────────────────────

interface IngestionJobPayload {
  /** The SourceMaterial record ID */
  sourceId: string;

  /** The StoryWorld this file belongs to */
  worldId: string;

  /** The user who initiated the upload */
  userId: string;

  /** File storage path */
  storagePath: string;

  /** Original filename */
  filename: string;

  /** Detected media type */
  mediaType: 'text' | 'audio' | 'video' | 'image';

  /** MIME type */
  mimeType: string;

  /** File size in bytes */
  fileSize: number;

  /** Optional: resume from a specific stage (for retries) */
  resumeFromStage?: string;

  /** Optional: configuration overrides for this specific job */
  config?: Partial<IngestionConfig>;
}

interface IngestionConfig {
  chunkSizeTokens: number;
  chunkOverlapTokens: number;
  keyframeIntervalSeconds: number;
  sceneDetectionThreshold: number;
  autoAcceptConfidence: number;
  reviewConfidence: number;
  enableVisionAnalysis: boolean;
  enableSceneDetection: boolean;
  language: string | null;
}

// ─── Transcription Queue ─────────────────────────────────────

interface TranscriptionJobPayload {
  sourceId: string;
  worldId: string;

  /** Path to the audio file (extracted from video, or the original audio upload) */
  audioPath: string;

  /** Transcription provider preference */
  provider: 'whisper' | 'deepgram';

  /** Language hint (null for auto-detect) */
  language: string | null;

  /** Enable speaker diarization */
  diarization: boolean;

  /** For long audio: segment index (if split into segments) */
  segmentIndex: number;
  totalSegments: number;
}

// ─── Extraction Queue ────────────────────────────────────────

interface ExtractionJobPayload {
  sourceId: string;
  worldId: string;

  /** The text chunk to analyze */
  chunk: TextChunk;

  /** Document-level context */
  documentTitle: string;
  worldName: string;

  /** Entity names extracted from prior chunks (for continuity) */
  priorEntityContext: string[];

  /** Claude model to use */
  model: string;
}

// ─── Embedding Queue ─────────────────────────────────────────

interface EmbeddingJobPayload {
  sourceId: string;
  worldId: string;

  /** Batch of items to embed */
  items: Array<{
    referenceType: 'entity' | 'passage';
    referenceId: string;
    text: string;
  }>;

  /** Embedding model to use */
  model: string;
}

// ─── Indexing Queue ──────────────────────────────────────────

interface IndexingJobPayload {
  sourceId: string;
  worldId: string;

  /** Type of indexing operation */
  operation: 'source_material' | 'entity' | 'relationship';

  /** The text content to index */
  content: string;

  /** The record ID to update */
  recordId: string;

  /** Language for tsvector configuration */
  language: string;
}
```

## Appendix B: Entity Type Enum

```typescript
type EntityType =
  | 'character'
  | 'location'
  | 'event'
  | 'relationship'
  | 'theme'
  | 'object'
  | 'faction'
  | 'motif'
  | 'scene'
  | 'beat';
```

## Appendix C: API Routes

The ingestion pipeline exposes the following API routes under `/api/ingest/`:

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/ingest/upload` | Upload a file for ingestion. Returns `sourceId` and `jobId`. |
| `GET` | `/api/ingest/status/{sourceId}` | Get current processing status and progress for a source. |
| `POST` | `/api/ingest/cancel/{sourceId}` | Cancel an in-progress ingestion job. |
| `POST` | `/api/ingest/retry/{sourceId}` | Retry a failed ingestion job. |
| `GET` | `/api/ingest/review/{sourceId}` | Get the review package (proposed entities) for a completed ingestion. |
| `POST` | `/api/ingest/review/{sourceId}/confirm` | Confirm, edit, merge, or dismiss proposed entities. |
| `GET` | `/api/ingest/batch/{worldId}` | List all ingestion jobs for a world with status summary. |

All routes return typed JSON responses with consistent error shape:

```typescript
// Success response
interface ApiSuccessResponse<T> {
  data: T;
}

// Error response
interface ApiErrorResponse {
  error: string;
  code: string;
}
```
