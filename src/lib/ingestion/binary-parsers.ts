// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>

export async function parsePDF(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer)
  return result.text
}

export async function parseDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth')
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
    default:
      return buffer.toString('utf-8')
  }
}
