import { create } from 'zustand'

interface RelationshipStoreState {
  createDialogOpen: boolean
  editingRelationshipId: string | null
  selectedRelationshipId: string | null
  setCreateDialogOpen: (open: boolean) => void
  setEditingRelationshipId: (id: string | null) => void
  setSelectedRelationshipId: (id: string | null) => void
}

export const useRelationshipStore = create<RelationshipStoreState>((set) => ({
  createDialogOpen: false,
  editingRelationshipId: null,
  selectedRelationshipId: null,
  setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
  setEditingRelationshipId: (id) => set({ editingRelationshipId: id }),
  setSelectedRelationshipId: (id) => set({ selectedRelationshipId: id }),
}))
