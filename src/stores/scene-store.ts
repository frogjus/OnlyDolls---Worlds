import { create } from 'zustand'

interface SceneUIState {
  createDialogOpen: boolean
  editingSceneId: string | null
  selectedSceneId: string | null
  setCreateDialogOpen: (open: boolean) => void
  setEditingSceneId: (id: string | null) => void
  setSelectedSceneId: (id: string | null) => void
}

export const useSceneStore = create<SceneUIState>((set) => ({
  createDialogOpen: false,
  editingSceneId: null,
  selectedSceneId: null,
  setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
  setEditingSceneId: (id) => set({ editingSceneId: id }),
  setSelectedSceneId: (id) => set({ selectedSceneId: id }),
}))
