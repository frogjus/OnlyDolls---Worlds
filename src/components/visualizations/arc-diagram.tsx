'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import { VizShell } from '@/components/visualizations/viz-shell'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ArcBeat {
  id: string
  label: string
  position: number
  tension: number
  expectedPosition?: number
  templateBeatType?: string
}

interface StoryArc {
  id: string
  name: string
  color: string
  beats: ArcBeat[]
  templateId?: string
}

interface StructureTemplate {
  id: string
  name: string
  beats: {
    type: string
    label: string
    expectedPosition: number
    tolerance: number
  }[]
}

interface ArcDiagramData {
  arcs: StoryArc[]
  templates: StructureTemplate[]
}

interface ArcDiagramProps {
  data?: ArcDiagramData
  showTemplateOverlay?: boolean
  onBeatSelect?: (arcId: string, beatId: string) => void
  readOnly?: boolean
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MARGIN = { top: 32, right: 24, bottom: 48, left: 56 }
const BEAT_RADIUS = 6
const BEAT_RADIUS_HOVER = 9
const DEVIATION_COLORS = {
  good: 'rgba(34,197,94,0.18)',
  warn: 'rgba(234,179,8,0.18)',
  bad: 'rgba(239,68,68,0.18)',
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function deviationColor(actual: number, expected: number, tolerance: number): string {
  const d = Math.abs(actual - expected)
  if (d <= tolerance) return DEVIATION_COLORS.good
  if (d <= tolerance * 2) return DEVIATION_COLORS.warn
  return DEVIATION_COLORS.bad
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ArcDiagram({
  data = MOCK_DATA,
  showTemplateOverlay = true,
  onBeatSelect,
  readOnly = false,
}: ArcDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [hiddenArcs, setHiddenArcs] = useState<Set<string>>(new Set())
  const [selectedBeat, setSelectedBeat] = useState<{ arcId: string; beatId: string } | null>(null)

  const visibleArcs = useMemo(
    () => data.arcs.filter((a) => !hiddenArcs.has(a.id)),
    [data.arcs, hiddenArcs],
  )

  const activeTemplate = useMemo(() => {
    if (!showTemplateOverlay || data.templates.length === 0) return null
    return data.templates[0]
  }, [showTemplateOverlay, data.templates])

  const toggleArc = useCallback((id: string) => {
    setHiddenArcs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  /* ---- D3 render ------------------------------------------------- */
  useEffect(() => {
    const container = containerRef.current
    const svg = svgRef.current
    const tooltip = tooltipRef.current
    if (!container || !svg || !tooltip) return

    const ro = new ResizeObserver(() => draw())
    ro.observe(container)
    draw()

    function draw() {
      if (!container || !svg || !tooltip) return

      const { width: W, height: H } = container.getBoundingClientRect()
      if (W === 0 || H === 0) return

      const w = W - MARGIN.left - MARGIN.right
      const h = H - MARGIN.top - MARGIN.bottom

      const xScale = d3.scaleLinear().domain([0, 1]).range([0, w])
      const yScale = d3.scaleLinear().domain([0, 1]).range([h, 0])

      /* Zoom behaviour (X-axis only pan+zoom) */
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 8])
        .translateExtent([
          [0, 0],
          [W, H],
        ])
        .extent([
          [0, 0],
          [W, H],
        ])
        .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          const t = event.transform
          const newX = t.rescaleX(xScale)
          gMain.attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)
          renderContent(newX, yScale)
        })

      const sel = d3.select(svg).attr('width', W).attr('height', H)

      sel.selectAll('*').remove()

      /* Clip path */
      sel
        .append('defs')
        .append('clipPath')
        .attr('id', 'arc-clip')
        .append('rect')
        .attr('width', w)
        .attr('height', h)

      const gMain = sel
        .append('g')
        .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

      if (!readOnly) {
        sel.call(zoom)
      }

      renderContent(xScale, yScale)

      /* ---- inner render with current scales ---------------------- */
      function renderContent(xS: d3.ScaleLinear<number, number>, yS: d3.ScaleLinear<number, number>) {
        gMain.selectAll('.arc-content').remove()
        const g = gMain.append('g').attr('class', 'arc-content').attr('clip-path', 'url(#arc-clip)')

        /* Template overlay */
        if (activeTemplate) {
          const tg = g.append('g').attr('class', 'template-overlay')

          for (const tb of activeTemplate.beats) {
            const x = xS(tb.expectedPosition)

            /* Tolerance zone */
            const x0 = xS(Math.max(0, tb.expectedPosition - tb.tolerance))
            const x1 = xS(Math.min(1, tb.expectedPosition + tb.tolerance))

            /* Shade beat zones per visible arc */
            for (const arc of visibleArcs) {
              const match = arc.beats.find((b) => b.templateBeatType === tb.type)
              if (match) {
                const col = deviationColor(match.position, tb.expectedPosition, tb.tolerance)
                tg.append('rect')
                  .attr('x', x0)
                  .attr('y', 0)
                  .attr('width', x1 - x0)
                  .attr('height', h)
                  .attr('fill', col)
              }
            }

            /* Dashed guideline */
            tg.append('line')
              .attr('x1', x)
              .attr('y1', 0)
              .attr('x2', x)
              .attr('y2', h)
              .attr('stroke', 'var(--color-muted-foreground, #888)')
              .attr('stroke-width', 1)
              .attr('stroke-dasharray', '4 4')
              .attr('opacity', 0.5)

            /* Label at top */
            tg.append('text')
              .attr('x', x)
              .attr('y', -6)
              .attr('text-anchor', 'middle')
              .attr('fill', 'var(--color-muted-foreground, #888)')
              .attr('font-size', 10)
              .text(tb.label)
          }
        }

        /* Axes */
        const xAxisG = gMain.selectAll<SVGGElement, unknown>('.x-axis').data([0])
        xAxisG
          .enter()
          .append('g')
          .attr('class', 'x-axis')
          .attr('transform', `translate(0,${h})`)
          .merge(xAxisG)
          .call(
            d3
              .axisBottom(xS)
              .ticks(10)
              .tickFormat((d) => `${Math.round(Number(d) * 100)}%`),
          )
          .selectAll('text')
          .attr('fill', 'var(--color-foreground, #eee)')

        gMain
          .selectAll('.x-axis line, .x-axis path')
          .attr('stroke', 'var(--color-border, #444)')

        const yAxisG = gMain.selectAll<SVGGElement, unknown>('.y-axis').data([0])
        yAxisG
          .enter()
          .append('g')
          .attr('class', 'y-axis')
          .merge(yAxisG)
          .call(d3.axisLeft(yS).ticks(5))
          .selectAll('text')
          .attr('fill', 'var(--color-foreground, #eee)')

        gMain
          .selectAll('.y-axis line, .y-axis path')
          .attr('stroke', 'var(--color-border, #444)')

        /* Axis labels */
        const xlExists = gMain.selectAll('.x-label').size()
        if (!xlExists) {
          gMain
            .append('text')
            .attr('class', 'x-label')
            .attr('x', w / 2)
            .attr('y', h + 40)
            .attr('text-anchor', 'middle')
            .attr('fill', 'var(--color-muted-foreground, #888)')
            .attr('font-size', 12)
            .text('Narrative Position')
        }
        const ylExists = gMain.selectAll('.y-label').size()
        if (!ylExists) {
          gMain
            .append('text')
            .attr('class', 'y-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -h / 2)
            .attr('y', -40)
            .attr('text-anchor', 'middle')
            .attr('fill', 'var(--color-muted-foreground, #888)')
            .attr('font-size', 12)
            .text('Tension / Intensity')
        }

        /* Arc curves */
        const line = d3
          .line<ArcBeat>()
          .x((d) => xS(d.position))
          .y((d) => yS(d.tension))
          .curve(d3.curveCatmullRom.alpha(0.5))

        for (const arc of visibleArcs) {
          const sorted = [...arc.beats].sort((a, b) => a.position - b.position)

          /* Curve path */
          g.append('path')
            .datum(sorted)
            .attr('d', line)
            .attr('fill', 'none')
            .attr('stroke', arc.color)
            .attr('stroke-width', 2.5)
            .attr('stroke-linejoin', 'round')

          /* Beat points */
          g.selectAll<SVGCircleElement, ArcBeat>(`.beat-${arc.id}`)
            .data(sorted, (d) => d.id)
            .enter()
            .append('circle')
            .attr('cx', (d) => xS(d.position))
            .attr('cy', (d) => yS(d.tension))
            .attr('r', (d) =>
              selectedBeat?.arcId === arc.id && selectedBeat?.beatId === d.id
                ? BEAT_RADIUS_HOVER
                : BEAT_RADIUS,
            )
            .attr('fill', arc.color)
            .attr('stroke', (d) =>
              selectedBeat?.arcId === arc.id && selectedBeat?.beatId === d.id
                ? 'var(--color-foreground, #fff)'
                : 'none',
            )
            .attr('stroke-width', 2)
            .attr('cursor', 'pointer')
            .on('mouseenter', function (event: MouseEvent, d: ArcBeat) {
              d3.select(this).transition().duration(120).attr('r', BEAT_RADIUS_HOVER)
              if (!tooltip) return
              tooltip.style.opacity = '1'
              tooltip.style.left = `${event.clientX + 12}px`
              tooltip.style.top = `${event.clientY - 12}px`
              tooltip.innerHTML = `
                <div class="font-semibold">${d.label}</div>
                <div class="text-xs text-muted-foreground mt-0.5">${arc.name}</div>
                <div class="text-xs mt-1">Position: ${Math.round(d.position * 100)}%</div>
                <div class="text-xs">Tension: ${Math.round(d.tension * 100)}%</div>
                ${d.templateBeatType ? `<div class="text-xs text-muted-foreground mt-0.5">${d.templateBeatType}</div>` : ''}
              `
            })
            .on('mousemove', function (event: MouseEvent) {
              if (!tooltip) return
              tooltip.style.left = `${event.clientX + 12}px`
              tooltip.style.top = `${event.clientY - 12}px`
            })
            .on('mouseleave', function () {
              const beat = d3.select<SVGCircleElement, ArcBeat>(this).datum()
              const isSelected =
                selectedBeat?.arcId === arc.id && selectedBeat?.beatId === beat.id
              d3.select(this)
                .transition()
                .duration(120)
                .attr('r', isSelected ? BEAT_RADIUS_HOVER : BEAT_RADIUS)
              if (!tooltip) return
              tooltip.style.opacity = '0'
            })
            .on('click', function (_event: MouseEvent, d: ArcBeat) {
              setSelectedBeat({ arcId: arc.id, beatId: d.id })
              onBeatSelect?.(arc.id, d.id)
            })
        }
      }
    }

    return () => ro.disconnect()
  }, [visibleArcs, activeTemplate, selectedBeat, onBeatSelect, readOnly])

  /* ---- Render ---------------------------------------------------- */
  return (
    <VizShell title="Arc Diagram">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-4 pb-2">
        {data.arcs.map((arc) => (
          <button
            key={arc.id}
            type="button"
            onClick={() => toggleArc(arc.id)}
            className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs transition-opacity hover:bg-muted"
            style={{ opacity: hiddenArcs.has(arc.id) ? 0.35 : 1 }}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: arc.color }}
            />
            <span>{arc.name}</span>
          </button>
        ))}
        {activeTemplate && (
          <span className="ml-auto text-xs text-muted-foreground">
            Template: {activeTemplate.name}
          </span>
        )}
      </div>

