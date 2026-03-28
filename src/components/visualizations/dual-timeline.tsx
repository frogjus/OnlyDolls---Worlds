'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimelineEvent {
  id: string
  title: string
  description: string
  fabulaStart: number
  fabulaEnd: number
  sjuzhetStart: number
  sjuzhetEnd: number
  level: 'series' | 'season' | 'episode' | 'scene' | 'beat'
  laneId: string
  characterIds: string[]
  category: string
  color: string
}

export interface TimelineLane {
  id: string
  label: string
  color: string
  timeline: 'fabula' | 'sjuzhet'
  order: number
}

export interface DualTimelineData {
  events: TimelineEvent[]
  lanes: TimelineLane[]
}

export interface DualTimelineProps {
  data?: DualTimelineData
  onEventSelect?: (eventId: string) => void
  onEventCreate?: (position: {
    timeline: 'fabula' | 'sjuzhet'
    start: number
  }) => void
  readOnly?: boolean
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const LANE_HEADER_WIDTH = 140
const LANE_HEIGHT = 52
const LANE_GAP = 2
const GUTTER_HEIGHT = 80
const EVENT_PADDING = 3
const EVENT_RADIUS = 4
const AXIS_HEIGHT = 28
const MIN_EVENT_WIDTH = 18
const TOOLTIP_OFFSET = 12

// ---------------------------------------------------------------------------
// Color helpers (CSS custom property aware for dark mode)
// ---------------------------------------------------------------------------

const cssVar = (name: string, fallback: string) =>
  `var(${name}, ${fallback})`

const COLORS = {
  bg: cssVar('--dual-tl-bg', '#09090b'),
  surface: cssVar('--dual-tl-surface', '#18181b'),
  border: cssVar('--dual-tl-border', '#27272a'),
  text: cssVar('--dual-tl-text', '#fafafa'),
  textMuted: cssVar('--dual-tl-text-muted', '#a1a1aa'),
  gutterBg: cssVar('--dual-tl-gutter', '#0c0c0f'),
  connector: cssVar('--dual-tl-connector', '#6366f1'),
  connectorMuted: cssVar('--dual-tl-connector-muted', 'rgba(99,102,241,0.25)'),
  selection: cssVar('--dual-tl-selection', '#6366f1'),
  headerBg: cssVar('--dual-tl-header-bg', '#111113'),
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function laneBlockHeight(count: number) {
  return count * LANE_HEIGHT + Math.max(0, count - 1) * LANE_GAP
}

function clampText(text: string, maxLen: number) {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + '\u2026' : text
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DualTimeline({
  data,
  onEventSelect,
  onEventCreate,
  readOnly = false,
}: DualTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const [size, setSize] = useState({ width: 800, height: 600 })
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [collapsedLanes, setCollapsedLanes] = useState<Set<string>>(new Set())

  // Stable reference for transform so D3 callbacks always read the latest
  const transformRef = useRef(d3.zoomIdentity)

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------

  const effective = useMemo(() => {
    if (!data) return null

    const fabulaLanes = data.lanes
      .filter((l) => l.timeline === 'fabula')
      .sort((a, b) => a.order - b.order)
    const sjuzhetLanes = data.lanes
      .filter((l) => l.timeline === 'sjuzhet')
      .sort((a, b) => a.order - b.order)

    const visibleFabula = fabulaLanes.filter((l) => !collapsedLanes.has(l.id))
    const visibleSjuzhet = sjuzhetLanes.filter(
      (l) => !collapsedLanes.has(l.id)
    )

    // Compute vertical layout
    const fabulaTop = AXIS_HEIGHT
    const fabulaHeight = laneBlockHeight(
      Math.max(visibleFabula.length, 1)
    )
    const gutterTop = fabulaTop + fabulaHeight
    const sjuzhetTop = gutterTop + GUTTER_HEIGHT
    const sjuzhetHeight = laneBlockHeight(
      Math.max(visibleSjuzhet.length, 1)
    )
    const totalHeight = sjuzhetTop + sjuzhetHeight + AXIS_HEIGHT

    // Build lane-y lookup
    const laneY = new Map<string, number>()
    visibleFabula.forEach((l, i) => {
      laneY.set(l.id, fabulaTop + i * (LANE_HEIGHT + LANE_GAP))
    })
    visibleSjuzhet.forEach((l, i) => {
      laneY.set(l.id, sjuzhetTop + i * (LANE_HEIGHT + LANE_GAP))
    })

    // Determine domain extents
    let minT = Infinity
    let maxT = -Infinity
    for (const e of data.events) {
      minT = Math.min(minT, e.fabulaStart, e.sjuzhetStart)
      maxT = Math.max(maxT, e.fabulaEnd, e.sjuzhetEnd)
    }
    if (!isFinite(minT)) {
      minT = 0
      maxT = 100
    }
    const pad = (maxT - minT) * 0.05 || 5
    minT -= pad
    maxT += pad

    return {
      fabulaLanes,
      sjuzhetLanes,
      visibleFabula,
      visibleSjuzhet,
      fabulaTop,
      fabulaHeight,
      gutterTop,
      sjuzhetTop,
      sjuzhetHeight,
      totalHeight,
      laneY,
      domain: [minT, maxT] as [number, number],
    }
  }, [data, collapsedLanes])

  // -----------------------------------------------------------------------
  // ResizeObserver
  // -----------------------------------------------------------------------

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) {
        setSize({ width, height })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // -----------------------------------------------------------------------
  // Toggle lane
  // -----------------------------------------------------------------------

  const toggleLane = useCallback((laneId: string) => {
    setCollapsedLanes((prev) => {
      const next = new Set(prev)
      if (next.has(laneId)) next.delete(laneId)
      else next.add(laneId)
      return next
    })
  }, [])

  // -----------------------------------------------------------------------
  // D3 render
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!svgRef.current || !effective || !data) return

    const { width } = size
    const chartWidth = width - LANE_HEADER_WIDTH
    if (chartWidth < 40) return

    const svg = d3.select(svgRef.current)

    // Clear previous render
    svg.selectAll('*').remove()

    // Scales
    const xScaleBase = d3
      .scaleLinear()
      .domain(effective.domain)
      .range([0, chartWidth])

    // We'll apply the current zoom transform to the scale
    const currentTransform = transformRef.current
    const xScale = currentTransform.rescaleX(xScaleBase)

    const defs = svg.append('defs')

    // Clip path for chart area
    defs
      .append('clipPath')
      .attr('id', 'chart-clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', chartWidth)
      .attr('height', effective.totalHeight)

    // ---- Lane headers (fixed left) ----
    const headerGroup = svg.append('g').attr('class', 'lane-headers')

    const allLanes = [
      ...effective.fabulaLanes.map((l) => ({ ...l, section: 'fabula' as const })),
      ...effective.sjuzhetLanes.map((l) => ({ ...l, section: 'sjuzhet' as const })),
    ]

    // Section labels
    headerGroup
      .append('text')
      .attr('x', 10)
      .attr('y', effective.fabulaTop - 4)
      .attr('fill', COLORS.textMuted)
      .attr('font-size', 10)
      .attr('font-weight', 600)
      .attr('text-transform', 'uppercase')
      .attr('letter-spacing', '0.05em')
      .text('FABULA (chronological)')

    headerGroup
      .append('text')
      .attr('x', 10)
      .attr('y', effective.sjuzhetTop - 4)
      .attr('fill', COLORS.textMuted)
      .attr('font-size', 10)
      .attr('font-weight', 600)
      .text('SJUZHET (narrative)')

    for (const lane of allLanes) {
      const y = effective.laneY.get(lane.id)
      const collapsed = collapsedLanes.has(lane.id)

      if (y === undefined && !collapsed) continue

      const headerY = collapsed
        ? lane.section === 'fabula'
          ? effective.fabulaTop
          : effective.sjuzhetTop
        : y!

      const g = headerGroup
        .append('g')
        .attr('transform', `translate(0, ${headerY})`)
        .style('cursor', 'pointer')
        .on('click', () => toggleLane(lane.id))

      g.append('rect')
        .attr('width', LANE_HEADER_WIDTH - 4)
        .attr('height', collapsed ? 18 : LANE_HEIGHT)
        .attr('rx', 3)
        .attr('fill', COLORS.headerBg)
        .attr('stroke', COLORS.border)
        .attr('stroke-width', 0.5)

      // Collapse indicator
      g.append('text')
        .attr('x', 8)
        .attr('y', collapsed ? 13 : LANE_HEIGHT / 2 + 1)
        .attr('dominant-baseline', 'middle')
        .attr('font-size', 9)
        .attr('fill', COLORS.textMuted)
        .text(collapsed ? '\u25B6' : '\u25BC')

      // Lane color dot
      g.append('circle')
        .attr('cx', 24)
        .attr('cy', collapsed ? 9 : LANE_HEIGHT / 2)
        .attr('r', 4)
        .attr('fill', lane.color)

      // Lane label
      g.append('text')
        .attr('x', 34)
        .attr('y', collapsed ? 13 : LANE_HEIGHT / 2 + 1)
        .attr('dominant-baseline', 'middle')
        .attr('font-size', 11)
        .attr('fill', COLORS.text)
        .text(clampText(lane.label, 12))
    }

    // ---- Chart area (scrollable/zoomable) ----
    const chartGroup = svg
      .append('g')
      .attr('transform', `translate(${LANE_HEADER_WIDTH}, 0)`)

    const clipped = chartGroup
      .append('g')
      .attr('clip-path', 'url(#chart-clip)')

    // Lane backgrounds
    for (const lane of [
      ...effective.visibleFabula,
      ...effective.visibleSjuzhet,
    ]) {
      const y = effective.laneY.get(lane.id)
      if (y === undefined) continue
      clipped
        .append('rect')
        .attr('x', 0)
        .attr('y', y)
        .attr('width', chartWidth)
        .attr('height', LANE_HEIGHT)
        .attr('fill', COLORS.surface)
        .attr('rx', 2)
    }

    // Gutter background
    clipped
      .append('rect')
      .attr('x', 0)
      .attr('y', effective.gutterTop)
      .attr('width', chartWidth)
      .attr('height', GUTTER_HEIGHT)
      .attr('fill', COLORS.gutterBg)

    clipped
      .append('text')
      .attr('x', chartWidth / 2)
      .attr('y', effective.gutterTop + GUTTER_HEIGHT / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', COLORS.textMuted)
      .attr('font-size', 9)
      .attr('opacity', 0.5)
      .text('connections')

    // ---- Axes ----
    const topAxis = d3.axisTop(xScale).ticks(Math.floor(chartWidth / 100))
    const bottomAxis = d3
      .axisBottom(xScale)
      .ticks(Math.floor(chartWidth / 100))

    chartGroup
      .append('g')
      .attr('transform', `translate(0, ${AXIS_HEIGHT})`)
      .call(topAxis)
      .call((g) => {
        g.select('.domain').attr('stroke', COLORS.border)
        g.selectAll('.tick line').attr('stroke', COLORS.border)
        g.selectAll('.tick text')
          .attr('fill', COLORS.textMuted)
          .attr('font-size', 10)
      })

    chartGroup
      .append('g')
      .attr(
        'transform',
        `translate(0, ${effective.sjuzhetTop + effective.sjuzhetHeight})`
      )
      .call(bottomAxis)
      .call((g) => {
        g.select('.domain').attr('stroke', COLORS.border)
        g.selectAll('.tick line').attr('stroke', COLORS.border)
        g.selectAll('.tick text')
          .attr('fill', COLORS.textMuted)
          .attr('font-size', 10)
      })

    // ---- Connectors (bezier curves in gutter) ----
    const connectorGroup = clipped.append('g').attr('class', 'connectors')

    for (const event of data.events) {
      const fabulaLaneY = effective.laneY.get(
        effective.visibleFabula.find((l) =>
          data.events.some(
            (e) =>
              e.id === event.id &&
              effective.fabulaLanes.some((fl) => fl.id === e.laneId)
          )
        )?.id ?? ''
      )
      const sjuzhetLaneY = effective.laneY.get(
        effective.visibleSjuzhet.find((l) =>
          data.events.some(
            (e) =>
              e.id === event.id &&
              effective.sjuzhetLanes.some((sl) => sl.id === e.laneId)
          )
        )?.id ?? ''
      )

      // Find the fabula and sjuzhet lane for this event
      const fLane = data.lanes.find(
        (l) => l.timeline === 'fabula' && effective.laneY.has(l.id)
      )
      const sLane = data.lanes.find(
        (l) => l.timeline === 'sjuzhet' && effective.laneY.has(l.id)
      )

      if (!fLane || !sLane) continue

      // Find which lane this event should be in per timeline
      const eventFabulaLane = data.lanes.find(
        (l) => l.timeline === 'fabula'
      )
      const eventSjuzhetLane = data.lanes.find(
        (l) => l.timeline === 'sjuzhet'
      )

      // Calculate mid-x for each timeline representation
      const fMidX =
        xScale(event.fabulaStart) +
        (xScale(event.fabulaEnd) - xScale(event.fabulaStart)) / 2
      const sMidX =
        xScale(event.sjuzhetStart) +
        (xScale(event.sjuzhetEnd) - xScale(event.sjuzhetStart)) / 2

      // Get y positions - bottom of fabula region, top of sjuzhet region
      const fY = effective.gutterTop
      const sY = effective.gutterTop + GUTTER_HEIGHT

      const isSelected = selectedEventId === event.id
      const strokeColor = isSelected ? COLORS.connector : COLORS.connectorMuted
      const strokeWidth = isSelected ? 2 : 1

      const cp1Y = fY + GUTTER_HEIGHT * 0.35
      const cp2Y = sY - GUTTER_HEIGHT * 0.35

      connectorGroup
        .append('path')
        .attr(
          'd',
          `M ${fMidX} ${fY} C ${fMidX} ${cp1Y}, ${sMidX} ${cp2Y}, ${sMidX} ${sY}`
        )
        .attr('fill', 'none')
        .attr('stroke', strokeColor)
        .attr('stroke-width', strokeWidth)
        .attr('stroke-dasharray', isSelected ? 'none' : '4 3')
        .attr('data-event-id', event.id)
    }

    // ---- Events ----
    const eventsGroup = clipped.append('g').attr('class', 'events')

    // Render events in both timelines
    for (const event of data.events) {
      // Draw in fabula lanes
      for (const lane of effective.visibleFabula) {
        const y = effective.laneY.get(lane.id)
        if (y === undefined) continue

        // Check if event belongs to a fabula lane by checking its laneId or by convention
        // Events appear in the first visible lane of each timeline for simplicity
        // A more sophisticated approach would assign events to specific lanes
        const laneEvents = data.events.filter(
          (e) =>
            data.lanes.some(
              (l) => l.id === e.laneId && l.timeline === 'fabula'
            ) && e.laneId === lane.id
        )
        if (!laneEvents.includes(event)) continue

        const x1 = xScale(event.fabulaStart)
        const x2 = xScale(event.fabulaEnd)
        const w = Math.max(x2 - x1, MIN_EVENT_WIDTH)
        const isSelected = selectedEventId === event.id

        const g = eventsGroup
          .append('g')
          .attr(
            'transform',
            `translate(${x1}, ${y + EVENT_PADDING})`
          )
          .style('cursor', 'pointer')
          .on('click', (e: MouseEvent) => {
            e.stopPropagation()
            setSelectedEventId(event.id)
            onEventSelect?.(event.id)
          })
          .on('mouseenter', (e: MouseEvent) => {
            showTooltip(e, event)
          })
          .on('mouseleave', hideTooltip)

        g.append('rect')
          .attr('width', w)
          .attr('height', LANE_HEIGHT - EVENT_PADDING * 2)
          .attr('rx', EVENT_RADIUS)
          .attr('fill', event.color)
          .attr('opacity', isSelected ? 1 : 0.8)
          .attr(
            'stroke',
            isSelected ? COLORS.selection : 'transparent'
          )
          .attr('stroke-width', isSelected ? 2 : 0)

        if (w > 30) {
          g.append('text')
            .attr('x', 6)
            .attr('y', (LANE_HEIGHT - EVENT_PADDING * 2) / 2 + 1)
            .attr('dominant-baseline', 'middle')
            .attr('font-size', 10)
            .attr('font-weight', 500)
            .attr('fill', '#fff')
            .text(clampText(event.title, Math.floor(w / 6)))
        }
      }

      // Draw in sjuzhet lanes
      for (const lane of effective.visibleSjuzhet) {
        const y = effective.laneY.get(lane.id)
        if (y === undefined) continue

        const laneEvents = data.events.filter(
          (e) =>
            data.lanes.some(
              (l) => l.id === e.laneId && l.timeline === 'sjuzhet'
            ) && e.laneId === lane.id
        )
        if (!laneEvents.includes(event)) continue

        const x1 = xScale(event.sjuzhetStart)
        const x2 = xScale(event.sjuzhetEnd)
        const w = Math.max(x2 - x1, MIN_EVENT_WIDTH)
        const isSelected = selectedEventId === event.id

        const g = eventsGroup
          .append('g')
          .attr(
            'transform',
            `translate(${x1}, ${y + EVENT_PADDING})`
          )
          .style('cursor', 'pointer')
          .on('click', (e: MouseEvent) => {
            e.stopPropagation()
            setSelectedEventId(event.id)
            onEventSelect?.(event.id)
          })
          .on('mouseenter', (e: MouseEvent) => {
            showTooltip(e, event)
          })
          .on('mouseleave', hideTooltip)

        g.append('rect')
          .attr('width', w)
          .attr('height', LANE_HEIGHT - EVENT_PADDING * 2)
          .attr('rx', EVENT_RADIUS)
          .attr('fill', event.color)
          .attr('opacity', isSelected ? 1 : 0.8)
          .attr(
            'stroke',
            isSelected ? COLORS.selection : 'transparent'
          )
          .attr('stroke-width', isSelected ? 2 : 0)

        // Dashed border to distinguish sjuzhet events visually
        g.append('rect')
          .attr('width', w)
          .attr('height', LANE_HEIGHT - EVENT_PADDING * 2)
          .attr('rx', EVENT_RADIUS)
          .attr('fill', 'none')
          .attr('stroke', 'rgba(255,255,255,0.15)')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3 2')

        if (w > 30) {
          g.append('text')
            .attr('x', 6)
            .attr('y', (LANE_HEIGHT - EVENT_PADDING * 2) / 2 + 1)
            .attr('dominant-baseline', 'middle')
            .attr('font-size', 10)
            .attr('font-weight', 500)
            .attr('fill', '#fff')
            .text(clampText(event.title, Math.floor(w / 6)))
        }
      }
    }

    // ---- Click on empty area to create event ----
    if (!readOnly && onEventCreate) {
      clipped
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', chartWidth)
        .attr('height', effective.totalHeight)
        .attr('fill', 'transparent')
        .lower()
        .on('dblclick', (e: MouseEvent) => {
          const [px, py] = d3.pointer(e)
          const time = xScale.invert(px)
          const timeline: 'fabula' | 'sjuzhet' =
            py < effective.gutterTop ? 'fabula' : 'sjuzhet'
          onEventCreate({ timeline, start: time })
        })
    }

    // Click on bg to deselect
    clipped.on('click', () => {
      setSelectedEventId(null)
    })

    // ---- Zoom behavior ----
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 20])
      .translateExtent([
        [-chartWidth * 0.5, 0],
        [chartWidth * 2, effective.totalHeight],
      ])
      .extent([
        [0, 0],
        [chartWidth, effective.totalHeight],
      ])
      .filter((event) => {
        // Allow wheel zoom and drag pan, but not double-click zoom
        if (event.type === 'dblclick') return false
        return true
      })
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        // Only apply horizontal transform
        const t = event.transform
        const constrainedTransform = d3.zoomIdentity
          .translate(t.x, 0)
          .scale(t.k)
        transformRef.current = constrainedTransform
        // Re-render by setting state (triggers useEffect)
        setSize((prev) => ({ ...prev }))
      })

    svg.call(zoom)
    // Apply the current transform so it persists across re-renders
    svg.call(zoom.transform, transformRef.current)

    // ---- Tooltip helpers (captured in closure) ----
    function showTooltip(mouseEvent: MouseEvent, event: TimelineEvent) {
      const tip = tooltipRef.current
      if (!tip) return
      tip.innerHTML = `
        <div style="font-weight:600;margin-bottom:2px">${event.title}</div>
        <div style="font-size:11px;color:#a1a1aa;margin-bottom:4px">${event.category} &middot; ${event.level}</div>
        <div style="font-size:11px">${event.description}</div>
        <div style="font-size:10px;color:#71717a;margin-top:4px">
          Fabula: ${event.fabulaStart}\u2013${event.fabulaEnd} &nbsp;|&nbsp;
          Sjuzhet: ${event.sjuzhetStart}\u2013${event.sjuzhetEnd}
        </div>
      `
      tip.style.display = 'block'
      const x = mouseEvent.clientX + TOOLTIP_OFFSET
      const y = mouseEvent.clientY + TOOLTIP_OFFSET
      tip.style.left = `${x}px`
      tip.style.top = `${y}px`
    }

    function hideTooltip() {
      const tip = tooltipRef.current
      if (!tip) return
      tip.style.display = 'none'
    }

    // Cleanup: remove zoom listener
    return () => {
      svg.on('.zoom', null)
    }
  }, [
    data,
    effective,
    size,
    selectedEventId,
    collapsedLanes,
    onEventSelect,
    onEventCreate,
    readOnly,
    toggleLane,
  ])

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const svgHeight = effective?.totalHeight ?? 400

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{ background: COLORS.bg }}
    >
      <svg
        ref={svgRef}
        width={size.width}
        height={Math.max(svgHeight, size.height)}
        style={{ display: 'block' }}
      />
      {/* Tooltip portal */}
      <div
        ref={tooltipRef}
        style={{
          display: 'none',
          position: 'fixed',
          zIndex: 50,
          maxWidth: 280,
          padding: '8px 12px',
          borderRadius: 6,
          fontSize: 12,
          lineHeight: 1.4,
          pointerEvents: 'none',
          background: '#1c1c1f',
          border: '1px solid #333',
          color: '#fafafa',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const FABULA_LANE_MAIN: TimelineLane = {
  id: 'fabula-main',
  label: 'Main Plot',
  color: '#6366f1',
  timeline: 'fabula',
  order: 0,
}

const FABULA_LANE_SUB: TimelineLane = {
  id: 'fabula-sub',
  label: 'Subplot',
  color: '#f59e0b',
  timeline: 'fabula',
  order: 1,
}

const SJUZHET_LANE_MAIN: TimelineLane = {
  id: 'sjuzhet-main',
  label: 'Main Plot',
  color: '#6366f1',
  timeline: 'sjuzhet',
  order: 0,
}

const SJUZHET_LANE_SUB: TimelineLane = {
  id: 'sjuzhet-sub',
  label: 'Subplot',
  color: '#f59e0b',
  timeline: 'sjuzhet',
  order: 1,
}

export const MOCK_DATA: DualTimelineData = {
  lanes: [FABULA_LANE_MAIN, FABULA_LANE_SUB, SJUZHET_LANE_MAIN, SJUZHET_LANE_SUB],
  events: [
    {
      id: 'e1',
      title: 'Opening Scene',
      description: 'The detective arrives at a rain-soaked crime scene.',
      fabulaStart: 0,
      fabulaEnd: 8,
      sjuzhetStart: 0,
      sjuzhetEnd: 8,
      level: 'scene',
      laneId: 'fabula-main',
      characterIds: ['c1'],
      category: 'Inciting',
      color: '#6366f1',
    },
    {
      id: 'e1s',
      title: 'Opening Scene',
      description: 'The detective arrives at a rain-soaked crime scene.',
      fabulaStart: 0,
      fabulaEnd: 8,
      sjuzhetStart: 0,
      sjuzhetEnd: 8,
      level: 'scene',
      laneId: 'sjuzhet-main',
      characterIds: ['c1'],
      category: 'Inciting',
      color: '#6366f1',
    },
    {
      id: 'e2',
      title: 'Victim\'s Backstory',
      description:
        'Flashback: the victim meets the suspect months earlier. Presented early in fabula but appears as flashback in sjuzhet.',
      fabulaStart: -30,
      fabulaEnd: -22,
      sjuzhetStart: 10,
      sjuzhetEnd: 16,
      level: 'scene',
      laneId: 'fabula-main',
      characterIds: ['c2', 'c3'],
      category: 'Backstory',
      color: '#a78bfa',
    },
    {
      id: 'e2s',
      title: 'Victim\'s Backstory (flashback)',
      description:
        'Flashback: the victim meets the suspect months earlier.',
      fabulaStart: -30,
      fabulaEnd: -22,
      sjuzhetStart: 10,
      sjuzhetEnd: 16,
      level: 'scene',
      laneId: 'sjuzhet-main',
      characterIds: ['c2', 'c3'],
      category: 'Backstory',
      color: '#a78bfa',
    },
    {
      id: 'e3',
      title: 'Witness Interview',
      description: 'Key witness provides contradictory testimony.',
      fabulaStart: 10,
      fabulaEnd: 18,
      sjuzhetStart: 18,
      sjuzhetEnd: 26,
      level: 'scene',
      laneId: 'fabula-main',
      characterIds: ['c1', 'c4'],
      category: 'Investigation',
      color: '#22d3ee',
    },
    {
      id: 'e3s',
      title: 'Witness Interview',
      description: 'Key witness provides contradictory testimony.',
      fabulaStart: 10,
      fabulaEnd: 18,
      sjuzhetStart: 18,
      sjuzhetEnd: 26,
      level: 'scene',
      laneId: 'sjuzhet-main',
      characterIds: ['c1', 'c4'],
      category: 'Investigation',
      color: '#22d3ee',
    },
    {
      id: 'e4',
      title: 'Secret Meeting',
      description:
        'Subplot: two suspects meet in secret. Chronologically early but revealed late.',
      fabulaStart: -10,
      fabulaEnd: -4,
      sjuzhetStart: 60,
      sjuzhetEnd: 68,
      level: 'scene',
      laneId: 'fabula-sub',
      characterIds: ['c3', 'c5'],
      category: 'Conspiracy',
      color: '#f43f5e',
    },
    {
      id: 'e4s',
      title: 'Secret Meeting (reveal)',
      description:
        'Subplot: the secret meeting is finally revealed to the audience.',
      fabulaStart: -10,
      fabulaEnd: -4,
      sjuzhetStart: 60,
      sjuzhetEnd: 68,
      level: 'scene',
      laneId: 'sjuzhet-sub',
      characterIds: ['c3', 'c5'],
      category: 'Conspiracy',
      color: '#f43f5e',
    },
    {
      id: 'e5',
      title: 'Lab Results',
      description: 'Forensic lab delivers unexpected DNA match.',
      fabulaStart: 20,
      fabulaEnd: 24,
      sjuzhetStart: 28,
      sjuzhetEnd: 32,
      level: 'beat',
      laneId: 'fabula-main',
      characterIds: ['c1'],
      category: 'Revelation',
      color: '#10b981',
    },
    {
      id: 'e5s',
      title: 'Lab Results',
      description: 'Forensic lab delivers unexpected DNA match.',
      fabulaStart: 20,
      fabulaEnd: 24,
      sjuzhetStart: 28,
      sjuzhetEnd: 32,
      level: 'beat',
      laneId: 'sjuzhet-main',
      characterIds: ['c1'],
      category: 'Revelation',
      color: '#10b981',
    },
    {
      id: 'e6',
      title: 'Romantic Subplot',
      description: 'Detective and journalist develop a complicated bond.',
      fabulaStart: 15,
      fabulaEnd: 26,
      sjuzhetStart: 34,
      sjuzhetEnd: 44,
      level: 'episode',
      laneId: 'fabula-sub',
      characterIds: ['c1', 'c6'],
      category: 'Romance',
      color: '#ec4899',
    },
    {
      id: 'e6s',
      title: 'Romantic Subplot',
      description: 'Detective and journalist develop a complicated bond.',
      fabulaStart: 15,
      fabulaEnd: 26,
      sjuzhetStart: 34,
      sjuzhetEnd: 44,
      level: 'episode',
      laneId: 'sjuzhet-sub',
      characterIds: ['c1', 'c6'],
      category: 'Romance',
      color: '#ec4899',
    },
    {
      id: 'e7',
      title: 'The Chase',
      description: 'Suspect flees; intense pursuit through the docks.',
      fabulaStart: 30,
      fabulaEnd: 36,
      sjuzhetStart: 46,
      sjuzhetEnd: 52,
      level: 'scene',
      laneId: 'fabula-main',
      characterIds: ['c1', 'c3'],
      category: 'Action',
      color: '#f97316',
    },
    {
      id: 'e7s',
      title: 'The Chase',
      description: 'Suspect flees; intense pursuit through the docks.',
      fabulaStart: 30,
      fabulaEnd: 36,
      sjuzhetStart: 46,
      sjuzhetEnd: 52,
      level: 'scene',
      laneId: 'sjuzhet-main',
      characterIds: ['c1', 'c3'],
      category: 'Action',
      color: '#f97316',
    },
    {
      id: 'e8',
      title: 'Childhood Trauma',
      description:
        'Flash-forward reveals the detective\'s childhood trauma that connects to the case.',
      fabulaStart: -60,
      fabulaEnd: -50,
      sjuzhetStart: 54,
      sjuzhetEnd: 58,
      level: 'scene',
      laneId: 'fabula-main',
      characterIds: ['c1'],
      category: 'Backstory',
      color: '#a78bfa',
    },
    {
      id: 'e8s',
      title: 'Childhood Trauma (flashback)',
      description:
        'Flash-forward reveals the detective\'s childhood trauma that connects to the case.',
      fabulaStart: -60,
      fabulaEnd: -50,
      sjuzhetStart: 54,
      sjuzhetEnd: 58,
      level: 'scene',
      laneId: 'sjuzhet-main',
      characterIds: ['c1'],
      category: 'Backstory',
      color: '#a78bfa',
    },
    {
      id: 'e9',
      title: 'Betrayal',
      description: 'Trusted ally is revealed as double agent.',
      fabulaStart: 40,
      fabulaEnd: 46,
      sjuzhetStart: 70,
      sjuzhetEnd: 76,
      level: 'scene',
      laneId: 'fabula-sub',
      characterIds: ['c4', 'c5'],
      category: 'Twist',
      color: '#eab308',
    },
    {
      id: 'e9s',
      title: 'Betrayal',
      description: 'Trusted ally is revealed as double agent.',
      fabulaStart: 40,
      fabulaEnd: 46,
      sjuzhetStart: 70,
      sjuzhetEnd: 76,
      level: 'scene',
      laneId: 'sjuzhet-sub',
      characterIds: ['c4', 'c5'],
      category: 'Twist',
      color: '#eab308',
    },
    {
      id: 'e10',
      title: 'Confrontation',
      description: 'Detective confronts the real killer in the finale.',
      fabulaStart: 50,
      fabulaEnd: 60,
      sjuzhetStart: 80,
      sjuzhetEnd: 90,
      level: 'scene',
      laneId: 'fabula-main',
      characterIds: ['c1', 'c5'],
      category: 'Climax',
      color: '#ef4444',
    },
    {
      id: 'e10s',
      title: 'Confrontation',
      description: 'Detective confronts the real killer in the finale.',
      fabulaStart: 50,
      fabulaEnd: 60,
      sjuzhetStart: 80,
      sjuzhetEnd: 90,
      level: 'scene',
      laneId: 'sjuzhet-main',
      characterIds: ['c1', 'c5'],
      category: 'Climax',
      color: '#ef4444',
    },
    {
      id: 'e11',
      title: 'Epilogue',
      description: 'Six months later: detective reflects on the case.',
      fabulaStart: 80,
      fabulaEnd: 86,
      sjuzhetStart: 92,
      sjuzhetEnd: 98,
      level: 'scene',
      laneId: 'fabula-main',
      characterIds: ['c1'],
      category: 'Resolution',
      color: '#64748b',
    },
    {
      id: 'e11s',
      title: 'Epilogue',
      description: 'Six months later: detective reflects on the case.',
      fabulaStart: 80,
      fabulaEnd: 86,
      sjuzhetStart: 92,
      sjuzhetEnd: 98,
      level: 'scene',
      laneId: 'sjuzhet-main',
      characterIds: ['c1'],
      category: 'Resolution',
      color: '#64748b',
    },
    {
      id: 'e12',
      title: 'Evidence Planted',
      description: 'Unknown figure plants evidence at the scene. Chronologically first, revealed last.',
      fabulaStart: -5,
      fabulaEnd: 0,
      sjuzhetStart: 88,
      sjuzhetEnd: 92,
      level: 'beat',
      laneId: 'fabula-sub',
      characterIds: ['c5'],
      category: 'Conspiracy',
      color: '#f43f5e',
    },
    {
      id: 'e12s',
      title: 'Evidence Planted (reveal)',
      description: 'The audience finally sees who planted the evidence.',
      fabulaStart: -5,
      fabulaEnd: 0,
      sjuzhetStart: 88,
      sjuzhetEnd: 92,
      level: 'beat',
      laneId: 'sjuzhet-sub',
      characterIds: ['c5'],
      category: 'Conspiracy',
      color: '#f43f5e',
    },
  ],
}
