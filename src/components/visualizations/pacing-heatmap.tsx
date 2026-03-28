'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PacingRow {
  id: string
  label: string
  position: number
  values: Record<string, number> // metricId → value (0–1 normalized)
}

export interface PacingMetric {
  id: string
  label: string
  colorScale: 'sequential' | 'diverging'
  description: string
}

export interface PacingHeatmapData {
  rows: PacingRow[]
  metrics: PacingMetric[]
}

export interface PacingHeatmapProps {
  data?: PacingHeatmapData
  onCellSelect?: (rowId: string, metricId: string) => void
  onRowSelect?: (rowId: string) => void
  readOnly?: boolean
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function cellColor(value: number, scale: 'sequential' | 'diverging'): string {
  const clamped = Math.max(0, Math.min(1, value))
  if (scale === 'diverging') {
    return d3.interpolateRdYlGn(clamped)
  }
  return d3.interpolateBlues(clamped)
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MARGIN = { top: 100, right: 160, bottom: 20, left: 140 }
const CELL_PAD = 2
const MIN_CELL = 28
const LEGEND_W = 120
const LEGEND_H = 14

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PacingHeatmap({
  data,
  onCellSelect,
  onRowSelect,
  readOnly = false,
}: PacingHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const [dims, setDims] = useState({ width: 800, height: 600 })
  const [selectedCell, setSelectedCell] = useState<{ row: string; metric: string } | null>(null)
  const [sortMetric, setSortMetric] = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(false)

  // Observe container size
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setDims({
          width: Math.max(entry.contentRect.width, 300),
          height: Math.max(entry.contentRect.height, 200),
        })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Sort rows
  const sortedRows = useMemo(() => {
    if (!data) return []
    const rows = [...data.rows]
    if (sortMetric) {
      rows.sort((a, b) => {
        const av = a.values[sortMetric] ?? 0
        const bv = b.values[sortMetric] ?? 0
        return sortAsc ? av - bv : bv - av
      })
    } else {
      rows.sort((a, b) => a.position - b.position)
    }
    return rows
  }, [data, sortMetric, sortAsc])

  const handleColumnClick = useCallback(
    (metricId: string) => {
      if (readOnly) return
      if (sortMetric === metricId) {
        setSortAsc((prev) => !prev)
      } else {
        setSortMetric(metricId)
        setSortAsc(false)
      }
    },
    [sortMetric, readOnly],
  )

  // D3 render
  useEffect(() => {
    if (!data || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const metrics = data.metrics
    const rows = sortedRows

    const innerW = dims.width - MARGIN.left - MARGIN.right
    const innerH = dims.height - MARGIN.top - MARGIN.bottom

    const cellW = Math.max(MIN_CELL, innerW / metrics.length)
    const cellH = Math.max(MIN_CELL, innerH / Math.max(rows.length, 1))

    const g = svg
      .attr('width', dims.width)
      .attr('height', dims.height)
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    // --- Column headers ---
    const headers = g
      .selectAll<SVGGElement, PacingMetric>('.col-header')
      .data(metrics)
      .join('g')
      .attr('class', 'col-header')
      .attr('transform', (_d, i) => `translate(${i * cellW + cellW / 2}, -8)`)
      .style('cursor', readOnly ? 'default' : 'pointer')
      .on('click', (_event, d) => handleColumnClick(d.id))

    headers
      .append('text')
      .text((d) => d.label)
      .attr('text-anchor', 'start')
      .attr('transform', 'rotate(-45)')
      .attr('class', 'fill-foreground text-xs')
      .attr('font-size', '12px')
      .attr('dy', '0.35em')

    // Sort indicator
    headers
      .filter((d) => d.id === sortMetric)
      .append('text')
      .text(sortAsc ? ' \u25B2' : ' \u25BC')
      .attr('text-anchor', 'start')
      .attr('transform', 'rotate(-45)')
      .attr('dx', '60')
      .attr('class', 'fill-foreground')
      .attr('font-size', '10px')
      .attr('dy', '0.35em')

    // --- Row headers ---
    g.selectAll<SVGTextElement, PacingRow>('.row-header')
      .data(rows)
      .join('text')
      .attr('class', 'row-header fill-foreground text-xs')
      .attr('x', -10)
      .attr('y', (_d, i) => i * cellH + cellH / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '12px')
      .style('cursor', readOnly ? 'default' : 'pointer')
      .text((d) => d.label)
      .on('click', (_event, d) => {
        if (!readOnly) onRowSelect?.(d.id)
      })

    // --- Cells ---
    const tooltip = d3.select(tooltipRef.current)

    rows.forEach((row, ri) => {
      metrics.forEach((metric, ci) => {
        const val = row.values[metric.id] ?? 0
        const isSelected = selectedCell?.row === row.id && selectedCell?.metric === metric.id

        const cell = g
          .append('rect')
          .attr('x', ci * cellW + CELL_PAD / 2)
          .attr('y', ri * cellH + CELL_PAD / 2)
          .attr('width', Math.max(0, cellW - CELL_PAD))
          .attr('height', Math.max(0, cellH - CELL_PAD))
          .attr('rx', 3)
          .attr('fill', cellColor(val, metric.colorScale))
          .style('cursor', readOnly ? 'default' : 'pointer')
          .attr('stroke', isSelected ? 'var(--foreground)' : 'none')
          .attr('stroke-width', isSelected ? 2 : 0)

        cell
          .on('mouseenter', (event: MouseEvent) => {
            tooltip
              .style('opacity', '1')
              .style('left', `${event.offsetX + 12}px`)
              .style('top', `${event.offsetY - 10}px`)
              .html(
                `<strong>${row.label}</strong><br/>${metric.label}: ${(val * 100).toFixed(0)}%`,
              )
            cell.attr('stroke', 'var(--foreground)').attr('stroke-width', 2)
          })
          .on('mousemove', (event: MouseEvent) => {
            tooltip
              .style('left', `${event.offsetX + 12}px`)
              .style('top', `${event.offsetY - 10}px`)
          })
          .on('mouseleave', () => {
            tooltip.style('opacity', '0')
            if (!isSelected) {
              cell.attr('stroke', 'none').attr('stroke-width', 0)
            }
          })
          .on('click', () => {
            if (readOnly) return
            const next =
              selectedCell?.row === row.id && selectedCell?.metric === metric.id
                ? null
                : { row: row.id, metric: metric.id }
            setSelectedCell(next)
            if (next) onCellSelect?.(row.id, metric.id)
          })
      })
    })

    // --- Legends ---
    const legendGroup = svg
      .append('g')
      .attr('transform', `translate(${dims.width - MARGIN.right + 20}, ${MARGIN.top})`)

    const scaleTypes: Array<{ type: 'sequential' | 'diverging'; label: string }> = []
    const seen = new Set<string>()
    for (const m of metrics) {
      if (!seen.has(m.colorScale)) {
        seen.add(m.colorScale)
        scaleTypes.push({
          type: m.colorScale,
          label: m.colorScale === 'sequential' ? 'Density / Rate' : 'Quality Score',
        })
      }
    }

    scaleTypes.forEach(({ type, label }, si) => {
      const ly = si * 60
      legendGroup
        .append('text')
        .attr('x', 0)
        .attr('y', ly)
        .attr('class', 'fill-foreground')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .text(label)

      const steps = 40
      const stepW = LEGEND_W / steps
      for (let i = 0; i < steps; i++) {
        legendGroup
          .append('rect')
          .attr('x', i * stepW)
          .attr('y', ly + 8)
          .attr('width', stepW + 0.5)
          .attr('height', LEGEND_H)
          .attr('fill', cellColor(i / (steps - 1), type))
      }

      legendGroup
        .append('text')
        .attr('x', 0)
        .attr('y', ly + 8 + LEGEND_H + 12)
        .attr('class', 'fill-muted-foreground')
        .attr('font-size', '10px')
        .text('0%')

      legendGroup
        .append('text')
        .attr('x', LEGEND_W)
        .attr('y', ly + 8 + LEGEND_H + 12)
        .attr('text-anchor', 'end')
        .attr('class', 'fill-muted-foreground')
        .attr('font-size', '10px')
        .text('100%')
    })
  }, [
    data,
    dims,
    sortedRows,
    selectedCell,
    sortMetric,
    sortAsc,
    readOnly,
    handleColumnClick,
    onCellSelect,
    onRowSelect,
  ])

  if (!data || data.rows.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        No pacing data available.
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative h-full min-h-[400px] w-full">
      <svg ref={svgRef} className="h-full w-full" />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
        style={{ opacity: 0, transition: 'opacity 150ms' }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const METRICS: PacingMetric[] = [
  {
    id: 'tension',
    label: 'Tension',
    colorScale: 'sequential',
    description: 'Overall narrative tension level in this segment',
  },
  {
    id: 'dialogue_density',
    label: 'Dialogue Density',
    colorScale: 'sequential',
    description: 'Ratio of dialogue to total text',
  },
  {
    id: 'action_density',
    label: 'Action Density',
    colorScale: 'sequential',
    description: 'Ratio of action/movement to total text',
  },
  {
    id: 'description_density',
    label: 'Description Density',
    colorScale: 'sequential',
    description: 'Ratio of descriptive passages to total text',
  },
  {
    id: 'pacing_score',
    label: 'Pacing Score',
    colorScale: 'diverging',
    description: 'Overall pacing quality assessment (higher is better)',
  },
]

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateRows(): PacingRow[] {
  const rand = seededRandom(42)
  const chapters = [
    'Prologue',
    'The Call',
    'Into the Unknown',
    'Allies & Enemies',
    'First Test',
    'The Crossing',
    'Descent',
    'Trials',
    'The Abyss',
    'Revelation',
    'Turning Point',
    'The Gambit',
    'Betrayal',
    'Fallout',
    'Regrouping',
    'The Siege',
    'Darkest Hour',
    'Rally',
    'Climax',
    'Resolution',
  ]

  return chapters.map((label, i) => {
    const arc = Math.sin((i / (chapters.length - 1)) * Math.PI)
    return {
      id: `ch-${i + 1}`,
      label: `Ch ${i + 1}: ${label}`,
      position: i,
      values: {
        tension: Math.min(1, Math.max(0, arc * 0.7 + rand() * 0.3)),
        dialogue_density: Math.min(1, Math.max(0, 0.3 + rand() * 0.5)),
        action_density: Math.min(1, Math.max(0, arc * 0.5 + rand() * 0.4)),
        description_density: Math.min(1, Math.max(0, (1 - arc) * 0.4 + rand() * 0.3)),
        pacing_score: Math.min(1, Math.max(0, 0.4 + arc * 0.3 + rand() * 0.3)),
      },
    }
  })
}

export const MOCK_DATA: PacingHeatmapData = {
  rows: generateRows(),
  metrics: METRICS,
}
