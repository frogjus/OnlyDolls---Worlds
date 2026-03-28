function inlineComputedStyles(source: SVGElement | HTMLElement, clone: Element): void {
  const sourceStyles = window.getComputedStyle(source)
  if (clone instanceof HTMLElement || clone instanceof SVGElement) {
    const important = ['fill', 'stroke', 'color', 'background-color', 'font-family', 'font-size', 'font-weight', 'opacity']
    for (const prop of important) {
      const value = sourceStyles.getPropertyValue(prop)
      if (value) {
        ;(clone as HTMLElement | SVGElement).style.setProperty(prop, value)
      }
    }
  }
  const sourceChildren = source.children
  const cloneChildren = clone.children
  for (let i = 0; i < sourceChildren.length; i++) {
    if (sourceChildren[i] instanceof HTMLElement || sourceChildren[i] instanceof SVGElement) {
      inlineComputedStyles(
        sourceChildren[i] as HTMLElement | SVGElement,
        cloneChildren[i]
      )
    }
  }
}

export async function exportToSvg(element: HTMLElement | SVGElement): Promise<string> {
  const svgElement = element instanceof SVGElement
    ? element
    : element.querySelector('svg')

  if (!svgElement) {
    throw new Error('No SVG element found for export')
  }

  const clone = svgElement.cloneNode(true) as SVGElement
  inlineComputedStyles(svgElement, clone)

  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  }

  const serializer = new XMLSerializer()
  return serializer.serializeToString(clone)
}

export async function exportToPng(
  element: HTMLElement | SVGElement,
  options?: { scale?: number; backgroundColor?: string }
): Promise<Blob> {
  const scale = options?.scale ?? 2
  const backgroundColor = options?.backgroundColor ?? 'transparent'

  const svgString = await exportToSvg(element)
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load SVG as image'))
      img.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth * scale
    canvas.height = img.naturalHeight * scale

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get canvas 2d context')
    }

    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    ctx.scale(scale, scale)
    ctx.drawImage(img, 0, 0)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Canvas toBlob returned null'))
        },
        'image/png'
      )
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadSvg(svgString: string, filename: string): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  downloadBlob(blob, filename)
}
