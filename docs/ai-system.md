# StoryForge AI Assist & Analysis System Design

> **Version**: 1.0.0-draft
> **Last Updated**: 2026-03-28
> **Purpose**: Complete specification of the AI integration layer, analysis operations, generation operations, context assembly, prompt versioning, and cost estimation for code generation agents.

---

## Table of Contents

1. [Claude API Integration Layer](#1-claude-api-integration-layer)
2. [Analysis Operations](#2-analysis-operations)
3. [Generation Operations (AI Wand)](#3-generation-operations-ai-wand)
4. [Context Assembly Strategy](#4-context-assembly-strategy)
5. [Prompt Versioning and Testing Strategy](#5-prompt-versioning-and-testing-strategy)
6. [Cost Estimation](#6-cost-estimation)

---

## 1. Claude API Integration Layer

All AI calls in StoryForge are routed through a centralized client at `src/lib/ai/`. No component or API route calls Claude directly. This layer handles client configuration, rate limiting, retries, token tracking, and streaming.

### 1.1 Client Setup

```typescript
// src/lib/ai/client.ts

import Anthropic from "@anthropic-ai/sdk";

/**
 * Singleton Claude API client.
 * All StoryForge AI operations route through this module.
 */

const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-20250514";
const CLAUDE_ANALYSIS_MODEL =
  process.env.CLAUDE_ANALYSIS_MODEL ?? "claude-sonnet-4-20250514";
const CLAUDE_GENERATION_MODEL =
  process.env.CLAUDE_GENERATION_MODEL ?? "claude-sonnet-4-20250514";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  maxRetries: 0, // We handle retries ourselves for finer control
});

export interface ClaudeRequest {
  system: string;
  messages: Anthropic.MessageParam[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  metadata?: {
    worldId: string;
    operation: AnalysisOperation | GenerationOperation;
    userId: string;
  };
}

export type AnalysisOperation =
  | "entity_extraction"
  | "relationship_mapping"
  | "consistency_check"
  | "pacing_analysis"
  | "voice_analysis"
  | "narrative_code_tagging"
  | "scene_value_change"
  | "emotional_state_extraction"
  | "causal_relation_detection"
  | "theme_motif_detection";

export type GenerationOperation =
  | "beat_generation"
  | "script_generation"
  | "synopsis_expansion"
  | "treatment_generation";

export interface ClaudeResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  stopReason: string;
  latencyMs: number;
}

/**
 * Returns the appropriate model for the operation type.
 * Analysis operations may use a different (cheaper/faster) model than generation.
 */
function getModelForOperation(
  operation?: AnalysisOperation | GenerationOperation
): string {
  if (!operation) return CLAUDE_MODEL;
  const analysisOps: string[] = [
    "entity_extraction",
    "relationship_mapping",
    "consistency_check",
    "pacing_analysis",
    "voice_analysis",
    "narrative_code_tagging",
    "scene_value_change",
    "emotional_state_extraction",
    "causal_relation_detection",
    "theme_motif_detection",
  ];
  return analysisOps.includes(operation)
    ? CLAUDE_ANALYSIS_MODEL
    : CLAUDE_GENERATION_MODEL;
}

export { client, getModelForOperation };
```

### 1.2 Rate Limiting

Rate limiting operates at two levels: per-user (to prevent individual abuse) and global (to stay within Anthropic API limits).

```typescript
// src/lib/ai/rate-limiter.ts

import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

interface RateLimitConfig {
  /** Max requests in the window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Per-user limits
  "user:analysis": { maxRequests: 20, windowSeconds: 60 },
  "user:generation": { maxRequests: 10, windowSeconds: 60 },
  "user:daily": { maxRequests: 500, windowSeconds: 86400 },

  // Global limits (across all users, matching Anthropic tier limits)
  "global:requests": { maxRequests: 2000, windowSeconds: 60 },
  "global:tokens_input": { maxRequests: 400000, windowSeconds: 60 }, // input tokens/min
  "global:tokens_output": { maxRequests: 80000, windowSeconds: 60 }, // output tokens/min
};

/**
 * Sliding-window rate limiter using Redis sorted sets.
 * Returns { allowed: boolean, retryAfterMs?: number }.
 */
export async function checkRateLimit(
  key: string,
  category: string
): Promise<{ allowed: boolean; retryAfterMs?: number; remaining: number }> {
  const config = RATE_LIMITS[category];
  if (!config) return { allowed: true, remaining: Infinity };

  const now = Date.now();
  const windowStart = now - config.windowSeconds * 1000;
  const redisKey = `ratelimit:${category}:${key}`;

  // Atomic: remove expired entries, count current, add new if allowed
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(redisKey, 0, windowStart);
  pipeline.zcard(redisKey);

  const results = await pipeline.exec();
  const currentCount = (results?.[1]?.[1] as number) ?? 0;

  if (currentCount >= config.maxRequests) {
    // Find oldest entry to calculate retry-after
    const oldest = await redis.zrange(redisKey, 0, 0, "WITHSCORES");
    const oldestTimestamp = oldest.length >= 2 ? Number(oldest[1]) : now;
    const retryAfterMs = oldestTimestamp + config.windowSeconds * 1000 - now;

    return {
      allowed: false,
      retryAfterMs: Math.max(retryAfterMs, 1000),
      remaining: 0,
    };
  }

  // Add this request
  await redis.zadd(redisKey, now, `${now}:${Math.random()}`);
  await redis.expire(redisKey, config.windowSeconds + 10);

  return { allowed: true, remaining: config.maxRequests - currentCount - 1 };
}

/**
 * Track token usage against global token rate limits.
 */
export async function trackTokenUsage(
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  const now = Date.now();
  const inputKey = `ratelimit:global:tokens_input:bucket`;
  const outputKey = `ratelimit:global:tokens_output:bucket`;

  // Use sorted set with token count as member score
  await redis.zadd(inputKey, now, `${now}:${inputTokens}`);
  await redis.zadd(outputKey, now, `${now}:${outputTokens}`);
  await redis.expire(inputKey, 120);
  await redis.expire(outputKey, 120);
}
```

### 1.3 Retry Strategy

```typescript
// src/lib/ai/retry.ts

import Anthropic from "@anthropic-ai/sdk";

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatusCodes: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 60000,
  retryableStatusCodes: [429, 500, 502, 503, 529],
};

/**
 * Exponential backoff with jitter and retry-after header respect.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === config.maxRetries) break;

      // Only retry on retryable errors
      if (error instanceof Anthropic.APIError) {
        if (!config.retryableStatusCodes.includes(error.status)) {
          throw error; // Non-retryable, rethrow immediately
        }

        // Respect Retry-After header for 429s
        const retryAfter = (error.headers as Record<string, string>)?.[
          "retry-after"
        ];
        if (retryAfter) {
          const delaySeconds = parseFloat(retryAfter);
          if (!isNaN(delaySeconds)) {
            await sleep(delaySeconds * 1000);
            continue;
          }
        }
      }

      // Exponential backoff with full jitter
      const baseDelay = config.baseDelayMs * Math.pow(2, attempt);
      const jitteredDelay = Math.random() * Math.min(baseDelay, config.maxDelayMs);
      await sleep(jitteredDelay);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

### 1.4 Token Tracking

Every Claude API call is metered and stored for per-user billing, cost monitoring, and budget enforcement.

```typescript
// src/lib/ai/token-tracker.ts

import { prisma } from "@/lib/db/client";

interface TokenUsageRecord {
  worldId: string;
  userId: string;
  operation: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  promptVersion: string;
  metadata?: Record<string, unknown>;
}

// Pricing per million tokens (as of 2026-03, Claude Sonnet 4)
const PRICING: Record<string, { inputPerMillion: number; outputPerMillion: number }> = {
  "claude-sonnet-4-20250514": { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  "claude-haiku-4-20250514": { inputPerMillion: 0.25, outputPerMillion: 1.25 },
  "claude-opus-4-20250514": { inputPerMillion: 15.0, outputPerMillion: 75.0 },
};

/**
 * Calculate estimated cost for a Claude API call.
 */
export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = PRICING[model] ?? PRICING["claude-sonnet-4-20250514"];
  return (
    (inputTokens / 1_000_000) * pricing.inputPerMillion +
    (outputTokens / 1_000_000) * pricing.outputPerMillion
  );
}

/**
 * Record token usage to database for billing and monitoring.
 */
export async function recordUsage(record: TokenUsageRecord): Promise<void> {
  await prisma.aiUsageLog.create({
    data: {
      worldId: record.worldId,
      userId: record.userId,
      operation: record.operation,
      model: record.model,
      inputTokens: record.inputTokens,
      outputTokens: record.outputTokens,
      totalTokens: record.totalTokens,
      estimatedCostUsd: record.estimatedCostUsd,
      latencyMs: record.latencyMs,
      promptVersion: record.promptVersion,
      metadata: record.metadata ?? {},
    },
  });
}

/**
 * Check if a user or world has exceeded their token budget.
 */
export async function checkBudget(
  userId: string,
  worldId: string
): Promise<{ withinBudget: boolean; usedUsd: number; limitUsd: number }> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const usage = await prisma.aiUsageLog.aggregate({
    where: { userId, createdAt: { gte: thirtyDaysAgo } },
    _sum: { estimatedCostUsd: true },
  });

  const usedUsd = usage._sum.estimatedCostUsd ?? 0;
  const limitUsd = parseFloat(process.env.USER_MONTHLY_AI_BUDGET_USD ?? "50");

  return { withinBudget: usedUsd < limitUsd, usedUsd, limitUsd };
}
```

### 1.5 Streaming vs Non-Streaming

StoryForge uses **two invocation modes** depending on the operation:

| Mode | Used For | Why |
|---|---|---|
| **Non-streaming** | All analysis operations (entity extraction, consistency check, pacing, voice, narrative codes, emotional states, causal relations, themes) | Analysis results are consumed as complete JSON objects. Partial results are unusable. Jobs run in background via BullMQ, so the user is not waiting on an HTTP response. |
| **Streaming** | All generation operations (beat generation, script generation, synopsis expansion, treatment generation) | Generation outputs are shown to the user progressively in the UI. Streaming provides a responsive experience while Claude produces text. |

```typescript
// src/lib/ai/invoke.ts

import { client, getModelForOperation, ClaudeRequest, ClaudeResponse } from "./client";
import { checkRateLimit, trackTokenUsage } from "./rate-limiter";
import { withRetry } from "./retry";
import { recordUsage, estimateCost } from "./token-tracker";

/**
 * Non-streaming invocation. Used for analysis operations.
 * Returns the full response once complete.
 */
export async function invokeAnalysis(request: ClaudeRequest): Promise<ClaudeResponse> {
  const model = request.model ?? getModelForOperation(request.metadata?.operation);

  // Rate limit check
  if (request.metadata?.userId) {
    const limit = await checkRateLimit(request.metadata.userId, "user:analysis");
    if (!limit.allowed) {
      throw new RateLimitError(
        `Rate limit exceeded. Retry after ${limit.retryAfterMs}ms`,
        limit.retryAfterMs!
      );
    }
  }

  const startTime = Date.now();

  const response = await withRetry(() =>
    client.messages.create({
      model,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.0, // Deterministic for analysis
      system: request.system,
      messages: request.messages,
    })
  );

  const latencyMs = Date.now() - startTime;
  const content =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Track usage
  await trackTokenUsage(response.usage.input_tokens, response.usage.output_tokens);

  if (request.metadata) {
    await recordUsage({
      worldId: request.metadata.worldId,
      userId: request.metadata.userId,
      operation: request.metadata.operation,
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      estimatedCostUsd: estimateCost(
        model,
        response.usage.input_tokens,
        response.usage.output_tokens
      ),
      latencyMs,
      promptVersion: getPromptVersion(request.metadata.operation),
    });
  }

  return {
    content,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    model,
    stopReason: response.stop_reason ?? "end_turn",
    latencyMs,
  };
}

/**
 * Streaming invocation. Used for generation operations.
 * Yields text chunks as they arrive.
 */
export async function* invokeGenerationStream(
  request: ClaudeRequest
): AsyncGenerator<string, ClaudeResponse> {
  const model = request.model ?? getModelForOperation(request.metadata?.operation);

  // Rate limit check
  if (request.metadata?.userId) {
    const limit = await checkRateLimit(request.metadata.userId, "user:generation");
    if (!limit.allowed) {
      throw new RateLimitError(
        `Rate limit exceeded. Retry after ${limit.retryAfterMs}ms`,
        limit.retryAfterMs!
      );
    }
  }

  const startTime = Date.now();
  let fullContent = "";
  let inputTokens = 0;
  let outputTokens = 0;

  const stream = client.messages.stream({
    model,
    max_tokens: request.maxTokens ?? 4096,
    temperature: request.temperature ?? 0.7, // More creative for generation
    system: request.system,
    messages: request.messages,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      fullContent += event.delta.text;
      yield event.delta.text;
    }
  }

  const finalMessage = await stream.finalMessage();
  inputTokens = finalMessage.usage.input_tokens;
  outputTokens = finalMessage.usage.output_tokens;

  const latencyMs = Date.now() - startTime;

  // Track usage
  await trackTokenUsage(inputTokens, outputTokens);

  if (request.metadata) {
    await recordUsage({
      worldId: request.metadata.worldId,
      userId: request.metadata.userId,
      operation: request.metadata.operation,
      model,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCostUsd: estimateCost(model, inputTokens, outputTokens),
      latencyMs,
      promptVersion: getPromptVersion(request.metadata.operation),
    });
  }

  return {
    content: fullContent,
    inputTokens,
    outputTokens,
    model,
    stopReason: finalMessage.stop_reason ?? "end_turn",
    latencyMs,
  };
}

/**
 * Get the current prompt version for an operation.
 * See Section 5 for the versioning strategy.
 */
function getPromptVersion(operation: string): string {
  const PROMPT_VERSIONS: Record<string, string> = {
    entity_extraction: "v2.1",
    relationship_mapping: "v1.3",
    consistency_check: "v1.4",
    pacing_analysis: "v1.1",
    voice_analysis: "v1.2",
    narrative_code_tagging: "v1.0",
    scene_value_change: "v1.0",
    emotional_state_extraction: "v1.1",
    causal_relation_detection: "v1.0",
    theme_motif_detection: "v1.0",
    beat_generation: "v1.2",
    script_generation: "v1.1",
    synopsis_expansion: "v1.0",
    treatment_generation: "v1.0",
  };
  return PROMPT_VERSIONS[operation] ?? "v0.0";
}

class RateLimitError extends Error {
  retryAfterMs: number;
  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}
```

---

## 2. Analysis Operations

All analysis operations run as background jobs via BullMQ. They use non-streaming invocation with `temperature: 0.0` for deterministic output. Every prompt requests structured JSON output. Results are stored in PostgreSQL and synced to SuperMemory.

### 2a. Entity Extraction

Extracts characters, locations, events, objects, and factions from narrative text. This is the primary ingestion analysis and runs on every chunk of ingested material.

**Invocation**: Non-streaming, `temperature: 0.0`, `max_tokens: 4096`
**Chunking**: Text is split into 3000-token chunks with 500-token overlap. Each chunk is processed independently, then results are merged via the entity resolution pipeline (see `docs/ingestion-pipeline.md`).

```
SYSTEM PROMPT (entity_extraction v2.1):
```

```text
You are StoryForge's narrative entity extraction engine. Your task is to identify
and extract structured entities from narrative text.

IMPORTANT RULES:
- Extract ONLY entities that are explicitly present or strongly implied in the text.
- Do NOT infer entities that require speculation beyond what the text supports.
- For characters, capture every named or distinctly referenced individual. Include
  unnamed characters only if they play a meaningful role (e.g., "the old woman who
  guards the gate").
- For locations, capture named places and any location described with enough detail
  to be a distinct setting.
- For events, capture discrete plot-relevant happenings. Do not extract trivial
  actions (e.g., "he sat down") unless they carry narrative significance.
- For objects, capture only items with narrative significance: weapons, gifts,
  symbols, plot devices. Ignore mundane props.
- For factions, capture named groups, organizations, families, armies, or any
  collective entity that acts as a unit in the story.
- Assign a confidence score (0.0-1.0) to each entity. Use 0.9+ only when the
  entity is explicitly named and unambiguous. Use 0.5-0.8 for implied or partially
  described entities.
- Include exact quote excerpts from the source text as evidence for each entity.

Respond with ONLY valid JSON matching the schema below. No commentary outside JSON.
```

```
USER PROMPT:
```

```text
Extract all narrative entities from the following text passage.

WORLD CONTEXT:
- Story title: {{world.title}}
- Synopsis: {{world.synopsis}}
- Known characters so far: {{existingCharacters | join(", ") | default("none yet")}}
- Known locations so far: {{existingLocations | join(", ") | default("none yet")}}

SOURCE METADATA:
- Source: {{source.name}} ({{source.format}})
- Section: {{chunk.sectionTitle | default("N/A")}}
- Position: chunk {{chunk.index}} of {{chunk.total}}

TEXT PASSAGE:
---
{{chunk.text}}
---

Respond with JSON matching this schema:
{
  "characters": [
    {
      "name": "string — primary name used in text",
      "aliases": ["string — other names, titles, or references"],
      "description": "string — physical/role description from text only",
      "firstMention": "string — exact quote of first appearance",
      "traits": ["string — observable traits from text"],
      "confidence": 0.0-1.0
    }
  ],
  "locations": [
    {
      "name": "string — location name",
      "description": "string — description from text",
      "type": "city | building | room | landscape | vehicle | realm | other",
      "firstMention": "string — exact quote",
      "confidence": 0.0-1.0
    }
  ],
  "events": [
    {
      "summary": "string — one-sentence event description",
      "type": "action | dialogue | discovery | transformation | revelation | decision",
      "participants": ["string — character names involved"],
      "location": "string | null — where it happens",
      "quote": "string — supporting text excerpt",
      "narrativeSignificance": "low | medium | high",
      "confidence": 0.0-1.0
    }
  ],
  "objects": [
    {
      "name": "string — object name or description",
      "description": "string — what it is and why it matters",
      "possessor": "string | null — who has it",
      "significance": "prop | symbol | plot_device | macguffin",
      "quote": "string — supporting text excerpt",
      "confidence": 0.0-1.0
    }
  ],
  "factions": [
    {
      "name": "string — faction/group name",
      "description": "string — what this group is",
      "members": ["string — known members from text"],
      "alignment": "string | null — allegiance or stance if evident",
      "quote": "string — supporting text excerpt",
      "confidence": 0.0-1.0
    }
  ]
}
```

### 2b. Relationship Mapping

Detects and classifies relationships between characters (and between characters and factions). Runs after entity extraction, receiving the resolved entity list as context.

**Invocation**: Non-streaming, `temperature: 0.0`, `max_tokens: 4096`

```
SYSTEM PROMPT (relationship_mapping v1.3):
```

```text
You are StoryForge's relationship analysis engine. Your task is to identify and
classify relationships between characters based on narrative text.

RELATIONSHIP TYPES (use exactly these labels):
- ally — characters who cooperate, support, or fight for the same cause
- enemy — characters in direct opposition, conflict, or antagonism
- family — blood relations, adoptive relations, or marriage
- romantic — romantic interest, love, attraction (requited or unrequited)
- mentor — teacher/student, guide/protege, master/apprentice
- rival — competitive relationship without outright enmity
- subordinate — hierarchical: one serves, reports to, or obeys the other
- colleague — professional or organizational connection without strong personal bond
- friend — personal closeness without romantic element
- betrayer — one has betrayed the other (directional)

RULES:
- A relationship may have MULTIPLE types (e.g., family + enemy).
- Relationships are DIRECTIONAL when the type requires it (betrayer, subordinate,
  mentor). For symmetric types (ally, enemy, family, romantic, rival, friend,
  colleague), direction does not matter.
- Include a strength score (1-5): 1 = barely indicated, 5 = central to the story.
- Provide the EVIDENCE: exact quotes showing the relationship.
- If a relationship changes during the passage (e.g., ally becomes enemy), record
  BOTH states with the transition noted.
- Only extract relationships supported by the text. Do not speculate.

Respond with ONLY valid JSON. No commentary outside JSON.
```

```
USER PROMPT:
```

```text
Analyze the relationships between characters in this text passage.

WORLD CONTEXT:
- Story title: {{world.title}}
- Synopsis: {{world.synopsis}}

KNOWN CHARACTERS:
{{#each characters}}
- {{this.name}} ({{this.description}})
{{/each}}

KNOWN FACTIONS:
{{#each factions}}
- {{this.name}} ({{this.description}})
{{/each}}

TEXT PASSAGE:
---
{{chunk.text}}
---

Respond with JSON matching this schema:
{
  "relationships": [
    {
      "sourceCharacter": "string — character name",
      "targetCharacter": "string — character name",
      "types": ["ally | enemy | family | romantic | mentor | rival | subordinate | colleague | friend | betrayer"],
      "strength": 1-5,
      "description": "string — nature of this relationship",
      "evidence": ["string — exact quotes from text"],
      "sentiment": "positive | negative | neutral | ambivalent",
      "isDirectional": true | false,
      "confidence": 0.0-1.0
    }
  ],
  "factionMemberships": [
    {
      "character": "string — character name",
      "faction": "string — faction name",
      "role": "string — role within faction (leader, member, recruit, spy, etc.)",
      "evidence": "string — supporting quote",
      "confidence": 0.0-1.0
    }
  ],
  "transitions": [
    {
      "sourceCharacter": "string",
      "targetCharacter": "string",
      "fromTypes": ["string"],
      "toTypes": ["string"],
      "trigger": "string — what caused the change",
      "evidence": "string — supporting quote"
    }
  ]
}
```

### 2c. Consistency Checking

Detects contradictions across the story world. Operates in two tiers: hard contradictions (factual impossibilities) and soft contradictions (behavioral/tonal inconsistencies). This runs across the full world data, not per-chunk.

**Invocation**: Non-streaming, `temperature: 0.0`, `max_tokens: 8192`

```
SYSTEM PROMPT (consistency_check v1.4):
```

```text
You are StoryForge's narrative consistency checker. Your task is to detect
contradictions and inconsistencies in a story world's data.

CONTRADICTION SEVERITY LEVELS:
- critical — Logically impossible. A dead character appears alive later without
  resurrection. A character is in two places at the same time. A destroyed object
  is used again without explanation.
- high — Strong factual inconsistency. Character age does not match timeline.
  Location description contradicts earlier description. Stated relationship
  contradicts shown behavior.
- medium — Behavioral or tonal inconsistency. A character acts out of established
  personality without in-narrative justification. Tone shifts abruptly without
  story reason.
- low — Minor quibbles. Slight description variations. Potential continuity gaps
  that could be intentional ambiguity.

CONTRADICTION CATEGORIES:
- timeline — events that cannot coexist in the established chronology
- character — character facts, traits, or behaviors that contradict
- location — location descriptions or properties that conflict
- relationship — relationship states that conflict with evidence
- causality — events whose causal chain is broken or impossible
- object — object state contradictions (destroyed but used, lost but present)

RULES:
- Report ONLY genuine contradictions supported by specific evidence.
- Always cite BOTH sides of the contradiction with exact references.
- Do NOT flag intentional ambiguity, unreliable narration, or deliberate mystery.
  If the world has an unreliable narrator or the synopsis suggests intentional
  contradiction, note this and reduce severity.
- Do NOT flag character growth/change as contradiction. A kind character becoming
  cruel is development, not inconsistency — unless it happens without any
  narrative justification.
- Provide a specific, actionable suggestion for resolving each contradiction.
- Group related contradictions together.

Respond with ONLY valid JSON. No commentary outside JSON.
```

```
USER PROMPT:
```

```text
Check the following story world data for contradictions and inconsistencies.

WORLD: {{world.title}}
SYNOPSIS: {{world.synopsis}}

CHARACTER DATA:
{{#each characters}}
### {{this.name}}
- Description: {{this.description}}
- Traits: {{this.traits | join(", ")}}
- Status: {{this.status}}
- Relationships: {{#each this.relationships}}{{this.target}} ({{this.types | join(", ")}}){{#unless @last}}, {{/unless}}{{/each}}
{{/each}}

TIMELINE (chronological):
{{#each events}}
{{this.order}}. [{{this.type}}] {{this.summary}}
   - When: {{this.timePosition}}
   - Where: {{this.location}}
   - Who: {{this.participants | join(", ")}}
   - Source: {{this.sourceReference}}
{{/each}}

LOCATION DATA:
{{#each locations}}
- {{this.name}}: {{this.description}} (type: {{this.type}})
{{/each}}

WORLD RULES:
{{#each worldRules}}
- {{this.rule}}
{{/each}}

Respond with JSON matching this schema:
{
  "contradictions": [
    {
      "severity": "critical | high | medium | low",
      "category": "timeline | character | location | relationship | causality | object",
      "title": "string — short description of the contradiction",
      "description": "string — detailed explanation",
      "evidenceA": {
        "entityId": "string | null",
        "entityType": "string",
        "entityName": "string",
        "field": "string — which field/fact conflicts",
        "value": "string — the value in entity A",
        "sourceReference": "string — where this comes from"
      },
      "evidenceB": {
        "entityId": "string | null",
        "entityType": "string",
        "entityName": "string",
        "field": "string — which field/fact conflicts",
        "value": "string — the contradicting value in entity B",
        "sourceReference": "string — where this comes from"
      },
      "suggestion": "string — how to resolve this contradiction",
      "couldBeIntentional": true | false,
      "intentionalReason": "string | null — why it might be deliberate"
    }
  ],
  "summary": {
    "totalContradictions": 0,
    "bySeverity": { "critical": 0, "high": 0, "medium": 0, "low": 0 },
    "byCategory": { "timeline": 0, "character": 0, "location": 0, "relationship": 0, "causality": 0, "object": 0 },
    "overallConsistencyScore": 0.0-1.0
  }
}
```

### 2d. Pacing Analysis

Analyzes action density, dialogue ratio, tension level, and descriptive weight per scene. Produces the data that powers the Pacing Heatmap visualization.

**Invocation**: Non-streaming, `temperature: 0.0`, `max_tokens: 4096`

```
SYSTEM PROMPT (pacing_analysis v1.1):
```

```text
You are StoryForge's pacing and rhythm analysis engine. Your task is to analyze
the pacing characteristics of narrative scenes.

METRICS TO ANALYZE PER SCENE:
1. ACTION DENSITY (0.0-1.0): Proportion of the scene devoted to physical action,
   movement, conflict, or events happening. 0.0 = pure introspection/dialogue,
   1.0 = nonstop action.
2. DIALOGUE RATIO (0.0-1.0): Proportion of scene that is dialogue vs. narration/
   description. 0.0 = no dialogue, 1.0 = all dialogue.
3. DESCRIPTION DENSITY (0.0-1.0): Proportion of scene devoted to sensory
   description, world-painting, setting, atmosphere. 0.0 = no description,
   1.0 = purely descriptive.
4. TENSION LEVEL (0-10): Overall tension/stakes/suspense in the scene.
   0 = completely relaxed, 10 = maximum possible tension.
5. EMOTIONAL INTENSITY (0-10): Strength of emotional content regardless of type.
   0 = emotionally flat, 10 = devastating.
6. SCENE TEMPO: "very_slow" | "slow" | "moderate" | "fast" | "very_fast" —
   how quickly events unfold and how much narrative ground is covered.

RULES:
- Analyze each scene independently but note pacing TRANSITIONS between adjacent
  scenes (e.g., "jarring shift from very slow to very fast").
- Flag potential pacing problems:
  - Multiple consecutive slow scenes (potential reader fatigue)
  - Sustained high tension without relief (exhausting)
  - Action scenes with too much description (pace-breaking)
  - Long dialogue scenes without action beats (talking heads)
- Compare against the story's structure template if provided. Note where pacing
  deviates from expected rhythm (e.g., midpoint should have elevated tension).
- Provide specific, actionable pacing recommendations.

Respond with ONLY valid JSON. No commentary outside JSON.
```

```
USER PROMPT:
```

```text
Analyze the pacing and rhythm of the following scenes.

WORLD: {{world.title}}
GENRE: {{world.genre | default("not specified")}}
STRUCTURE TEMPLATE: {{structureTemplate.name | default("none")}}
{{#if structureTemplate}}
Expected pacing curve:
{{#each structureTemplate.beats}}
- {{this.name}} ({{this.expectedPosition}}%): expected tension {{this.expectedTension}}
{{/each}}
{{/if}}

SCENES TO ANALYZE:
{{#each scenes}}
### Scene {{@index}}: "{{this.title}}"
- Position in narrative: {{this.orderIndex}} of {{totalScenes}}
- Characters present: {{this.characters | join(", ")}}
- Location: {{this.location}}
- Scene text:
---
{{this.content}}
---

{{/each}}

Respond with JSON matching this schema:
{
  "scenes": [
    {
      "sceneTitle": "string",
      "sceneIndex": 0,
      "actionDensity": 0.0-1.0,
      "dialogueRatio": 0.0-1.0,
      "descriptionDensity": 0.0-1.0,
      "tensionLevel": 0-10,
      "emotionalIntensity": 0-10,
      "tempo": "very_slow | slow | moderate | fast | very_fast",
      "dominantMode": "action | dialogue | description | introspection | mixed",
      "wordCount": 0,
      "estimatedReadTimeSeconds": 0,
      "notes": "string — specific observations about this scene's pacing"
    }
  ],
  "transitions": [
    {
      "fromScene": "string",
      "toScene": "string",
      "transitionType": "smooth | abrupt | jarring",
      "note": "string — description of the pacing shift"
    }
  ],
  "overallPace": "slow | moderate | fast | uneven",
  "problems": [
    {
      "type": "sustained_tension | sustained_lull | talking_heads | pace_breaking_description | monotonous_tempo | missing_climax_escalation",
      "affectedScenes": ["string — scene titles"],
      "description": "string",
      "recommendation": "string"
    }
  ],
  "recommendations": ["string — general pacing improvement suggestions"]
}
```

### 2e. Character Voice Analysis

Analyzes each character's dialogue patterns: vocabulary, sentence structure, speech tics, formality level, and consistency across scenes. Powers the Character Voice Analysis feature and flags when characters sound identical.

**Invocation**: Non-streaming, `temperature: 0.0`, `max_tokens: 4096`

```
SYSTEM PROMPT (voice_analysis v1.2):
```

```text
You are StoryForge's character voice analysis engine. Your task is to analyze how
each character speaks — their vocabulary, syntax, speech patterns, and verbal tics
— and assess whether their voice is distinctive and consistent.

ANALYSIS DIMENSIONS:
1. VOCABULARY LEVEL: "simple" | "moderate" | "sophisticated" | "technical" |
   "archaic" | "slang-heavy" — the word choice register.
2. AVERAGE SENTENCE LENGTH: short (1-8 words), medium (9-20), long (21+).
3. SPEECH TICS: Recurring verbal habits — catchphrases, filler words, repeated
   sentence structures, characteristic exclamations, dialect markers.
4. FORMALITY: 0.0 (extremely casual, broken grammar, slang) to 1.0 (extremely
   formal, precise, elaborate).
5. EMOTIONAL EXPRESSIVENESS: 0.0 (flat, restrained, stoic) to 1.0 (highly
   expressive, dramatic, effusive).
6. SYNTAX PATTERNS: Declarative-heavy, interrogative-heavy, imperative-heavy,
   complex subordinate clauses, fragments, run-ons.
7. DISTINCTIVE MARKERS: What makes this character's voice recognizable if you
   removed the dialogue attribution?

RULES:
- Analyze ONLY dialogue lines, not narration or action lines.
- Compare characters against each other. Flag pairs of characters whose voices are
  indistinguishable (similar vocabulary, sentence length, formality, no unique tics).
- Flag individual scenes where a character's voice deviates from their established
  pattern WITHOUT narrative justification (e.g., not under duress, disguise, or
  character growth).
- Provide specific line-level examples for every claim.
- If a character has fewer than 3 dialogue lines, note that the sample is too small
  for reliable analysis.

Respond with ONLY valid JSON. No commentary outside JSON.
```

```
USER PROMPT:
```

```text
Analyze the dialogue voice patterns for the following characters.

WORLD: {{world.title}}

CHARACTER PROFILES:
{{#each characters}}
- {{this.name}}: {{this.description}}
  Background: {{this.background | default("not specified")}}
  Education/class: {{this.socialClass | default("not specified")}}
{{/each}}

DIALOGUE SAMPLES (by character):
{{#each characterDialogue}}
### {{this.characterName}}
{{#each this.lines}}
[Scene: "{{this.sceneName}}"] "{{this.text}}"
{{/each}}
{{/each}}

Respond with JSON matching this schema:
{
  "characterVoices": [
    {
      "characterName": "string",
      "sampleSize": 0,
      "vocabularyLevel": "simple | moderate | sophisticated | technical | archaic | slang-heavy",
      "averageSentenceLength": "short | medium | long",
      "averageWordCount": 0,
      "formality": 0.0-1.0,
      "emotionalExpressiveness": 0.0-1.0,
      "syntaxPatterns": ["string — dominant patterns"],
      "speechTics": [
        {
          "tic": "string — the recurring pattern",
          "frequency": 0,
          "examples": ["string — exact quotes"]
        }
      ],
      "distinctiveMarkers": ["string — what makes this voice unique"],
      "topWords": ["string — most characteristic vocabulary"],
      "exampleQuotes": {
        "mostCharacteristic": "string — line that best represents this voice",
        "leastCharacteristic": "string — line that feels most off-voice"
      }
    }
  ],
  "voiceSimilarityPairs": [
    {
      "characterA": "string",
      "characterB": "string",
      "similarityScore": 0.0-1.0,
      "sharedTraits": ["string — what makes them sound alike"],
      "differentiatingTraits": ["string — what little differences exist"],
      "recommendation": "string — how to differentiate them further"
    }
  ],
  "inconsistencies": [
    {
      "characterName": "string",
      "sceneName": "string",
      "excerpt": "string — the off-voice line",
      "issue": "string — what is inconsistent",
      "expectedPattern": "string — what the character normally sounds like",
      "possibleJustification": "string | null — could this be intentional?",
      "suggestion": "string — how to fix if unintentional"
    }
  ],
  "overallDistinctivenessScore": 0.0-1.0,
  "recommendations": ["string — general voice improvement suggestions"]
}
```

### 2f. Narrative Code Tagging (Barthes' Five Codes)

Tags text segments with Roland Barthes' five semiotic codes: hermeneutic (mystery/enigma), proairetic (action/sequence), semic (character/connotation), symbolic (theme/opposition), and cultural (reference/knowledge).

**Invocation**: Non-streaming, `temperature: 0.0`, `max_tokens: 4096`

```
SYSTEM PROMPT (narrative_code_tagging v1.0):
```

```text
You are StoryForge's narrative code analysis engine, applying Roland Barthes'
five codes from S/Z to narrative text.

THE FIVE CODES:
1. HERMENEUTIC (HER) — The code of enigmas. Any element that poses a question,
   creates mystery, delays an answer, or provides a partial/misleading answer.
   Sub-types: question_posed, clue, mislead (false clue), partial_answer,
   answer_revealed, suspended (question left hanging).

2. PROAIRETIC (ACT) — The code of actions. Sequences of actions that create
   narrative momentum and imply an outcome. Each action belongs to a named sequence
   (e.g., "the escape," "the seduction," "the battle"). Sub-types: sequence_start,
   continuation, climax, resolution.

3. SEMIC (SEM) — The code of semes/connotation. Attributes and qualities attached
   to characters, places, or objects through connotation (not denotation). These
   build up the "character effect." Sub-types: character_trait, atmosphere,
   moral_quality, status_marker.

4. SYMBOLIC (SYM) — The code of symbols. Binary oppositions, thematic antitheses,
   and symbolic structures. Sub-types: opposition (name both poles), transgression
   (crossing a boundary), mediation (resolving an opposition).

5. CULTURAL (REF) — The code of reference. Appeals to shared cultural knowledge:
   proverbs, scientific facts, historical references, genre conventions, literary
   allusions. Sub-types: literary_allusion, historical_reference, scientific_fact,
   proverb, genre_convention, social_norm.

RULES:
- A single text passage can (and often does) activate multiple codes simultaneously.
- For hermeneutic codes, track the LIFECYCLE of each enigma: when posed, clues
  given, when resolved.
- For proairetic codes, NAME the action sequence each action belongs to.
- For semic codes, NAME the specific seme/quality being connoted.
- For symbolic codes, NAME both poles of the opposition.
- For cultural codes, IDENTIFY the specific reference.
- Cite the exact text segment for each code activation.
- Focus on narratively significant code activations. Not every sentence needs a tag.

Respond with ONLY valid JSON. No commentary outside JSON.
```

```
USER PROMPT:
```

```text
Apply Barthes' five narrative codes to the following text passage.

WORLD: {{world.title}}
KNOWN THEMES: {{themes | join(", ") | default("none identified yet")}}
OPEN ENIGMAS: {{#each openEnigmas}}{{this.question}} (posed in: {{this.source}}){{#unless @last}}; {{/unless}}{{/each}}{{#unless openEnigmas}}none tracked yet{{/unless}}

TEXT PASSAGE:
---
{{passage.text}}
---

Respond with JSON matching this schema:
{
  "codes": [
    {
      "code": "HER | ACT | SEM | SYM | REF",
      "subType": "string — sub-type from the list above",
      "textSegment": "string — exact quoted text that activates this code",
      "startOffset": 0,
      "endOffset": 0,
      "analysis": "string — why this segment activates this code",
      "linkedEntity": "string | null — character, theme, or enigma name this relates to",
      "metadata": {}
    }
  ],
  "enigmaTracker": [
    {
      "enigmaName": "string — short name for this mystery/question",
      "status": "posed | clue_given | misled | partially_answered | answered | suspended",
      "question": "string — the question the reader is asking",
      "textEvidence": "string — the triggering text",
      "relatedEnigmaName": "string | null — if this clue/answer relates to an earlier enigma"
    }
  ],
  "actionSequences": [
    {
      "sequenceName": "string — name of the action sequence",
      "phase": "start | continuation | climax | resolution",
      "action": "string — what happens in this step",
      "textEvidence": "string"
    }
  ],
  "symbolicOppositions": [
    {
      "poleA": "string",
      "poleB": "string",
      "textEvidence": "string",
      "thematicConnection": "string | null"
    }
  ]
}
```

### 2g. Scene Value Change (McKee)

Analyzes the value change in each scene per Robert McKee's framework: every scene should turn at least one value from positive to negative or vice versa.

**Invocation**: Non-streaming, `temperature: 0.0`, `max_tokens: 4096`

```
SYSTEM PROMPT (scene_value_change v1.0):
```

```text
You are StoryForge's scene value analysis engine, applying Robert McKee's principle
that every meaningful scene contains a value change — a shift in a human value
(justice/injustice, hope/despair, love/hate, freedom/captivity, truth/lie,
strength/weakness, life/death, etc.) from one charge to another.

McKee's VALUE CHANGE MODEL:
- Every scene has a STARTING VALUE STATE: the condition of the value at the scene's
  opening (positive, negative, or ironic).
- Every scene has an ENDING VALUE STATE: the condition after the scene's events.
- The TURNING POINT is the event, decision, or revelation that causes the shift.
- A scene where the value does not change is a NON-EVENT (potentially a pacing problem).
- Value changes can be:
  - Positive to negative (or reverse): simple reversal
  - Positive to double-positive (escalation)
  - Negative to double-negative (deepening)
  - Ironic: both positive and negative simultaneously (the most powerful scenes)

RULES:
- Identify the PRIMARY value at stake in each scene (there may be secondary values too).
- Name the value using a paired opposition (e.g., "trust/betrayal" not just "trust").
- Rate the magnitude of the change (1-5): 1 = subtle shift, 5 = complete reversal.
- Scenes with NO value change should be flagged — they may be candidates for
  cutting or restructuring.
- The turning point should be a specific moment you can point to in the text.
- Track value arcs across scenes: a value that keeps moving in one direction without
  reversal signals a potential structural issue.

Respond with ONLY valid JSON. No commentary outside JSON.
```

```
USER PROMPT:
```

```text
Analyze the value changes in the following scenes using McKee's framework.

WORLD: {{world.title}}
GENRE: {{world.genre | default("not specified")}}

SCENES:
{{#each scenes}}
### Scene {{@index}}: "{{this.title}}"
- Characters: {{this.characters | join(", ")}}
- Location: {{this.location}}
- Scene text:
---
{{this.content}}
---

{{/each}}

Respond with JSON matching this schema:
{
  "sceneValues": [
    {
      "sceneTitle": "string",
      "sceneIndex": 0,
      "primaryValue": {
        "name": "string — value opposition pair, e.g., 'trust/betrayal'",
        "startingCharge": "positive | negative | ironic | neutral",
        "endingCharge": "positive | negative | ironic | neutral | double_positive | double_negative",
        "magnitude": 1-5,
        "turningPoint": {
          "description": "string — what happens to cause the shift",
          "textEvidence": "string — exact quote from the scene",
          "approximatePosition": "opening | early | midpoint | late | closing"
        }
      },
      "secondaryValues": [
        {
          "name": "string — value opposition pair",
          "startingCharge": "string",
          "endingCharge": "string",
          "magnitude": 1-5
        }
      ],
      "isNonEvent": false,
      "nonEventNote": "string | null — why this scene has no value change, if applicable"
    }
  ],
  "valueArcs": [
    {
      "valueName": "string — the value being tracked",
      "trajectory": [
        {
          "sceneTitle": "string",
          "charge": "string"
        }
      ],
      "concern": "string | null — flag if value moves monotonically without reversal"
    }
  ],
  "insights": ["string — overall observations about value dynamics"]
}
```

### 2h. Emotional State Extraction Per Character Per Scene

Extracts the emotional state of each character at each scene: primary emotion, secondary emotion, intensity, and the trigger.

**Invocation**: Non-streaming, `temperature: 0.0`, `max_tokens: 4096`

```
SYSTEM PROMPT (emotional_state_extraction v1.1):
```

```text
You are StoryForge's emotional state analysis engine. Your task is to track the
emotional state of each character in each scene.

EMOTIONAL DIMENSIONS (use these labels):
- joy — happiness, contentment, satisfaction, elation, relief
- grief — sadness, loss, mourning, melancholy, despair
- anger — rage, frustration, resentment, indignation, irritation
- fear — anxiety, dread, terror, nervousness, panic
- hope — optimism, anticipation, faith, longing, aspiration
- surprise — shock, disbelief, wonder, bewilderment, revelation
- disgust — revulsion, contempt, moral outrage, repulsion
- love — affection, tenderness, devotion, protectiveness, warmth
- shame — guilt, embarrassment, humiliation, self-loathing
- pride — confidence, triumph, dignity, self-respect, arrogance

RULES:
- Analyze ONLY characters who are PRESENT and ACTIVE in the scene (speaking,
  acting, or being focused on by the narration).
- Assign a PRIMARY emotion (the dominant one) and optionally 1-2 SECONDARY emotions.
- Rate INTENSITY on a 0-10 scale: 0 = barely perceptible, 10 = overwhelming/
  all-consuming.
- Identify the TRIGGER: what specific event, line, or realization causes or
  sustains the emotion.
- Track EMOTIONAL SHIFTS within a scene: a character may start fearful and end
  hopeful. Record both states with the transition moment.
- Base analysis on TEXTUAL EVIDENCE: dialogue tone, described body language,
  internal thoughts, narrator commentary, actions taken. Do not project emotions
  not supported by the text.
- Note when emotions are MASKED: a character may feel fear but present anger.
  Record both the felt and presented emotion.

Respond with ONLY valid JSON. No commentary outside JSON.
```

```
USER PROMPT:
```

```text
Extract the emotional states of each character in the following scenes.

WORLD: {{world.title}}

CHARACTER PROFILES (for context):
{{#each characters}}
- {{this.name}}: {{this.description}}
{{/each}}

SCENES:
{{#each scenes}}
### Scene {{@index}}: "{{this.title}}"
- Characters present: {{this.characters | join(", ")}}
- Scene text:
---
{{this.content}}
---

{{/each}}

Respond with JSON matching this schema:
{
  "sceneEmotions": [
    {
      "sceneTitle": "string",
      "sceneIndex": 0,
      "characterStates": [
        {
          "characterName": "string",
          "primaryEmotion": "joy | grief | anger | fear | hope | surprise | disgust | love | shame | pride",
          "primaryIntensity": 0-10,
          "secondaryEmotions": [
            {
              "emotion": "string",
              "intensity": 0-10
            }
          ],
          "trigger": "string — what causes this emotional state",
          "textEvidence": "string — supporting quote",
          "maskedEmotion": {
            "feltEmotion": "string",
            "presentedEmotion": "string",
            "evidence": "string"
          } | null,
          "shift": {
            "fromEmotion": "string",
            "fromIntensity": 0-10,
            "toEmotion": "string",
            "toIntensity": 0-10,
            "transitionMoment": "string — what triggers the shift",
            "transitionEvidence": "string"
          } | null
        }
      ]
    }
  ],
  "characterArcs": [
    {
      "characterName": "string",
      "emotionalTrajectory": [
        {
          "sceneTitle": "string",
          "dominantEmotion": "string",
          "intensity": 0-10
        }
      ],
      "overallArc": "string — summary of this character's emotional journey"
    }
  ]
}
```

### 2i. Causal Relation Detection Between Events

Detects and classifies causal relationships between events: what causes what and why. Powers the Causality Graph visualization.

**Invocation**: Non-streaming, `temperature: 0.0`, `max_tokens: 4096`

```
SYSTEM PROMPT (causal_relation_detection v1.0):
```

```text
You are StoryForge's causal relation detection engine. Your task is to identify
cause-and-effect relationships between narrative events.

CAUSALITY TYPES:
1. PHYSICAL — Direct physical cause. Event A physically causes Event B.
   Example: "The bridge collapsed" causes "The army could not cross."
2. MOTIVATIONAL — A character's goal or desire drives an action.
   Example: "She wanted revenge" causes "She tracked down the killer."
3. PSYCHOLOGICAL — A character's emotional/mental state leads to behavior.
   Example: "His grief overwhelmed him" causes "He withdrew from his friends."
4. ENABLING — Event A does not directly cause B but makes B possible.
   Example: "She found the key" enables "She opened the vault."
5. PREVENTING — Event A prevents Event B from occurring.
   Example: "The storm grounded all flights" prevents "Their escape by plane."
6. COMPELLING — External forces leave no choice.
   Example: "The king's decree" compels "The knight's departure."

RULES:
- Focus on NARRATIVELY SIGNIFICANT causal chains, not trivial physical causation
  (e.g., do not tag "he walked to the door" as causing "he opened the door").
- A single event can be both a cause and an effect (causal chains).
- Identify ROOT CAUSES: trace chains back to their origin event when possible.
- Identify CONVERGENT CAUSES: multiple events that together cause an outcome.
- Flag BROKEN CHAINS: events that appear to be effects but have no established cause
  in the story (potential deus ex machina or plot hole).
- Flag ORPHAN CAUSES: events set up as causally significant that never produce an
  effect (potential dangling plot thread).
- Rate STRENGTH (1-5): 1 = weak/circumstantial, 5 = direct and undeniable.

Respond with ONLY valid JSON. No commentary outside JSON.
```

```
USER PROMPT:
```

```text
Detect causal relationships between the following events.

WORLD: {{world.title}}
SYNOPSIS: {{world.synopsis}}

EVENTS (in narrative order):
{{#each events}}
{{@index}}. [{{this.type}}] "{{this.summary}}"
   - Scene: "{{this.sceneName}}"
   - Characters: {{this.participants | join(", ")}}
   - Location: {{this.location}}
   - Time: {{this.timePosition | default("unspecified")}}
{{/each}}

SCENE CONTEXT (for evidence):
{{#each scenes}}
### "{{this.title}}"
{{this.content | truncate(1500)}}
{{/each}}

Respond with JSON matching this schema:
{
  "causalRelations": [
    {
      "causeEventIndex": 0,
      "causeEventSummary": "string",
      "effectEventIndex": 0,
      "effectEventSummary": "string",
      "causalityType": "physical | motivational | psychological | enabling | preventing | compelling",
      "strength": 1-5,
      "description": "string — how A causes/enables/prevents B",
      "evidence": "string — textual evidence supporting this causal link",
      "isExplicit": true | false
    }
  ],
  "causalChains": [
    {
      "chainName": "string — descriptive name for this causal thread",
      "eventIndices": [0, 1, 2],
      "summary": "string — narrative summary of the chain"
    }
  ],
  "brokenChains": [
    {
      "effectEventIndex": 0,
      "effectEventSummary": "string",
      "issue": "string — why the cause is missing or unclear",
      "severity": "minor | moderate | major",
      "suggestion": "string — how to establish causation"
    }
  ],
  "orphanCauses": [
    {
      "causeEventIndex": 0,
      "causeEventSummary": "string",
      "issue": "string — this event sets up something that never pays off",
      "suggestion": "string"
    }
  ]
}
```

### 2j. Theme and Motif Detection

Identifies recurring themes and motifs across the narrative, tracking their appearances and evolution.

**Invocation**: Non-streaming, `temperature: 0.1` (slight creativity for thematic interpretation), `max_tokens: 4096`

```
SYSTEM PROMPT (theme_motif_detection v1.0):
```

```text
You are StoryForge's theme and motif detection engine. Your task is to identify
the abstract themes and recurring motifs in narrative text.

DEFINITIONS:
- THEME: An abstract idea or question the narrative explores. Themes are expressed
  as thematic statements or oppositions, not single words. Bad: "love." Good:
  "the cost of unconditional love" or "love vs. duty."
- MOTIF: A recurring concrete element — image, symbol, phrase, object, color,
  sound, action — that carries thematic weight through repetition. A motif is not
  a theme itself but POINTS TO a theme.
- THEMATIC OPPOSITION: A pair of values in tension that the narrative explores
  without necessarily resolving. Corresponds to Barthes' symbolic code.

RULES:
- Extract themes as OPPOSITION PAIRS or THEMATIC QUESTIONS, not single words.
- For each theme, identify HOW the narrative explores it: through which characters,
  events, dialogue, imagery?
- For motifs, track EVERY appearance with exact quotes. A motif must appear at least
  twice to qualify.
- Link motifs to the themes they reinforce.
- Rate theme PROMINENCE (1-5): 1 = minor undercurrent, 5 = central to the story.
- Note THEMATIC EVOLUTION: does the narrative's position on a theme shift over time?
- Do not over-read. Only extract themes with clear textual support.

Respond with ONLY valid JSON. No commentary outside JSON.
```

```
USER PROMPT:
```

```text
Identify themes and motifs in the following narrative material.

WORLD: {{world.title}}
SYNOPSIS: {{world.synopsis}}
GENRE: {{world.genre | default("not specified")}}
EXISTING THEMES (previously detected): {{existingThemes | join("; ") | default("none yet")}}
EXISTING MOTIFS (previously detected): {{existingMotifs | join("; ") | default("none yet")}}

NARRATIVE TEXT:
{{#each passages}}
### {{this.sectionTitle}} ({{this.source}})
---
{{this.text}}
---

{{/each}}

Respond with JSON matching this schema:
{
  "themes": [
    {
      "name": "string — thematic opposition or question, e.g., 'freedom vs. security'",
      "statement": "string — the thematic argument the narrative seems to make",
      "prominence": 1-5,
      "opposition": {
        "poleA": "string",
        "poleB": "string"
      },
      "exploredThrough": [
        {
          "vehicle": "character | event | dialogue | imagery | structure",
          "entityName": "string — which character, event, etc.",
          "how": "string — how this entity explores the theme",
          "evidence": "string — supporting quote"
        }
      ],
      "evolution": "string | null — how the narrative's stance on this theme shifts"
    }
  ],
  "motifs": [
    {
      "name": "string — the recurring element",
      "type": "image | symbol | phrase | object | color | sound | action | name",
      "appearances": [
        {
          "location": "string — section/scene where it appears",
          "quote": "string — exact text",
          "context": "string — what is happening when it appears"
        }
      ],
      "linkedThemes": ["string — theme names this motif reinforces"],
      "interpretation": "string — what this motif seems to signify",
      "frequency": 0
    }
  ],
  "thematicWeb": [
    {
      "themeA": "string",
      "themeB": "string",
      "relationship": "reinforcing | contrasting | parallel | subverting",
      "explanation": "string"
    }
  ]
}
```

---

## 3. Generation Operations (AI Wand)

Generation operations are user-initiated, opt-in, and always presented as suggestions. They use streaming invocation with `temperature: 0.7` for creative output. The AI Wand is disabled until the world's synopsis is filled (matches Othelia behavior).

All generation prompts include the world synopsis, relevant character profiles, and surrounding narrative context to maximize quality. More existing content in the world means better generation.

### 3a. Beat Description Generation

Generates a beat title and description for a scene card. Returns 3 suggestions for the user to choose from.

**Invocation**: Streaming, `temperature: 0.7`, `max_tokens: 2048`

```
SYSTEM PROMPT (beat_generation v1.2):
```

```text
You are a creative writing assistant for StoryForge. Your task is to generate beat
descriptions — short, vivid descriptions of story moments that will appear on
beat cards in a scene board.

A BEAT is the smallest unit of story action: a single action, reaction, decision,
revelation, or emotional shift. Think of it as one "move" in the scene.

STYLE GUIDELINES:
- Beat TITLES should be 3-8 words: evocative, specific, active. Use strong verbs.
  Good: "Elena Confronts the Forger." Bad: "A Conversation Happens."
- Beat DESCRIPTIONS should be 2-4 sentences: what happens, who is involved, what
  changes. Write in present tense. Be specific to this story's characters and world.
- Match the TONE of the story world. A noir thriller should sound different from a
  fantasy epic or a romantic comedy.
- Respect established CHARACTER VOICES and RELATIONSHIPS. Do not contradict known
  story facts.
- Generate exactly 3 distinct suggestions that take different creative directions
  while all fitting the narrative context.
- If a specific beat type is requested (action, dialogue, revelation, etc.), ensure
  all 3 suggestions match that type.
- Consider what came BEFORE (previous beats) and what comes AFTER (scene goals)
  to ensure continuity.

You are generating SUGGESTIONS, not final text. The writer will choose, edit, or
dismiss. Keep the creative authority with the human.
```

```
USER PROMPT:
```

```text
Generate 3 beat card suggestions for the following context.

STORY WORLD: {{world.title}}
SYNOPSIS: {{world.synopsis}}
GENRE: {{world.genre | default("not specified")}}
TONE: {{tone | default("match the synopsis")}}

SCENE CONTEXT:
- Scene: "{{scene.title}}"
- Scene goal: {{scene.goal | default("not specified")}}
- Scene conflict: {{scene.conflict | default("not specified")}}
- Location: {{scene.location | default("not specified")}}
- Characters present: {{scene.characters | join(", ")}}

PRECEDING BEATS IN THIS SCENE:
{{#each precedingBeats}}
{{@index}}. [{{this.type}}] "{{this.title}}" — {{this.description}}
{{/each}}
{{#unless precedingBeats}}(This is the first beat in the scene.){{/unless}}

FOLLOWING SCENE (if known):
{{nextScene.title | default("not specified")}} — {{nextScene.description | default("")}}

{{#if beatType}}REQUESTED BEAT TYPE: {{beatType}}{{/if}}
{{#if userPrompt}}ADDITIONAL DIRECTION FROM WRITER: {{userPrompt}}{{/if}}
{{#if length}}TARGET LENGTH: {{length}}{{/if}}

CHARACTER PROFILES:
{{#each involvedCharacters}}
- {{this.name}}: {{this.description}}
  Voice: {{this.voiceSummary | default("not analyzed yet")}}
  Current emotional state: {{this.currentEmotion | default("not tracked")}}
{{/each}}

Generate 3 beat suggestions as JSON:
{
  "suggestions": [
    {
      "title": "string — 3-8 word evocative title",
      "description": "string — 2-4 sentence beat description in present tense",
      "dialogueText": "string | null — key dialogue line if this is a dialogue beat",
      "actionText": "string | null — key action if this is an action beat",
      "emotionalTone": "string — the dominant emotional quality"
    }
  ]
}
```

### 3b. Script Section Generation

Generates formatted script text (Fountain screenplay format or prose) for a scene based on its beat descriptions and world context.

**Invocation**: Streaming, `temperature: 0.7`, `max_tokens: 4096`

```
SYSTEM PROMPT (script_generation v1.1):
```

```text
You are a creative writing assistant for StoryForge. Your task is to generate
draft script text for a scene based on its beat descriptions and world context.

OUTPUT FORMATS:
- "fountain": Standard Fountain screenplay format. Use proper sluglines (INT./EXT.),
  action lines, CHARACTER names in caps before dialogue, parentheticals for tone.
- "prose": Novel-style narrative prose. Third person unless the world specifies
  otherwise. Include dialogue in quotation marks, action, description, and
  interiority.
- "outline": Expanded outline — more detailed than beats but not fully written.
  Numbered paragraphs describing what happens.

GUIDELINES:
- Follow the beats IN ORDER. Each beat should be clearly represented in the output.
- Give each character a DISTINCT VOICE based on their profile. Do not make everyone
  sound the same.
- Match the TONE and GENRE of the story world.
- Include sensory details and setting when entering a new location.
- For screenplay format, follow standard formatting conventions strictly.
- Do not exceed the requested word count.
- Do not add plot points or reveals not present in the beats. You are SCRIPTING
  existing story decisions, not making new ones.
- This is a DRAFT for the writer to revise. Prioritize capturing the story beats
  accurately over polished prose.

You are generating a SUGGESTION. The writer will edit, revise, or discard.
```

```
USER PROMPT:
```

```text
Generate a {{format}} draft for the following scene.

STORY WORLD: {{world.title}}
SYNOPSIS: {{world.synopsis}}
GENRE: {{world.genre | default("not specified")}}

SCENE: "{{scene.title}}"
- Location: {{scene.location}}
- Time: {{scene.time | default("not specified")}}
- Goal: {{scene.goal | default("not specified")}}
- Conflict: {{scene.conflict | default("not specified")}}
- Outcome: {{scene.outcome | default("not specified")}}

CHARACTERS IN SCENE:
{{#each characters}}
- {{this.name}}: {{this.description}}
  Voice traits: {{this.voiceTraits | join(", ") | default("not analyzed")}}
  Current emotional state: {{this.currentEmotion | default("not specified")}}
  Relationship to others in scene: {{this.relationshipsInScene | default("not mapped")}}
{{/each}}

BEATS TO SCRIPT (in order):
{{#each beats}}
{{@index}}. [{{this.type}}] "{{this.title}}"
   {{this.description}}
   {{#if this.dialogueText}}Key dialogue: "{{this.dialogueText}}"{{/if}}
   {{#if this.actionText}}Key action: {{this.actionText}}{{/if}}
{{/each}}

PRECEDING SCENE ENDING (for continuity):
{{previousSceneEnding | default("N/A — this is the first scene.")}}

{{#if styleNotes}}STYLE NOTES FROM WRITER: {{styleNotes}}{{/if}}

TARGET WORD COUNT: {{maxWords | default(1000)}}

Generate the {{format}} script section now. Output ONLY the script text, no JSON
wrapper or commentary.
```

### 3c. Synopsis Expansion

Expands a short logline or synopsis into a fuller narrative description, optionally suggesting scene breakdowns.

**Invocation**: Streaming, `temperature: 0.7`, `max_tokens: 4096`

```
SYSTEM PROMPT (synopsis_expansion v1.0):
```

```text
You are a creative writing assistant for StoryForge. Your task is to expand a
short synopsis or logline into a fuller narrative description.

EXPANSION LEVELS:
- "paragraph": Expand to a solid 1-paragraph synopsis (100-200 words).
- "page": Expand to a one-page synopsis (400-600 words) with beginning, middle, end.
- "detailed": Expand to a detailed multi-page treatment (800-1500 words) with
  suggested scene/beat breakdowns.

GUIDELINES:
- Preserve EVERY story element mentioned in the original synopsis. Do not cut
  anything.
- Expand by adding: emotional stakes, character motivations, world details, key
  turning points, thematic resonance.
- Use the character and location profiles from the world context to enrich the
  expansion with specific, consistent details.
- Maintain the GENRE TONE of the story world.
- For "detailed" level, suggest a scene breakdown at the end — but mark it clearly
  as suggestion, not prescription.
- Do NOT introduce major new characters or plot threads not implied by the original
  synopsis. You can add minor connective tissue.
- Write in present tense, third person.
- This is a SUGGESTION for the writer to revise. Keep creative authority with
  the human.
```

```
USER PROMPT:
```

```text
Expand the following synopsis to "{{targetLength}}" level.

STORY WORLD: {{world.title}}
GENRE: {{world.genre | default("not specified")}}

ORIGINAL SYNOPSIS:
{{synopsis}}

WORLD CONTEXT:
{{#if characters.length}}
Characters:
{{#each characters}}
- {{this.name}}: {{this.description}}
{{/each}}
{{/if}}

{{#if locations.length}}
Locations:
{{#each locations}}
- {{this.name}}: {{this.description}}
{{/each}}
{{/if}}

{{#if events.length}}
Known events:
{{#each events}}
- {{this.summary}}
{{/each}}
{{/if}}

{{#if tone}}TONE DIRECTION: {{tone}}{{/if}}

Generate the expanded synopsis now. Output ONLY the expanded text.
{{#if targetLength === "detailed"}}
After the expanded synopsis, add a section titled "SUGGESTED SCENE BREAKDOWN:"
with numbered scene suggestions.
{{/if}}
```

### 3d. Treatment Generation

Generates a complete treatment document from the beat sheet, assembling beats into a coherent narrative outline.

**Invocation**: Streaming, `temperature: 0.5` (less creative, more structural), `max_tokens: 8192`

```
SYSTEM PROMPT (treatment_generation v1.0):
```

```text
You are a creative writing assistant for StoryForge. Your task is to generate a
treatment document — a prose narrative outline — from a story's beat sheet.

TREATMENT FORMAT:
- A treatment reads like a short story written in present tense, third person.
- It covers the ENTIRE story from beginning to end.
- Every beat should be represented, but the treatment should flow as continuous
  prose, not a numbered list.
- Include key dialogue moments as paraphrased speech or brief direct quotes.
- Include emotional beats and character reactions, not just plot events.
- Organize by acts/sequences if the story has structural divisions.
- Use section headers for major structural divisions (Act 1, Act 2, etc. or
  episode titles).

GUIDELINES:
- Follow the beat order EXACTLY. Do not reorder or skip beats.
- Connect beats with transitional prose that maintains narrative flow.
- Match the TONE and GENRE of the story world.
- A treatment is typically 5-15 pages for a feature film, 2-5 pages per episode
  for TV. Scale to the number of beats provided.
- This is a working document for the writer. Clarity and accuracy matter more
  than literary polish.
```

```
USER PROMPT:
```

```text
Generate a treatment document from the following beat sheet.

STORY WORLD: {{world.title}}
SYNOPSIS: {{world.synopsis}}
GENRE: {{world.genre | default("not specified")}}
FORMAT: {{world.format | default("feature film")}}

{{#if structureTemplate}}
STRUCTURE: {{structureTemplate.name}}
{{/if}}

CHARACTERS:
{{#each characters}}
- {{this.name}}: {{this.description}}
{{/each}}

BEAT SHEET (in order):
{{#each beats}}
### {{#if this.actLabel}}{{this.actLabel}} — {{/if}}Beat {{@index}}: "{{this.title}}"
- Type: {{this.type}}
- Scene: "{{this.sceneName}}"
- Characters: {{this.characters | join(", ")}}
- Location: {{this.location | default("not specified")}}
- Description: {{this.description}}
- Star rating: {{this.starRating}}/5
{{#if this.structureBeatName}}- Structure position: {{this.structureBeatName}} ({{this.structureBeatPosition}}%){{/if}}
{{#if this.notes}}- Writer notes: {{this.notes}}{{/if}}

{{/each}}

Generate the treatment as continuous prose. Use section headers for acts or major
structural divisions. Output ONLY the treatment text.
```

---

## 4. Context Assembly Strategy

Context assembly is the process of constructing what goes into the system prompt and user prompt for each Claude API call. StoryForge must carefully manage token budgets because story worlds can be very large (thousands of characters, events, locations).

### 4.1 System Prompt vs User Prompt Division

| Content | Placement | Rationale |
|---|---|---|
| Operation-specific instructions, rules, output schema | **System prompt** | Stable across invocations. Defines the "role" and constraints. |
| World context (synopsis, genre, character profiles) | **User prompt** | Varies per world and per invocation scope. |
| The text being analyzed or generated from | **User prompt** | Changes every call. |
| Known entities (existing characters, locations, etc.) | **User prompt** | Prevents re-extraction and helps with entity resolution. |
| Prompt version identifier | **System prompt** (appended) | For tracking and debugging. |

### 4.2 Token Budget Strategy

The token budget is the maximum context window size minus a reserved output buffer.

```typescript
// src/lib/ai/context-budget.ts

interface TokenBudget {
  modelMaxTokens: number;     // e.g., 200000 for Claude Sonnet
  reservedOutput: number;     // tokens reserved for the response
  systemPrompt: number;       // fixed cost of the system prompt
  availableForContext: number; // what remains for user prompt content
}

const MODEL_LIMITS: Record<string, number> = {
  "claude-sonnet-4-20250514": 200000,
  "claude-haiku-4-20250514": 200000,
  "claude-opus-4-20250514": 200000,
};

/**
 * Calculate the available token budget for user prompt context.
 */
function calculateBudget(
  model: string,
  systemPromptTokens: number,
  maxOutputTokens: number
): TokenBudget {
  const modelMax = MODEL_LIMITS[model] ?? 200000;
  return {
    modelMaxTokens: modelMax,
    reservedOutput: maxOutputTokens,
    systemPrompt: systemPromptTokens,
    availableForContext: modelMax - systemPromptTokens - maxOutputTokens,
  };
}
```

### 4.3 Context Priority Tiers

When assembling the user prompt, content is included in priority order until the budget is exhausted:

| Priority | Content | Token Estimate | Included For |
|---|---|---|---|
| **P0 (always)** | World title + synopsis | ~200 | All operations |
| **P0 (always)** | The text chunk being analyzed / beats being generated from | Varies | All operations |
| **P1 (high)** | Directly involved character profiles | ~100 per character | All operations |
| **P1 (high)** | Scene/beat context (preceding + following) | ~500 | Generation, pacing, value change |
| **P2 (medium)** | Known entity lists (deduplication context) | ~50 per entity | Entity extraction, relationship mapping |
| **P2 (medium)** | Relevant relationships between involved characters | ~200 | Generation, consistency, voice |
| **P3 (low)** | World rules | ~300 | Consistency checking |
| **P3 (low)** | Existing themes/motifs | ~200 | Theme detection, narrative codes |
| **P4 (background)** | Genre/structure template context | ~400 | Pacing, value change |
| **P4 (background)** | Open enigma tracker state | ~300 | Narrative code tagging |

```typescript
// src/lib/ai/context-assembler.ts

interface ContextPiece {
  priority: 0 | 1 | 2 | 3 | 4;
  key: string;
  content: string;
  estimatedTokens: number;
}

/**
 * Assemble context pieces within the token budget.
 * Higher priority pieces are always included first.
 * Within the same priority, pieces are included in declaration order.
 * If a piece does not fit, it is truncated or omitted.
 */
function assembleContext(
  pieces: ContextPiece[],
  budgetTokens: number
): { included: ContextPiece[]; excluded: ContextPiece[]; usedTokens: number } {
  const sorted = [...pieces].sort((a, b) => a.priority - b.priority);
  const included: ContextPiece[] = [];
  const excluded: ContextPiece[] = [];
  let usedTokens = 0;

  for (const piece of sorted) {
    if (usedTokens + piece.estimatedTokens <= budgetTokens) {
      included.push(piece);
      usedTokens += piece.estimatedTokens;
    } else {
      // Try truncation for P0-P1 content
      if (piece.priority <= 1) {
        const remainingBudget = budgetTokens - usedTokens;
        if (remainingBudget > 100) {
          const truncated = truncateToTokens(piece.content, remainingBudget);
          included.push({ ...piece, content: truncated, estimatedTokens: remainingBudget });
          usedTokens += remainingBudget;
        } else {
          excluded.push(piece);
        }
      } else {
        excluded.push(piece);
      }
    }
  }

  return { included, excluded, usedTokens };
}

function truncateToTokens(text: string, maxTokens: number): string {
  // Approximate: 1 token ≈ 4 characters for English text
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n\n[...truncated due to context budget]";
}
```

### 4.4 SuperMemory Integration for Relevant Context Retrieval

SuperMemory acts as a semantic memory layer over the story world. Instead of loading ALL world data into context (which would overflow for large worlds), we query SuperMemory for the most relevant context pieces.

```typescript
// src/lib/ai/supermemory-context.ts

import { SuperMemory } from "supermemory";

const memory = new SuperMemory({ apiKey: process.env.SUPERMEMORY_API_KEY! });

/**
 * Retrieve relevant context from SuperMemory for an AI operation.
 * Uses semantic search to find the most relevant world data for the
 * current operation, avoiding the need to load the entire world.
 */
async function retrieveRelevantContext(
  worldId: string,
  query: string,
  options: {
    maxResults?: number;
    filterByEntityType?: string[];
    filterByCharacterId?: string[];
    filterBySceneId?: string[];
  } = {}
): Promise<RelevantContext[]> {
  const containerTag = `storyforge_world_${worldId}`;

  const results = await memory.search({
    query,
    containerTags: [containerTag],
    limit: options.maxResults ?? 20,
    filters: buildFilters(options),
  });

  return results.results.map((r) => ({
    content: r.content,
    entityType: r.metadata?.entityType as string,
    entityId: r.metadata?.entityId as string,
    relevanceScore: r.score,
    source: r.metadata?.source as string,
  }));
}

interface RelevantContext {
  content: string;
  entityType: string;
  entityId: string;
  relevanceScore: number;
  source: string;
}

/**
 * For entity extraction: retrieve existing entities to avoid duplicates.
 * For consistency checking: retrieve all facts about involved entities.
 * For generation: retrieve character profiles, scene context, and world details.
 */
async function getContextForOperation(
  worldId: string,
  operation: string,
  operationContext: Record<string, unknown>
): Promise<RelevantContext[]> {
  switch (operation) {
    case "entity_extraction":
      // Retrieve existing entities for deduplication
      return retrieveRelevantContext(worldId, operationContext.chunkText as string, {
        maxResults: 30,
        filterByEntityType: ["character", "location", "object", "faction"],
      });

    case "consistency_check":
      // Retrieve all facts about the entities being checked
      return retrieveRelevantContext(
        worldId,
        (operationContext.entityNames as string[]).join(" "),
        { maxResults: 50 }
      );

    case "beat_generation":
    case "script_generation":
      // Retrieve relevant world context for generation
      return retrieveRelevantContext(
        worldId,
        `${operationContext.sceneTitle} ${operationContext.sceneGoal}`,
        {
          maxResults: 25,
          filterByCharacterId: operationContext.characterIds as string[],
        }
      );

    default:
      return retrieveRelevantContext(worldId, JSON.stringify(operationContext), {
        maxResults: 20,
      });
  }
}

function buildFilters(options: {
  filterByEntityType?: string[];
  filterByCharacterId?: string[];
  filterBySceneId?: string[];
}): Record<string, unknown> {
  const filters: Record<string, unknown> = {};
  if (options.filterByEntityType?.length) {
    filters["entityType"] = { $in: options.filterByEntityType };
  }
  if (options.filterByCharacterId?.length) {
    filters["characterId"] = { $in: options.filterByCharacterId };
  }
  if (options.filterBySceneId?.length) {
    filters["sceneId"] = { $in: options.filterBySceneId };
  }
  return filters;
}
```

### 4.5 Full Context Assembly Flow

```
1. Determine operation type and select system prompt template
2. Calculate token budget (model limit - system prompt - reserved output)
3. Query SuperMemory for relevant context (semantic retrieval)
4. Query PostgreSQL for structured data (entities, relationships, scenes)
5. Build context pieces with priority assignments
6. Assemble pieces within budget (priority order, truncation as needed)
7. Render final system prompt and user prompt from templates
8. Invoke Claude (streaming or non-streaming based on operation type)
```

---

## 5. Prompt Versioning and Testing Strategy

### 5.1 Prompt Storage and Versioning

All prompt templates are stored as versioned files in the codebase, not in the database. Each prompt has a semantic version and a changelog.

```
src/lib/ai/prompts/
├── analysis/
│   ├── entity-extraction.v2.1.ts
│   ├── relationship-mapping.v1.3.ts
│   ├── consistency-check.v1.4.ts
│   ├── pacing-analysis.v1.1.ts
│   ├── voice-analysis.v1.2.ts
│   ├── narrative-code-tagging.v1.0.ts
│   ├── scene-value-change.v1.0.ts
│   ├── emotional-state-extraction.v1.1.ts
│   ├── causal-relation-detection.v1.0.ts
│   └── theme-motif-detection.v1.0.ts
├── generation/
│   ├── beat-generation.v1.2.ts
│   ├── script-generation.v1.1.ts
│   ├── synopsis-expansion.v1.0.ts
│   └── treatment-generation.v1.0.ts
└── index.ts  # Version registry and loader
```

### 5.2 Version Format

```typescript
// src/lib/ai/prompts/analysis/entity-extraction.v2.1.ts

export const ENTITY_EXTRACTION_PROMPT = {
  version: "v2.1",
  operation: "entity_extraction" as const,
  changelog: [
    "v1.0 — Initial prompt",
    "v1.1 — Added confidence scoring",
    "v2.0 — Added faction extraction, restructured JSON schema",
    "v2.1 — Improved instructions for unnamed character handling",
  ],
  system: `...`,  // The system prompt text
  userTemplate: `...`,  // The user prompt template with {{variables}}
  expectedOutputSchema: { /* JSON Schema for validation */ },
  testCases: [
    {
      name: "basic_novel_chapter",
      input: { /* test fixture */ },
      assertions: [
        "output.characters.length >= 2",
        "output.characters.every(c => c.confidence >= 0 && c.confidence <= 1)",
      ],
    },
  ],
};
```

### 5.3 Testing Strategy

Prompt testing runs in three tiers:

**Tier 1: Schema Validation (runs on every CI build, no API calls)**
- Validate that the prompt's `expectedOutputSchema` is valid JSON Schema.
- Validate that test fixture inputs match the expected template variables.
- Validate that the system prompt and user template render without errors.

**Tier 2: Snapshot Testing (runs nightly, uses Claude API)**
- Execute each prompt's test cases against the live Claude API.
- Parse the response JSON and validate against the output schema.
- Run assertion functions on the output.
- Store results as snapshot files for regression detection.
- Flag any test case where assertions fail or output schema is violated.

**Tier 3: Quality Evaluation (runs weekly or on prompt version bump)**
- Run against a curated corpus of 10+ narrative texts spanning genres (literary fiction, thriller, fantasy, screenplay, TV script).
- Human reviewers score outputs on: accuracy, completeness, false positive rate, usefulness.
- Track scores over prompt versions to detect regressions.
- Maintain a "golden set" of expected outputs for key test cases.

```typescript
// tests/unit/ai/prompt-schema.test.ts

import { describe, it, expect } from "vitest";
import { ALL_PROMPTS } from "@/lib/ai/prompts";
import Ajv from "ajv";

const ajv = new Ajv();

describe("Prompt Schema Validation", () => {
  for (const prompt of ALL_PROMPTS) {
    describe(`${prompt.operation} ${prompt.version}`, () => {
      it("has a valid JSON output schema", () => {
        expect(ajv.validateSchema(prompt.expectedOutputSchema)).toBe(true);
      });

      it("system prompt is non-empty", () => {
        expect(prompt.system.length).toBeGreaterThan(100);
      });

      it("user template contains expected variables", () => {
        // Each operation has required template variables
        const required = REQUIRED_VARIABLES[prompt.operation];
        for (const variable of required) {
          expect(prompt.userTemplate).toContain(`{{${variable}}}`);
        }
      });

      it("has at least one test case", () => {
        expect(prompt.testCases.length).toBeGreaterThan(0);
      });
    });
  }
});
```

### 5.4 A/B Testing Support

When testing a new prompt version, both the old and new version can run simultaneously on a percentage of traffic. Results are logged with the prompt version, enabling comparison.

```typescript
// src/lib/ai/prompts/index.ts

interface PromptABConfig {
  operation: string;
  control: { version: string; weight: number };  // e.g., v1.3, 80%
  experiment: { version: string; weight: number }; // e.g., v1.4, 20%
}

const AB_TESTS: PromptABConfig[] = [
  // Example: testing a new entity extraction prompt
  // {
  //   operation: "entity_extraction",
  //   control: { version: "v2.0", weight: 0.8 },
  //   experiment: { version: "v2.1", weight: 0.2 },
  // },
];

/**
 * Select prompt version, respecting any active A/B tests.
 */
function selectPromptVersion(operation: string): string {
  const abTest = AB_TESTS.find((t) => t.operation === operation);
  if (!abTest) return getLatestVersion(operation);

  const roll = Math.random();
  return roll < abTest.control.weight
    ? abTest.control.version
    : abTest.experiment.version;
}
```

---

## 6. Cost Estimation

All cost estimates below use Claude Sonnet 4 pricing ($3/M input, $15/M output) as the default model. Actual costs vary based on text length, world complexity, and output verbosity.

### 6.1 Per-Operation Cost Estimates

| Operation | Avg Input Tokens | Avg Output Tokens | Est. Cost Per Call | Notes |
|---|---|---|---|---|
| **Entity extraction** (per chunk) | ~4,000 | ~1,500 | ~$0.035 | 3K text + 1K context |
| **Relationship mapping** (per chunk) | ~4,500 | ~1,200 | ~$0.032 | More context for known entities |
| **Consistency check** (full world) | ~15,000 | ~3,000 | ~$0.090 | Scales with world size |
| **Pacing analysis** (10 scenes) | ~12,000 | ~2,000 | ~$0.066 | Scene text is expensive |
| **Voice analysis** (1 character) | ~6,000 | ~1,500 | ~$0.041 | Depends on dialogue volume |
| **Narrative code tagging** (per chunk) | ~4,000 | ~2,000 | ~$0.042 | Dense output |
| **Scene value change** (5 scenes) | ~8,000 | ~1,500 | ~$0.047 | |
| **Emotional state extraction** (5 scenes) | ~8,000 | ~2,000 | ~$0.054 | |
| **Causal relation detection** (20 events) | ~6,000 | ~2,000 | ~$0.048 | |
| **Theme/motif detection** (5 passages) | ~8,000 | ~1,500 | ~$0.047 | |
| **Beat generation** | ~3,000 | ~800 | ~$0.021 | 3 suggestions |
| **Script generation** | ~4,000 | ~2,000 | ~$0.042 | Up to 1000 words |
| **Synopsis expansion** | ~2,000 | ~1,500 | ~$0.029 | |
| **Treatment generation** | ~6,000 | ~4,000 | ~$0.078 | Can be larger for long beat sheets |

### 6.2 Composite Operation Costs

#### Full Manuscript Ingestion (80,000-word novel)

A novel of ~80K words is approximately 100K tokens. With structure-aware chunking at 3K tokens per chunk with 500-token overlap, this produces approximately 40 chunks.

| Step | Calls | Cost Per Call | Total |
|---|---|---|---|
| Entity extraction | 40 chunks | $0.035 | $1.40 |
| Relationship mapping | 40 chunks | $0.032 | $1.28 |
| Entity resolution (merging) | 5 passes | $0.040 | $0.20 |
| Emotional state extraction | 40 chunks | $0.054 | $2.16 |
| Theme/motif detection | 10 passages | $0.047 | $0.47 |
| Causal relation detection | 5 passes | $0.048 | $0.24 |
| **Total manuscript ingestion** | | | **~$5.75** |

#### Full World Consistency Check (medium world: 50 characters, 200 events)

| Step | Calls | Cost Per Call | Total |
|---|---|---|---|
| Consistency check (batched) | 4 passes | $0.090 | $0.36 |
| Cross-reference validation | 2 passes | $0.060 | $0.12 |
| **Total consistency check** | | | **~$0.48** |

#### Full Pacing + Voice + Value Analysis (20-episode TV season)

| Step | Calls | Cost Per Call | Total |
|---|---|---|---|
| Pacing analysis | 20 episodes | $0.066 | $1.32 |
| Voice analysis | 15 characters | $0.041 | $0.62 |
| Scene value change | 20 episodes | $0.047 | $0.94 |
| Narrative code tagging | 80 chunks | $0.042 | $3.36 |
| **Total full analysis** | | | **~$6.24** |

#### AI Wand Generation Session (typical writing session)

| Operation | Calls | Cost Per Call | Total |
|---|---|---|---|
| Beat generation | 10 beats | $0.021 | $0.21 |
| Script generation | 3 scenes | $0.042 | $0.13 |
| Synopsis expansion | 1 | $0.029 | $0.03 |
| **Total session** | | | **~$0.37** |

### 6.3 Monthly Cost Projections

| User Profile | Operations/Month | Est. Monthly Cost |
|---|---|---|
| **Solo novelist** (1 world, occasional analysis) | 2 ingestions + 5 consistency checks + 20 wand uses | ~$15 |
| **Active screenwriter** (1-2 worlds, frequent wand use) | 1 ingestion + 10 consistency checks + 100 wand uses + 5 full analyses | ~$50 |
| **TV writers room** (1 world, heavy analysis) | 5 ingestions + 20 consistency checks + 500 wand uses + 20 full analyses | ~$200 |

### 6.4 Cost Optimization Strategies

1. **Model tiering**: Use Haiku ($0.25/$1.25 per M tokens) for simpler operations like entity extraction on clean text. Reserve Sonnet for consistency checking and generation.
2. **Caching**: Cache analysis results in PostgreSQL. Only re-analyze when source material changes. Entity extraction results are stable and rarely need re-running.
3. **Incremental analysis**: When a user edits a single scene, only re-run analysis on that scene and its immediate neighbors, not the entire world.
4. **Batch operations**: Group multiple chunks into a single larger API call where possible (staying within context limits) to reduce per-call overhead.
5. **Budget enforcement**: The token tracker (Section 1.4) enforces per-user monthly budgets. Default $50/month with configurable limits.

---

## Appendix A: Template Variable Reference

All prompt templates use Handlebars-style `{{variable}}` syntax. Variables are populated by the context assembler before invoking Claude.

| Variable | Type | Available In | Description |
|---|---|---|---|
| `world.title` | string | All | Story world name |
| `world.synopsis` | string | All | World synopsis (required for generation) |
| `world.genre` | string | All | Genre classification |
| `world.format` | string | Generation | "feature film", "TV series", "novel", etc. |
| `characters` | array | All | Character profiles with name, description, traits |
| `locations` | array | Most analysis | Location profiles |
| `events` | array | Causal, consistency | Event list with metadata |
| `scenes` | array | Pacing, value, emotion | Scene objects with content |
| `chunk.text` | string | Per-chunk analysis | The text being analyzed |
| `chunk.index` / `chunk.total` | number | Per-chunk analysis | Chunk position |
| `existingCharacters` | string[] | Entity extraction | Already-known character names |
| `existingLocations` | string[] | Entity extraction | Already-known location names |
| `themes` | string[] | Theme, narrative codes | Detected theme names |
| `openEnigmas` | array | Narrative codes | Unresolved hermeneutic enigmas |
| `structureTemplate` | object | Pacing, value change | Active story structure template |
| `scene.*` | object | Generation | Current scene details |
| `precedingBeats` | array | Beat generation | Beats before the insertion point |
| `beats` | array | Script/treatment gen | Beat list to script from |
| `characterDialogue` | array | Voice analysis | Dialogue lines grouped by character |
| `worldRules` | array | Consistency check | Established world rules/constraints |

## Appendix B: Error Handling

All AI operations use a standardized error response:

```typescript
interface AIOperationError {
  code: "RATE_LIMITED" | "BUDGET_EXCEEDED" | "CONTEXT_TOO_LARGE" | "PARSE_FAILED"
    | "API_ERROR" | "TIMEOUT" | "INVALID_INPUT";
  message: string;
  retryable: boolean;
  retryAfterMs?: number;
  details?: Record<string, unknown>;
}
```

| Error Code | Cause | Retry? | User-Facing Message |
|---|---|---|---|
| `RATE_LIMITED` | Too many requests per minute | Yes (after delay) | "Analysis queue is busy. Retrying shortly." |
| `BUDGET_EXCEEDED` | Monthly token budget exhausted | No | "Monthly AI budget reached. Resets on [date]." |
| `CONTEXT_TOO_LARGE` | World data exceeds context window even after truncation | No | "This world is too large for a single analysis pass. Try scoping to specific characters or scenes." |
| `PARSE_FAILED` | Claude returned non-JSON or schema-invalid output | Yes (1 retry) | "Analysis produced unexpected results. Retrying." |
| `API_ERROR` | Anthropic API returned an error | Depends on status | "AI service temporarily unavailable." |
| `TIMEOUT` | Request exceeded 120s timeout | Yes | "Analysis timed out. Retrying with a smaller scope." |
| `INVALID_INPUT` | Missing synopsis, empty text, invalid parameters | No | Specific validation message. |
