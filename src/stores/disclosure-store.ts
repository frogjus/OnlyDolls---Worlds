import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DisclosureState {
  showAllViews: boolean
  tierOverrides: Record<string, boolean>
  setShowAllViews: (show: boolean) => void
  setTierOverride: (viewSlug: string, visible: boolean) => void
  clearOverrides: () => void
}

export const useDisclosureStore = create<DisclosureState>()(
  persist(
    (set) => ({
      showAllViews: false,
      tierOverrides: {},
      setShowAllViews: (show) => set({ showAllViews: show }),
      setTierOverride: (viewSlug, visible) =>
        set((state) => ({
          tierOverrides: { ...state.tierOverrides, [viewSlug]: visible },
        })),
      clearOverrides: () => set({ tierOverrides: {}, showAllViews: false }),
    }),
    {
      name: 'storyforge-disclosure',
      partialize: (state) => ({
        showAllViews: state.showAllViews,
        tierOverrides: state.tierOverrides,
      }),
    },
  ),
)
