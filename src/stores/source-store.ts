import { create } from 'zustand'

interface SourceStoreState {
  createDialogOpen: boolean
  editingSourceId: string | null
  selectedSourceId: string | null
  setCreateDialogOpen: (open: boolean) => void
  setEditingSourceId: (id: string | null) => void
  setSelectedSourceId: (id: string | null) => void
}

export const useSourceStore = create<SourceStoreState>((set) => ({
  createDialogOpen: false,
  editingSourceId: null,
  selectedSourceId: null,
  setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
  setEditingSourceId: (id) => set({ editingSourceId: id }),
  setSelectedSourceId: (id) => set({ selectedSourceId: id }),
}))
