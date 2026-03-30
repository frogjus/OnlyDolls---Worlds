import { WorldNav } from '@/components/layout/world-nav'
import { StorySidebar } from '@/components/layout/story-sidebar'
import { WorkspaceSidebar } from '@/components/layout/workspace-sidebar'
import { InspectorPanel } from '@/components/layout/inspector-panel'
import { PageTransition } from '@/components/layout/page-transition'

export default async function WorldLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="flex h-full flex-1 overflow-hidden bg-background">
      <WorkspaceSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <WorldNav />
        <div className="flex flex-1 overflow-hidden">
          <PageTransition>{children}</PageTransition>
          <StorySidebar worldId={id} />
          <InspectorPanel />
        </div>
      </div>
    </div>
  )
}
