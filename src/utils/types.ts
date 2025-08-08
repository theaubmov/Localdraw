export type BinaryFiles = Record<string, unknown>

export type ExcalidrawAPI = {
  updateScene: (opts: { elements?: readonly unknown[]; files?: BinaryFiles }) => void
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
}


