'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  type NodeTypes,
  type EdgeTypes,
  Handle,
  Position,
  BaseEdge,
  getSmoothStepPath,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  MapPin,
  User,
  Users,
  Gem,
  Lightbulb,
  Calendar,
  Globe,
  ChevronDown,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface WorldElement {
  id: string
  name: string
  type:
    | 'location'
    | 'character'
    | 'faction'
    | 'artifact'
    | 'concept'
    | 'event'
    | 'custom'
  description: string
  imageUrl?: string
  parentId?: string
  children?: WorldElement[]
  tags: string[]
  position?: { x: number; y: number }
}

export interface WorldConnection {
  id: string
  sourceId: string
  targetId: string
  label?: string
  type: 'contains' | 'related' | 'controls' | 'located_in' | 'custom'
}

export interface MindMapData {
  elements: WorldElement[]
  connections: WorldConnection[]
}

export interface MindMapProps {
  data?: MindMapData
  onElementSelect?: (elementId: string) => void
  onConnectionCreate?: (sourceId: string, targetId: string) => void
  readOnly?: boolean
}

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const TYPE_COLORS: Record<WorldElement['type'], { bg: string; border: string; text: string; mini: string }> = {
  location:  { bg: 'bg-emerald-950/80', border: 'border-emerald-500/60', text: 'text-emerald-400', mini: '#34d399' },
  character: { bg: 'bg-blue-950/80',    border: 'border-blue-500/60',    text: 'text-blue-400',    mini: '#60a5fa' },
  faction:   { bg: 'bg-purple-950/80',  border: 'border-purple-500/60',  text: 'text-purple-400',  mini: '#a78bfa' },
  artifact:  { bg: 'bg-amber-950/80',   border: 'border-amber-500/60',   text: 'text-amber-400',   mini: '#fbbf24' },
  concept:   { bg: 'bg-rose-950/80',    border: 'border-rose-500/60',    text: 'text-rose-400',    mini: '#fb7185' },
  event:     { bg: 'bg-orange-950/80',  border: 'border-orange-500/60',  text: 'text-orange-400',  mini: '#fb923c' },
  custom:    { bg: 'bg-zinc-900/80',    border: 'border-zinc-500/60',    text: 'text-zinc-400',    mini: '#a1a1aa' },
}

const TYPE_ICONS: Record<WorldElement['type'], LucideIcon> = {
  location: MapPin,
  character: User,
  faction: Users,
  artifact: Gem,
  concept: Lightbulb,
  event: Calendar,
  custom: Globe,
}

const CONNECTION_STYLES: Record<WorldConnection['type'], { stroke: string; strokeDasharray?: string }> = {
  contains:   { stroke: '#6b7280' },
  related:    { stroke: '#8b5cf6', strokeDasharray: '6 3' },
  controls:   { stroke: '#ef4444' },
  located_in: { stroke: '#34d399', strokeDasharray: '4 4' },
  custom:     { stroke: '#a1a1aa', strokeDasharray: '2 2' },
}

// ---------------------------------------------------------------------------
// Custom node data
// ---------------------------------------------------------------------------

type ElementNodeData = {
  element: WorldElement
  isCenter: boolean
  hasChildren: boolean
  isExpanded: boolean
  onToggle: (id: string) => void
  onSelect?: (id: string) => void
}

type ElementNode = Node<ElementNodeData, 'worldElement'>

// ---------------------------------------------------------------------------
// Custom node component
// ---------------------------------------------------------------------------

