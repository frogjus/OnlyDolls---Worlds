'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  useReactFlow,
  ReactFlowProvider,
  getBezierPath,
  EdgeLabelRenderer,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ForeshadowingNode {
  id: string
  type: 'setup' | 'payoff'
  title: string
  description: string
  position: number
  positionLabel: string
  sceneId: string
  status: 'connected' | 'orphan-setup' | 'deus-ex-machina'
  characterIds: string[]
  tags: string[]
}

interface ForeshadowingLink {
  id: string
  setupId: string
  payoffId: string
  subtlety: 'obvious' | 'moderate' | 'subtle'
  notes?: string
}

interface ForeshadowingWebData {
  nodes: ForeshadowingNode[]
  links: ForeshadowingLink[]
}

export interface ForeshadowingWebProps {
  data?: ForeshadowingWebData
  showOrphans?: boolean
  onNodeSelect?: (nodeId: string) => void
  onLinkSelect?: (linkId: string) => void
  readOnly?: boolean
}

// ---------------------------------------------------------------------------
// Style constants
// ---------------------------------------------------------------------------

const NODE_WIDTH = 220
const NODE_HEIGHT = 80
const HORIZONTAL_GAP = 300
const VERTICAL_GAP = 120

const STATUS_STYLES = {
  'connected': {
    setup: {
      bg: 'var(--foreshadow-setup-bg, #1e40af)',
      border: 'var(--foreshadow-setup-border, #3b82f6)',
      text: 'var(--foreshadow-setup-text, #dbeafe)',
      borderStyle: 'solid' as const,
    },
    payoff: {
      bg: 'var(--foreshadow-payoff-bg, #166534)',
      border: 'var(--foreshadow-payoff-border, #22c55e)',
      text: 'var(--foreshadow-payoff-text, #dcfce7)',
      borderStyle: 'solid' as const,
    },
  },
  'orphan-setup': {
    bg: 'var(--foreshadow-orphan-bg, #92400e)',
    border: 'var(--foreshadow-orphan-border, #f59e0b)',
    text: 'var(--foreshadow-orphan-text, #fef3c7)',
    borderStyle: 'dashed' as const,
  },
  'deus-ex-machina': {
    bg: 'var(--foreshadow-deus-bg, #991b1b)',
    border: 'var(--foreshadow-deus-border, #ef4444)',
    text: 'var(--foreshadow-deus-text, #fee2e2)',
    borderStyle: 'dashed' as const,
  },
} as const

function getNodeStyle(nodeType: 'setup' | 'payoff', status: ForeshadowingNode['status']) {
  if (status === 'connected') {
    return STATUS_STYLES.connected[nodeType]
  }
  if (status === 'orphan-setup') {
    return STATUS_STYLES['orphan-setup']
  }
  return STATUS_STYLES['deus-ex-machina']
}

const SUBTLETY_EDGE: Record<string, { strokeWidth: number; strokeDasharray?: string }> = {
  obvious: { strokeWidth: 3 },
  moderate: { strokeWidth: 2 },
  subtle: { strokeWidth: 1.5, strokeDasharray: '6 4' },
}

// ---------------------------------------------------------------------------
// Custom Nodes
// ---------------------------------------------------------------------------

type SetupNodeData = {
  label: string
  description: string
  positionLabel: string
  status: ForeshadowingNode['status']
  onSelect?: (id: string) => void
}

type PayoffNodeData = SetupNodeData

function BaseNode({
  id,
  data,
  nodeType,
}: {
  id: string
  data: SetupNodeData | PayoffNodeData
  nodeType: 'setup' | 'payoff'
}) {
  const style = getNodeStyle(nodeType, data.status)
  const isPulse = data.status === 'orphan-setup' || data.status === 'deus-ex-machina'

  return (
    <div
      className={isPulse ? 'foreshadow-pulse' : ''}
      style={{
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        background: style.bg,
        border: `2px ${style.borderStyle} ${style.border}`,
        borderRadius: 10,
        padding: '10px 14px',
        color: style.text,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden',
        fontSize: 13,
      }}
      onClick={() => data.onSelect?.(id)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            opacity: 0.7,
            flexShrink: 0,
          }}
        >
          {nodeType === 'setup' ? 'Setup' : 'Payoff'}
        </span>
        <span style={{ fontSize: 10, opacity: 0.5, marginLeft: 'auto', flexShrink: 0 }}>
          {data.positionLabel}
        </span>
      </div>
      <div
        style={{
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {data.label}
      </div>
      {nodeType === 'setup' && (
        <Handle type="source" position={Position.Right} style={{ background: style.border }} />
      )}
      {nodeType === 'payoff' && (
        <Handle type="target" position={Position.Left} style={{ background: style.border }} />
      )}
      {/* Connected nodes that are both setup and payoff targets need both handles */}
      {nodeType === 'setup' && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: style.border, opacity: 0 }}
        />
      )}
      {nodeType === 'payoff' && (
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: style.border, opacity: 0 }}
        />
      )}
    </div>
  )
}

