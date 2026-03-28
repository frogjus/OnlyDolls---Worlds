# StoryForge Ingestion Pipeline Architecture

## Table of Contents

1. [Pipeline Overview](#1-pipeline-overview)
2. [Claude API Prompt Templates](#2-claude-api-prompt-templates)
3. [Entity Resolution System](#3-entity-resolution-system)
4. [BullMQ Job Architecture](#4-bullmq-job-architecture)
5. [Chunking Strategy](#5-chunking-strategy)

---

## 1. Pipeline Overview

### High-Level Architecture

```
                         +------------------+
                         |   File Upload    |
                         |   (Presigned S3) |
                         +--------+---------+
                                  |
                         +--------v---------+
                         |  Format Detect   |
                         |  (magic bytes +  |
                         |   extension)     |
                         +--------+---------+
                                  |
              +-------------------+-------------------+
              |                   |                   |
     +--------v------+  +--------v------+  +---------v-----+
     |  Text Pipeline |  | Audio Pipeline|  | Video Pipeline |
     |  .txt .md .pdf |  | .mp3 .wav     |  | .mp4 .mkv     |
     |  .docx .fdx    |  | .m4a .ogg     |  | .mov .webm    |
     |  .fountain     |  | .flac         |  |               |
     |  .epub         |  +-------+-------+  +-------+-------+
     +-------+--------+          |                  |
             |                   v                  v
             |          +----------------+  +----------------+
             |          | Transcription  |  | FFmpeg Extract |
             |          | (Whisper/      |  | Audio+Keyframes|
             |          |  Deepgram)     |  +-------+--------+
             |          +-------+--------+          |
             |                  |            +------+------+
             |                  |            |             |
             |                  v            v             v
             |          +-------------+ +--------+ +----------+
             |          | Time-coded  | | Audio  | | Keyframe |
             |          | Transcript  | | Track  | | Images   |
             |          +------+------+ +---+----+ +----+-----+
             |                 |            |           |
             +--------+--------+            |           |
                      |                     v           v
             +--------v---------+   +-------+----+ +---+--------+
             |  Chunking Engine |   |Transcribe  | |Claude      |
             |  (structure-     |   |Pipeline    | |Vision API  |
             |   aware)         |   +------+-----+ +---+--------+
             +--------+---------+          |           |
                      |                    v           |
             +--------v---------+   +------+-----+    |
             | Claude API       |   |Text Ingest |    |
             | Entity Extraction|   |Pipeline    |    |
             +--------+---------+   +------+-----+    |
                      |                    |           |
             +--------v---------+          |           |
             | Entity Resolution|<---------+-----------+
             | (fuzzy match +   |
             |  confidence)     |
             +--------+---------+
                      |
             +--------v---------+
             | Store Results    |
             | PostgreSQL +     |
             | SuperMemory      |
             +--------+---------+
                      |
             +--------v---------+
             | User Review UI   |
             | (confirm/merge/  |
             |  dismiss)        |
             +------------------+
```

---

### 1.1 Text Pipeline (.txt, .md, .docx, .pdf, .fdx, .fountain, .epub)

#### Step 1: File Upload and Format Detection

```typescript
// src/ingestion/detect-format.ts

import { fileTypeFromBuffer } from 'file-type';

const SUPPORTED_TEXT_FORMATS = {
  'text/plain': 'txt',
  'text/markdown': 'md',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/pdf': 'pdf',
  'application/x-final-draft': 'fdx',
  'text/x-fountain': 'fountain',
  'application/epub+zip': 'epub',
} as const;

type SupportedFormat = typeof SUPPORTED_TEXT_FORMATS[keyof typeof SUPPORTED_TEXT_FORMATS];

interface DetectedFile {
  format: SupportedFormat;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
}

export async function detectFormat(buffer: Buffer, filename: string): Promise<DetectedFile> {
  // Try magic bytes first
  const fileType = await fileTypeFromBuffer(buffer);

  if (fileType && fileType.mime in SUPPORTED_TEXT_FORMATS) {
    return {
      format: SUPPORTED_TEXT_FORMATS[fileType.mime as keyof typeof SUPPORTED_TEXT_FORMATS],
      mimeType: fileType.mime,
      sizeBytes: buffer.byteLength,
      originalName: filename,
    };
  }

  // Fall back to extension-based detection for plain text formats
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'txt':
      return { format: 'txt', mimeType: 'text/plain', sizeBytes: buffer.byteLength, originalName: filename };
    case 'md':
      return { format: 'md', mimeType: 'text/markdown', sizeBytes: buffer.byteLength, originalName: filename };
    case 'fountain':
      return { format: 'fountain', mimeType: 'text/x-fountain', sizeBytes: buffer.byteLength, originalName: filename };
    case 'fdx':
      return { format: 'fdx', mimeType: 'application/x-final-draft', sizeBytes: buffer.byteLength, originalName: filename };
    default:
      throw new Error(`Unsupported file format: ${ext}`);
  }
}
```

#### Step 2: Parser Selection and Structured Text Extraction

```typescript
// src/ingestion/parsers/index.ts

import mammoth from 'mammoth';
import * as pdfParse from 'pdf-parse';
import { parseEpub } from '@nicnbk/epub-parser';
import { parse as parseFountain } from 'fountain-js';

interface ParsedDocument {
  title: string;
  rawText: string;
  sections: Section[];
  metadata: Record<string, string>;
  format: string;
}

interface Section {
  type: 'chapter' | 'scene' | 'act' | 'part' | 'section';
  title: string;
  content: string;
  startOffset: number;
  endOffset: number;
  children: Section[];
  markers: Marker[];
}

interface Marker {
  type: 'dialogue' | 'scene_heading' | 'transition' | 'character_intro' | 'time_reference';
  text: string;
  attribution?: string; // For dialogue: who is speaking
  offset: number;
}

const parsers: Record<string, (buffer: Buffer) => Promise<ParsedDocument>> = {
  txt: parsePlainText,
  md: parseMarkdown,
  docx: parseDocx,
  pdf: parsePdf,
  fdx: parseFinalDraft,
  fountain: parseFountainFile,
  epub: parseEpubFile,
};

export async function parseDocument(buffer: Buffer, format: string): Promise<ParsedDocument> {
  const parser = parsers[format];
  if (!parser) throw new Error(`No parser for format: ${format}`);
  return parser(buffer);
}

async function parsePlainText(buffer: Buffer): Promise<ParsedDocument> {
  const text = buffer.toString('utf-8');
  const sections = detectStructuralBoundaries(text);
  return { title: '', rawText: text, sections, metadata: {}, format: 'txt' };
}

async function parseDocx(buffer: Buffer): Promise<ParsedDocument> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;
  const sections = detectStructuralBoundaries(text);
  return { title: '', rawText: text, sections, metadata: {}, format: 'docx' };
}

async function parsePdf(buffer: Buffer): Promise<ParsedDocument> {
  const data = await pdfParse(buffer);
  const sections = detectStructuralBoundaries(data.text);
  return {
    title: data.info?.Title ?? '',
    rawText: data.text,
    sections,
    metadata: { pages: String(data.numpages) },
    format: 'pdf',
  };
}

/**
 * Detect structural boundaries in plain/extracted text using heuristic patterns.
 */
function detectStructuralBoundaries(text: string): Section[] {
  const patterns = {
    chapter: /^(?:chapter|ch\.?)\s+(\d+|[IVXLC]+)[\s.:—-]*(.*)/im,
    act: /^act\s+(\d+|[IVXLC]+|one|two|three|four|five)[\s.:—-]*(.*)/im,
    scene: /^scene\s+(\d+|[IVXLC]+)[\s.:—-]*(.*)/im,
    part: /^part\s+(\d+|[IVXLC]+|one|two|three|four|five)[\s.:—-]*(.*)/im,
    separator: /^\s*[*#=\-]{3,}\s*$/m,
  };

  const sections: Section[] = [];
  const lines = text.split('\n');
  let currentSection: Section | null = null;
  let currentOffset = 0;

  for (const line of lines) {
    let matched = false;
    for (const [type, pattern] of Object.entries(patterns)) {
      if (type === 'separator') continue;
      const match = line.match(pattern);
      if (match) {
        if (currentSection) {
          currentSection.endOffset = currentOffset;
          sections.push(currentSection);
        }
        currentSection = {
          type: type as Section['type'],
          title: match[2]?.trim() || `${type} ${match[1]}`,
          content: '',
          startOffset: currentOffset,
          endOffset: currentOffset,
          children: [],
          markers: [],
        };
        matched = true;
        break;
      }
    }

    if (!matched && currentSection) {
      currentSection.content += line + '\n';

      // Detect dialogue patterns: "Character Name: dialogue" or quoted speech
      const dialogueMatch = line.match(/^([A-Z][A-Za-z\s]+):\s*[""](.+)/);
      if (dialogueMatch) {
        currentSection.markers.push({
          type: 'dialogue',
          text: dialogueMatch[2],
          attribution: dialogueMatch[1].trim(),
          offset: currentOffset,
        });
      }
    }

    currentOffset += line.length + 1;
  }

  if (currentSection) {
    currentSection.endOffset = currentOffset;
    sections.push(currentSection);
  }

  // If no structural boundaries found, wrap entire text as one section
  if (sections.length === 0) {
    sections.push({
      type: 'section',
      title: 'Full Document',
      content: text,
      startOffset: 0,
      endOffset: text.length,
      children: [],
      markers: [],
    });
  }

  return sections;
}
```

#### Step 3: Chunking (see [Section 5](#5-chunking-strategy) for full details)

#### Step 4: Claude API Entity Extraction (see [Section 2](#2-claude-api-prompt-templates) for prompts)

#### Step 5: Entity Resolution (see [Section 3](#3-entity-resolution-system))

#### Step 6: Store Results

```typescript
// src/ingestion/store-results.ts

import { db } from '../db/client';
import { superMemory } from '../memory/client';

interface ExtractedEntity {
  id: string;
  type: 'character' | 'location' | 'event' | 'item' | 'concept' | 'faction';
  name: string;
  aliases: string[];
  description: string;
  traits: Record<string, string>;
  sourceChunkIds: string[];
  confidence: number;
}

interface ExtractedRelationship {
  sourceEntityId: string;
  targetEntityId: string;
  type: 'ally' | 'enemy' | 'family' | 'romantic' | 'mentor' | 'rival' | 'member_of' | 'located_in' | 'owns' | 'custom';
  customLabel?: string;
  description: string;
  strength: number; // 0-1
  timelinePosition?: string;
}

interface ExtractedEvent {
  id: string;
  name: string;
  description: string;
  participantIds: string[];
  locationId?: string;
  relativeOrder: number; // Ordinal position in narrative
  causalLinks: { eventId: string; relationship: 'causes' | 'enables' | 'prevents' | 'follows' }[];
  emotionalImpact: Record<string, string>; // characterId -> emotion
}

export async function storeExtractionResults(
  worldId: string,
  sourceId: string,
  entities: ExtractedEntity[],
  relationships: ExtractedRelationship[],
  events: ExtractedEvent[],
  themes: { name: string; description: string; evidence: string[] }[],
) {
  // --- PostgreSQL: structured data ---
  await db.transaction(async (tx) => {
    // Upsert entities
    for (const entity of entities) {
      await tx.query(
        `INSERT INTO world_entities (id, world_id, source_id, type, name, aliases, description, traits, confidence)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           aliases = array_cat(world_entities.aliases, EXCLUDED.aliases),
           description = EXCLUDED.description,
           traits = world_entities.traits || EXCLUDED.traits,
           confidence = GREATEST(world_entities.confidence, EXCLUDED.confidence)`,
        [entity.id, worldId, sourceId, entity.type, entity.name,
         entity.aliases, entity.description, JSON.stringify(entity.traits), entity.confidence],
      );
    }

    // Insert relationships
    for (const rel of relationships) {
      await tx.query(
        `INSERT INTO entity_relationships (world_id, source_entity_id, target_entity_id, type, custom_label, description, strength, timeline_position)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (world_id, source_entity_id, target_entity_id, type) DO UPDATE SET
           description = EXCLUDED.description,
           strength = GREATEST(entity_relationships.strength, EXCLUDED.strength)`,
        [worldId, rel.sourceEntityId, rel.targetEntityId, rel.type,
         rel.customLabel, rel.description, rel.strength, rel.timelinePosition],
      );
    }

    // Insert events
    for (const event of events) {
      await tx.query(
        `INSERT INTO timeline_events (id, world_id, source_id, name, description, participant_ids, location_id, relative_order, causal_links, emotional_impact)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           description = EXCLUDED.description,
           participant_ids = EXCLUDED.participant_ids`,
        [event.id, worldId, sourceId, event.name, event.description,
         event.participantIds, event.locationId, event.relativeOrder,
         JSON.stringify(event.causalLinks), JSON.stringify(event.emotionalImpact)],
      );
    }

    // Insert themes
    for (const theme of themes) {
      await tx.query(
        `INSERT INTO world_themes (world_id, source_id, name, description, evidence)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (world_id, name) DO UPDATE SET
           description = EXCLUDED.description,
           evidence = array_cat(world_themes.evidence, EXCLUDED.evidence)`,
        [worldId, sourceId, theme.name, theme.description, theme.evidence],
      );
    }
  });

  // --- SuperMemory: semantic search layer ---
  for (const entity of entities) {
    await superMemory.add({
      content: `${entity.type}: ${entity.name}\n${entity.description}\nTraits: ${JSON.stringify(entity.traits)}`,
      metadata: {
        worldId,
        entityId: entity.id,
        entityType: entity.type,
        sourceId,
      },
    });
  }

  for (const event of events) {
    await superMemory.add({
      content: `Event: ${event.name}\n${event.description}`,
      metadata: {
        worldId,
        eventId: event.id,
        entityType: 'event',
        sourceId,
        participantIds: event.participantIds,
      },
    });
  }
}
```

#### Step 7: User Review (Confirm/Merge/Dismiss)

The user review flow is described in [Section 3.4](#34-user-review-ui-flow).

---

### 1.2 Screenplay Pipeline (.fountain, .fdx)

Screenplays get a specialized first pass that exploits the rigid formatting of Fountain and FDX to extract entities without an LLM call. Claude is only needed for higher-order extraction (relationships, themes).

```typescript
// src/ingestion/parsers/fountain-parser.ts

import { parse as fountainParse } from 'fountain-js';

interface ScreenplayScene {
  sceneNumber: number;
  heading: string;
  intExt: 'INT' | 'EXT' | 'INT/EXT' | 'I/E';
  location: string;
  timeOfDay: string;
  content: string;
  characters: string[];          // Characters with dialogue in this scene
  dialogueBlocks: DialogueBlock[];
}

interface DialogueBlock {
  character: string;
  parenthetical?: string;
  text: string;
  isDual: boolean;
}

interface ScreenplayData {
  title: string;
  credit: string;
  author: string;
  scenes: ScreenplayScene[];
  allCharacters: Set<string>;
  allLocations: Set<string>;
}

export function parseScreenplay(source: string): ScreenplayData {
  const result = fountainParse(source);

  const scenes: ScreenplayScene[] = [];
  const allCharacters = new Set<string>();
  const allLocations = new Set<string>();

  let currentScene: ScreenplayScene | null = null;

  for (const token of result.tokens) {
    switch (token.type) {
      case 'scene_heading': {
        if (currentScene) scenes.push(currentScene);

        // Parse slugline: INT. COFFEE SHOP - NIGHT
        const heading = token.text || '';
        const slugMatch = heading.match(/^(INT|EXT|INT\/EXT|I\/E)[.\s]+(.+?)(?:\s*-\s*(.+))?$/i);

        const location = slugMatch?.[2]?.trim() ?? heading;
        allLocations.add(location);

        currentScene = {
          sceneNumber: scenes.length + 1,
          heading,
          intExt: (slugMatch?.[1]?.toUpperCase() ?? 'INT') as ScreenplayScene['intExt'],
          location,
          timeOfDay: slugMatch?.[3]?.trim() ?? '',
          content: '',
          characters: [],
          dialogueBlocks: [],
        };
        break;
      }

      case 'character': {
        const charName = (token.text || '')
          .replace(/\(.*\)/, '')  // Remove parentheticals like (V.O.), (O.S.)
          .trim()
          .toUpperCase();

        if (charName) {
          allCharacters.add(charName);
          if (currentScene && !currentScene.characters.includes(charName)) {
            currentScene.characters.push(charName);
          }
        }
        break;
      }

      case 'dialogue': {
        if (currentScene) {
          currentScene.dialogueBlocks.push({
            character: currentScene.characters[currentScene.characters.length - 1] ?? 'UNKNOWN',
            text: token.text || '',
            isDual: token.dual ?? false,
          });
          currentScene.content += `${token.text}\n`;
        }
        break;
      }

      case 'parenthetical': {
        if (currentScene && currentScene.dialogueBlocks.length > 0) {
          currentScene.dialogueBlocks[currentScene.dialogueBlocks.length - 1].parenthetical = token.text;
        }
        break;
      }

      case 'action': {
        if (currentScene) {
          currentScene.content += `${token.text}\n`;
        }
        break;
      }
    }
  }

  if (currentScene) scenes.push(currentScene);

  return {
    title: result.title ?? '',
    credit: result.credit ?? '',
    author: result.author ?? '',
    scenes,
    allCharacters,
    allLocations,
  };
}
```

**Screenplay ingestion flow:**

1. Parse with `fountain-js` (Fountain) or XML parser (FDX) into `ScreenplayData`
2. Auto-create entity stubs for every character and location (no LLM needed)
3. Send scene content in batches to Claude API for relationship/theme extraction using the screenplay-specific prompt (see [Section 2.7](#27-screenplay-scene-analysis))
4. Run entity resolution against existing world entities
5. Store and present for review

---

### 1.3 Audio Pipeline (.mp3, .wav, .m4a, .ogg, .flac)

```typescript
// src/ingestion/audio/transcribe.ts

import { Queue, Worker } from 'bullmq';
import Anthropic from '@anthropic-ai/sdk';

interface TranscriptionSegment {
  speaker: string;       // Speaker label from diarization (SPEAKER_00, SPEAKER_01, etc.)
  text: string;
  startMs: number;
  endMs: number;
  confidence: number;
}

interface TranscriptionResult {
  segments: TranscriptionSegment[];
  fullText: string;
  speakers: string[];
  durationMs: number;
  language: string;
}

/**
 * Transcribe audio using Deepgram (preferred for speaker diarization)
 * with Whisper as fallback.
 */
async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string,
): Promise<TranscriptionResult> {
  const { createClient } = await import('@deepgram/sdk');
  const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

  const { result } = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
    model: 'nova-2',
    smart_format: true,
    diarize: true,
    punctuate: true,
    utterances: true,
    detect_language: true,
  });

  const utterances = result.results?.utterances ?? [];
  const segments: TranscriptionSegment[] = utterances.map((u) => ({
    speaker: `SPEAKER_${String(u.speaker).padStart(2, '0')}`,
    text: u.transcript,
    startMs: Math.round(u.start * 1000),
    endMs: Math.round(u.end * 1000),
    confidence: u.confidence,
  }));

  const speakers = [...new Set(segments.map((s) => s.speaker))];

  return {
    segments,
    fullText: segments.map((s) => `[${s.speaker}] ${s.text}`).join('\n'),
    speakers,
    durationMs: Math.round((result.results?.channels?.[0]?.alternatives?.[0]?.words?.at(-1)?.end ?? 0) * 1000),
    language: result.results?.channels?.[0]?.detected_language ?? 'en',
  };
}

/**
 * Map speakers to character names using Claude.
 * After transcription, we send the transcript to Claude to identify
 * which speaker labels correspond to which characters.
 */
async function mapSpeakersToCharacters(
  transcript: TranscriptionResult,
  worldId: string,
  existingCharacters: { id: string; name: string }[],
): Promise<Record<string, string>> {
  const client = new Anthropic();

  const sampleDialogue = transcript.segments.slice(0, 50)
    .map((s) => `[${s.speaker}] ${s.text}`)
    .join('\n');

  const charList = existingCharacters.map((c) => c.name).join(', ');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Given this transcript with speaker labels and a list of known characters, map each speaker to a character name. If a speaker cannot be identified, use "UNKNOWN".

Known characters: ${charList || 'None yet — infer character names from context.'}

Transcript sample:
${sampleDialogue}

Return JSON only:
{
  "speaker_map": { "SPEAKER_00": "character name", ... },
  "reasoning": "brief explanation"
}`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const parsed = JSON.parse(text);
  return parsed.speaker_map;
}
```

**Audio ingestion flow:**

1. Upload audio file to S3, enqueue `audio-transcribe` BullMQ job
2. Worker picks up job, calls Deepgram (speaker diarization enabled)
3. Receive time-coded transcript with speaker labels
4. Map speaker labels to character names (Claude or user input)
5. Convert transcript to `ParsedDocument` format preserving time codes as metadata
6. Feed into text ingestion pipeline (chunking, entity extraction, etc.)
7. Every extracted entity carries a `timeCodeMs` field linking it back to the source audio

---

### 1.4 Video Pipeline (.mp4, .mkv, .mov, .webm)

```typescript
// src/ingestion/video/process.ts

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const execFileAsync = promisify(execFile);

interface VideoMetadata {
  durationMs: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
}

interface ExtractedKeyframe {
  timestampMs: number;
  filePath: string;
  sceneChangeScore?: number;
}

/**
 * Extract audio track from video for transcription.
 */
async function extractAudioTrack(videoPath: string): Promise<string> {
  const outputPath = videoPath.replace(/\.[^.]+$/, '.wav');

  await execFileAsync('ffmpeg', [
    '-i', videoPath,
    '-vn',                    // No video
    '-acodec', 'pcm_s16le',  // WAV format
    '-ar', '16000',           // 16kHz (optimal for speech recognition)
    '-ac', '1',               // Mono
    '-y',                     // Overwrite
    outputPath,
  ]);

  return outputPath;
}

/**
 * Extract keyframes using two strategies:
 * 1. Fixed interval (every N seconds)
 * 2. Scene change detection (frame difference threshold)
 */
async function extractKeyframes(
  videoPath: string,
  options: {
    mode: 'interval' | 'scene_change' | 'both';
    intervalSeconds?: number;
    sceneChangeThreshold?: number; // 0-1, lower = more sensitive. Default 0.3
  } = { mode: 'both', intervalSeconds: 10, sceneChangeThreshold: 0.3 },
): Promise<ExtractedKeyframe[]> {
  const outputDir = await mkdtemp(join(tmpdir(), 'storyforge-keyframes-'));
  const keyframes: ExtractedKeyframe[] = [];

  if (options.mode === 'interval' || options.mode === 'both') {
    const interval = options.intervalSeconds ?? 10;
    await execFileAsync('ffmpeg', [
      '-i', videoPath,
      '-vf', `fps=1/${interval}`,
      '-frame_pts', '1',
      '-q:v', '2',
      join(outputDir, 'interval_%06d.jpg'),
    ]);

    const files = (await readdir(outputDir)).filter((f) => f.startsWith('interval_')).sort();
    for (let i = 0; i < files.length; i++) {
      keyframes.push({
        timestampMs: i * interval * 1000,
        filePath: join(outputDir, files[i]),
      });
    }
  }

  if (options.mode === 'scene_change' || options.mode === 'both') {
    const threshold = options.sceneChangeThreshold ?? 0.3;

    // Use ffmpeg scene detection filter
    await execFileAsync('ffmpeg', [
      '-i', videoPath,
      '-vf', `select='gt(scene,${threshold})',showinfo`,
      '-vsync', 'vfr',
      '-q:v', '2',
      join(outputDir, 'scene_%06d.jpg'),
    ], { maxBuffer: 50 * 1024 * 1024 });

    const sceneFiles = (await readdir(outputDir)).filter((f) => f.startsWith('scene_')).sort();
    for (const file of sceneFiles) {
      // Parse timestamp from ffmpeg showinfo output or from file metadata
      keyframes.push({
        timestampMs: 0, // Populated from ffmpeg showinfo log parsing
        filePath: join(outputDir, file),
        sceneChangeScore: threshold,
      });
    }
  }

  return keyframes;
}

/**
 * Get video metadata using ffprobe.
 */
async function getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    videoPath,
  ]);

  const probe = JSON.parse(stdout);
  const videoStream = probe.streams.find((s: any) => s.codec_type === 'video');

  return {
    durationMs: Math.round(parseFloat(probe.format.duration) * 1000),
    width: videoStream?.width ?? 0,
    height: videoStream?.height ?? 0,
    fps: eval(videoStream?.r_frame_rate ?? '24/1'),
    codec: videoStream?.codec_name ?? 'unknown',
  };
}
```

**Video ingestion flow:**

1. Upload to S3, enqueue `video-process` BullMQ job
2. `ffprobe` extracts metadata (duration, resolution, codec)
3. `ffmpeg` extracts audio track as 16kHz mono WAV
4. Audio goes to the audio transcription pipeline (Deepgram with diarization)
5. `ffmpeg` extracts keyframes (interval + scene change detection)
6. Each keyframe goes through the image pipeline (Claude Vision API)
7. Transcript + keyframe descriptions are merged into a unified time-coded document
8. Unified document feeds into text ingestion pipeline
9. All extracted entities carry `timeCodeMs` linking back to source video

---

### 1.5 Image Pipeline (.png, .jpg, .webp)

```typescript
// src/ingestion/image/analyze.ts

import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'node:fs/promises';

interface ImageAnalysis {
  description: string;
  characters: { name: string; description: string; confidence: number }[];
  location: { name: string; description: string } | null;
  objects: { name: string; significance: string }[];
  mood: string;
  tags: string[];
}

async function analyzeImage(
  imagePath: string,
  worldContext: { worldName: string; knownCharacters: string[]; knownLocations: string[] },
): Promise<ImageAnalysis> {
  const client = new Anthropic();
  const imageBuffer = await readFile(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const ext = imagePath.split('.').pop()?.toLowerCase();
  const mediaType = ext === 'png' ? 'image/png'
    : ext === 'webp' ? 'image/webp'
    : 'image/jpeg';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64Image },
        },
        {
          type: 'text',
          text: `You are analyzing an image for the story world "${worldContext.worldName}".

Known characters: ${worldContext.knownCharacters.join(', ') || 'None yet'}
Known locations: ${worldContext.knownLocations.join(', ') || 'None yet'}

Analyze this image and return JSON:
{
  "description": "Detailed visual description of the image (2-3 sentences)",
  "characters": [
    { "name": "character name or UNKNOWN", "description": "appearance details", "confidence": 0.0-1.0 }
  ],
  "location": { "name": "location name or null", "description": "setting details" },
  "objects": [
    { "name": "object name", "significance": "potential narrative significance" }
  ],
  "mood": "overall mood/atmosphere",
  "tags": ["tag1", "tag2", "..."]
}

If characters match known characters, use those names. Otherwise describe them for later matching.
Return ONLY valid JSON.`,
        },
      ],
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  return JSON.parse(text);
}
```

---

## 2. Claude API Prompt Templates

All prompts use Claude's structured output capabilities to return valid JSON. Each prompt is designed for a specific extraction pass over chunked text.

### 2.1 Character Extraction

```typescript
// src/ingestion/prompts/character-extraction.ts

export const CHARACTER_EXTRACTION_PROMPT = `You are an expert literary analyst extracting characters from a passage of narrative text. Your task is to identify every character mentioned or implied, no matter how minor.

<world_context>
World: {{worldName}}
Existing known characters: {{existingCharacters}}
</world_context>

<source_text>
{{chunkText}}
</source_text>

<instructions>
Extract ALL characters from the text above. For each character, provide:

1. **name**: The most formal/complete version of the character's name as it appears
2. **aliases**: Every other name, nickname, title, pronoun cluster, or descriptor used to refer to this character (e.g., "the old man", "Dad", "Captain", "she" if unambiguous)
3. **role**: Their narrative role — protagonist, antagonist, supporting, mentioned-only, referenced-historical
4. **traits**: Observable personality traits, physical descriptions, skills, and quirks — ONLY what is directly stated or clearly implied in this passage
5. **relationships_mentioned**: Any relationships to other characters stated or implied in this passage
6. **first_appearance_quote**: The exact quote from the text where this character first appears
7. **dialogue_count**: How many lines of dialogue this character has in this passage
8. **emotional_state**: The character's emotional state in this passage, if discernible

If a character matches one in the existing known characters list, use that character's canonical name but still list any new aliases found in this passage.

IMPORTANT:
- Do NOT invent information not present in the text
- Do NOT confuse the narrator with a character unless the narrator is clearly a character
- Groups (e.g., "the soldiers", "the council") count as characters if they act as a unit
- Include characters who are only mentioned or referenced but not physically present
</instructions>

Return ONLY valid JSON in this exact format:
{
  "characters": [
    {
      "name": "string",
      "aliases": ["string"],
      "role": "protagonist | antagonist | supporting | mentioned_only | referenced_historical",
      "traits": {
        "physical": ["string"],
        "personality": ["string"],
        "skills": ["string"],
        "quirks": ["string"]
      },
      "relationships_mentioned": [
        {
          "target_name": "string",
          "type": "family | romantic | ally | enemy | mentor | rival | professional | other",
          "description": "string"
        }
      ],
      "first_appearance_quote": "string",
      "dialogue_count": 0,
      "emotional_state": "string | null"
    }
  ],
  "ambiguous_references": [
    {
      "reference": "string (e.g., 'the stranger')",
      "possible_matches": ["character name"],
      "context": "string"
    }
  ]
}`;
```

### 2.2 Event Extraction

```typescript
export const EVENT_EXTRACTION_PROMPT = `You are an expert narrative analyst extracting story events from a passage. Identify every discrete event — things that happen, change, or are decided.

<world_context>
World: {{worldName}}
Known characters: {{existingCharacters}}
Known locations: {{existingLocations}}
Timeline so far: {{timelineSummary}}
</world_context>

<source_text>
{{chunkText}}
</source_text>

<instructions>
Extract every event from the passage. An "event" is any discrete occurrence where something changes — an action, decision, revelation, arrival, departure, confrontation, realization, or transformation.

For each event:
1. **name**: A concise label (3-8 words)
2. **description**: What happened in 1-2 sentences
3. **participants**: Characters directly involved
4. **location**: Where it happened (if stated or inferable)
5. **temporal_markers**: Any time references ("three days later", "at dawn", "1847", "before the war")
6. **relative_order**: Sequential position within THIS passage (1, 2, 3...)
7. **causal_links**: How this event relates to other events in this passage
8. **narrative_layer**: Is this happening in the "present" narrative, a flashback, a dream, a story-within-a-story, or a prophecy/plan?
9. **significance**: Why does this event matter to the story? (1 sentence)

IMPORTANT:
- Distinguish between events that HAPPEN and events that are REMEMBERED or DESCRIBED
- Backstory events mentioned in passing still count — tag them as narrative_layer: "backstory"
- If temporal ordering is ambiguous, note the ambiguity
- Granularity: prefer more events over fewer. "They fought and he won" is TWO events.
</instructions>

Return ONLY valid JSON:
{
  "events": [
    {
      "name": "string",
      "description": "string",
      "participants": ["character name"],
      "location": "string | null",
      "temporal_markers": ["string"],
      "relative_order": 1,
      "causal_links": [
        {
          "target_event_name": "string",
          "relationship": "causes | enables | prevents | follows | contradicts | parallels"
        }
      ],
      "narrative_layer": "present | flashback | dream | backstory | prophecy | story_within_story",
      "significance": "string"
    }
  ],
  "temporal_ambiguities": [
    {
      "description": "string",
      "possible_orderings": ["string"]
    }
  ]
}`;
```

### 2.3 Relationship Extraction

```typescript
export const RELATIONSHIP_EXTRACTION_PROMPT = `You are an expert in narrative analysis specializing in character relationships. Extract every relationship between characters — both explicit and implied.

<world_context>
World: {{worldName}}
Known characters: {{existingCharacters}}
Previously identified relationships: {{existingRelationships}}
</world_context>

<source_text>
{{chunkText}}
</source_text>

<instructions>
Extract ALL relationships between characters. A relationship exists whenever two characters have any meaningful connection — whether stated directly, shown through action, or implied through context.

Relationship types:
- **family**: parent, child, sibling, spouse, cousin, ancestor, descendant
- **romantic**: current partner, ex, unrequited, flirtation, betrothed
- **ally**: friend, teammate, co-conspirator, supporter
- **enemy**: antagonist, rival, nemesis, persecutor
- **mentor**: teacher, guide, trainer, role model
- **rival**: competitor, foil (not necessarily hostile)
- **professional**: employer/employee, colleague, client, ruler/subject
- **member_of**: belongs to group/faction/family unit
- **custom**: anything that doesn't fit the above — provide a label

For each relationship, assess:
- **strength** (0.0-1.0): How central is this relationship to the narrative?
- **sentiment** (positive/negative/ambivalent/neutral): How do the characters feel about each other?
- **dynamics**: Is the relationship changing? Growing closer or farther apart?
- **power_balance**: Is one character dominant? Equal footing?
- **evidence**: The specific text that reveals this relationship

IMPORTANT:
- Relationships are directional. "A mentors B" is different from "B is mentored by A" — capture both sides.
- A single pair can have MULTIPLE relationship types (e.g., siblings who are also rivals).
- Include implied relationships. If Character A fears Character B, there's a relationship even if they never interact directly in this passage.
</instructions>

Return ONLY valid JSON:
{
  "relationships": [
    {
      "source": "character name",
      "target": "character name",
      "type": "family | romantic | ally | enemy | mentor | rival | professional | member_of | custom",
      "subtype": "string (e.g., 'parent-child', 'unrequited', 'employer-employee')",
      "custom_label": "string | null",
      "description": "string",
      "strength": 0.0,
      "sentiment": "positive | negative | ambivalent | neutral",
      "dynamics": "stable | growing_closer | growing_apart | volatile | newly_formed | deteriorating",
      "power_balance": "source_dominant | target_dominant | equal | shifting",
      "evidence": "exact quote from text",
      "is_new": true
    }
  ],
  "relationship_changes": [
    {
      "source": "character name",
      "target": "character name",
      "change_description": "string",
      "trigger_event": "string"
    }
  ]
}`;
```

### 2.4 Theme and Motif Detection

```typescript
export const THEME_MOTIF_PROMPT = `You are a literary scholar analyzing a narrative passage for themes and motifs.

<world_context>
World: {{worldName}}
Previously identified themes: {{existingThemes}}
Genre/tone notes: {{genreNotes}}
</world_context>

<source_text>
{{chunkText}}
</source_text>

<instructions>
Identify themes and motifs present in this passage.

**Theme**: An abstract idea or message explored through the narrative (e.g., "the corrupting influence of power", "the impossibility of returning home", "redemption through sacrifice").

**Motif**: A recurring element — image, phrase, situation, or symbol — that reinforces a theme (e.g., recurring references to water/drowning reinforcing a theme of being overwhelmed; a character's scar being mentioned in moments of vulnerability).

For each theme:
1. **name**: A concise label (2-5 words)
2. **description**: What the text is saying about this theme (1-2 sentences)
3. **evidence**: Specific quotes or passages that express this theme
4. **strength**: How prominently this theme features in the passage (0.0-1.0)
5. **characters_involved**: Which characters embody or explore this theme

For each motif:
1. **name**: The recurring element
2. **instances**: Every occurrence in this passage
3. **associated_theme**: Which theme(s) does this motif reinforce?
4. **pattern**: How is the motif used? (literally, metaphorically, ironically)

IMPORTANT:
- Be specific. "Good vs evil" is too generic. "The futility of moral purity in a corrupt system" is better.
- Only identify themes with textual evidence. Do not project themes not supported by the text.
- If a previously identified theme appears again here, note it as a continuation.
- Note thematic tensions or contradictions — passages where the text seems to argue with itself.
</instructions>

Return ONLY valid JSON:
{
  "themes": [
    {
      "name": "string",
      "description": "string",
      "evidence": ["exact quote 1", "exact quote 2"],
      "strength": 0.0,
      "characters_involved": ["character name"],
      "is_continuation_of": "existing theme name | null"
    }
  ],
  "motifs": [
    {
      "name": "string",
      "instances": [
        { "quote": "string", "context": "string" }
      ],
      "associated_themes": ["theme name"],
      "pattern": "literal | metaphorical | ironic | subverted"
    }
  ],
  "thematic_tensions": [
    {
      "theme_a": "string",
      "theme_b": "string",
      "description": "how they conflict or create tension"
    }
  ]
}`;
```

### 2.5 Scene Value Change Analysis (McKee)

```typescript
export const SCENE_VALUE_CHANGE_PROMPT = `You are a story analyst using Robert McKee's value change framework. In McKee's approach, every well-constructed scene turns on at least one value — an abstract quality of human experience (love/hate, freedom/slavery, truth/lie, hope/despair, etc.) that shifts from one charge to another during the scene.

<world_context>
World: {{worldName}}
Characters in scene: {{sceneCharacters}}
Scene location: {{sceneLocation}}
Scene number: {{sceneNumber}}
</world_context>

<scene_text>
{{sceneText}}
</scene_text>

<instructions>
Analyze this scene using McKee's scene analysis framework:

1. **Opening value charge**: What is the state of the primary value(s) at the scene's beginning? (positive, negative, or somewhere between)
2. **Closing value charge**: What is the state at the end?
3. **The turn**: What event or realization causes the shift?
4. **Beat analysis**: Break the scene into beats — the smallest unit of action/reaction. Each beat is one exchange of behavior.

For each value at stake:
- Name the value (e.g., "trust", "safety", "loyalty", "power")
- Rate it on a scale: ++ (strongly positive) / + (positive) / - (negative) / -- (doubly negative, worse than expected) / +/- (ironic, appears positive but is actually negative)
- Identify whose value it is (which character experiences this value shift)

McKee's key insight: Scenes that don't turn are dead weight. If you cannot identify a value change, note the scene as "static" and explain what function it might serve (exposition, atmosphere, etc.).

Also assess:
- **Scene type**: exposition | complication | crisis | climax | resolution | setpiece
- **Conflict type**: inner (within character) | personal (between characters) | extra-personal (character vs. institution/society/nature)
- **Subtext**: What are characters really communicating beneath the surface dialogue?
</instructions>

Return ONLY valid JSON:
{
  "value_changes": [
    {
      "value": "string (e.g., 'trust', 'safety', 'love')",
      "character": "string",
      "opening_charge": "++ | + | neutral | - | --",
      "closing_charge": "++ | + | neutral | - | -- | ironic",
      "turn_description": "string",
      "turn_event": "string"
    }
  ],
  "beats": [
    {
      "order": 1,
      "action": "string (what a character does or says)",
      "reaction": "string (how others respond)",
      "subtext": "string (what's really happening beneath the surface)"
    }
  ],
  "scene_analysis": {
    "scene_type": "exposition | complication | crisis | climax | resolution | setpiece",
    "conflict_type": "inner | personal | extra_personal | none",
    "is_static": false,
    "static_function": "string | null",
    "overall_arc": "string (1-sentence summary of the scene's dramatic movement)"
  }
}`;
```

### 2.6 Emotional State Per Character Per Scene

```typescript
export const EMOTIONAL_STATE_PROMPT = `You are an expert in character psychology analyzing a scene for the emotional journey of each character present.

<world_context>
World: {{worldName}}
Characters to track: {{characters}}
Scene context: {{sceneContext}}
</world_context>

<scene_text>
{{sceneText}}
</scene_text>

<instructions>
For each character present in or referenced by this scene, map their emotional arc:

1. **entering_emotion**: What emotional state is the character in when the scene begins? (Based on context and opening behavior)
2. **emotional_beats**: Key moments where their emotional state shifts during the scene
3. **exiting_emotion**: What emotional state are they in when the scene ends?
4. **internal_vs_external**: Are they showing their true feelings, or masking them?
5. **triggers**: What specific events or dialogue lines trigger emotional shifts?
6. **unresolved_tension**: Any emotional threads left dangling at scene's end

Use Plutchik's wheel as a vocabulary guide (but don't be limited to it):
- Primary: joy, trust, fear, surprise, sadness, disgust, anger, anticipation
- Secondary combinations: love (joy+trust), submission (trust+fear), awe (fear+surprise), disappointment (surprise+sadness), remorse (sadness+disgust), contempt (disgust+anger), aggressiveness (anger+anticipation), optimism (anticipation+joy)

Rate intensity on a scale of 1-10 for each emotional state.
</instructions>

Return ONLY valid JSON:
{
  "character_emotions": [
    {
      "character": "string",
      "entering_emotion": {
        "primary": "string",
        "secondary": "string | null",
        "intensity": 1,
        "is_masked": false,
        "mask_emotion": "string | null"
      },
      "emotional_beats": [
        {
          "order": 1,
          "trigger": "string (the event or line that causes the shift)",
          "emotion": "string",
          "intensity": 1,
          "is_masked": false,
          "mask_emotion": "string | null",
          "evidence_quote": "string"
        }
      ],
      "exiting_emotion": {
        "primary": "string",
        "secondary": "string | null",
        "intensity": 1,
        "is_masked": false,
        "mask_emotion": "string | null"
      },
      "overall_arc": "string (1-sentence summary, e.g., 'From hopeful to devastated')",
      "unresolved_tension": "string | null"
    }
  ]
}`;
```

### 2.7 Screenplay Scene Analysis

```typescript
export const SCREENPLAY_SCENE_ANALYSIS_PROMPT = `You are a screenwriting analyst. Analyze this screenplay scene for story structure and character dynamics.

<world_context>
World: {{worldName}}
Known characters: {{existingCharacters}}
Known locations: {{existingLocations}}
Script format: {{format}} (Fountain or FDX)
</world_context>

<scene>
Scene heading: {{sceneHeading}}
Characters with dialogue: {{sceneCharacters}}

{{sceneContent}}
</scene>

<instructions>
This scene was parsed from a screenplay. The characters and locations have already been extracted from formatting. Your job is to extract the HIGHER-ORDER narrative elements:

1. Relationships revealed or developed between characters
2. Events that occur (what happens, not just what is said)
3. Subtext in dialogue (what characters mean vs. what they say)
4. Power dynamics and status shifts
5. Setup/payoff elements (plants that might pay off later, or payoffs of earlier plants)
6. Emotional tone and shifts
7. Visual storytelling notes from action lines

Pay special attention to:
- Parentheticals — they reveal intended delivery and often subtext
- Action lines between dialogue — they show physical behavior that contradicts or amplifies speech
- Scene transitions — CUT TO, SMASH CUT, DISSOLVE suggest pacing and tonal intent
</instructions>

Return ONLY valid JSON:
{
  "events": [
    {
      "name": "string",
      "description": "string",
      "participants": ["string"],
      "is_dialogue_driven": true,
      "significance": "string"
    }
  ],
  "relationships": [
    {
      "source": "string",
      "target": "string",
      "type": "string",
      "evidence": "string",
      "subtext": "string"
    }
  ],
  "subtext_notes": [
    {
      "dialogue_line": "string",
      "speaker": "string",
      "surface_meaning": "string",
      "actual_meaning": "string",
      "evidence": "string"
    }
  ],
  "power_dynamics": [
    {
      "dominant": "string",
      "subordinate": "string",
      "basis": "string (knowledge, physical, social, emotional)",
      "shifts": true,
      "shift_trigger": "string | null"
    }
  ],
  "setup_payoff": [
    {
      "element": "string",
      "type": "setup | payoff | callback",
      "description": "string"
    }
  ],
  "emotional_tone": {
    "opening": "string",
    "closing": "string",
    "dominant_mood": "string"
  }
}`;
```

### 2.8 Prompt Template Hydration

```typescript
// src/ingestion/prompts/hydrate.ts

/**
 * Replace template placeholders with actual values.
 * Handles {{variable}} syntax.
 */
export function hydratePrompt(
  template: string,
  variables: Record<string, string | string[]>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = variables[key];
    if (value === undefined) return `{{${key}}}`;
    return Array.isArray(value) ? value.join(', ') : value;
  });
}

