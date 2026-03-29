'use client'

import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Handle,
  Position,
  MarkerType,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  BaseEdge,
  getBezierPath,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from 'react'
import * as d3 from 'd3'
import {
  VizShell,
  type FilterDimension,
  type FilterValue,
} from '@/components/visualizations/viz-shell'

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface CharacterNode {
  id: string
  name: string
  avatarUrl?: string
  importance: number
  factionId?: string
  traits: string[]
  status: 'alive' | 'dead' | 'unknown'
}

export type RelationshipType =
  | 'family'
  | 'romantic'
  | 'friendship'
  | 'rivalry'
  | 'professional'
  | 'mentor'
  | 'custom'

export interface CharacterRelationship {
  id: string
  sourceId: string
  targetId: string
  type: RelationshipType
  customLabel?: string
  weight: number
  sentiment: number
  bidirectional: boolean
}

export interface Faction {
  id: string
  name: string
  color: string
}

export interface CharacterGraphData {
  characters: CharacterNode[]
  relationships: CharacterRelationship[]
  factions?: Faction[]
}

export interface CharacterGraphProps {
  data?: CharacterGraphData
  onCharacterSelect?: (characterId: string) => void
  onRelationshipSelect?: (relationshipId: string) => void
  readOnly?: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  family: '#3b82f6',
  romantic: '#ec4899',
  friendship: '#22c55e',
  rivalry: '#ef4444',
  professional: '#6b7280',
  mentor: '#a855f7',
  custom: '#f59e0b',
}

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  family: 'Family',
  romantic: 'Romantic',
  friendship: 'Friendship',
  rivalry: 'Rivalry',
  professional: 'Professional',
  mentor: 'Mentor',
  custom: 'Custom',
}

const STATUS_RING: Record<CharacterNode['status'], string> = {
  alive: 'var(--color-foreground, #e5e7eb)',
  dead: '#6b7280',
  unknown: '#f59e0b',
}

const NODE_MIN_SIZE = 40
const NODE_MAX_SIZE = 80

function nodeSize(importance: number): number {
  return NODE_MIN_SIZE + importance * (NODE_MAX_SIZE - NODE_MIN_SIZE)
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ---------------------------------------------------------------------------
// Custom node: CharacterNodeComponent
// ---------------------------------------------------------------------------

interface CharacterNodeData extends Record<string, unknown> {
  character: CharacterNode
  faction?: Faction
  selected: boolean
  dimmed: boolean
  onHover: (id: string | null) => void
}

function CharacterNodeComponent({ data }: NodeProps<Node<CharacterNodeData>>) {
  const { character, faction, selected, dimmed, onHover } = data
  const size = nodeSize(character.importance)
  const ringColor = STATUS_RING[character.status]
  const bgColor = faction?.color ?? 'var(--color-muted, #374151)'

  const containerStyle: CSSProperties = {
    width: size,
    height: size + 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    opacity: dimmed ? 0.25 : 1,
    transition: 'opacity 150ms ease',
    cursor: 'pointer',
  }

  const circleStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    border: `3px solid ${selected ? '#f59e0b' : ringColor}`,
    boxShadow: selected ? '0 0 0 3px rgba(245,158,11,0.4)' : 'none',
    backgroundColor: bgColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    fontSize: size * 0.3,
    fontWeight: 700,
    color: '#fff',
    position: 'relative',
  }

  const labelStyle: CSSProperties = {
    marginTop: 4,
    fontSize: 11,
    fontWeight: 600,
    textAlign: 'center',
    maxWidth: size + 20,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: 'var(--color-foreground, #e5e7eb)',
  }

  const handleStyle: CSSProperties = {
    opacity: 0,
    width: 1,
    height: 1,
    minWidth: 0,
    minHeight: 0,
    border: 'none',
    background: 'transparent',
  }

  return (
    <div
      style={containerStyle}
      onMouseEnter={() => onHover(character.id)}
      onMouseLeave={() => onHover(null)}
    >
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <div style={circleStyle}>
        {character.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={character.avatarUrl}
            alt={character.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          initials(character.name)
        )}
        {character.status === 'dead' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: size * 0.5,
            }}
          >
            &#x2020;
          </div>
        )}
      </div>
      <div style={labelStyle}>{character.name}</div>
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Custom edge with label
// ---------------------------------------------------------------------------

interface RelEdgeData extends Record<string, unknown> {
  relationship: CharacterRelationship
  dimmed: boolean
}

