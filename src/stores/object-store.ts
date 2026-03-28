import { create } from 'zustand'

interface ObjectUIState {
  createDialogOpen: boolean
  editingObjectId: string | null
  selectedObjectId: string | null
  setCreateDialogOpen: (open: boolean) => void
  setEditingObjectId: (id: string | null) => void
  setSelectedObjectId: (id: string | null) => void
}

export const useObjectStore = create<ObjectUIState>((set) => ({
  createDialogOpen: false,
  editingObjectId: null,
  selectedObjectId: null,
  setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
  setEditingObjectId: (id) => set({ editingObjectId: id }),
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),
}))