/**
 * Run a full extraction pass on a single chunk.
 * Returns all extraction types in parallel for efficiency.
 */
export async function extractFromChunk(
  client: Anthropic,
  chunk: { text: string; index: number; total: number },
  worldContext: {
    worldName: string;
    existingCharacters: string[];
    existingLocations: string[];
    existingRelationships: string[];
    existingThemes: string[];
    timelineSummary: string;
    genreNotes: string;
  },
): Promise<{
  characters: any;
  events: any;
  relationships: any;
  themes: any;
}> {
  const vars = {
    worldName: worldContext.worldName,
    existingCharacters: worldContext.existingCharacters,
    existingLocations: worldContext.existingLocations,
    existingRelationships: worldContext.existingRelationships,
    existingThemes: worldContext.existingThemes,
    timelineSummary: worldContext.timelineSummary,
    genreNotes: worldContext.genreNotes,
    chunkText: chunk.text,
  };

  // Run all extraction prompts in parallel for speed
  const [characters, events, relationships, themes] = await Promise.all([
    callClaude(client, hydratePrompt(CHARACTER_EXTRACTION_PROMPT, vars)),
    callClaude(client, hydratePrompt(EVENT_EXTRACTION_PROMPT, vars)),
    callClaude(client, hydratePrompt(RELATIONSHIP_EXTRACTION_PROMPT, vars)),
    callClaude(client, hydratePrompt(THEME_MOTIF_PROMPT, vars)),
  ]);

  return { characters, events, relationships, themes };
}