function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<Edge<RelEdgeData>>) {
  const rel = data?.relationship
  const dimmed = data?.dimmed ?? false
  const color = rel ? RELATIONSHIP_COLORS[rel.type] : '#6b7280'
  const thickness = rel ? 1 + rel.weight * 4 : 2

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const label = rel?.type === 'custom' ? rel.customLabel ?? 'Custom' : RELATIONSHIP_LABELS[rel?.type ?? 'custom']

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: thickness,
          opacity: dimmed ? 0.1 : 0.8,
          transition: 'opacity 150ms ease',
        }}
      />
      {!dimmed && (
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontSize: 10,
            fill: color,
            fontWeight: 600,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {label}
        </text>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Tooltips
// ---------------------------------------------------------------------------

interface TooltipState {
  type: 'node' | 'edge'
  x: number
  y: number
  character?: CharacterNode
  faction?: Faction
  relationship?: CharacterRelationship
}

function Tooltip({ tooltip }: { tooltip: TooltipState }) {
  const style: CSSProperties = {
    position: 'fixed',
    left: tooltip.x + 12,
    top: tooltip.y + 12,
    zIndex: 50,
    background: 'var(--color-popover, #1f2937)',
    color: 'var(--color-popover-foreground, #e5e7eb)',
    border: '1px solid var(--color-border, #374151)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 12,
    maxWidth: 240,
    pointerEvents: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  }

  if (tooltip.type === 'node' && tooltip.character) {
    const c = tooltip.character
    return (
      <div style={style}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{c.name}</div>
        {tooltip.faction && (
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>
            {tooltip.faction.name}
          </div>
        )}
        <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>
          Status: {c.status}
        </div>
        {c.traits.length > 0 && (
          <div style={{ fontSize: 11, opacity: 0.7 }}>
            Traits: {c.traits.join(', ')}
          </div>
        )}
      </div>
    )
  }

  if (tooltip.type === 'edge' && tooltip.relationship) {
    const r = tooltip.relationship
    const sentimentLabel =
      r.sentiment > 0.3 ? 'Positive' : r.sentiment < -0.3 ? 'Negative' : 'Neutral'
    const sentimentColor =
      r.sentiment > 0.3 ? '#22c55e' : r.sentiment < -0.3 ? '#ef4444' : '#6b7280'
    return (
      <div style={style}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          {r.type === 'custom' ? r.customLabel ?? 'Custom' : RELATIONSHIP_LABELS[r.type]}
        </div>
        <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>
          Weight: {Math.round(r.weight * 100)}%
        </div>
        <div style={{ fontSize: 11 }}>
          Sentiment:{' '}
          <span style={{ color: sentimentColor, fontWeight: 600 }}>
            {sentimentLabel} ({r.sentiment > 0 ? '+' : ''}
            {r.sentiment.toFixed(1)})
          </span>
        </div>
      </div>
    )
  }

  return null
}

// ---------------------------------------------------------------------------
// Force layout
// ---------------------------------------------------------------------------

interface ForceNode extends d3.SimulationNodeDatum {
  id: string
}

function computeLayout(
  characters: CharacterNode[],
  relationships: CharacterRelationship[],
  width: number,
  height: number,
): Map<string, { x: number; y: number }> {
  const nodes: ForceNode[] = characters.map((c) => ({ id: c.id }))
  const links = relationships.map((r) => ({
    source: r.sourceId,
    target: r.targetId,
    weight: r.weight,
  }))

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3
        .forceLink(links)
        .id((d) => (d as ForceNode).id)
        .distance((d) => 120 - (d as { weight: number }).weight * 40)
        .strength((d) => 0.3 + (d as { weight: number }).weight * 0.5),
    )
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(60))
    .stop()

  for (let i = 0; i < 200; i++) simulation.tick()

  const positions = new Map<string, { x: number; y: number }>()
  for (const node of nodes) {
    positions.set(node.id, { x: node.x ?? 0, y: node.y ?? 0 })
  }
  return positions
}

// ---------------------------------------------------------------------------
// Inner graph (needs ReactFlowProvider parent)
// ---------------------------------------------------------------------------

const nodeTypes = { character: CharacterNodeComponent }
const edgeTypes = { relationship: RelationshipEdge }

