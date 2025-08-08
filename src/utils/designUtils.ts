import type { DesignContent, DesignMeta } from './types'

export function createEmptyDesign(title: string): { meta: DesignMeta; content: DesignContent } {
  const id = crypto.randomUUID()
  const now = Date.now()
  return {
    meta: { id, title, updatedAt: now },
    content: { elements: [], scrollToContent: true, files: {} },
  }
}

export function formatDateTime(ts: number): string {
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ''
  }
}