async function callClaude(client: Anthropic, prompt: string): Promise<any> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```json?\n?/m, '').replace(/\n?```$/m, '');
  return JSON.parse(cleaned);
}
```

---

## 3. Entity Resolution System

### 3.1 The Problem

A single character might be referred to as:
- "John" (first name)
- "Johnny" (nickname)
- "Mr. Smith" (formal)
- "the detective" (role descriptor)
- "her father" (relational reference)
- "he" / "him" (pronoun)

The entity resolution system must unify these into a single canonical entity.

### 3.2 Multi-Pass Resolution Algorithm

```typescript
// src/ingestion/entity-resolution/resolver.ts

import Anthropic from '@anthropic-ai/sdk';
import Fuse from 'fuse.js';

interface CandidateEntity {
  id: string;
  name: string;
  aliases: string[];
  type: string;
  traits: Record<string, string[]>;
  sourceChunks: string[];
}

interface ResolutionCandidate {
  existingEntityId: string;
  existingEntityName: string;
  newEntityName: string;
  confidence: number;
  matchMethod: 'exact' | 'alias' | 'fuzzy' | 'semantic' | 'llm';
  evidence: string;
}

interface ResolutionResult {
  merged: { newEntityId: string; existingEntityId: string; confidence: number }[];
  new: CandidateEntity[];         // Truly new entities
  needsReview: ResolutionCandidate[]; // Uncertain matches for user review
}

