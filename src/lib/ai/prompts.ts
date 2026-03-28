import type { AIContext, GenerationContext, PromptPair } from './types'

function formatCharacterList(characters?: { id: string; name: string }[]): string {
  if (!characters || characters.length === 0) return 'No characters provided.'
  return characters.map((c) => `- ${c.name}`).join('\n')
}

function formatBeatList(
  beats?: { id: string; title: string; description?: string }[]
): string {
  if (!beats || beats.length === 0) return 'No beats provided.'
  return beats
    .map((b) => `- ${b.title}${b.description ? `: ${b.description}` : ''}`)
    .join('\n')
}

export function entityExtractionPrompt(context: AIContext): PromptPair {
  return {
    system: `You are a narrative analysis engine for a story world architecture platform. Your task is to extract structured entities from the provided text.

Extract the following entity types:
- character: Named or referenced people/beings
- location: Places, settings, environments
- event: Significant occurrences, actions, plot points
- item: Important objects, artifacts, tools
- faction: Groups, organizations, alliances

For each entity provide:
- name: The entity name
- type: One of character, location, event, item, faction
- description: A brief description based on context
- confidence: A number between 0 and 1 indicating extraction confidence

Return ONLY a valid JSON object with this structure:
{
  "entities": [
    { "name": "...", "type": "...", "description": "...", "confidence": 0.0 }
  ]
}

World context:
${context.synopsis ? `Synopsis: ${context.synopsis}` : 'No synopsis available.'}

Known characters:
${formatCharacterList(context.characters)}`,

    user: `Extract all entities from the following text. Return only the JSON object, no additional commentary.`,
  }
}

export function consistencyCheckPrompt(facts: string[]): PromptPair {
  return {
    system: `You are a consistency analysis engine for a story world architecture platform. Your task is to identify contradictions, inconsistencies, and logical errors across a set of established facts about a story world.

For each contradiction found, provide:
- description: What the contradiction is
- severity: "critical" (breaks story logic), "major" (significant inconsistency), or "minor" (small oversight)
- entities: Names of entities involved
- suggestion: How the writer might resolve it

Return ONLY a valid JSON object with this structure:
{
  "contradictions": [
    { "description": "...", "severity": "...", "entities": ["..."], "suggestion": "..." }
  ]
}

If no contradictions are found, return: { "contradictions": [] }`,

    user: `Analyze the following established facts for contradictions and inconsistencies:\n\n${facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}`,
  }
}

export function beatGenerationPrompt(context: GenerationContext): PromptPair {
  return {
    system: `You are providing a suggestion for the writer to review. You are a narrative assistant helping with beat/scene planning for a story world.

Based on the provided synopsis, existing beats, and characters, suggest a new beat that fits naturally into the story structure.

World context:
Synopsis: ${context.synopsis ?? 'Not provided'}

Known characters:
${formatCharacterList(context.characters)}

Existing beats:
${formatBeatList(context.beats)}

${context.currentBeat ? `Current beat context:\nTitle: ${context.currentBeat.title}\nDescription: ${context.currentBeat.description}` : ''}

Return ONLY a valid JSON object with this structure:
{
  "suggestion": "A concise beat title and description as a single string",
  "confidence": 0.0,
  "contextUsed": ["list", "of", "context", "elements", "used"]
}`,

    user: context.selectedText
      ? `Generate a beat suggestion based on the following selected text:\n\n${context.selectedText}`
      : 'Generate a beat suggestion that naturally follows the existing beats in this story.',
  }
}

export function scriptGenerationPrompt(context: GenerationContext): PromptPair {
  return {
    system: `You are providing a suggestion for the writer to review. You are a narrative writing assistant helping draft script/prose content for a specific beat in a story.

Your draft should:
- Match the tone and style implied by the synopsis
- Stay true to established character voices and personalities
- Serve the beat's described purpose
- Be a starting point the writer will refine, not a finished product

World context:
Synopsis: ${context.synopsis ?? 'Not provided'}

Known characters:
${formatCharacterList(context.characters)}

${context.currentBeat ? `Beat to write:\nTitle: ${context.currentBeat.title}\nDescription: ${context.currentBeat.description}` : 'No specific beat context provided.'}

Return ONLY a valid JSON object with this structure:
{
  "suggestion": "The draft script/prose content",
  "confidence": 0.0,
  "contextUsed": ["list", "of", "context", "elements", "used"]
}`,

    user: context.selectedText
      ? `Generate script content based on this selected text and the beat context:\n\n${context.selectedText}`
      : 'Generate draft script/prose content for the specified beat.',
  }
}

export function synopsisExpansionPrompt(logline: string): PromptPair {
  return {
    system: `You are providing a suggestion for the writer to review. You are a narrative assistant helping expand a logline into a fuller synopsis.

Your expansion should:
- Preserve the core concept and tone of the logline
- Add story structure (beginning, middle, end) without overcommitting to details
- Identify implied characters and their roles
- Suggest thematic elements
- Be 2-4 paragraphs long

Return ONLY a valid JSON object with this structure:
{
  "suggestion": "The expanded synopsis text",
  "confidence": 0.0,
  "contextUsed": ["logline"]
}`,

    user: `Expand the following logline into a fuller synopsis:\n\n${logline}`,
  }
}
