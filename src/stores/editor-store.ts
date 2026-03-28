import { create } from 'zustand'

interface EditorUIState {
  mode: 'prose' | 'screenplay'
  wordCount: number
  activeManuscriptId: string | null
  isDirty: boolean
  sidebarCollapsed: boolean
  setMode: (mode: 'prose' | 'screenplay') => void
  setWordCount: (count: number) => void
  setActiveManuscriptId: (id: string | null) => void
  setIsDirty: (dirty: boolean) => void
  toggleSidebar: () => void
}

export const useEditorUI = create<EditorUIState>((set) => ({
  mode: 'prose',
  wordCount: 0,
  activeManuscriptId: null,
  isDirty: false,
  sidebarCollapsed: false,
  setMode: (mode) => set({ mode }),
  setWordCount: (count) => set({ wordCount: count }),
  setActiveManuscriptId: (id) => set({ activeManuscriptId: id }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