export class EntityResolver {
  private fuse: Fuse<CandidateEntity>;
  private client: Anthropic;

  constructor(
    private existingEntities: CandidateEntity[],
    client: Anthropic,
  ) {
    this.client = client;

    // Configure Fuse.js for fuzzy string matching
    this.fuse = new Fuse(existingEntities, {
      keys: [
        { name: 'name', weight: 0.5 },
        { name: 'aliases', weight: 0.4 },
        { name: 'type', weight: 0.1 },
      ],
      threshold: 0.4,       // 0 = perfect match, 1 = match anything
      distance: 100,
      includeScore: true,
      useExtendedSearch: true,
    });
  }

  /**
   * Resolve a batch of newly extracted entities against existing world entities.
   * Uses a multi-pass strategy: exact -> alias -> fuzzy -> LLM.
   */
  async resolve(newEntities: CandidateEntity[]): Promise<ResolutionResult> {
    const result: ResolutionResult = { merged: [], new: [], needsReview: [] };

    for (const entity of newEntities) {
      const candidates = await this.findCandidates(entity);

      if (candidates.length === 0) {
        // No match found — this is a new entity
        result.new.push(entity);
        continue;
      }

      const best = candidates[0];

      if (best.confidence >= 0.9) {
        // High confidence — auto-merge
        result.merged.push({
          newEntityId: entity.id,
          existingEntityId: best.existingEntityId,
          confidence: best.confidence,
        });
      } else if (best.confidence >= 0.5) {
        // Medium confidence — needs user review
        result.needsReview.push(best);
      } else {
        // Low confidence — treat as new
        result.new.push(entity);
      }
    }

    return result;
  }

