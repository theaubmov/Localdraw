export type BinaryFiles = Record<string, unknown>

export type DesignViewport = {
  scrollX?: number
  scrollY?: number
  zoom?: {
    value: number
  }
}

export type ExcalidrawSceneAppState = {
  theme?: 'light' | 'dark'
  scrollX?: number
  scrollY?: number
  zoom?: DesignViewport['zoom']
  selectedElementIds?: Record<string, true>
  previousSelectedElementIds?: Record<string, true>
  selectedGroupIds?: Record<string, true>
  editingGroupId?: string | null
}

export type ExcalidrawAPI = {
  updateScene: (opts: {
    elements?: readonly unknown[]
    files?: BinaryFiles
    appState?: ExcalidrawSceneAppState
    captureUpdate?: 'IMMEDIATELY' | 'NEVER' | 'EVENTUALLY'
  }) => void
  history: {
    clear: () => void
  }
}

export type DesignMeta = {
  id: string
  title: string
  updatedAt: number
}

export type DesignContent = {
  elements?: readonly unknown[]
  files?: BinaryFiles
  scrollToContent?: boolean
  viewport?: DesignViewport
}
