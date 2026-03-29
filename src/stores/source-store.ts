import { create } from 'zustand'

type IngestionStep = 'idle' | 'uploading' | 'analyzing' | 'reviewing' | 'complete' | 'error'

interface SourceStoreState {
  createDialogOpen: boolean
  editingSourceId: string | null
  selectedSourceId: string | null
  ingestionStep: IngestionStep
  ingestingSourceId: string | null
  setCreateDialogOpen: (open: boolean) => void
  setEditingSourceId: (id: string | null) => void
  setSelectedSourceId: (id: string | null) => void
  setIngestionStep: (step: IngestionStep) => void
  setIngestingSourceId: (id: string | null) => void
}

export const useSourceStore = create<SourceStoreState>((set) => ({
  createDialogOpen: false,
  editingSourceId: null,
  selectedSourceId: null,
  ingestionStep: 'idle',
  ingestingSourceId: null,
  setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
  setEditingSourceId: (id) => set({ editingSourceId: id }),
  setSelectedSourceId: (id) => set({ selectedSourceId: id }),
  setIngestionStep: (step) => set({ ingestionStep: step }),
  setIngestingSourceId: (id) => set({ ingestingSourceId: id }),
}))