  private async findCandidates(entity: CandidateEntity): Promise<ResolutionCandidate[]> {
    const candidates: ResolutionCandidate[] = [];

    // Pass 1: Exact name match
    const exactMatch = this.existingEntities.find(
      (e) => e.name.toLowerCase() === entity.name.toLowerCase()
        || e.aliases.some((a) => a.toLowerCase() === entity.name.toLowerCase()),
    );
    if (exactMatch) {
      candidates.push({
        existingEntityId: exactMatch.id,
        existingEntityName: exactMatch.name,
        newEntityName: entity.name,
        confidence: 0.95,
        matchMethod: 'exact',
        evidence: `Exact name match: "${entity.name}" = "${exactMatch.name}"`,
      });
      return candidates; // Exact match is decisive
    }

    // Pass 2: Alias cross-reference
    for (const existing of this.existingEntities) {
      for (const alias of entity.aliases) {
        if (existing.aliases.some((a) => a.toLowerCase() === alias.toLowerCase())
          || existing.name.toLowerCase() === alias.toLowerCase()) {
          candidates.push({
            existingEntityId: existing.id,
            existingEntityName: existing.name,
            newEntityName: entity.name,
            confidence: 0.85,
            matchMethod: 'alias',
            evidence: `Alias match: "${alias}" found in existing entity "${existing.name}"`,
          });
        }
      }
    }

    if (candidates.length > 0) return candidates;

    // Pass 3: Fuzzy string matching (Fuse.js)
    const fuseResults = this.fuse.search(entity.name);
    for (const result of fuseResults.slice(0, 3)) {
      const score = 1 - (result.score ?? 1); // Fuse scores are inverted (0 = perfect)
      if (score > 0.5) {
        candidates.push({
          existingEntityId: result.item.id,
          existingEntityName: result.item.name,
          newEntityName: entity.name,
          confidence: score * 0.8, // Discount fuzzy matches slightly
          matchMethod: 'fuzzy',
          evidence: `Fuzzy match: "${entity.name}" ~ "${result.item.name}" (score: ${score.toFixed(2)})`,
        });
      }
    }

    if (candidates.length > 0) return candidates;

    // Pass 4: LLM-based semantic matching for descriptive references
    // ("the detective", "her father", "the old man by the window")
    if (this.looksDescriptive(entity.name)) {
      const llmResult = await this.llmResolve(entity);
      if (llmResult) candidates.push(llmResult);
    }

    return candidates;
  }

  private looksDescriptive(name: string): boolean {
    const descriptivePatterns = [
      /^the\s+/i,
      /^a\s+/i,
      /^an\s+/i,
      /^his\s+/i,
      /^her\s+/i,
      /^their\s+/i,
      /^my\s+/i,
    ];
    return descriptivePatterns.some((p) => p.test(name));
  }

