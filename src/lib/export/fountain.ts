import type { ExportableContent, ExportResult } from './types'

/**
 * Export content in Fountain screenplay format.
 * Fountain is a plain-text markup language for screenwriting.
 * See: https://fountain.io/syntax
 */
export function exportFountain(content: ExportableContent): ExportResult {
  const lines: string[] = []

  // Title page metadata
  lines.push(`Title: ${content.title}`)
  if (content.metadata?.author) {
    lines.push(`Author: ${content.metadata.author}`)
  }
  if (content.metadata?.date) {
    lines.push(`Date: ${content.metadata.date}`)
  }
  if (content.metadata?.genre) {
    lines.push(`Genre: ${content.metadata.genre}`)
  }
  if (content.metadata?.logline) {
    lines.push(`Notes: ${content.metadata.logline}`)
  }
  lines.push('')
  lines.push('===')
  lines.push('')

  for (const section of content.sections) {
    // Act headers use Fountain's section syntax
    if (section.level === 1) {
      lines.push(`# ${section.title}`)
      lines.push('')
    } else if (section.level === 2) {
      lines.push(`## ${section.title}`)
      lines.push('')
    } else {
      lines.push(`### ${section.title}`)
      lines.push('')
    }

    if (section.content) {
      lines.push(section.content)
      lines.push('')
    }
  }

  const output = lines.join('\n')
  const safeTitle = content.title.replace(/[^a-zA-Z0-9_-]/g, '_')

  return {
    content: output,
    filename: `${safeTitle}.fountain`,
    mimeType: 'text/plain',
    format: 'fountain',
  }
}
