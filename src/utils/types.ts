export type BinaryFiles = Record<string, unknown>

export type DesignViewport = {
  scrollX?: number
  scrollY?: number
  zoom?: {
    value: number
  }
}

export type ExcalidrawAPI = {
  updateScene: (opts: {
    elements?: readonly unknown[]
    files?: BinaryFiles
    appState?: {
      theme?: 'light' | 'dark'
      scrollX?: number
      scrollY?: number
      zoom?: DesignViewport['zoom']
    }
  }) => void
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
