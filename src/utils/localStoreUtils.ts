import type { DesignContent, DesignMeta } from './types'

export const STORAGE_KEYS = {
  list: 'exclidraw:designs:list',
  content: (id: string) => `exclidraw:designs:content:${id}`,
}

export function loadDesignList(): DesignMeta[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.list)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as DesignMeta[]
  } catch {
    return []
  }
}

export function saveDesignList(list: DesignMeta[]) {
  localStorage.setItem(STORAGE_KEYS.list, JSON.stringify(list))
}

export function loadDesignContent(id: string): DesignContent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.content(id))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveDesignContent(id: string, content: DesignContent) {
  localStorage.setItem(STORAGE_KEYS.content(id), JSON.stringify(content))
}


