import { PDFParse } from 'pdf-parse'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth') as { extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }> }

export async function parsePDF(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  const result = await parser.getText()
  await parser.destroy()
  return result.pages.map((p) => p.text).join('\n\n')
}

export async function parseDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

export async function parseByExtension(
  buffer: Buffer,
  extension: string
): Promise<string> {
  switch (extension) {
    case 'pdf':
      return parsePDF(buffer)
    case 'docx':
    case 'doc':
      return parseDOCX(buffer)
    case 'rtf':
    case 'epub':
    case 'txt':
    case 'md':
    case 'markdown':
    case 'fountain':
      return buffer.toString('utf-8')
    default:
      return buffer.toString('utf-8')
  }
}
