'use client'

import { useState } from 'react'
import { Copy, Download, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  treatmentToMarkdown,
  treatmentToPlainText,
  type TreatmentSection,
} from '@/lib/hooks/use-treatments'

interface TreatmentExportProps {
  sections: TreatmentSection[]
  title: string
}

export function TreatmentExport({ sections, title }: TreatmentExportProps) {
  const [copied, setCopied] = useState(false)

  async function copyAsMarkdown() {
    const md = `# ${title}\n\n${treatmentToMarkdown(sections)}`
    await navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadAsText() {
    const text = `${title}\n${'='.repeat(title.length)}\n\n${treatmentToPlainText(sections)}`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}-treatment.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex gap-1.5">
      <Button
        size="sm"
        variant="outline"
        onClick={copyAsMarkdown}
        disabled={sections.length === 0}
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {copied ? 'Copied' : 'Copy as Markdown'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={downloadAsText}
        disabled={sections.length === 0}
      >
        <Download className="size-3.5" />
        Download as Text
      </Button>
    </div>
  )
}