function WorldElementNode({ data }: NodeProps<ElementNode>) {
  const { element, isCenter, hasChildren, isExpanded, onToggle, onSelect } = data
  const colors = TYPE_COLORS[element.type]
  const Icon = TYPE_ICONS[element.type]

  const handleClick = useCallback(() => {
    onSelect?.(element.id)
  }, [onSelect, element.id])

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggle(element.id)
    },
    [onToggle, element.id],
  )

  const maxDescLength = isCenter ? 120 : 80
  const truncatedDesc =
    element.description.length > maxDescLength
      ? element.description.slice(0, maxDescLength) + '...'
      : element.description

  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-zinc-600 !border-zinc-500" />
      <div
        onClick={handleClick}
        className={cn(
          'rounded-lg border px-3 py-2 shadow-lg backdrop-blur-sm transition-shadow hover:shadow-xl cursor-pointer',
          colors.bg,
          colors.border,
          isCenter && 'px-5 py-4 border-2',
        )}
        style={isCenter ? { minWidth: 220 } : { minWidth: 160, maxWidth: 220 }}
      >
        <div className="flex items-center gap-2">
          <Icon className={cn('shrink-0', colors.text, isCenter ? 'h-5 w-5' : 'h-4 w-4')} />
          <span
            className={cn(
              'font-semibold text-zinc-100 truncate',
              isCenter ? 'text-base' : 'text-sm',
            )}
          >
            {element.name}
          </span>
          {hasChildren && (
            <button
              onClick={handleToggle}
              className="ml-auto shrink-0 rounded p-0.5 hover:bg-white/10 text-zinc-400"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
        <p className={cn('mt-1 leading-snug text-zinc-400', isCenter ? 'text-xs' : 'text-[11px]')}>
          {truncatedDesc}
        </p>
        {element.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {element.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className={cn(
                  'rounded-full px-1.5 py-px text-[10px] font-medium',
                  colors.text,
                  'bg-white/5',
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-zinc-600 !border-zinc-500" />
    </>
  )
}

// ---------------------------------------------------------------------------
// Custom edge component
// ---------------------------------------------------------------------------

type ConnectionEdgeData = { connectionType: WorldConnection['type']; label?: string }
type ConnectionEdge = Edge<ConnectionEdgeData, 'worldConnection'>

function WorldConnectionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: {
  id: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: Position
  targetPosition: Position
  data?: ConnectionEdgeData
}) {
  const connType = data?.connectionType ?? 'related'
  const style = CONNECTION_STYLES[connType]

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
          stroke: style.stroke,
          strokeWidth: 1.5,
          strokeDasharray: style.strokeDasharray,
        }}
      />
      {data?.label && (
        <foreignObject
          x={labelX - 40}
          y={labelY - 10}
          width={80}
          height={20}
          className="pointer-events-none overflow-visible"
        >
          <div className="flex items-center justify-center">
            <span className="rounded bg-zinc-900/90 px-1.5 py-0.5 text-[10px] text-zinc-400 border border-zinc-700/50">
              {data.label}
            </span>
          </div>
        </foreignObject>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

function buildNodesAndEdges(
  data: MindMapData,
  expandedIds: Set<string>,
  onToggle: (id: string) => void,
  onSelect?: (id: string) => void,
  typeFilter: Set<WorldElement['type']> | null = null,
): { nodes: ElementNode[]; edges: ConnectionEdge[] } {
  const elementMap = new Map<string, WorldElement>()
  const childrenMap = new Map<string, WorldElement[]>()

  for (const el of data.elements) {
    elementMap.set(el.id, el)
    if (el.parentId) {
      const siblings = childrenMap.get(el.parentId) ?? []
      siblings.push(el)
      childrenMap.set(el.parentId, siblings)
    }
  }

  // Find center node (no parentId, or first element)
  const centerElement = data.elements.find((el) => !el.parentId) ?? data.elements[0]
  if (!centerElement) return { nodes: [], edges: [] }

  // Collect visible elements: start from roots, expand children if expanded
  const visibleIds = new Set<string>()
  const queue: string[] = []

  // Add all root-level elements
  for (const el of data.elements) {
    if (!el.parentId) {
      if (!typeFilter || el.type === centerElement.type || typeFilter.has(el.type)) {
        visibleIds.add(el.id)
        queue.push(el.id)
      }
    }
  }

  // Expand children
  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (expandedIds.has(currentId)) {
      const children = childrenMap.get(currentId) ?? []
      for (const child of children) {
        if (!typeFilter || typeFilter.has(child.type)) {
          visibleIds.add(child.id)
          queue.push(child.id)
        }
      }
    }
  }

  // Layout: radial positioning around center
  const centerId = centerElement.id
  const rootNodes = data.elements.filter(
    (el) => !el.parentId && el.id !== centerId && visibleIds.has(el.id),
  )

  const nodes: ElementNode[] = []
  const placedPositions = new Map<string, { x: number; y: number }>()

  // Center node
  const centerPos = centerElement.position ?? { x: 0, y: 0 }
  placedPositions.set(centerId, centerPos)
  nodes.push({
    id: centerId,
    type: 'worldElement',
    position: centerPos,
    data: {
      element: centerElement,
      isCenter: true,
      hasChildren: (childrenMap.get(centerId)?.length ?? 0) > 0,
      isExpanded: expandedIds.has(centerId),
      onToggle,
      onSelect,
    },
  })

  // Place root nodes in a ring
  const ringRadius = 320
  const angleStep = (2 * Math.PI) / Math.max(rootNodes.length, 1)
  const startAngle = -Math.PI / 2

  rootNodes.forEach((el, i) => {
    const angle = startAngle + i * angleStep
    const pos = el.position ?? {
      x: centerPos.x + Math.cos(angle) * ringRadius,
      y: centerPos.y + Math.sin(angle) * ringRadius,
    }
    placedPositions.set(el.id, pos)
    nodes.push({
      id: el.id,
      type: 'worldElement',
      position: pos,
      data: {
        element: el,
        isCenter: false,
        hasChildren: (childrenMap.get(el.id)?.length ?? 0) > 0,
        isExpanded: expandedIds.has(el.id),
        onToggle,
        onSelect,
      },
    })

    // Place children in a sub-ring
    if (expandedIds.has(el.id)) {
      const children = (childrenMap.get(el.id) ?? []).filter((c) => visibleIds.has(c.id))
      const childRadius = 180
      const childAngleStep = Math.PI / Math.max(children.length, 1)
      const childStartAngle = angle - (childAngleStep * (children.length - 1)) / 2

      children.forEach((child, ci) => {
        const childAngle = childStartAngle + ci * childAngleStep
        const childPos = child.position ?? {
          x: pos.x + Math.cos(childAngle) * childRadius,
          y: pos.y + Math.sin(childAngle) * childRadius,
        }
        placedPositions.set(child.id, childPos)
        nodes.push({
          id: child.id,
          type: 'worldElement',
          position: childPos,
          data: {
            element: child,
            isCenter: false,
            hasChildren: (childrenMap.get(child.id)?.length ?? 0) > 0,
            isExpanded: expandedIds.has(child.id),
            onToggle,
            onSelect,
          },
        })
      })
    }
  })

  // Edges from connections
  const edges: ConnectionEdge[] = data.connections
    .filter((conn) => visibleIds.has(conn.sourceId) && visibleIds.has(conn.targetId))
    .map((conn) => ({
      id: conn.id,
      source: conn.sourceId,
      target: conn.targetId,
      type: 'worldConnection',
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: CONNECTION_STYLES[conn.type].stroke },
      data: { connectionType: conn.type, label: conn.label },
    }))

  return { nodes, edges }
}

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------

const ELEMENT_TYPES: WorldElement['type'][] = [
  'location',
  'character',
  'faction',
  'artifact',
  'concept',
  'event',
  'custom',
]

function TypeFilterBar({
  activeTypes,
  onToggle,
  counts,
}: {
  activeTypes: Set<WorldElement['type']> | null
  onToggle: (type: WorldElement['type']) => void
  counts: Record<string, number>
}) {
  return (
    <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-900/90 p-1.5 backdrop-blur-sm">
      {ELEMENT_TYPES.filter((t) => (counts[t] ?? 0) > 0).map((type) => {
        const colors = TYPE_COLORS[type]
        const Icon = TYPE_ICONS[type]
        const active = activeTypes === null || activeTypes.has(type)
        return (
          <button
            key={type}
            onClick={() => onToggle(type)}
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
              active ? cn(colors.bg, colors.text, colors.border, 'border') : 'text-zinc-600 hover:text-zinc-400',
            )}
          >
            <Icon className="h-3 w-3" />
            <span className="capitalize">{type}</span>
            <span className="ml-0.5 text-[10px] opacity-60">{counts[type] ?? 0}</span>
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Node types & edge types registration
// ---------------------------------------------------------------------------

const nodeTypes: NodeTypes = {
  worldElement: WorldElementNode,
}

const edgeTypes: EdgeTypes = {
  worldConnection: WorldConnectionEdge as EdgeTypes[string],
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function MindMapInner({ data, onElementSelect, readOnly = false }: MindMapProps) {
  const mapData = data ?? MOCK_DATA

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Auto-expand center node
    const center = mapData.elements.find((el) => !el.parentId)
    return new Set(center ? [center.id] : [])
  })

  const [activeTypes, setActiveTypes] = useState<Set<WorldElement['type']> | null>(null)

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const el of mapData.elements) {
      counts[el.type] = (counts[el.type] ?? 0) + 1
    }
    return counts
  }, [mapData.elements])

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleTypeToggle = useCallback((type: WorldElement['type']) => {
    setActiveTypes((prev) => {
      if (prev === null) {
        // All active → deactivate everything except this type
        const next = new Set<WorldElement['type']>([type])
        return next
      }
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
        return next.size === 0 ? null : next
      }
      next.add(type)
      // If all types are now active, reset to null (show all)
      if (ELEMENT_TYPES.every((t) => next.has(t))) return null
      return next
    })
  }, [])

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildNodesAndEdges(mapData, expandedIds, handleToggle, onElementSelect, activeTypes),
    [mapData, expandedIds, handleToggle, onElementSelect, activeTypes],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Sync when initialNodes/initialEdges change (filter/expand toggled)
  useMemo(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes, initialEdges])

  return (
    <div className="h-full w-full">
      <TypeFilterBar activeTypes={activeTypes} onToggle={handleTypeToggle} counts={typeCounts} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-zinc-950"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#27272a" />
        <MiniMap
          nodeColor={(node) => {
            const el = (node.data as ElementNodeData)?.element
            return el ? TYPE_COLORS[el.type].mini : '#71717a'
          }}
          maskColor="rgba(0, 0, 0, 0.7)"
          className="!bg-zinc-900 !border-zinc-700"
          pannable
          zoomable
        />
        <Controls
          showInteractive={!readOnly}
          className="!bg-zinc-900 !border-zinc-700 !shadow-lg [&>button]:!bg-zinc-800 [&>button]:!border-zinc-700 [&>button]:!text-zinc-300 [&>button:hover]:!bg-zinc-700"
        />
      </ReactFlow>
    </div>
  )
}