  /**
   * Use Claude to resolve descriptive references.
   * E.g., "the detective" -> "John Smith" if John Smith is a known detective.
   */
  private async llmResolve(entity: CandidateEntity): Promise<ResolutionCandidate | null> {
    const entitySummaries = this.existingEntities
      .map((e) => `- ${e.name} (${e.type}): aliases=[${e.aliases.join(', ')}], traits=${JSON.stringify(e.traits)}`)
      .join('\n');

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `A narrative text refers to a character as "${entity.name}".
Context about this reference: ${JSON.stringify(entity.traits)}

These are the known characters in this story world:
${entitySummaries}

Does "${entity.name}" refer to one of these existing characters? If yes, which one and why? If no, say "NEW_ENTITY".

Return JSON only:
{
  "match": "character name" | "NEW_ENTITY",
  "confidence": 0.0-1.0,
  "reasoning": "string"
}`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const parsed = JSON.parse(text);

    if (parsed.match === 'NEW_ENTITY') return null;

    const matchedEntity = this.existingEntities.find((e) => e.name === parsed.match);
    if (!matchedEntity) return null;

    return {
      existingEntityId: matchedEntity.id,
      existingEntityName: matchedEntity.name,
      newEntityName: entity.name,
      confidence: parsed.confidence,
      matchMethod: 'llm',
      evidence: parsed.reasoning,
    };
  }
}
```

### 3.3 Confidence Scoring

| Score Range | Action | UI State |
|---|---|---|
| 0.90 - 1.00 | Auto-merge | Entity merged silently, visible in activity log |
| 0.70 - 0.89 | Suggest merge | Prominent merge suggestion shown, one-tap to confirm |
| 0.50 - 0.69 | Ask user | Full comparison view, user must decide |
| 0.00 - 0.49 | Treat as new | Created as new entity, but "possible match" indicator shown |

Confidence factors:
- **Name similarity** (Levenshtein / Jaro-Winkler): 0-0.3 contribution
- **Alias match**: +0.3 if any alias matches
- **Trait overlap**: +0.1-0.2 if physical descriptions or roles match
- **Co-occurrence**: +0.1 if entities never appear in the same scene (suggesting they might be the same person referred to differently)
- **LLM assessment**: 0-1.0 (used as final arbiter)

### 3.4 User Review UI Flow

The entity review uses a "tinder swipe" pattern — each ambiguous entity is presented as a card the user can quickly action.

```
+------------------------------------------------+
|  ENTITY REVIEW                          3 of 12 |
|                                                  |
|  +-----------+     +-----------+                 |
|  | NEW       |     | EXISTING  |                 |
|  | "Johnny"  | <-> | "John     |                 |
|  |           |     |  Smith"   |                 |
|  | Traits:   |     | Traits:   |                 |
|  | - young   |     | - tall    |                 |
|  | - nervous |     | - detect- |                 |
|  |           |     |   ive     |                 |
|  | Source:    |     | 14 refs   |                 |
|  | Ch. 3     |     | across    |                 |
|  | p. 47     |     | 4 sources |                 |
|  +-----------+     +-----------+                 |
|                                                  |
|  Confidence: 72% (alias + trait overlap)         |
|  Evidence: "Johnny, as Detective Smith preferred |
|  to be called in his younger days..."            |
|                                                  |
|  [<< DISMISS]  [SKIP >>]  [MERGE ✓]            |
|                  [NEW ENTITY]                    |
|                                                  |
+------------------------------------------------+
```

**Actions:**
- **Merge** (swipe right / green button): Merge the new reference into the existing entity. The new name becomes an alias.
- **Dismiss** (swipe left / red button): This extraction is noise. Discard it entirely.
- **New Entity** (swipe up): This is a genuinely new character. Create a new entity.
- **Skip** (tap): Come back to this one later.

```typescript
// src/ingestion/entity-resolution/review-types.ts

interface EntityReviewItem {
  id: string;
  newEntity: {
    name: string;
    aliases: string[];
    traits: Record<string, string[]>;
    sourceQuote: string;
    sourceLocation: string; // "Chapter 3, page 47"
  };
  suggestedMatch: {
    entityId: string;
    name: string;
    aliases: string[];
    traits: Record<string, string[]>;
    referenceCount: number;
    sourceCount: number;
  } | null;
  confidence: number;
  matchMethod: string;
  evidence: string;
}

type ReviewAction =
  | { type: 'merge'; existingEntityId: string }
  | { type: 'dismiss' }
  | { type: 'new_entity' }
  | { type: 'skip' };

// WebSocket event sent to frontend when review items are ready
interface ReviewReadyEvent {
  type: 'entity_review_ready';
  worldId: string;
  sourceId: string;
  items: EntityReviewItem[];
  autoMergedCount: number; // How many were auto-merged (high confidence)
  newEntityCount: number;  // How many were auto-created (low confidence)
}
```

---

## 4. BullMQ Job Architecture

### 4.1 Queue and Job Type Definitions

```typescript
// src/jobs/queues.ts

import { Queue, Worker, QueueEvents, FlowProducer } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

// --- Queue Definitions ---

export const textIngestQueue = new Queue('text-ingest', { connection });
export const audioTranscribeQueue = new Queue('audio-transcribe', { connection });
export const videoProcessQueue = new Queue('video-process', { connection });
export const entityExtractQueue = new Queue('entity-extract', { connection });
export const entityResolveQueue = new Queue('entity-resolve', { connection });
export const imageAnalyzeQueue = new Queue('image-analyze', { connection });

// --- Job Data Types ---

interface TextIngestJobData {
  worldId: string;
  sourceId: string;
  fileKey: string;        // S3 key
  format: string;
  fileName: string;
  userId: string;
}

interface AudioTranscribeJobData {
  worldId: string;
  sourceId: string;
  fileKey: string;
  mimeType: string;
  userId: string;
}

interface VideoProcessJobData {
  worldId: string;
  sourceId: string;
  fileKey: string;
  mimeType: string;
  keyframeMode: 'interval' | 'scene_change' | 'both';
  keyframeIntervalSeconds: number;
  sceneChangeThreshold: number;
  userId: string;
}

interface EntityExtractJobData {
  worldId: string;
  sourceId: string;
  chunks: { text: string; index: number; total: number; metadata?: Record<string, any> }[];
  userId: string;
}

interface EntityResolveJobData {
  worldId: string;
  sourceId: string;
  extractedEntities: any[];
  userId: string;
}

interface ImageAnalyzeJobData {
  worldId: string;
  sourceId: string;
  fileKey: string;
  timestampMs?: number;   // If extracted from video
  userId: string;
}
```

### 4.2 Job Dependencies with FlowProducer

```typescript
// src/jobs/flows.ts

import { FlowProducer } from 'bullmq';

const flowProducer = new FlowProducer({ connection });

/**
 * Create the full ingestion flow for a text file.
 * Dependencies ensure correct ordering:
 *   text-ingest -> entity-extract -> entity-resolve
 */
export async function createTextIngestionFlow(data: TextIngestJobData) {
  return flowProducer.add({
    name: 'entity-resolve',
    queueName: 'entity-resolve',
    data: { worldId: data.worldId, sourceId: data.sourceId, userId: data.userId },
    children: [
      {
        name: 'entity-extract',
        queueName: 'entity-extract',
        data: { worldId: data.worldId, sourceId: data.sourceId, userId: data.userId },
        children: [
          {
            name: 'text-ingest',
            queueName: 'text-ingest',
            data,
          },
        ],
      },
    ],
  });
}

/**
 * Create the full ingestion flow for an audio file.
 * Dependencies:
 *   audio-transcribe -> text-ingest -> entity-extract -> entity-resolve
 */
export async function createAudioIngestionFlow(data: AudioTranscribeJobData) {
  return flowProducer.add({
    name: 'entity-resolve',
    queueName: 'entity-resolve',
    data: { worldId: data.worldId, sourceId: data.sourceId, userId: data.userId },
    children: [
      {
        name: 'entity-extract',
        queueName: 'entity-extract',
        data: { worldId: data.worldId, sourceId: data.sourceId, userId: data.userId },
        children: [
          {
            name: 'text-ingest',
            queueName: 'text-ingest',
            data: { worldId: data.worldId, sourceId: data.sourceId, userId: data.userId } as any,
            children: [
              {
                name: 'audio-transcribe',
                queueName: 'audio-transcribe',
                data,
              },
            ],
          },
        ],
      },
    ],
  });
}

/**
 * Video ingestion flow:
 *   video-process -> [audio-transcribe, image-analyze[]] -> text-ingest -> entity-extract -> entity-resolve
 *
 * Video is more complex because it fans out into parallel audio + image analysis,
 * then merges back for entity extraction.
 */
export async function createVideoIngestionFlow(data: VideoProcessJobData) {
  // Video processing is the first step — it produces audio + keyframes.
  // We create the video-process job first, then in its worker completion handler
  // we dynamically spawn the downstream jobs based on how many keyframes were extracted.

  return videoProcessQueue.add('video-process', data, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 30_000 },
  });
  // The video-process worker handles spawning child jobs (see worker definition below).
}
```

### 4.3 Workers

```typescript
// src/jobs/workers/text-ingest.worker.ts

import { Worker, Job } from 'bullmq';
import { detectFormat } from '../../ingestion/detect-format';
import { parseDocument } from '../../ingestion/parsers';
import { chunkDocument } from '../../ingestion/chunking';
import { emitProgress } from '../../websocket/progress';

const textIngestWorker = new Worker(
  'text-ingest',
  async (job: Job<TextIngestJobData>) => {
    const { worldId, sourceId, fileKey, format, fileName, userId } = job.data;

    // Step 1: Download from S3
    await job.updateProgress(10);
    emitProgress(userId, { jobId: job.id!, stage: 'downloading', progress: 10 });
    const buffer = await downloadFromS3(fileKey);

    // Step 2: Detect format (verify)
    await job.updateProgress(15);
    const detected = await detectFormat(buffer, fileName);

    // Step 3: Parse document
    await job.updateProgress(20);
    emitProgress(userId, { jobId: job.id!, stage: 'parsing', progress: 20 });
    const parsed = await parseDocument(buffer, detected.format);

    // Step 4: Chunk for Claude API
    await job.updateProgress(40);
    emitProgress(userId, { jobId: job.id!, stage: 'chunking', progress: 40 });
    const chunks = chunkDocument(parsed);

    await job.updateProgress(100);
    emitProgress(userId, { jobId: job.id!, stage: 'complete', progress: 100 });

    // Return chunks for the dependent entity-extract job
    return { chunks, metadata: parsed.metadata, title: parsed.title };
  },
  {
    connection,
    concurrency: 5,
    limiter: { max: 10, duration: 1000 },
  },
);

