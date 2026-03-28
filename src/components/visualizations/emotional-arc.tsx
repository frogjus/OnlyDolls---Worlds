'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import { VizShell } from '@/components/visualizations/viz-shell'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmotionalCharacter {
  characterId: string
  characterName: string
  color: string
  dataPoints: {
    position: number
    positionLabel: string
    values: Record<string, number>
  }[]
}

interface EmotionDimension {
  id: string
  label: string
}

interface EmotionalArcData {
  characters: EmotionalCharacter[]
  dimensions: EmotionDimension[]
}

interface EmotionalArcProps {
  data?: EmotionalArcData
  dimensionId?: string
  onDataPointSelect?: (characterId: string, position: number) => void
  readOnly?: boolean
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const DIMENSIONS: EmotionDimension[] = [
  { id: 'joy', label: 'Joy' },
  { id: 'fear', label: 'Fear' },
  { id: 'anger', label: 'Anger' },
  { id: 'sadness', label: 'Sadness' },
  { id: 'hope', label: 'Hope' },
  { id: 'tension', label: 'Tension' },
]

const POSITION_LABELS = [
  'Opening Image',
  'Theme Stated',
  'Set-Up',
  'Catalyst',
  'Debate',
  'Break into Two',
  'B Story',
  'Fun & Games',
  'Midpoint',
  'Bad Guys Close In',
  'All Is Lost',
  'Dark Night',
  'Break into Three',
  'Finale',
  'Final Image',
]

function makePoints(
  arcs: Record<string, number[]>,
): EmotionalCharacter['dataPoints'] {
  return POSITION_LABELS.map((label, i) => ({
    position: i,
    positionLabel: label,
    values: Object.fromEntries(
      Object.entries(arcs).map(([dim, vals]) => [dim, vals[i]]),
    ),
  }))
}

export const MOCK_DATA: EmotionalArcData = {
  dimensions: DIMENSIONS,
  characters: [
    {
      characterId: 'protagonist',
      characterName: 'Protagonist',
      color: '#6366f1',
      dataPoints: makePoints({
        joy:     [ 0.6,  0.5,  0.4,  0.1, -0.1,  0.2,  0.3,  0.5,  0.0, -0.3, -0.7, -0.8, -0.2,  0.6,  0.8],
        fear:    [-0.2, -0.1,  0.0,  0.4,  0.5,  0.3,  0.1,  0.0,  0.3,  0.6,  0.8,  0.9,  0.5,  0.2, -0.1],
        anger:   [-0.3, -0.2, -0.1,  0.1,  0.3,  0.2,  0.0,  0.1,  0.4,  0.6,  0.7,  0.5,  0.3,  0.1, -0.2],
        sadness: [-0.1,  0.0,  0.1,  0.3,  0.4,  0.2,  0.1,  0.0,  0.2,  0.5,  0.8,  0.9,  0.4,  0.1,  0.0],
        hope:    [ 0.7,  0.6,  0.5,  0.2,  0.0,  0.3,  0.4,  0.6,  0.3, -0.1, -0.5, -0.7,  0.1,  0.7,  0.9],
        tension: [ 0.1,  0.2,  0.2,  0.5,  0.6,  0.4,  0.2,  0.3,  0.6,  0.8,  0.9,  1.0,  0.7,  0.4,  0.1],
      }),
    },
    {
      characterId: 'antagonist',
      characterName: 'Antagonist',
      color: '#ef4444',
      dataPoints: makePoints({
        joy:     [ 0.3,  0.4,  0.5,  0.6,  0.5,  0.4,  0.3,  0.5,  0.7,  0.8,  0.6,  0.3, -0.1, -0.5, -0.7],
        fear:    [ 0.0, -0.1,  0.0,  0.0,  0.1,  0.1,  0.0,  0.0,  0.1,  0.2,  0.3,  0.5,  0.7,  0.8,  0.6],
        anger:   [ 0.2,  0.3,  0.3,  0.4,  0.3,  0.5,  0.4,  0.5,  0.3,  0.4,  0.6,  0.7,  0.8,  0.6,  0.4],
        sadness: [ 0.1,  0.0,  0.0,  0.0,  0.1,  0.0,  0.0,  0.1,  0.0,  0.1,  0.2,  0.4,  0.6,  0.8,  0.7],
        hope:    [ 0.5,  0.6,  0.6,  0.7,  0.5,  0.6,  0.5,  0.6,  0.7,  0.6,  0.3,  0.0, -0.3, -0.6, -0.8],
        tension: [ 0.3,  0.3,  0.4,  0.5,  0.4,  0.5,  0.5,  0.6,  0.7,  0.8,  0.8,  0.9,  1.0,  0.8,  0.5],
      }),
    },
    {
      characterId: 'mentor',
      characterName: 'Mentor',
      color: '#22c55e',
      dataPoints: makePoints({
        joy:     [ 0.4,  0.4,  0.3,  0.2,  0.2,  0.3,  0.4,  0.4,  0.3,  0.1, -0.2, -0.5, -0.3,  0.2,  0.4],
        fear:    [ 0.0,  0.0,  0.1,  0.2,  0.2,  0.1,  0.0,  0.1,  0.2,  0.4,  0.6,  0.7,  0.3,  0.1,  0.0],
        anger:   [ 0.0,  0.0,  0.0,  0.1,  0.1,  0.0,  0.0,  0.0,  0.1,  0.3,  0.4,  0.3,  0.2,  0.1,  0.0],
        sadness: [ 0.1,  0.1,  0.2,  0.2,  0.3,  0.2,  0.1,  0.1,  0.3,  0.5,  0.7,  0.8,  0.4,  0.2,  0.1],
        hope:    [ 0.6,  0.5,  0.5,  0.4,  0.3,  0.4,  0.5,  0.5,  0.4,  0.2, -0.1, -0.3,  0.2,  0.5,  0.6],
        tension: [ 0.0,  0.1,  0.1,  0.3,  0.3,  0.2,  0.1,  0.1,  0.3,  0.5,  0.7,  0.8,  0.5,  0.2,  0.0],
      }),
    },
    {
      characterId: 'love-interest',
      characterName: 'Love Interest',
      color: '#f59e0b',
      dataPoints: makePoints({
        joy:     [ 0.3,  0.3,  0.4,  0.2,  0.0,  0.3,  0.6,  0.7,  0.4,  0.1, -0.3, -0.4,  0.0,  0.5,  0.7],
        fear:    [ 0.0,  0.1,  0.1,  0.3,  0.4,  0.2,  0.0,  0.0,  0.2,  0.5,  0.7,  0.6,  0.3,  0.1,  0.0],
        anger:   [ 0.0,  0.0,  0.0,  0.2,  0.3,  0.1,  0.0,  0.1,  0.3,  0.4,  0.5,  0.4,  0.2,  0.0, -0.1],
        sadness: [ 0.0,  0.1,  0.0,  0.3,  0.5,  0.2,  0.0,  0.0,  0.2,  0.4,  0.7,  0.8,  0.3,  0.1,  0.0],
        hope:    [ 0.4,  0.4,  0.5,  0.2,  0.0,  0.4,  0.7,  0.8,  0.5,  0.2, -0.2, -0.4,  0.1,  0.6,  0.8],
        tension: [ 0.1,  0.1,  0.1,  0.4,  0.5,  0.3,  0.1,  0.0,  0.3,  0.6,  0.8,  0.7,  0.5,  0.2,  0.0],
      }),
    },
  ],
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MARGIN = { top: 24, right: 24, bottom: 56, left: 52 }
const TRANSITION_MS = 350
const DOT_RADIUS = 4
const DOT_HOVER_RADIUS = 6

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmotionalArc({
  data = MOCK_DATA,
  dimensionId: controlledDimension,
  onDataPointSelect,
  readOnly = false,
}: EmotionalArcProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [internalDimension, setInternalDimension] = useState(
    data.dimensions[0]?.id ?? 'joy',
  )
  const [hiddenCharacters, setHiddenCharacters] = useState<Set<string>>(
    new Set(),
  )

  const activeDimension = controlledDimension ?? internalDimension

  // Responsive sizing
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Toggle character visibility
  const toggleCharacter = useCallback((id: string) => {
    setHiddenCharacters((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Visible characters
  const visibleCharacters = useMemo(
    () => data.characters.filter((c) => !hiddenCharacters.has(c.characterId)),
    [data.characters, hiddenCharacters],
  )

  // All positions (assume same across characters)
  const positions = useMemo(
    () => data.characters[0]?.dataPoints.map((d) => d.position) ?? [],
    [data.characters],
  )

  // ---------------------------------------------------------------------------
  // D3 rendering
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const svg = d3.select(svgRef.current)
    if (!svgRef.current || size.width === 0 || size.height === 0) return

    const { width, height } = size
    const innerW = width - MARGIN.left - MARGIN.right
    const innerH = height - MARGIN.top - MARGIN.bottom
    if (innerW <= 0 || innerH <= 0) return

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(positions) as [number, number])
      .range([0, innerW])

    const yScale = d3.scaleLinear().domain([-1, 1]).range([innerH, 0])

    // Clear previous
    svg.selectAll('*').remove()

    // Defs – clip path
    const defs = svg.append('defs')
    defs
      .append('clipPath')
      .attr('id', 'chart-clip')
      .append('rect')
      .attr('width', innerW)
      .attr('height', innerH)

    // Root group
    const g = svg
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    // Grid lines
    const gridY = g.append('g').attr('class', 'grid-y')
    yScale.ticks(8).forEach((tick) => {
      gridY
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerW)
        .attr('y1', yScale(tick))
        .attr('y2', yScale(tick))
        .attr('stroke', 'var(--grid-color, rgba(128,128,128,0.15))')
        .attr('stroke-dasharray', '3,3')
    })

    const gridX = g.append('g').attr('class', 'grid-x')
    positions.forEach((pos) => {
      gridX
        .append('line')
        .attr('x1', xScale(pos))
        .attr('x2', xScale(pos))
        .attr('y1', 0)
        .attr('y2', innerH)
        .attr('stroke', 'var(--grid-color, rgba(128,128,128,0.10))')
        .attr('stroke-dasharray', '2,4')
    })

    // Zero line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', 'var(--zero-line, rgba(128,128,128,0.35))')
      .attr('stroke-width', 1)

    // Axes
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(positions)
      .tickFormat((d) => {
        const dp = data.characters[0]?.dataPoints.find(
          (p) => p.position === d,
        )
        return dp?.positionLabel ?? String(d)
      })

    const xAxisG = g
      .append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(xAxis)

    xAxisG
      .selectAll('text')
      .attr('transform', 'rotate(-35)')
      .style('text-anchor', 'end')
      .style('font-size', '10px')
      .style('fill', 'var(--axis-text, #888)')

    xAxisG.selectAll('line').style('stroke', 'var(--axis-line, #555)')
    xAxisG.select('.domain').style('stroke', 'var(--axis-line, #555)')

    const yAxis = d3.axisLeft(yScale).ticks(8).tickSize(-4)

    const yAxisG = g.append('g').call(yAxis)
    yAxisG
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', 'var(--axis-text, #888)')
    yAxisG.selectAll('line').style('stroke', 'var(--axis-line, #555)')
    yAxisG.select('.domain').style('stroke', 'var(--axis-line, #555)')

    // Y-axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -38)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', 'var(--axis-text, #888)')
      .text('Intensity')

    // Line generator
    const line = d3
      .line<EmotionalCharacter['dataPoints'][number]>()
      .x((d) => xScale(d.position))
      .y((d) => yScale(d.values[activeDimension] ?? 0))
      .curve(d3.curveCatmullRom.alpha(0.5))

    // Clipped chart area
    const chartArea = g.append('g').attr('clip-path', 'url(#chart-clip)')

    // Lines
    visibleCharacters.forEach((char) => {
      chartArea
        .append('path')
        .datum(char.dataPoints)
        .attr('fill', 'none')
        .attr('stroke', char.color)
        .attr('stroke-width', 2.5)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', line)
        .attr('opacity', 0)
        .transition()
        .duration(TRANSITION_MS)
        .attr('opacity', 1)
    })

    // Dots
    visibleCharacters.forEach((char) => {
      chartArea
        .selectAll(`.dot-${char.characterId}`)
        .data(char.dataPoints)
        .join('circle')
        .attr('cx', (d) => xScale(d.position))
        .attr('cy', (d) => yScale(d.values[activeDimension] ?? 0))
        .attr('r', DOT_RADIUS)
        .attr('fill', char.color)
        .attr('stroke', 'var(--dot-stroke, #1a1a2e)')
        .attr('stroke-width', 1.5)
        .style('cursor', readOnly ? 'default' : 'pointer')
        .on('click', (_event, d) => {
          if (!readOnly && onDataPointSelect) {
            onDataPointSelect(char.characterId, d.position)
          }
        })
    })

    // Crosshair + tooltip interaction
    const crosshairLine = chartArea
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', 'var(--crosshair, rgba(200,200,200,0.4))')
      .attr('stroke-width', 1)
      .attr('pointer-events', 'none')
      .style('display', 'none')

    const hoverDots = chartArea
      .append('g')
      .attr('pointer-events', 'none')
      .style('display', 'none')

    visibleCharacters.forEach((char) => {
      hoverDots
        .append('circle')
        .attr('data-character', char.characterId)
        .attr('r', DOT_HOVER_RADIUS)
        .attr('fill', char.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
    })

    const tooltip = d3
      .select(containerRef.current)
      .append('div')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', 'var(--tooltip-bg, rgba(15,15,30,0.92))')
      .style('border', '1px solid var(--tooltip-border, rgba(100,100,140,0.3))')
      .style('border-radius', '6px')
      .style('padding', '8px 12px')
      .style('font-size', '12px')
      .style('color', 'var(--tooltip-text, #e0e0e0)')
      .style('white-space', 'nowrap')
      .style('display', 'none')
      .style('z-index', '10')

    // Invisible overlay for mouse tracking
    const overlay = chartArea
      .append('rect')
      .attr('width', innerW)
      .attr('height', innerH)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')

    overlay
      .on('mousemove', (event: MouseEvent) => {
        const [mx] = d3.pointer(event)
        const closestPos = positions.reduce((best, pos) =>
          Math.abs(xScale(pos) - mx) < Math.abs(xScale(best) - mx)
            ? pos
            : best,
        )

        const cx = xScale(closestPos)
        crosshairLine.attr('x1', cx).attr('x2', cx).style('display', null)
        hoverDots.style('display', null)

        hoverDots.selectAll('circle').each(function () {
          const el = d3.select(this)
          const charId = el.attr('data-character')
          const char = visibleCharacters.find(
            (c) => c.characterId === charId,
          )
          const dp = char?.dataPoints.find((d) => d.position === closestPos)
          if (dp) {
            el.attr('cx', cx).attr('cy', yScale(dp.values[activeDimension] ?? 0))
          }
        })

        // Tooltip content
        const dp0 = data.characters[0]?.dataPoints.find(
          (d) => d.position === closestPos,
        )
        const label = dp0?.positionLabel ?? String(closestPos)

        const rows = visibleCharacters
          .map((char) => {
            const dp = char.dataPoints.find(
              (d) => d.position === closestPos,
            )
            const v = dp?.values[activeDimension] ?? 0
            return `<span style="color:${char.color}">\u25CF</span> ${char.characterName}: <strong>${v.toFixed(2)}</strong>`
          })
          .join('<br/>')

        tooltip
          .html(`<div style="margin-bottom:4px;font-weight:600">${label}</div>${rows}`)
          .style('display', 'block')

        // Position tooltip
        const containerRect = containerRef.current!.getBoundingClientRect()
        const svgRect = svgRef.current!.getBoundingClientRect()
        const offsetLeft = svgRect.left - containerRect.left
        const tooltipX = offsetLeft + MARGIN.left + cx + 14
        const tooltipY = event.clientY - containerRect.top - 20

        tooltip.style('left', `${tooltipX}px`).style('top', `${tooltipY}px`)
      })
      .on('mouseleave', () => {
        crosshairLine.style('display', 'none')
        hoverDots.style('display', 'none')
        tooltip.style('display', 'none')
      })

    // Zoom + pan (X only)
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 6])
      .translateExtent([
        [0, 0],
        [innerW, innerH],
      ])
      .extent([
        [0, 0],
        [innerW, innerH],
      ])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        const newX = event.transform.rescaleX(xScale)

        // Update lines
        const zoomedLine = d3
          .line<EmotionalCharacter['dataPoints'][number]>()
          .x((d) => newX(d.position))
          .y((d) => yScale(d.values[activeDimension] ?? 0))
          .curve(d3.curveCatmullRom.alpha(0.5))

        chartArea.selectAll('path').attr('d', function () {
          const datum = d3.select(this).datum() as
            | EmotionalCharacter['dataPoints']
            | undefined
          if (!datum || !Array.isArray(datum)) return null
          return zoomedLine(datum)
        })

        chartArea
          .selectAll<SVGCircleElement, EmotionalCharacter['dataPoints'][number]>(
            'circle:not([data-character])',
          )
          .attr('cx', (d) => {
            if (d && typeof d.position === 'number') return newX(d.position)
            return 0
          })

        // Update x-axis
        const zoomedAxis = d3
          .axisBottom(newX)
          .tickValues(positions)
          .tickFormat((d) => {
            const dp = data.characters[0]?.dataPoints.find(
              (p) => p.position === d,
            )
            return dp?.positionLabel ?? String(d)
          })

        xAxisG.call(zoomedAxis)
        xAxisG
          .selectAll('text')
          .attr('transform', 'rotate(-35)')
          .style('text-anchor', 'end')
          .style('font-size', '10px')
          .style('fill', 'var(--axis-text, #888)')
        xAxisG.selectAll('line').style('stroke', 'var(--axis-line, #555)')
        xAxisG.select('.domain').style('stroke', 'var(--axis-line, #555)')

        // Update grid-x
        gridX.selectAll('line').each(function (_d, i) {
          d3.select(this)
            .attr('x1', newX(positions[i]))
            .attr('x2', newX(positions[i]))
        })
      })

    svg.call(zoom as unknown as (selection: typeof svg) => void)

    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove()
    }
  }, [
    size,
    visibleCharacters,
    positions,
    activeDimension,
    data.characters,
    readOnly,
    onDataPointSelect,
  ])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const currentDimLabel =
    data.dimensions.find((d) => d.id === activeDimension)?.label ??
    activeDimension

  return (
    <VizShell title="Emotional Arc Chart">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 px-4 pb-2">
        {/* Dimension selector */}
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Dimension:</span>
          <select
            value={activeDimension}
            onChange={(e) => setInternalDimension(e.target.value)}
            className="rounded border border-border bg-background px-2 py-1 text-sm"
          >
            {data.dimensions.map((dim) => (
              <option key={dim.id} value={dim.id}>
                {dim.label}
              </option>
            ))}
          </select>
        </label>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3">
          {data.characters.map((char) => {
            const hidden = hiddenCharacters.has(char.characterId)
            return (
              <button
                key={char.characterId}
                type="button"
                onClick={() => toggleCharacter(char.characterId)}
                className="flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs transition-opacity hover:bg-muted"
                style={{ opacity: hidden ? 0.35 : 1 }}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: char.color }}
                />
                <span>{char.characterName}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chart */}
      <div
        ref={containerRef}
        className="relative h-[calc(100%-2.5rem)] min-h-[300px] w-full"
      >
        <svg
          ref={svgRef}
          width={size.width}
          height={size.height}
          className="block"
          aria-label={`Emotional arc chart showing ${currentDimLabel} for ${visibleCharacters.map((c) => c.characterName).join(', ')}`}
        />
      </div>
    </VizShell>
  )
}