      {/* Chart */}
      <div ref={containerRef} className="absolute inset-0 top-8">
        <svg ref={svgRef} className="h-full w-full" />
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="pointer-events-none fixed z-50 rounded-md border bg-popover px-3 py-2 text-popover-foreground shadow-md transition-opacity"
        style={{ opacity: 0 }}
      />
    </VizShell>
  )
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

export const MOCK_DATA: ArcDiagramData = {
  arcs: [
    {
      id: 'main-plot',
      name: 'Main Plot',
      color: '#6366f1',
      templateId: 'three-act',
      beats: [
        { id: 'mp-1', label: 'Opening Image', position: 0.0, tension: 0.15, expectedPosition: 0.0, templateBeatType: 'opening' },
        { id: 'mp-2', label: 'Inciting Incident', position: 0.1, tension: 0.35, expectedPosition: 0.1, templateBeatType: 'inciting-incident' },
        { id: 'mp-3', label: 'First Threshold', position: 0.2, tension: 0.42 },
        { id: 'mp-4', label: 'Rising Complications', position: 0.3, tension: 0.52 },
        { id: 'mp-5', label: 'Midpoint Reversal', position: 0.48, tension: 0.65, expectedPosition: 0.5, templateBeatType: 'midpoint' },
        { id: 'mp-6', label: 'Darkest Moment', position: 0.62, tension: 0.45 },
        { id: 'mp-7', label: 'All Is Lost', position: 0.72, tension: 0.3 },
        { id: 'mp-8', label: 'Second Act Turn', position: 0.75, tension: 0.55, expectedPosition: 0.75, templateBeatType: 'act-2-turn' },
        { id: 'mp-9', label: 'Climax Build', position: 0.85, tension: 0.78 },
        { id: 'mp-10', label: 'Climax', position: 0.9, tension: 0.95, expectedPosition: 0.88, templateBeatType: 'climax' },
        { id: 'mp-11', label: 'Resolution', position: 0.97, tension: 0.2 },
      ],
    },
    {
      id: 'char-a',
      name: 'Character A Arc',
      color: '#f59e0b',
      templateId: 'three-act',
      beats: [
        { id: 'ca-1', label: 'Ordinary World', position: 0.0, tension: 0.1, expectedPosition: 0.0, templateBeatType: 'opening' },
        { id: 'ca-2', label: 'Call to Adventure', position: 0.12, tension: 0.25, expectedPosition: 0.1, templateBeatType: 'inciting-incident' },
        { id: 'ca-3', label: 'Refusal of Call', position: 0.18, tension: 0.2 },
        { id: 'ca-4', label: 'Meeting the Mentor', position: 0.25, tension: 0.38 },
        { id: 'ca-5', label: 'Tests & Allies', position: 0.35, tension: 0.48 },
        { id: 'ca-6', label: 'Inner Cave', position: 0.5, tension: 0.6, expectedPosition: 0.5, templateBeatType: 'midpoint' },
        { id: 'ca-7', label: 'Ordeal', position: 0.65, tension: 0.82 },
        { id: 'ca-8', label: 'Reward', position: 0.73, tension: 0.55, expectedPosition: 0.75, templateBeatType: 'act-2-turn' },
        { id: 'ca-9', label: 'Resurrection', position: 0.88, tension: 0.9, expectedPosition: 0.88, templateBeatType: 'climax' },
        { id: 'ca-10', label: 'Return with Elixir', position: 0.96, tension: 0.3 },
      ],
    },
    {
      id: 'love-subplot',
      name: 'Love Subplot',
      color: '#ec4899',
      beats: [
        { id: 'ls-1', label: 'First Meeting', position: 0.05, tension: 0.2 },
        { id: 'ls-2', label: 'Attraction', position: 0.15, tension: 0.35 },
        { id: 'ls-3', label: 'First Date', position: 0.22, tension: 0.45 },
        { id: 'ls-4', label: 'Growing Close', position: 0.35, tension: 0.58 },
        { id: 'ls-5', label: 'Vulnerability', position: 0.45, tension: 0.7 },
        { id: 'ls-6', label: 'Betrayal / Misunderstanding', position: 0.55, tension: 0.25 },
        { id: 'ls-7', label: 'Separation', position: 0.65, tension: 0.15 },
        { id: 'ls-8', label: 'Grand Gesture', position: 0.82, tension: 0.75 },
        { id: 'ls-9', label: 'Reunion', position: 0.92, tension: 0.85 },
      ],
    },
  ],
  templates: [
    {
      id: 'three-act',
      name: 'Three-Act Structure',
      beats: [
        { type: 'opening', label: 'Opening', expectedPosition: 0.0, tolerance: 0.05 },
        { type: 'inciting-incident', label: 'Inciting Incident', expectedPosition: 0.1, tolerance: 0.05 },
        { type: 'midpoint', label: 'Midpoint', expectedPosition: 0.5, tolerance: 0.07 },
        { type: 'act-2-turn', label: 'Act 2 Turn', expectedPosition: 0.75, tolerance: 0.05 },
        { type: 'climax', label: 'Climax', expectedPosition: 0.88, tolerance: 0.06 },
      ],
    },
  ],
}