// src/jobs/workers/entity-extract.worker.ts

const entityExtractWorker = new Worker(
  'entity-extract',
  async (job: Job<EntityExtractJobData>) => {
    const { worldId, sourceId, userId } = job.data;

    // Get chunks from parent job result
    const parentData = await job.getChildrenValues();
    const textIngestResult = Object.values(parentData)[0] as any;
    const chunks = textIngestResult.chunks;

    const client = new Anthropic();
    const worldContext = await loadWorldContext(worldId);
    const allResults = [];

    // Process chunks with controlled concurrency
    const CONCURRENT_CHUNKS = 3; // Respect Claude API rate limits
    for (let i = 0; i < chunks.length; i += CONCURRENT_CHUNKS) {
      const batch = chunks.slice(i, i + CONCURRENT_CHUNKS);
      const batchResults = await Promise.all(
        batch.map((chunk: any) => extractFromChunk(client, chunk, worldContext)),
      );
      allResults.push(...batchResults);

      const progress = Math.round(((i + batch.length) / chunks.length) * 100);
      await job.updateProgress(progress);
      emitProgress(userId, {
        jobId: job.id!,
        stage: 'extracting',
        progress,
        detail: `Processed ${i + batch.length} of ${chunks.length} chunks`,
      });
    }

    // Merge results across chunks
    const merged = mergeExtractionResults(allResults);
    return merged;
  },
  {
    connection,
    concurrency: 2,  // Lower concurrency — each job makes many Claude API calls
  },
);

// src/jobs/workers/entity-resolve.worker.ts

const entityResolveWorker = new Worker(
  'entity-resolve',
  async (job: Job<EntityResolveJobData>) => {
    const { worldId, sourceId, userId } = job.data;

    // Get extracted entities from parent job
    const parentData = await job.getChildrenValues();
    const extractResult = Object.values(parentData)[0] as any;

    const existingEntities = await loadExistingEntities(worldId);
    const client = new Anthropic();
    const resolver = new EntityResolver(existingEntities, client);

    const resolution = await resolver.resolve(extractResult.entities);

    // Auto-merge high confidence matches
    for (const merge of resolution.merged) {
      await mergeEntities(worldId, merge.existingEntityId, merge.newEntityId);
    }

    // Create genuinely new entities
    for (const newEntity of resolution.new) {
      await createEntity(worldId, sourceId, newEntity);
    }

    // Store everything
    await storeExtractionResults(
      worldId, sourceId,
      extractResult.entities,
      extractResult.relationships,
      extractResult.events,
      extractResult.themes,
    );

    // Notify frontend that review items are ready
    if (resolution.needsReview.length > 0) {
      emitProgress(userId, {
        type: 'entity_review_ready',
        worldId,
        sourceId,
        items: resolution.needsReview,
        autoMergedCount: resolution.merged.length,
        newEntityCount: resolution.new.length,
      });
    }

    return {
      merged: resolution.merged.length,
      new: resolution.new.length,
      needsReview: resolution.needsReview.length,
    };
  },
  { connection, concurrency: 3 },
);
```

### 4.4 Progress Reporting via WebSocket

```typescript
// src/websocket/progress.ts

import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer;

export function initWebSocket(server: SocketIOServer) {
  io = server;

  io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId;
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });
}

interface ProgressEvent {
  jobId: string;
  stage: string;
  progress: number;    // 0-100
  detail?: string;
  type?: string;
  [key: string]: any;
}

export function emitProgress(userId: string, event: ProgressEvent) {
  io?.to(`user:${userId}`).emit('ingestion:progress', event);
}

/**
 * Frontend listens for these events:
 *
 * socket.on('ingestion:progress', (event) => {
 *   // event.stage: 'downloading' | 'parsing' | 'chunking' | 'transcribing'
 *   //            | 'extracting' | 'resolving' | 'complete' | 'error'
 *   // event.progress: 0-100
 *   // event.detail: optional human-readable message
 *   updateProgressBar(event.jobId, event.progress, event.stage);
 * });
 *
 * socket.on('ingestion:progress', (event) => {
 *   if (event.type === 'entity_review_ready') {
 *     showEntityReviewUI(event.items);
 *   }
 * });
 */
```

### 4.5 Retry Strategy and Dead Letter Queue

```typescript
// src/jobs/config.ts

/** Default job options applied to all ingestion jobs. */
export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5_000,  // 5s, 10s, 20s
  },
  removeOnComplete: { age: 24 * 3600, count: 1000 },  // Keep for 24h or last 1000
  removeOnFail: false,                                  // Keep failed jobs for inspection
};

/** Rate limit configuration per queue. */
export const QUEUE_CONCURRENCY = {
  'text-ingest': 5,        // Parsing is CPU-light
  'audio-transcribe': 3,   // Depends on external API (Deepgram)
  'video-process': 2,      // CPU-heavy (FFmpeg)
  'entity-extract': 2,     // Claude API rate limits
  'entity-resolve': 3,     // Mixed: DB + occasional Claude API
  'image-analyze': 4,      // Claude Vision API
};

/**
 * Claude API rate limiting.
 * At Tier 2: 40 RPM for claude-sonnet-4-6
 * We run 4 extraction prompts per chunk * 2 concurrent entity-extract workers
 * = up to 8 concurrent requests. With 3 chunks in parallel per worker = 24 concurrent.
 * Use a shared rate limiter to stay under limits.
 */
export const CLAUDE_RATE_LIMITER = {
  maxConcurrent: 15,      // Max simultaneous Claude API calls across all workers
  reservoir: 35,           // Requests per minute (leaving headroom from 40 RPM limit)
  reservoirRefreshInterval: 60_000,
  reservoirRefreshAmount: 35,
};

/**
 * Dead letter queue handler.
 * Failed jobs after all retries are moved here for manual inspection.
 */