function SetupNode({ id, data }: NodeProps<Node<SetupNodeData>>) {
  return <BaseNode id={id} data={data} nodeType="setup" />
}

function PayoffNode({ id, data }: NodeProps<Node<PayoffNodeData>>) {
  return <BaseNode id={id} data={data} nodeType="payoff" />
}

// ---------------------------------------------------------------------------
// Custom Edge
// ---------------------------------------------------------------------------

type ForeshadowEdgeData = {
  subtlety: 'obvious' | 'moderate' | 'subtle'
  notes?: string
  onSelect?: (id: string) => void
}

function ForeshadowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<Edge<ForeshadowEdgeData>>) {
  const subtlety = data?.subtlety ?? 'moderate'
  const edgeStyle = SUBTLETY_EDGE[subtlety]
  const [hovered, setHovered] = useState(false)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  return (
    <>
      {/* Invisible wider path for easier hover targeting */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => data?.onSelect?.(id)}
        style={{ cursor: 'pointer' }}
      />
      <path
        d={edgePath}
        fill="none"
        stroke="var(--foreshadow-edge, #64748b)"
        strokeWidth={edgeStyle.strokeWidth}
        strokeDasharray={edgeStyle.strokeDasharray}
        markerEnd={markerEnd}
        style={{ pointerEvents: 'none' }}
      />
      {hovered && data?.notes && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
              background: 'var(--foreshadow-tooltip-bg, #1e293b)',
              color: 'var(--foreshadow-tooltip-text, #e2e8f0)',
              padding: '6px 10px',
              borderRadius: 6,
              fontSize: 12,
              maxWidth: 200,
              whiteSpace: 'pre-wrap',
              border: '1px solid var(--foreshadow-tooltip-border, #334155)',
              zIndex: 1000,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 2, textTransform: 'capitalize' }}>
              {subtlety}
            </div>
            <div>{data.notes}</div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Layout helper
// ---------------------------------------------------------------------------

function computeLayout(data: ForeshadowingWebData): {
  nodes: Node[]
  edges: Edge[]
} {
  const sorted = [...data.nodes].sort((a, b) => a.position - b.position)

  const setups = sorted.filter((n) => n.type === 'setup')
  const payoffs = sorted.filter((n) => n.type === 'payoff')

  const nodeMap = new Map<string, { x: number; y: number }>()

  setups.forEach((n, i) => {
    nodeMap.set(n.id, { x: 0, y: i * VERTICAL_GAP })
  })

  payoffs.forEach((n, i) => {
    nodeMap.set(n.id, { x: HORIZONTAL_GAP + NODE_WIDTH, y: i * VERTICAL_GAP })
  })

  // Adjust Y positions to minimize edge crossings by pulling linked payoffs
  // closer to their setups
  const setupIdxMap = new Map(setups.map((n, i) => [n.id, i]))
  const payoffOrder: { id: string; avgSetupY: number }[] = payoffs.map((p) => {
    const incomingLinks = data.links.filter((l) => l.payoffId === p.id)
    if (incomingLinks.length === 0) {
      return { id: p.id, avgSetupY: nodeMap.get(p.id)!.y }
    }
    const avgY =
      incomingLinks.reduce((sum, l) => {
        const idx = setupIdxMap.get(l.setupId)
        return sum + (idx !== undefined ? idx * VERTICAL_GAP : 0)
      }, 0) / incomingLinks.length
    return { id: p.id, avgSetupY: avgY }
  })
  payoffOrder.sort((a, b) => a.avgSetupY - b.avgSetupY)
  payoffOrder.forEach((p, i) => {
    const pos = nodeMap.get(p.id)
    if (pos) pos.y = i * VERTICAL_GAP
  })

  const rfNodes: Node[] = sorted.map((n) => {
    const pos = nodeMap.get(n.id) ?? { x: 0, y: 0 }
    return {
      id: n.id,
      type: n.type === 'setup' ? 'setupNode' : 'payoffNode',
      position: { x: pos.x, y: pos.y },
      data: {
        label: n.title,
        description: n.description,
        positionLabel: n.positionLabel,
        status: n.status,
      },
    }
  })

  const rfEdges: Edge[] = data.links.map((l) => ({
    id: l.id,
    source: l.setupId,
    target: l.payoffId,
    type: 'foreshadowEdge',
    markerEnd: { type: 'arrowclosed' as const, color: 'var(--foreshadow-edge, #64748b)' },
    data: {
      subtlety: l.subtlety,
      notes: l.notes,
    },
  }))

  return { nodes: rfNodes, edges: rfEdges }
}

// ---------------------------------------------------------------------------
// Orphan Stats Badge
// ---------------------------------------------------------------------------

function OrphanBadge({ nodes }: { nodes: ForeshadowingNode[] }) {
  const orphanSetups = nodes.filter((n) => n.status === 'orphan-setup').length
  const deusEx = nodes.filter((n) => n.status === 'deus-ex-machina').length

  if (orphanSetups === 0 && deusEx === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        zIndex: 10,
        display: 'flex',
        gap: 8,
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {orphanSetups > 0 && (
        <span
          style={{
            background: 'var(--foreshadow-orphan-bg, #92400e)',
            color: 'var(--foreshadow-orphan-text, #fef3c7)',
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--foreshadow-orphan-border, #f59e0b)',
          }}
        >
          {orphanSetups} orphan setup{orphanSetups !== 1 ? 's' : ''}
        </span>
      )}
      {deusEx > 0 && (
        <span
          style={{
            background: 'var(--foreshadow-deus-bg, #991b1b)',
            color: 'var(--foreshadow-deus-text, #fee2e2)',
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--foreshadow-deus-border, #ef4444)',
          }}
        >
          {deusEx} deus ex machina
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Subtlety filter
// ---------------------------------------------------------------------------

const SUBTLETY_OPTIONS: { value: ForeshadowingLink['subtlety']; label: string }[] = [
  { value: 'obvious', label: 'Obvious' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'subtle', label: 'Subtle' },
]

function SubtletyFilter({
  active,
  onChange,
}: {
  active: Set<string>
  onChange: (next: Set<string>) => void
}) {
  const toggle = (value: string) => {
    const next = new Set(active)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    onChange(next)
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        display: 'flex',
        gap: 4,
        fontSize: 12,
      }}
    >
      {SUBTLETY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => toggle(opt.value)}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--foreshadow-filter-border, #475569)',
            background: active.has(opt.value)
              ? 'var(--foreshadow-filter-active-bg, #334155)'
              : 'var(--foreshadow-filter-bg, #0f172a)',
            color: active.has(opt.value)
              ? 'var(--foreshadow-filter-active-text, #f1f5f9)'
              : 'var(--foreshadow-filter-text, #94a3b8)',
            cursor: 'pointer',
            fontWeight: active.has(opt.value) ? 600 : 400,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Node tooltip
// ---------------------------------------------------------------------------

function NodeTooltip({ node }: { node: ForeshadowingNode | null }) {
  if (!node) return null

  const statusLabel =
    node.status === 'connected'
      ? 'Connected'
      : node.status === 'orphan-setup'
        ? 'Orphan Setup'
        : 'Deus Ex Machina'

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 10,
        background: 'var(--foreshadow-tooltip-bg, #1e293b)',
        color: 'var(--foreshadow-tooltip-text, #e2e8f0)',
        border: '1px solid var(--foreshadow-tooltip-border, #334155)',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
        maxWidth: 280,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{node.title}</div>
      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>
        {node.type === 'setup' ? 'Setup' : 'Payoff'} &middot; {node.positionLabel} &middot;{' '}
        {statusLabel}
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.4 }}>{node.description}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inner component (needs ReactFlowProvider above it)
// ---------------------------------------------------------------------------

const nodeTypes = {
  setupNode: SetupNode,
  payoffNode: PayoffNode,
}

const edgeTypes = {
  foreshadowEdge: ForeshadowEdge,
}

function ForeshadowingWebInner({
  data = MOCK_DATA,
  showOrphans = true,
  onNodeSelect,
  onLinkSelect,
  readOnly = false,
}: ForeshadowingWebProps) {
  const [subtletyFilter, setSubtletyFilter] = useState<Set<string>>(
    new Set(['obvious', 'moderate', 'subtle']),
  )
  const [hoveredNode, setHoveredNode] = useState<ForeshadowingNode | null>(null)

  const filteredData = useMemo(() => {
    const filteredLinks = data.links.filter((l) => subtletyFilter.has(l.subtlety))
    const connectedSetupIds = new Set(filteredLinks.map((l) => l.setupId))
    const connectedPayoffIds = new Set(filteredLinks.map((l) => l.payoffId))

    const filteredNodes = data.nodes.filter((n) => {
      if (!showOrphans && (n.status === 'orphan-setup' || n.status === 'deus-ex-machina')) {
        return false
      }
      if (n.status === 'orphan-setup' || n.status === 'deus-ex-machina') {
        return true
      }
      if (n.type === 'setup') return connectedSetupIds.has(n.id)
      return connectedPayoffIds.has(n.id)
    })

    return { nodes: filteredNodes, links: filteredLinks }
  }, [data, subtletyFilter, showOrphans])

  const { nodes: rfNodes, edges: rfEdges } = useMemo(() => {
    const layout = computeLayout(filteredData)
    // Inject callbacks into node data
    layout.nodes = layout.nodes.map((n) => ({
      ...n,
      data: { ...n.data, onSelect: onNodeSelect },
    }))
    layout.edges = layout.edges.map((e) => ({
      ...e,
      data: { ...e.data, onSelect: onLinkSelect },
    }))
    return layout
  }, [filteredData, onNodeSelect, onLinkSelect])

  const handleNodeMouseEnter = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const sourceNode = data.nodes.find((n) => n.id === node.id)
      if (sourceNode) setHoveredNode(sourceNode)
    },
    [data.nodes],
  )

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNode(null)
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <style>{`
        @keyframes foreshadow-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .foreshadow-pulse {
          animation: foreshadow-pulse 2.5s ease-in-out infinite;
        }
        .react-flow__node {
          z-index: 1 !important;
        }
      `}</style>

      <SubtletyFilter active={subtletyFilter} onChange={setSubtletyFilter} />
      <NodeTooltip node={hoveredNode} />
      <OrphanBadge nodes={data.nodes} />

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        nodesDraggable={!readOnly}
        nodesConnectable={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <MiniMap
          nodeStrokeWidth={3}
          pannable
          zoomable
          style={{
            background: 'var(--foreshadow-minimap-bg, #0f172a)',
            border: '1px solid var(--foreshadow-minimap-border, #334155)',
            borderRadius: 8,
          }}
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Exported component (with provider)
// ---------------------------------------------------------------------------

export function ForeshadowingWeb(props: ForeshadowingWebProps) {
  return (
    <ReactFlowProvider>
      <ForeshadowingWebInner {...props} />
    </ReactFlowProvider>
  )
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

export const MOCK_DATA: ForeshadowingWebData = {
  nodes: [
    {
      id: 'setup-1',
      type: 'setup',
      title: 'Mysterious ring mentioned',
      description: 'A silver ring with unknown inscriptions is found in the attic.',
      position: 5,
      positionLabel: 'Ch 1, Scene 3',
      sceneId: 'scene-3',
      status: 'connected',
      characterIds: ['char-1'],
      tags: ['artifact', 'mystery'],
    },
    {
      id: 'setup-2',
      type: 'setup',
      title: 'Stranger warns about the forest',
      description: 'An old traveler warns the protagonist never to enter the northern woods.',
      position: 8,
      positionLabel: 'Ch 2, Scene 1',
      sceneId: 'scene-5',
      status: 'connected',
      characterIds: ['char-2', 'char-1'],
      tags: ['warning', 'forest'],
    },
    {
      id: 'setup-3',
      type: 'setup',
      title: 'Recurring dream of falling',
      description: 'The protagonist has a recurring dream about falling from a great height.',
      position: 12,
      positionLabel: 'Ch 3, Scene 2',
      sceneId: 'scene-9',
      status: 'connected',
      characterIds: ['char-1'],
      tags: ['dream', 'premonition'],
    },
    {
      id: 'setup-4',
      type: 'setup',
      title: 'Locked room in the mansion',
      description: 'A room on the third floor is always locked; servants avoid it.',
      position: 15,
      positionLabel: 'Ch 4, Scene 1',
      sceneId: 'scene-11',
      status: 'orphan-setup',
      characterIds: ['char-3'],
      tags: ['mystery', 'mansion'],
    },
    {
      id: 'setup-5',
      type: 'setup',
      title: 'Missing pages in the journal',
      description: 'Pages 42-47 have been carefully cut from the old journal.',
      position: 20,
      positionLabel: 'Ch 5, Scene 3',
      sceneId: 'scene-15',
      status: 'connected',
      characterIds: ['char-1'],
      tags: ['journal', 'mystery'],
    },
    {
      id: 'setup-6',
      type: 'setup',
      title: 'Broken compass always points north-east',
      description: 'A compass that should be broken consistently points to the same direction.',
      position: 22,
      positionLabel: 'Ch 6, Scene 1',
      sceneId: 'scene-17',
      status: 'orphan-setup',
      characterIds: ['char-1'],
      tags: ['artifact', 'navigation'],
    },
    {
      id: 'setup-7',
      type: 'setup',
      title: 'The scar on the mentor\'s hand',
      description: 'The mentor has a scar that matches the ring inscriptions, but deflects questions about it.',
      position: 25,
      positionLabel: 'Ch 6, Scene 4',
      sceneId: 'scene-20',
      status: 'connected',
      characterIds: ['char-4', 'char-1'],
      tags: ['scar', 'mentor'],
    },
    {
      id: 'payoff-1',
      type: 'payoff',
      title: 'Ring revealed as key to vault',
      description: 'The ring\'s inscriptions are a cipher that unlocks an ancient vault beneath the mansion.',
      position: 55,
      positionLabel: 'Ch 14, Scene 2',
      sceneId: 'scene-42',
      status: 'connected',
      characterIds: ['char-1', 'char-3'],
      tags: ['artifact', 'revelation'],
    },
    {
      id: 'payoff-2',
      type: 'payoff',
      title: 'Forest creature attacks',
      description: 'A creature from the northern woods attacks the village, vindicating the warning.',
      position: 40,
      positionLabel: 'Ch 10, Scene 3',
      sceneId: 'scene-32',
      status: 'connected',
      characterIds: ['char-1', 'char-2'],
      tags: ['forest', 'confrontation'],
    },
    {
      id: 'payoff-3',
      type: 'payoff',
      title: 'Protagonist falls from the tower',
      description: 'During the climax, the protagonist falls from the tower — the dream was prophetic.',
      position: 60,
      positionLabel: 'Ch 15, Scene 4',
      sceneId: 'scene-48',
      status: 'connected',
      characterIds: ['char-1'],
      tags: ['dream', 'climax'],
    },
    {
      id: 'payoff-4',
      type: 'payoff',
      title: 'Journal pages found in vault',
      description: 'The missing journal pages are inside the vault, revealing the true history.',
      position: 58,
      positionLabel: 'Ch 15, Scene 1',
      sceneId: 'scene-46',
      status: 'connected',
      characterIds: ['char-1'],
      tags: ['journal', 'revelation'],
    },
    {
      id: 'payoff-5',
      type: 'payoff',
      title: 'Mentor secretly the antagonist',
      description: 'The mentor is revealed to be the one who sealed the vault — the scar is from the ritual.',
      position: 62,
      positionLabel: 'Ch 16, Scene 2',
      sceneId: 'scene-50',
      status: 'deus-ex-machina',
      characterIds: ['char-4'],
      tags: ['betrayal', 'twist'],
    },
  ],
  links: [
    {
      id: 'link-1',
      setupId: 'setup-1',
      payoffId: 'payoff-1',
      subtlety: 'moderate',
      notes: 'Ring introduced casually in Ch 1, significance hidden until vault scene.',
    },
    {
      id: 'link-2',
      setupId: 'setup-2',
      payoffId: 'payoff-2',
      subtlety: 'obvious',
      notes: 'Direct warning → direct consequence. Reader expects this.',
    },
    {
      id: 'link-3',
      setupId: 'setup-3',
      payoffId: 'payoff-3',
      subtlety: 'subtle',
      notes: 'Dream imagery mirrors the exact physical event. Easy to miss on first read.',
    },
    {
      id: 'link-4',
      setupId: 'setup-5',
      payoffId: 'payoff-4',
      subtlety: 'moderate',
      notes: 'Missing pages create curiosity gap resolved when vault contents revealed.',
    },
    {
      id: 'link-5',
      setupId: 'setup-7',
      payoffId: 'payoff-1',
      subtlety: 'subtle',
      notes: 'Scar matching ring inscriptions links mentor to vault — very subtle parallel.',
    },
    {
      id: 'link-6',
      setupId: 'setup-7',
      payoffId: 'payoff-5',
      subtlety: 'moderate',
      notes: 'The scar foreshadows the mentor\'s hidden role in sealing the vault.',
    },
  ],
}