export function MindMap(props: MindMapProps) {
  return (
    <ReactFlowProvider>
      <MindMapInner {...props} />
    </ReactFlowProvider>
  )
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

export const MOCK_DATA: MindMapData = {
  elements: [
    {
      id: 'world-middle-earth',
      name: 'Middle Earth',
      type: 'location',
      description: 'The vast continent where the events of the Lord of the Rings unfold, spanning from the Shire to Mordor.',
      tags: ['world', 'primary'],
    },
    {
      id: 'loc-shire',
      name: 'The Shire',
      type: 'location',
      description: 'Peaceful homeland of the Hobbits, known for rolling green hills and round doors.',
      parentId: 'world-middle-earth',
      tags: ['homeland', 'peaceful'],
    },
    {
      id: 'loc-mordor',
      name: 'Mordor',
      type: 'location',
      description: 'Dark land of Sauron, surrounded by mountains and volcanic ash. Home of Mount Doom.',
      parentId: 'world-middle-earth',
      tags: ['antagonist', 'volcanic'],
    },
    {
      id: 'loc-rivendell',
      name: 'Rivendell',
      type: 'location',
      description: 'Elven sanctuary hidden in a valley, a place of wisdom and refuge.',
      parentId: 'world-middle-earth',
      tags: ['elven', 'sanctuary'],
    },
    {
      id: 'loc-gondor',
      name: 'Gondor',
      type: 'location',
      description: 'Kingdom of Men in the south, with Minas Tirith as its white-walled capital.',
      parentId: 'world-middle-earth',
      tags: ['kingdom', 'men'],
    },
    {
      id: 'char-frodo',
      name: 'Frodo Baggins',
      type: 'character',
      description: 'Hobbit ring-bearer tasked with destroying the One Ring in the fires of Mount Doom.',
      tags: ['protagonist', 'hobbit'],
    },
    {
      id: 'char-gandalf',
      name: 'Gandalf',
      type: 'character',
      description: 'Istari wizard and guide of the Fellowship. Known as the Grey, later the White.',
      tags: ['wizard', 'guide'],
    },
    {
      id: 'char-aragorn',
      name: 'Aragorn',
      type: 'character',
      description: 'Heir of Isildur, ranger of the North, destined to become King of Gondor.',
      tags: ['king', 'ranger'],
    },
    {
      id: 'char-sauron',
      name: 'Sauron',
      type: 'character',
      description: 'The Dark Lord who forged the One Ring to dominate all of Middle Earth.',
      tags: ['antagonist', 'dark lord'],
    },
    {
      id: 'fac-fellowship',
      name: 'The Fellowship',
      type: 'faction',
      description: 'Nine companions chosen to escort Frodo and destroy the One Ring.',
      tags: ['alliance', 'quest'],
    },
    {
      id: 'fac-forces-of-mordor',
      name: 'Forces of Mordor',
      type: 'faction',
      description: 'Orcs, Nazgul, and dark creatures serving Sauron in his quest for domination.',
      tags: ['evil', 'army'],
    },
    {
      id: 'art-one-ring',
      name: 'The One Ring',
      type: 'artifact',
      description: 'Ring of power forged by Sauron. Corrupts its bearer. Must be destroyed in Mount Doom.',
      tags: ['macguffin', 'power'],
    },
    {
      id: 'con-corruption',
      name: 'Corruption of Power',
      type: 'concept',
      description: 'Central theme: absolute power corrupts absolutely. The Ring tempts all who encounter it.',
      tags: ['theme', 'core'],
    },
    {
      id: 'evt-council-elrond',
      name: 'Council of Elrond',
      type: 'event',
      description: 'Historic meeting at Rivendell where the quest to destroy the One Ring is decided.',
      tags: ['turning-point', 'act-1'],
    },
    {
      id: 'evt-battle-pelennor',
      name: 'Battle of Pelennor Fields',
      type: 'event',
      description: 'Massive battle before the gates of Minas Tirith. Turning point in the War of the Ring.',
      tags: ['climax', 'battle'],
    },
  ],
  connections: [
    { id: 'conn-1', sourceId: 'char-frodo', targetId: 'art-one-ring', label: 'bears', type: 'controls' },
    { id: 'conn-2', sourceId: 'char-frodo', targetId: 'fac-fellowship', label: 'leads', type: 'related' },
    { id: 'conn-3', sourceId: 'char-gandalf', targetId: 'fac-fellowship', label: 'guides', type: 'related' },
    { id: 'conn-4', sourceId: 'char-aragorn', targetId: 'loc-gondor', label: 'heir of', type: 'located_in' },
    { id: 'conn-5', sourceId: 'char-sauron', targetId: 'fac-forces-of-mordor', label: 'commands', type: 'controls' },
    { id: 'conn-6', sourceId: 'char-sauron', targetId: 'art-one-ring', label: 'forged', type: 'controls' },
    { id: 'conn-7', sourceId: 'art-one-ring', targetId: 'con-corruption', label: 'embodies', type: 'related' },
    { id: 'conn-8', sourceId: 'evt-council-elrond', targetId: 'loc-rivendell', label: 'held at', type: 'located_in' },
    { id: 'conn-9', sourceId: 'evt-battle-pelennor', targetId: 'loc-gondor', label: 'at', type: 'located_in' },
    { id: 'conn-10', sourceId: 'fac-fellowship', targetId: 'fac-forces-of-mordor', label: 'opposes', type: 'related' },
  ],
}
