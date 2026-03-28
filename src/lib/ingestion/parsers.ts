import type { ParsedContent, ParsedSection } from './types'

/**
 * Parse plain text content into structured sections.
 * Detects chapter/section breaks by common patterns.
 */
export function parseText(text: string, filename?: string): ParsedContent {
  const lines = text.split('\n')
  const sections: ParsedSection[] = []
  let currentSection: ParsedSection = {
    content: '',
    position: 0,
    type: 'body',
  }
  let sectionIndex = 0

  const chapterPattern = /^(chapter|part|section|act)\s+\d+/i
  const headerPattern = /^#{1,6}\s+/
  const dividerPattern = /^[\s]*[*\-_]{3,}[\s]*$/

  for (const line of lines) {
    const trimmed = line.trim()

    if (chapterPattern.test(trimmed) || headerPattern.test(trimmed)) {
      if (currentSection.content.trim()) {
        sections.push({ ...currentSection })
      }
      sectionIndex++
      const heading = trimmed.replace(/^#{1,6}\s+/, '')
      const type = detectSectionType(heading)
      currentSection = {
        heading,
        content: '',
        position: sectionIndex,
        type,
      }
    } else if (dividerPattern.test(trimmed) && currentSection.content.trim()) {
      sections.push({ ...currentSection })
      sectionIndex++
      currentSection = {
        content: '',
        position: sectionIndex,
        type: 'section',
      }
    } else {
      currentSection.content += line + '\n'
    }
  }

  if (currentSection.content.trim()) {
    sections.push(currentSection)
  }

  if (sections.length === 0) {
    sections.push({
      content: text,
      position: 0,
      type: 'body',
    })
  }

  return {
    text,
    title: filename?.replace(/\.[^/.]+$/, ''),
    sections,
    metadata: {},
  }
}

/**
 * Parse Markdown content with header-based section detection.
 */
export function parseMarkdown(markdown: string, filename?: string): ParsedContent {
  const lines = markdown.split('\n')
  const sections: ParsedSection[] = []
  let currentSection: ParsedSection = {
    content: '',
    position: 0,
    type: 'body',
  }
  let sectionIndex = 0
  let title: string | undefined

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,6})\s+(.+)/)

    if (headerMatch) {
      if (currentSection.content.trim()) {
        sections.push({ ...currentSection })
      }

      const level = headerMatch[1].length
      const heading = headerMatch[2].trim()

      if (level === 1 && !title) {
        title = heading
      }

      sectionIndex++
      currentSection = {
        heading,
        content: '',
        position: sectionIndex,
        type: level <= 2 ? 'chapter' : 'section',
      }
    } else {
      currentSection.content += line + '\n'
    }
  }

  if (currentSection.content.trim()) {
    sections.push(currentSection)
  }

  if (sections.length === 0) {
    sections.push({
      content: markdown,
      position: 0,
      type: 'body',
    })
  }

  return {
    text: markdown,
    title: title ?? filename?.replace(/\.[^/.]+$/, ''),
    sections,
    metadata: { format: 'markdown' },
  }
}

/**
 * Parse Fountain screenplay format.
 * Recognizes title page, scene headings, and basic Fountain syntax.
 */
export function parseFountain(fountain: string, filename?: string): ParsedContent {
  const lines = fountain.split('\n')
  const sections: ParsedSection[] = []
  const metadata: Record<string, string> = {}
  let title: string | undefined
  let currentSection: ParsedSection = {
    content: '',
    position: 0,
    type: 'body',
  }
  let sectionIndex = 0
  let inTitlePage = true

  const sceneHeadingPattern = /^(INT\.|EXT\.|INT\.\/EXT\.|I\/E\.)\s+/i
  const forcedScenePattern = /^\.\S/
  const pageSeparator = /^===+$/

  for (const line of lines) {
    const trimmed = line.trim()

    // Title page processing
    if (inTitlePage) {
      if (pageSeparator.test(trimmed)) {
        inTitlePage = false
        continue
      }
      const metaMatch = trimmed.match(/^(\w+):\s*(.+)/)
      if (metaMatch) {
        const key = metaMatch[1].toLowerCase()
        const value = metaMatch[2]
        metadata[key] = value
        if (key === 'title') {
          title = value
        }
        continue
      }
      if (trimmed === '' && Object.keys(metadata).length === 0) {
        continue
      }
      if (Object.keys(metadata).length > 0 && trimmed === '') {
        continue
      }
      inTitlePage = false
    }

    // Scene heading detection
    if (sceneHeadingPattern.test(trimmed) || forcedScenePattern.test(trimmed)) {
      if (currentSection.content.trim()) {
        sections.push({ ...currentSection })
      }
      sectionIndex++
      const heading = forcedScenePattern.test(trimmed) ? trimmed.slice(1) : trimmed
      currentSection = {
        heading,
        content: '',
        position: sectionIndex,
        type: 'scene',
      }
    } else {
      currentSection.content += line + '\n'
    }
  }

  if (currentSection.content.trim()) {
    sections.push(currentSection)
  }

  if (sections.length === 0) {
    sections.push({
      content: fountain,
      position: 0,
      type: 'body',
    })
  }

  return {
    text: fountain,
    title: title ?? filename?.replace(/\.[^/.]+$/, ''),
    sections,
    metadata: { ...metadata, format: 'fountain' },
  }
}

function detectSectionType(heading: string): ParsedSection['type'] {
  const lower = heading.toLowerCase()
  if (/^(chapter|part)\b/i.test(lower)) return 'chapter'
  if (/^act\b/i.test(lower)) return 'act'
  if (/^scene\b/i.test(lower)) return 'scene'
  return 'section'
}
