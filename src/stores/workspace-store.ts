import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WorkspaceState {
  sidebarCollapsed: boolean
  collapsedSections: Record<string, boolean>
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSection: (groupId: string) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      collapsedSections: {},
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),
      toggleSection: (groupId) =>
        set((state) => ({
          collapsedSections: {
            ...state.collapsedSections,
            [groupId]: !state.collapsedSections[groupId],
          },
        })),
    }),
    { name: 'storyforge-workspace' }
  )
)
