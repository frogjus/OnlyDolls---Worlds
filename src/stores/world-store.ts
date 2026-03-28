import { create } from 'zustand'

interface WorldUIState {
  createDialogOpen: boolean
  editingWorldId: string | null
  setCreateDialogOpen: (open: boolean) => void
  setEditingWorldId: (id: string | null) => void
}

export const useWorldStore = create<WorldUIState>((set) => ({
  createDialogOpen: false,
  editingWorldId: null,
  setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
  setEditingWorldId: (id) => set({ editingWorldId: id }),
}))
