'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  Handle,
  Position,
  EdgeLabelRenderer,
  BaseEdge,
  getSmoothStepPath,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { VizShell } from '@/components/visualizations/viz-shell'

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface FactionNode {
  id: string
  name: string
  color: string
  powerLevel: number
  leaderId?: string
  leaderName?: string
  memberCount: number
  childFactionIds: string[]
}

export interface FactionAlliance {
  id: string
  factionAId: string
  factionBId: string
  type: 'alliance' | 'rivalry' | 'vassal' | 'neutral' | 'war'
  strength: number
}

export interface FactionMapData {
  factions: FactionNode[]
  alliances: FactionAlliance[]
}

interface FactionMapProps {
  data?: FactionMapData
  onFactionSelect?: (factionId: string) => void
  readOnly?: boolean
}

// ---------------------------------------------------------------------------
// Alliance type styling
// ---------------------------------------------------------------------------

const ALLIANCE_STYLES: Record<
  FactionAlliance['type'],
  { color: string; label: string; dashed: boolean }
> = {
  alliance: { color: '#22c55e', label: 'Alliance', dashed: false },
  rivalry: { color: '#ef4444', label: 'Rivalry', dashed: false },
  vassal: { color: '#3b82f6', label: 'Vassal', dashed: false },
  neutral: { color: '#9ca3af', label: 'Neutral', dashed: false },
  war: { color: '#7f1d1d', label: 'War', dashed: true },
}

const ALLIANCE_TYPES = Object.keys(ALLIANCE_STYLES) as FactionAlliance['type'][]

// ---------------------------------------------------------------------------
// Custom node
// ---------------------------------------------------------------------------

type FactionNodeData = {
  faction: FactionNode
  selected: boolean
}

