import type { ExportableContent, ExportResult } from './types'

/**
 * Generate a simple valid PDF from content using raw PDF syntax.
 * No external dependencies required.
 */
export async function exportPDF(content: ExportableContent): Promise<ExportResult> {
  const textLines = buildTextLines(content)
  const pdfBytes = generatePDFBytes(content.title, textLines)
  const safeTitle = content.title.replace(/[^a-zA-Z0-9_-]/g, '_')

  return {
    content: Buffer.from(pdfBytes),
    filename: `${safeTitle}.pdf`,
    mimeType: 'application/pdf',
    format: 'pdf',
  }
}

function buildTextLines(content: ExportableContent): string[] {
  const lines: string[] = []

  lines.push(content.title)
  lines.push('')

  if (content.metadata?.author) {
    lines.push(`Author: ${content.metadata.author}`)
  }
  if (content.metadata?.date) {
    lines.push(`Date: ${content.metadata.date}`)
  }
  if (content.metadata?.logline) {
    lines.push(`Logline: ${content.metadata.logline}`)
  }
  lines.push('')
  lines.push('---')
  lines.push('')

  for (const section of content.sections) {
    lines.push(section.title)
    lines.push('')
    if (section.content) {
      const wrapped = wordWrap(section.content, 80)
      lines.push(...wrapped)
      lines.push('')
    }
  }

  return lines
}

function wordWrap(text: string, maxWidth: number): string[] {
  const result: string[] = []
  const paragraphs = text.split('\n')

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      result.push('')
      continue
    }

    const words = paragraph.split(/\s+/)
    let currentLine = ''

    for (const word of words) {
      if (currentLine.length + word.length + 1 > maxWidth && currentLine.length > 0) {
        result.push(currentLine)
        currentLine = word
      } else {
        currentLine = currentLine ? `${currentLine} ${word}` : word
      }
    }
    if (currentLine) {
      result.push(currentLine)
    }
  }

  return result
}

function escapePDFString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function generatePDFBytes(title: string, lines: string[]): Uint8Array {
  const objects: string[] = []
  const offsets: number[] = []

  // Build page content stream
  const fontSize = 11
  const titleFontSize = 16
  const lineHeight = 14
  const margin = 72 // 1 inch
  const pageWidth = 612 // Letter size
  const pageHeight = 792
  const usableHeight = pageHeight - 2 * margin

  // Split lines into pages
  const pages: string[][] = []
  let currentPage: string[] = []
  let currentY = 0

  for (const line of lines) {
    const lh = line === lines[0] ? titleFontSize + 4 : lineHeight
    if (currentY + lh > usableHeight && currentPage.length > 0) {
      pages.push(currentPage)
      currentPage = []
      currentY = 0
    }
    currentPage.push(line)
    currentY += lh
  }
  if (currentPage.length > 0) {
    pages.push(currentPage)
  }

  if (pages.length === 0) {
    pages.push(['(empty document)'])
  }

  // Object 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj')

  // Object 2: Pages (will reference page objects)
  const pageObjectIds = pages.map((_, i) => `${3 + i * 2} 0 R`)
  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjectIds.join(' ')}] /Count ${pages.length} >>\nendobj`
  )

  // Object 3+: Page objects and their content streams
  let nextObjId = 3
  const fontObjId = nextObjId + pages.length * 2

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const pageObjId = nextObjId
    const contentObjId = nextObjId + 1
    nextObjId += 2

    // Build content stream for this page
    const streamLines: string[] = []
    streamLines.push('BT')

    let y = pageHeight - margin
    const pageLines = pages[pageIdx]

    for (let i = 0; i < pageLines.length; i++) {
      const line = pageLines[i]
      const isTitle = pageIdx === 0 && i === 0
      const fs = isTitle ? titleFontSize : fontSize

      streamLines.push(`/F1 ${fs} Tf`)
      streamLines.push(`${margin} ${y} Td`)
      streamLines.push(`(${escapePDFString(line)}) Tj`)

      y -= isTitle ? titleFontSize + 4 : lineHeight

      // Reset position for next line
      if (i < pageLines.length - 1) {
        streamLines.push(`${-margin} ${-(isTitle ? titleFontSize + 4 : lineHeight)} Td`)
        // Re-set absolute position
        streamLines.pop()
      }
    }

    // Rebuild with absolute positioning
    const finalStream: string[] = ['BT']
    y = pageHeight - margin

    for (let i = 0; i < pageLines.length; i++) {
      const line = pageLines[i]
      const isTitle = pageIdx === 0 && i === 0
      const fs = isTitle ? titleFontSize : fontSize

      finalStream.push(`/F1 ${fs} Tf`)
      finalStream.push(`1 0 0 1 ${margin} ${y} Tm`)
      finalStream.push(`(${escapePDFString(line)}) Tj`)

      y -= isTitle ? titleFontSize + 4 : lineHeight
    }

    finalStream.push('ET')
    const streamContent = finalStream.join('\n')

    // Page object
    objects.push(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentObjId} 0 R /Resources << /Font << /F1 ${fontObjId} 0 R >> >> >>\nendobj`
    )

    // Content stream object
    objects.push(
      `${contentObjId} 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`
    )
  }

  // Font object (Helvetica, built-in)
  objects.push(
    `${fontObjId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`
  )

  // Build the PDF
  let pdf = '%PDF-1.4\n'

  for (const obj of objects) {
    offsets.push(pdf.length)
    pdf += obj + '\n'
  }

  // Cross-reference table
  const xrefOffset = pdf.length
  pdf += 'xref\n'
  pdf += `0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  }

  // Trailer
  pdf += 'trailer\n'
  pdf += `<< /Size ${objects.length + 1} /Root 1 0 R /Info << /Title (${escapePDFString(title)}) >> >>\n`
  pdf += 'startxref\n'
  pdf += `${xrefOffset}\n`
  pdf += '%%EOF'

  return new TextEncoder().encode(pdf)
}
