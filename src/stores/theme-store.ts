import { create } from 'zustand'

interface ThemeUIState {
  createDialogOpen: boolean
  editingThemeId: string | null
  selectedThemeId: string | null
  setCreateDialogOpen: (open: boolean) => void
  setEditingThemeId: (id: string | null) => void
  setSelectedThemeId: (id: string | null) => void
}

export const useThemeStore = create<ThemeUIState>((set) => ({
  createDialogOpen: false,
  editingThemeId: null,
  selectedThemeId: null,
  setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
  setEditingThemeId: (id) => set({ editingThemeId: id }),
  setSelectedThemeId: (id) => set({ selectedThemeId: id }),
}))