function FactionNodeComponent({ data }: NodeProps<Node<FactionNodeData>>) {
  const { faction, selected } = data
  const width = 120 + faction.powerLevel * 120
  const powerPct = Math.round(faction.powerLevel * 100)

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-3 !h-3" />
      <div
        className="rounded-lg bg-white dark:bg-zinc-900 shadow-md transition-shadow"
        style={{
          width,
          borderWidth: 2,
          borderStyle: 'solid',
          borderColor: faction.color,
          boxShadow: selected
            ? `0 0 0 3px ${faction.color}44, 0 4px 12px rgba(0,0,0,0.15)`
            : undefined,
        }}
      >
        {/* Header bar */}
        <div
          className="rounded-t-md px-3 py-1.5"
          style={{ backgroundColor: `${faction.color}18` }}
        >
          <p
            className="truncate text-sm font-bold"
            style={{ color: faction.color }}
            title={faction.name}
          >
            {faction.name}
          </p>
        </div>

        <div className="space-y-1.5 px-3 py-2">
          {/* Power bar */}
          <div>
            <div className="mb-0.5 flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
              <span>Power</span>
              <span>{powerPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${powerPct}%`,
                  backgroundColor: faction.color,
                }}
              />
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-600 dark:text-zinc-400">
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5"
              style={{ backgroundColor: `${faction.color}14` }}
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
              </svg>
              {faction.memberCount}
            </span>
            {faction.leaderName && (
              <span className="truncate" title={faction.leaderName}>
                {faction.leaderName}
              </span>
            )}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-3 !h-3" />
    </>
  )
}

// ---------------------------------------------------------------------------
// Custom edge
// ---------------------------------------------------------------------------

type AllianceEdgeData = {
  allianceType: FactionAlliance['type']
  strength: number
}

function AllianceEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<Edge<AllianceEdgeData>>) {
  const style = data ? ALLIANCE_STYLES[data.allianceType] : ALLIANCE_STYLES.neutral
  const thickness = data ? 1 + data.strength * 3 : 2

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: style.color,
          strokeWidth: thickness,
          strokeDasharray: style.dashed ? '6 4' : undefined,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-none absolute rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium shadow-sm dark:bg-zinc-800/90"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            color: style.color,
          }}
        >
          {style.label}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

// ---------------------------------------------------------------------------
// Node types & edge types registries (stable refs)
// ---------------------------------------------------------------------------

const nodeTypes = { faction: FactionNodeComponent }
const edgeTypes = { alliance: AllianceEdge }

// ---------------------------------------------------------------------------
// Layout helper — simple force-like circular layout
// ---------------------------------------------------------------------------

function layoutFactions(factions: FactionNode[]): { x: number; y: number }[] {
  const count = factions.length
  if (count === 0) return []
  if (count === 1) return [{ x: 0, y: 0 }]

  const radius = 180 + count * 40
  return factions.map((_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    }
  })
}

// ---------------------------------------------------------------------------
// Inner component (must be inside ReactFlowProvider)
// ---------------------------------------------------------------------------

function FactionMapInner({
  data,
  onFactionSelect,
  readOnly = false,
}: FactionMapProps) {
  const mapData = data ?? MOCK_DATA
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<Set<FactionAlliance['type']>>(
    new Set(ALLIANCE_TYPES),
  )

  const initialNodes = useMemo<Node<FactionNodeData>[]>(() => {
    const positions = layoutFactions(mapData.factions)
    return mapData.factions.map((faction, i) => ({
      id: faction.id,
      type: 'faction' as const,
      position: positions[i],
      data: { faction, selected: faction.id === selectedId },
      draggable: !readOnly,
    }))
  }, [mapData.factions, readOnly, selectedId])

  const initialEdges = useMemo<Edge<AllianceEdgeData>[]>(() => {
    return mapData.alliances
      .filter((a) => activeFilters.has(a.type))
      .map((alliance) => ({
        id: alliance.id,
        source: alliance.factionAId,
        target: alliance.factionBId,
        type: 'alliance' as const,
        data: { allianceType: alliance.type, strength: alliance.strength },
      }))
  }, [mapData.alliances, activeFilters])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Sync when initialNodes/initialEdges change (filters, selection)
  useMemo(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  useMemo(() => {
    setEdges(initialEdges)
  }, [initialEdges, setEdges])

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const id = node.id
      setSelectedId((prev) => (prev === id ? null : id))
      onFactionSelect?.(id)
    },
    [onFactionSelect],
  )

  const toggleFilter = useCallback((type: FactionAlliance['type']) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  return (
    <VizShell title="Faction / Power Map">
      {/* Filter bar */}
      <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
        {ALLIANCE_TYPES.map((type) => {
          const s = ALLIANCE_STYLES[type]
          const active = activeFilters.has(type)
          return (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className="rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
              style={{
                borderColor: active ? s.color : 'transparent',
                backgroundColor: active ? `${s.color}18` : 'rgba(0,0,0,0.05)',
                color: active ? s.color : '#9ca3af',
              }}
            >
              {s.label}
            </button>
          )
        })}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={!readOnly}
        nodesConnectable={false}
        elementsSelectable={!readOnly}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <MiniMap
          nodeStrokeWidth={2}
          pannable
          zoomable
          style={{ borderRadius: 8 }}
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </VizShell>
  )
}

// ---------------------------------------------------------------------------
// Public component (wraps provider)
// ---------------------------------------------------------------------------

export default function FactionMap(props: FactionMapProps) {
  return (
    <ReactFlowProvider>
      <FactionMapInner {...props} />
    </ReactFlowProvider>
  )
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

export const MOCK_DATA: FactionMapData = {
  factions: [
    {
      id: 'f-crown',
      name: 'The Crown',
      color: '#eab308',
      powerLevel: 0.9,
      leaderName: 'King Aldric III',
      memberCount: 1200,
      childFactionIds: [],
    },
    {
      id: 'f-north',
      name: 'Northern Alliance',
      color: '#3b82f6',
      powerLevel: 0.7,
      leaderName: 'Jarl Sigrid',
      memberCount: 800,
      childFactionIds: [],
    },
    {
      id: 'f-shadow',
      name: 'Shadow Guild',
      color: '#6b21a8',
      powerLevel: 0.5,
      leaderName: 'The Whisper',
      memberCount: 340,
      childFactionIds: [],
    },
    {
      id: 'f-merchant',
      name: 'Merchant League',
      color: '#f97316',
      powerLevel: 0.6,
      leaderName: 'Guildmaster Orlen',
      memberCount: 520,
      childFactionIds: [],
    },
    {
      id: 'f-temple',
      name: 'Temple Order',
      color: '#14b8a6',
      powerLevel: 0.55,
      leaderName: 'High Priestess Ilara',
      memberCount: 450,
      childFactionIds: [],
    },
    {
      id: 'f-free',
      name: 'Free Cities',
      color: '#ec4899',
      powerLevel: 0.45,
      leaderName: 'Council of Nine',
      memberCount: 680,
      childFactionIds: [],
    },
  ],
  alliances: [
    {
      id: 'a-1',
      factionAId: 'f-crown',
      factionBId: 'f-north',
      type: 'rivalry',
      strength: 0.8,
    },
    {
      id: 'a-2',
      factionAId: 'f-crown',
      factionBId: 'f-temple',
      type: 'alliance',
      strength: 0.9,
    },
    {
      id: 'a-3',
      factionAId: 'f-crown',
      factionBId: 'f-merchant',
      type: 'vassal',
      strength: 0.6,
    },
    {
      id: 'a-4',
      factionAId: 'f-north',
      factionBId: 'f-free',
      type: 'alliance',
      strength: 0.7,
    },
    {
      id: 'a-5',
      factionAId: 'f-shadow',
      factionBId: 'f-merchant',
      type: 'neutral',
      strength: 0.4,
    },
    {
      id: 'a-6',
      factionAId: 'f-shadow',
      factionBId: 'f-crown',
      type: 'war',
      strength: 0.9,
    },
    {
      id: 'a-7',
      factionAId: 'f-temple',
      factionBId: 'f-shadow',
      type: 'rivalry',
      strength: 0.85,
    },
    {
      id: 'a-8',
      factionAId: 'f-free',
      factionBId: 'f-merchant',
      type: 'alliance',
      strength: 0.5,
    },
    {
      id: 'a-9',
      factionAId: 'f-north',
      factionBId: 'f-temple',
      type: 'neutral',
      strength: 0.3,
    },
    {
      id: 'a-10',
      factionAId: 'f-free',
      factionBId: 'f-crown',
      type: 'rivalry',
      strength: 0.6,
    },
  ],
}
