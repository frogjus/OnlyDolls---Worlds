import { WorldNav } from '@/components/layout/world-nav'
import { StorySidebar } from '@/components/layout/story-sidebar'

export default async function WorldLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h1 className="text-lg font-semibold">World</h1>
      </div>
      <WorldNav />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">{children}</div>
        <StorySidebar worldId={id} />
      </div>
    </div>
  )
}