function CharacterGraphInner({
  data,
  onCharacterSelect,
  onRelationshipSelect,
  readOnly,
}: CharacterGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { fitView } = useReactFlow()

  const graphData = data ?? MOCK_DATA
  const { characters, relationships, factions } = graphData

  const factionMap = useMemo(() => {
    const m = new Map<string, Faction>()
    for (const f of factions ?? []) m.set(f.id, f)
    return m
  }, [factions])

  // Selection & hover state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })

  // Active filters
  const [activeFilters, setActiveFilters] = useState<Record<string, FilterValue>>({})

  // ResizeObserver
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Filter dimensions
  const filterDimensions: FilterDimension[] = useMemo(() => {
    const typeCounts = new Map<RelationshipType, number>()
    for (const r of relationships) {
      typeCounts.set(r.type, (typeCounts.get(r.type) ?? 0) + 1)
    }
    return [
      {
        key: 'relationshipType',
        label: 'Relationship Type',
        type: 'multi-select' as const,
        options: (Object.keys(RELATIONSHIP_LABELS) as RelationshipType[])
          .filter((t) => typeCounts.has(t))
          .map((t) => ({
            value: t,
            label: RELATIONSHIP_LABELS[t],
            count: typeCounts.get(t) ?? 0,
          })),
      },
    ]
  }, [relationships])

  // Determine active relationship type filter
  const activeRelTypes = useMemo<Set<RelationshipType>>(() => {
    const filter = activeFilters['relationshipType']
    if (filter?.type === 'multi-select' && filter.values.length > 0) {
      return new Set(filter.values as RelationshipType[])
    }
    return new Set(Object.keys(RELATIONSHIP_LABELS) as RelationshipType[])
  }, [activeFilters])

  const filteredRelationships = useMemo(
    () => relationships.filter((r) => activeRelTypes.has(r.type)),
    [relationships, activeRelTypes],
  )

  // Compute connected set for selection highlighting
  const connectedNodeIds = useMemo(() => {
    const focusId = selectedNodeId ?? hoveredNodeId
    if (!focusId) return null
    const set = new Set<string>([focusId])
    for (const r of filteredRelationships) {
      if (r.sourceId === focusId) set.add(r.targetId)
      if (r.targetId === focusId) set.add(r.sourceId)
    }
    return set
  }, [selectedNodeId, hoveredNodeId, filteredRelationships])

  const connectedEdgeIds = useMemo(() => {
    const focusId = selectedNodeId ?? hoveredNodeId
    if (!focusId) return null
    const set = new Set<string>()
    for (const r of filteredRelationships) {
      if (r.sourceId === focusId || r.targetId === focusId) set.add(r.id)
    }
    return set
  }, [selectedNodeId, hoveredNodeId, filteredRelationships])

  // Layout via d3-force
  const positions = useMemo(
    () => computeLayout(characters, filteredRelationships, containerSize.width, containerSize.height),
    [characters, filteredRelationships, containerSize.width, containerSize.height],
  )

  // Build React Flow nodes
  const nodes: Node<CharacterNodeData>[] = useMemo(
    () =>
      characters.map((c) => {
        const pos = positions.get(c.id) ?? { x: 0, y: 0 }
        const size = nodeSize(c.importance)
        return {
          id: c.id,
          type: 'character',
          position: { x: pos.x - size / 2, y: pos.y - size / 2 },
          data: {
            character: c,
            faction: c.factionId ? factionMap.get(c.factionId) : undefined,
            selected: selectedNodeId === c.id,
            dimmed: connectedNodeIds != null && !connectedNodeIds.has(c.id),
            onHover: setHoveredNodeId,
          },
          draggable: !readOnly,
        }
      }),
    [characters, positions, factionMap, selectedNodeId, connectedNodeIds, readOnly],
  )

  // Build React Flow edges
  const edges: Edge<RelEdgeData>[] = useMemo(
    () =>
      filteredRelationships.map((r) => ({
        id: r.id,
        source: r.sourceId,
        target: r.targetId,
        type: 'relationship',
        markerEnd: r.bidirectional
          ? undefined
          : { type: MarkerType.ArrowClosed, color: RELATIONSHIP_COLORS[r.type] },
        data: {
          relationship: r,
          dimmed: connectedEdgeIds != null && !connectedEdgeIds.has(r.id),
        },
      })),
    [filteredRelationships, connectedEdgeIds],
  )

  // Fit view after layout changes
  useEffect(() => {
    const timer = setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 50)
    return () => clearTimeout(timer)
  }, [fitView, positions])

  // Handlers
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId((prev) => (prev === node.id ? null : node.id))
      onCharacterSelect?.(node.id)
    },
    [onCharacterSelect],
  )

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      onRelationshipSelect?.(edge.id)
    },
    [onRelationshipSelect],
  )

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [])

  // Mouse tracking for tooltips
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (hoveredNodeId) {
        const c = characters.find((ch) => ch.id === hoveredNodeId)
        if (c) {
          setTooltip({
            type: 'node',
            x: e.clientX,
            y: e.clientY,
            character: c,
            faction: c.factionId ? factionMap.get(c.factionId) : undefined,
          })
          return
        }
      }
      if (hoveredEdgeId) {
        const r = filteredRelationships.find((rel) => rel.id === hoveredEdgeId)
        if (r) {
          setTooltip({
            type: 'edge',
            x: e.clientX,
            y: e.clientY,
            relationship: r,
          })
          return
        }
      }
      setTooltip(null)
    },
    [hoveredNodeId, hoveredEdgeId, characters, filteredRelationships, factionMap],
  )

  const onEdgeMouseEnter = useCallback((_: React.MouseEvent, edge: Edge) => {
    setHoveredEdgeId(edge.id)
  }, [])

  const onEdgeMouseLeave = useCallback(() => {
    setHoveredEdgeId(null)
  }, [])

  const handleFilterChange = useCallback((filters: Record<string, FilterValue>) => {
    setActiveFilters(filters)
  }, [])

  // Legend
  const legendTypes = useMemo(() => {
    const used = new Set(relationships.map((r) => r.type))
    return (Object.keys(RELATIONSHIP_LABELS) as RelationshipType[]).filter((t) =>
      used.has(t),
    )
  }, [relationships])

  const legendToolbar = (
    <div className="flex items-center gap-3">
      {legendTypes.map((t) => (
        <div key={t} className="flex items-center gap-1 text-xs">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: RELATIONSHIP_COLORS[t] }}
          />
          <span className="text-muted-foreground">{RELATIONSHIP_LABELS[t]}</span>
        </div>
      ))}
    </div>
  )

  return (
    <VizShell
      title="Character Relationship Map"
      filterDimensions={filterDimensions}
      activeFilters={activeFilters}
      onFilterChange={handleFilterChange}
      extraControls={legendToolbar}
    >
      <div
        ref={containerRef}
        className="h-full w-full"
        onMouseMove={onMouseMove}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onEdgeMouseEnter={onEdgeMouseEnter}
          onEdgeMouseLeave={onEdgeMouseLeave}
          fitView
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={!readOnly}
          nodesConnectable={false}
          elementsSelectable={!readOnly}
        >
          <MiniMap
            nodeColor={(n) => {
              const d = n.data as CharacterNodeData | undefined
              return d?.faction?.color ?? '#374151'
            }}
            maskColor="rgba(0,0,0,0.6)"
            style={{ borderRadius: 8 }}
          />
          <Controls showInteractive={false} />
        </ReactFlow>
        {tooltip && <Tooltip tooltip={tooltip} />}
      </div>
    </VizShell>
  )
}