export function setupDeadLetterHandling() {
  const queues = [
    textIngestQueue, audioTranscribeQueue, videoProcessQueue,
    entityExtractQueue, entityResolveQueue, imageAnalyzeQueue,
  ];

  for (const queue of queues) {
    const events = new QueueEvents(queue.name, { connection });

    events.on('failed', async ({ jobId, failedReason }) => {
      const job = await Job.fromId(queue, jobId);
      if (!job) return;

      // If this was the final attempt, log to dead letter storage
      if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
        await db.query(
          `INSERT INTO dead_letter_jobs (queue_name, job_id, job_data, error, failed_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [queue.name, jobId, JSON.stringify(job.data), failedReason],
        );

        // Notify user
        emitProgress(job.data.userId, {
          jobId: jobId,
          stage: 'error',
          progress: -1,
          detail: `Processing failed after ${job.attemptsMade} attempts: ${failedReason}`,
        });
      }
    });
  }
}
```

---

## 5. Chunking Strategy

### 5.1 Optimal Chunk Size

| Factor | Recommendation |
|---|---|
| **Target chunk size** | 3,000 - 4,000 tokens (~12,000-16,000 characters) |
| **Maximum chunk size** | 6,000 tokens (hard cap) |
| **Minimum chunk size** | 500 tokens (merge small sections with neighbors) |
| **Overlap** | 200-300 tokens between consecutive chunks |
| **Model context** | claude-sonnet-4-6 has 200K context; each extraction prompt uses ~1,500 tokens for instructions + ~4,000 for chunk + ~4,000 for response = ~9,500 per call |

**Why 3,000-4,000 tokens?**
- Large enough to contain complete scenes/interactions (preserves narrative context)
- Small enough for precise extraction (Claude can attend to every detail)
- Allows 4 parallel extraction calls per chunk within reasonable cost
- Sweet spot for entity co-reference resolution (characters mentioned together)

### 5.2 Structure-Aware Chunking Algorithm

```typescript
// src/ingestion/chunking/index.ts

import { encode, decode } from 'gpt-tokenizer'; // Token counting compatible with Claude's tokenizer

interface Chunk {
  text: string;
  index: number;
  total: number;
  tokenCount: number;
  structuralBoundary: string;  // What boundary this chunk starts at
  overlapTokens: number;
  metadata: {
    sectionTitle?: string;
    sectionType?: string;
    startOffset: number;
    endOffset: number;
    timeCodeMs?: number;      // For audio/video-sourced text
  };
}

const TARGET_CHUNK_TOKENS = 3500;
const MAX_CHUNK_TOKENS = 6000;
const MIN_CHUNK_TOKENS = 500;
const OVERLAP_TOKENS = 250;

export function chunkDocument(doc: ParsedDocument): Chunk[] {
  // Strategy 1: If the document has clear structural sections, use them
  if (doc.sections.length > 1) {
    return chunkByStructure(doc);
  }

  // Strategy 2: For unstructured text, use sliding window with paragraph awareness
  return chunkByParagraph(doc.rawText);
}

/**
 * Structure-aware chunking: prefer chapter/scene/act boundaries.
 * If a section is too large, sub-chunk it at paragraph boundaries.
 * If a section is too small, merge it with the next section.
 */
function chunkByStructure(doc: ParsedDocument): Chunk[] {
  const chunks: Chunk[] = [];
  let pendingText = '';
  let pendingTitle = '';
  let pendingType = '';
  let pendingStartOffset = 0;

  for (const section of doc.sections) {
    const sectionTokens = encode(section.content).length;

    if (sectionTokens > MAX_CHUNK_TOKENS) {
      // Section too large — flush pending, then sub-chunk this section
      if (pendingText) {
        addChunk(chunks, pendingText, pendingTitle, pendingType, pendingStartOffset, section.startOffset);
        pendingText = '';
      }

      const subChunks = chunkByParagraph(section.content, section.startOffset);
      for (const sub of subChunks) {
        sub.metadata.sectionTitle = section.title;
        sub.metadata.sectionType = section.type;
        chunks.push(sub);
      }
    } else if (sectionTokens < MIN_CHUNK_TOKENS) {
      // Section too small — accumulate
      pendingText += `\n\n--- ${section.type}: ${section.title} ---\n\n${section.content}`;
      if (!pendingTitle) {
        pendingTitle = section.title;
        pendingType = section.type;
        pendingStartOffset = section.startOffset;
      }

      // If accumulated text is large enough, flush
      if (encode(pendingText).length >= TARGET_CHUNK_TOKENS) {
        addChunk(chunks, pendingText, pendingTitle, pendingType, pendingStartOffset, section.endOffset);
        pendingText = '';
        pendingTitle = '';
      }
    } else {
      // Section is right-sized — flush pending and add this section
      if (pendingText) {
        addChunk(chunks, pendingText, pendingTitle, pendingType, pendingStartOffset, section.startOffset);
        pendingText = '';
        pendingTitle = '';
      }
      addChunk(chunks, section.content, section.title, section.type, section.startOffset, section.endOffset);
    }
  }

  // Flush any remaining pending text
  if (pendingText) {
    addChunk(chunks, pendingText, pendingTitle, pendingType, pendingStartOffset, doc.rawText.length);
  }

  // Add overlap between chunks
  return addOverlap(chunks);
}

/**
 * Paragraph-aware sliding window for unstructured text.
 */
function chunkByParagraph(text: string, baseOffset: number = 0): Chunk[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: Chunk[] = [];
  let currentChunkText = '';
  let currentTokenCount = 0;
  let chunkStartOffset = baseOffset;
  let currentOffset = baseOffset;

  for (const paragraph of paragraphs) {
    const paraTokens = encode(paragraph).length;

    if (currentTokenCount + paraTokens > MAX_CHUNK_TOKENS && currentChunkText) {
      // Current chunk is full — save it
      addChunk(chunks, currentChunkText, '', 'paragraph', chunkStartOffset, currentOffset);
      currentChunkText = '';
      currentTokenCount = 0;
      chunkStartOffset = currentOffset;
    }

    currentChunkText += (currentChunkText ? '\n\n' : '') + paragraph;
    currentTokenCount += paraTokens;
    currentOffset += paragraph.length + 2;

    if (currentTokenCount >= TARGET_CHUNK_TOKENS) {
      addChunk(chunks, currentChunkText, '', 'paragraph', chunkStartOffset, currentOffset);
      currentChunkText = '';
      currentTokenCount = 0;
      chunkStartOffset = currentOffset;
    }
  }

  if (currentChunkText) {
    addChunk(chunks, currentChunkText, '', 'paragraph', chunkStartOffset, currentOffset);
  }

  return addOverlap(chunks);
}

function addChunk(
  chunks: Chunk[],
  text: string,
  sectionTitle: string,
  sectionType: string,
  startOffset: number,
  endOffset: number,
) {
  chunks.push({
    text: text.trim(),
    index: chunks.length,
    total: 0, // Set after all chunks are created
    tokenCount: encode(text).length,
    structuralBoundary: sectionType || 'none',
    overlapTokens: 0,
    metadata: {
      sectionTitle: sectionTitle || undefined,
      sectionType: sectionType || undefined,
      startOffset,
      endOffset,
    },
  });
}

/**
 * Add overlap: append the last N tokens of each chunk to the beginning of the next.
 * This ensures entities that span chunk boundaries are captured.
 */
function addOverlap(chunks: Chunk[]): Chunk[] {
  for (let i = 0; i < chunks.length; i++) {
    chunks[i].total = chunks.length;
    chunks[i].index = i;

    if (i > 0) {
      const prevTokens = encode(chunks[i - 1].text);
      const overlapTokens = prevTokens.slice(-OVERLAP_TOKENS);
      const overlapText = decode(overlapTokens);

      chunks[i].text = `[...continued from previous chunk...]\n${overlapText}\n\n---\n\n${chunks[i].text}`;
      chunks[i].overlapTokens = overlapTokens.length;
      chunks[i].tokenCount += overlapTokens.length;
    }
  }

  return chunks;
}
```

### 5.3 Handling Very Long Documents (500K+ Words)

A 500,000-word novel is approximately 650,000 tokens. At 3,500 tokens per chunk, that's ~186 chunks. With 4 extraction prompts per chunk, that's ~744 Claude API calls.

**Strategy: Hierarchical Two-Pass Processing**

```
Pass 1: "Survey" pass (fast, cheap)
  - Chunk at 8,000 tokens (fewer, larger chunks)
  - Use Claude Haiku for initial entity/event extraction
  - Build a rough entity catalog and timeline skeleton
  - ~81 chunks * 4 prompts = ~324 Haiku calls

Pass 2: "Detail" pass (targeted, precise)
  - Use the survey results to identify high-density sections
  - Re-chunk those sections at 3,500 tokens
  - Use Claude Sonnet for detailed extraction
  - Only re-process sections that contain significant narrative action
  - Skip descriptive passages, travel montages, etc. unless flagged
```

```typescript
// src/ingestion/chunking/long-document.ts

interface SurveyResult {
  chunkIndex: number;
  entityDensity: number;      // Entities per 1000 tokens
  eventDensity: number;       // Events per 1000 tokens
  hasDialogue: boolean;
  hasConflict: boolean;
  narrativeImportance: 'high' | 'medium' | 'low';
}

const LONG_DOCUMENT_THRESHOLD = 100_000; // tokens

export async function processLongDocument(
  doc: ParsedDocument,
  worldId: string,
): Promise<void> {
  const totalTokens = encode(doc.rawText).length;

  if (totalTokens < LONG_DOCUMENT_THRESHOLD) {
    // Standard processing
    return standardProcess(doc, worldId);
  }

  // Pass 1: Survey with large chunks and Haiku
  const surveyChunks = chunkDocument(doc, { targetTokens: 8000, maxTokens: 12000 });
  const surveyResults = await surveyPass(surveyChunks, worldId);

  // Identify high-priority sections
  const highPriority = surveyResults.filter(
    (r) => r.narrativeImportance === 'high' || r.entityDensity > 2 || r.eventDensity > 1.5,
  );
  const mediumPriority = surveyResults.filter(
    (r) => r.narrativeImportance === 'medium',
  );

  // Pass 2: Detail extraction on important sections
  for (const section of highPriority) {
    const sectionText = surveyChunks[section.chunkIndex].text;
    const detailChunks = chunkByParagraph(sectionText);
    await detailPass(detailChunks, worldId);
  }

  // Medium priority gets single-pass Sonnet extraction (no re-chunking)
  for (const section of mediumPriority) {
    await singlePassExtraction(surveyChunks[section.chunkIndex], worldId);
  }

  // Low priority: survey results are sufficient — store as-is
}

async function surveyPass(chunks: Chunk[], worldId: string): Promise<SurveyResult[]> {
  const client = new Anthropic();

  return Promise.all(chunks.map(async (chunk, i) => {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Quickly survey this text passage and classify it:
1. How many distinct characters are mentioned? (count)
2. How many distinct events/actions occur? (count)
3. Does it contain dialogue? (yes/no)
4. Does it contain conflict or tension? (yes/no)
5. Narrative importance: high (major plot event, character revelation), medium (character development, subplot), low (description, transition, filler)

Text:
${chunk.text}

Return JSON: { "characters": N, "events": N, "hasDialogue": bool, "hasConflict": bool, "importance": "high|medium|low" }`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const parsed = JSON.parse(text);
    const tokenCount = chunk.tokenCount || 1000;

    return {
      chunkIndex: i,
      entityDensity: (parsed.characters / tokenCount) * 1000,
      eventDensity: (parsed.events / tokenCount) * 1000,
      hasDialogue: parsed.hasDialogue,
      hasConflict: parsed.hasConflict,
      narrativeImportance: parsed.importance,
    };
  }));
}
```

### 5.4 Cost Estimation

| Document Size | Chunks | API Calls | Est. Cost (Sonnet) | Est. Time |
|---|---|---|---|---|
| Short story (10K words) | 4 | 16 | ~$0.15 | ~30s |
| Novella (40K words) | 15 | 60 | ~$0.55 | ~2min |
| Novel (80K words) | 30 | 120 | ~$1.10 | ~4min |
| Epic novel (200K words) | 75 | 300 | ~$2.75 | ~10min |
| Mega-novel (500K words) | ~186 (survey: ~81) | ~400-600 | ~$3-5 | ~15-25min |

Cost is based on ~4,000 input tokens + ~2,000 output tokens per call at Sonnet pricing. Survey pass uses Haiku at ~10x lower cost.

---

## Appendix: Database Schema (Reference)

```sql
-- Core entity storage
CREATE TABLE world_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id),
  source_id UUID REFERENCES sources(id),
  type VARCHAR(50) NOT NULL, -- character, location, event, item, concept, faction
  name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  description TEXT,
  traits JSONB DEFAULT '{}',
  confidence FLOAT DEFAULT 1.0,
  review_status VARCHAR(20) DEFAULT 'auto', -- auto, confirmed, dismissed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(world_id, type, name)
);

CREATE INDEX idx_entities_world ON world_entities(world_id);
CREATE INDEX idx_entities_type ON world_entities(world_id, type);
CREATE INDEX idx_entities_aliases ON world_entities USING GIN(aliases);

-- Relationships between entities
CREATE TABLE entity_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id),
  source_entity_id UUID NOT NULL REFERENCES world_entities(id),
  target_entity_id UUID NOT NULL REFERENCES world_entities(id),
  type VARCHAR(50) NOT NULL,
  custom_label TEXT,
  description TEXT,
  strength FLOAT DEFAULT 0.5,
  timeline_position TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(world_id, source_entity_id, target_entity_id, type)
);

-- Timeline events
CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id),
  source_id UUID REFERENCES sources(id),
  name TEXT NOT NULL,
  description TEXT,
  participant_ids UUID[] DEFAULT '{}',
  location_id UUID REFERENCES world_entities(id),
  relative_order INTEGER,
  causal_links JSONB DEFAULT '[]',
  emotional_impact JSONB DEFAULT '{}',
  narrative_layer VARCHAR(30) DEFAULT 'present',
  temporal_markers TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_world ON timeline_events(world_id);
CREATE INDEX idx_events_order ON timeline_events(world_id, relative_order);

-- Themes
CREATE TABLE world_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id),
  source_id UUID REFERENCES sources(id),
  name TEXT NOT NULL,
  description TEXT,
  evidence TEXT[] DEFAULT '{}',
  strength FLOAT DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(world_id, name)
);

-- Source tracking
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id),
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_key TEXT NOT NULL, -- S3 key
  format VARCHAR(20) NOT NULL,
  size_bytes BIGINT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, complete, error
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Dead letter queue for failed jobs
CREATE TABLE dead_letter_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name VARCHAR(50) NOT NULL,
  job_id VARCHAR(100) NOT NULL,
  job_data JSONB NOT NULL,
  error TEXT,
  failed_at TIMESTAMPTZ DEFAULT NOW()
);
```
