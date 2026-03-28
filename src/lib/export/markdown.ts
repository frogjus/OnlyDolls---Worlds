import type { ExportableContent, ExportResult } from './types'

/**
 * Export content as Markdown.
 */
export function exportMarkdown(content: ExportableContent): ExportResult {
  const lines: string[] = []

  // Title
  lines.push(`# ${content.title}`)
  lines.push('')

  // Metadata block
  if (content.metadata) {
    if (content.metadata.author) {
      lines.push(`**Author:** ${content.metadata.author}`)
    }
    if (content.metadata.date) {
      lines.push(`**Date:** ${content.metadata.date}`)
    }
    if (content.metadata.genre) {
      lines.push(`**Genre:** ${content.metadata.genre}`)
    }
    if (content.metadata.logline) {
      lines.push('')
      lines.push(`> ${content.metadata.logline}`)
    }
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  // Sections
  for (const section of content.sections) {
    const headerPrefix = '#'.repeat(Math.min(section.level + 1, 6))
    lines.push(`${headerPrefix} ${section.title}`)
    lines.push('')

    if (section.content) {
      lines.push(section.content)
      lines.push('')
    }
  }

  const output = lines.join('\n')
  const safeTitle = content.title.replace(/[^a-zA-Z0-9_-]/g, '_')

  return {
    content: output,
    filename: `${safeTitle}.md`,
    mimeType: 'text/markdown',
    format: 'markdown',
  }
}
