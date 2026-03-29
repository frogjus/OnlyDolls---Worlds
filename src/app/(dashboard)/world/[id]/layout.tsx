import { WorldNav } from '@/components/layout/world-nav'
import { StorySidebar } from '@/components/layout/story-sidebar'
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar'
import { InspectorPanel } from '@/components/layout/inspector-panel'

export default async function WorldLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="flex h-full flex-1 overflow-hidden">
      <WorkspaceSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <WorldNav />
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto">{children}</div>
          <StorySidebar worldId={id} />
          <InspectorPanel />
        </div>
      </div>
    </div>
  )
}