// ---------------------------------------------------------------------------
// Exported wrapper with ReactFlowProvider
// ---------------------------------------------------------------------------

export function CharacterGraph(props: CharacterGraphProps) {
  return (
    <ReactFlowProvider>
      <CharacterGraphInner {...props} />
    </ReactFlowProvider>
  )
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

export const MOCK_DATA: CharacterGraphData = {
  factions: [
    { id: 'f1', name: 'House Aurelia', color: '#7c3aed' },
    { id: 'f2', name: 'The Iron Circle', color: '#dc2626' },
    { id: 'f3', name: 'Wanderers Guild', color: '#0891b2' },
  ],
  characters: [
    {
      id: 'c1',
      name: 'Queen Lyra Aurelia',
      importance: 1.0,
      factionId: 'f1',
      traits: ['ambitious', 'strategic', 'compassionate'],
      status: 'alive',
    },
    {
      id: 'c2',
      name: 'Prince Caden',
      importance: 0.75,
      factionId: 'f1',
      traits: ['impulsive', 'brave', 'loyal'],
      status: 'alive',
    },
    {
      id: 'c3',
      name: 'Sera Nightshade',
      importance: 0.85,
      factionId: 'f2',
      traits: ['cunning', 'charismatic', 'ruthless'],
      status: 'alive',
    },
    {
      id: 'c4',
      name: 'General Thane',
      importance: 0.7,
      factionId: 'f2',
      traits: ['disciplined', 'stoic', 'honourable'],
      status: 'alive',
    },
    {
      id: 'c5',
      name: 'Mira the Wanderer',
      importance: 0.65,
      factionId: 'f3',
      traits: ['curious', 'resourceful', 'secretive'],
      status: 'alive',
    },
    {
      id: 'c6',
      name: 'Old Kael',
      importance: 0.5,
      factionId: 'f3',
      traits: ['wise', 'patient', 'cryptic'],
      status: 'alive',
    },
    {
      id: 'c7',
      name: 'Duke Harren',
      importance: 0.55,
      factionId: 'f1',
      traits: ['greedy', 'political', 'cowardly'],
      status: 'dead',
    },
    {
      id: 'c8',
      name: 'Zara Flint',
      importance: 0.6,
      traits: ['independent', 'fierce', 'distrustful'],
      status: 'alive',
    },
    {
      id: 'c9',
      name: 'Brother Aldric',
      importance: 0.45,
      traits: ['devout', 'conflicted', 'scholarly'],
      status: 'unknown',
    },
    {
      id: 'c10',
      name: 'Vex',
      importance: 0.4,
      factionId: 'f2',
      traits: ['silent', 'lethal', 'loyal'],
      status: 'alive',
    },
  ],
  relationships: [
    {
      id: 'r1',
      sourceId: 'c1',
      targetId: 'c2',
      type: 'family',
      weight: 0.9,
      sentiment: 0.8,
      bidirectional: true,
    },
    {
      id: 'r2',
      sourceId: 'c1',
      targetId: 'c7',
      type: 'family',
      weight: 0.6,
      sentiment: -0.2,
      bidirectional: true,
    },
    {
      id: 'r3',
      sourceId: 'c1',
      targetId: 'c3',
      type: 'rivalry',
      weight: 0.95,
      sentiment: -0.9,
      bidirectional: true,
    },
    {
      id: 'r4',
      sourceId: 'c2',
      targetId: 'c5',
      type: 'romantic',
      weight: 0.7,
      sentiment: 0.7,
      bidirectional: true,
    },
    {
      id: 'r5',
      sourceId: 'c3',
      targetId: 'c4',
      type: 'professional',
      weight: 0.8,
      sentiment: 0.3,
      bidirectional: false,
    },
    {
      id: 'r6',
      sourceId: 'c3',
      targetId: 'c10',
      type: 'professional',
      weight: 0.7,
      sentiment: 0.1,
      bidirectional: false,
    },
    {
      id: 'r7',
      sourceId: 'c5',
      targetId: 'c6',
      type: 'mentor',
      weight: 0.85,
      sentiment: 0.9,
      bidirectional: false,
    },
    {
      id: 'r8',
      sourceId: 'c4',
      targetId: 'c2',
      type: 'rivalry',
      weight: 0.6,
      sentiment: -0.5,
      bidirectional: true,
    },
    {
      id: 'r9',
      sourceId: 'c6',
      targetId: 'c9',
      type: 'friendship',
      weight: 0.5,
      sentiment: 0.6,
      bidirectional: true,
    },
    {
      id: 'r10',
      sourceId: 'c8',
      targetId: 'c5',
      type: 'friendship',
      weight: 0.65,
      sentiment: 0.5,
      bidirectional: true,
    },
    {
      id: 'r11',
      sourceId: 'c8',
      targetId: 'c3',
      type: 'rivalry',
      weight: 0.55,
      sentiment: -0.7,
      bidirectional: true,
    },
    {
      id: 'r12',
      sourceId: 'c7',
      targetId: 'c3',
      type: 'professional',
      weight: 0.4,
      sentiment: -0.3,
      bidirectional: false,
    },
    {
      id: 'r13',
      sourceId: 'c1',
      targetId: 'c4',
      type: 'professional',
      weight: 0.5,
      sentiment: -0.1,
      bidirectional: false,
    },
    {
      id: 'r14',
      sourceId: 'c9',
      targetId: 'c1',
      type: 'mentor',
      weight: 0.45,
      sentiment: 0.4,
      bidirectional: false,
    },
    {
      id: 'r15',
      sourceId: 'c10',
      targetId: 'c4',
      type: 'friendship',
      weight: 0.5,
      sentiment: 0.3,
      bidirectional: true,
    },
  ],
}
