import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import './App.css'
import { Sidebar } from './components/Sidebar'
import { Canvas } from './components/Canvas'
import { createEmptyDesign } from './utils/designUtils'
import { loadDesignContent, loadDesignList, saveDesignContent, saveDesignList, STORAGE_KEYS } from './utils/localStoreUtils'
import type { DesignContent, DesignMeta, DesignViewport } from './utils/types'

const COLLAPSED_SIDEBAR_WIDTH = 60
const DEFAULT_SIDEBAR_WIDTH = 248
const MIN_SIDEBAR_WIDTH = 220
const MAX_SIDEBAR_WIDTH = 360
const COLLAPSE_TRIGGER_WIDTH = 180
const SIDEBAR_WIDTH_STORAGE_KEY = 'exclidraw:ui:sidebar-width'
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'exclidraw:ui:sidebar-collapsed'

function getMaxSidebarWidth() {
  if (typeof window === 'undefined') {
    return MAX_SIDEBAR_WIDTH
  }

  return Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, window.innerWidth - 240))
}

function clampSidebarWidth(width: number) {
  return Math.min(getMaxSidebarWidth(), Math.max(MIN_SIDEBAR_WIDTH, Math.round(width)))
}

function normalizeViewport(viewport?: DesignViewport): DesignViewport | undefined {
  if (!viewport) return undefined

  const nextViewport: DesignViewport = {}

  if (typeof viewport.scrollX === 'number') {
    nextViewport.scrollX = viewport.scrollX
  }

  if (typeof viewport.scrollY === 'number') {
    nextViewport.scrollY = viewport.scrollY
  }

  if (typeof viewport.zoom?.value === 'number') {
    nextViewport.zoom = {
      value: viewport.zoom.value,
    }
  }

  return Object.keys(nextViewport).length > 0 ? nextViewport : undefined
}

function normalizeDesignContent(content?: DesignContent | null): DesignContent {
  const viewport = normalizeViewport(content?.viewport)

  return {
    elements: content?.elements || [],
    files: content?.files || {},
    scrollToContent: viewport ? false : (content?.scrollToContent ?? true),
    ...(viewport ? { viewport } : {}),
  }
}

function App() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })
  const [isResizing, setIsResizing] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY)
      if (!raw) return DEFAULT_SIDEBAR_WIDTH
      const parsed = Number(raw)
      return Number.isFinite(parsed) ? clampSidebarWidth(parsed) : DEFAULT_SIDEBAR_WIDTH
    } catch {
      return DEFAULT_SIDEBAR_WIDTH
    }
  })
  const [designs, setDesigns] = useState<DesignMeta[]>(() => loadDesignList())
  const designContentCacheRef = useRef<Record<string, DesignContent>>({})
  const [activeId, setActiveId] = useState<string | null>(() => designs[0]?.id ?? null)
  const [initialData, setInitialData] = useState<DesignContent | null>(() => {
    const firstDesignId = designs[0]?.id
    if (!firstDesignId) return null

    const content = normalizeDesignContent(loadDesignContent(firstDesignId))
    designContentCacheRef.current[firstDesignId] = content
    return content
  })
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('exclidraw:ui:theme') as 'light' | 'dark') || 'light')
  const resizeStateRef = useRef<{
    pointerId: number
    startX: number
    startWidth: number
    previousWidth: number
    initiallyCollapsed: boolean
    shouldCollapse: boolean
    shouldExpand: boolean
  } | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem('exclidraw:ui:theme', theme)
    } catch {
      // ignore
    }
  }, [theme])

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth))
    } catch {
      // ignore
    }
  }, [sidebarWidth])

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed))
    } catch {
      // ignore
    }
  }, [collapsed])

  useEffect(() => {
    const handleResize = () => {
      setSidebarWidth((current) => clampSidebarWidth(current))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    document.body.style.cursor = isResizing ? 'col-resize' : ''
    document.body.style.userSelect = isResizing ? 'none' : ''

    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  const getDesignContent = useCallback((id: string) => {
    const cachedContent = designContentCacheRef.current[id]
    if (cachedContent) {
      return cachedContent
    }

    const content = normalizeDesignContent(loadDesignContent(id))
    designContentCacheRef.current[id] = content
    return content
  }, [])

  const activateDesign = useCallback(
    (id: string) => {
      if (id === activeId) return
      setActiveId(id)
      setInitialData(getDesignContent(id))
    },
    [activeId, getDesignContent],
  )

  // ensure at least one design exists
  useEffect(() => {
    if (designs.length === 0) {
      const { meta, content } = createEmptyDesign('Untitled 1')
      const nextContent = normalizeDesignContent(content)
      designContentCacheRef.current[meta.id] = nextContent
      saveDesignContent(meta.id, nextContent)
      const nextList = [meta]
      saveDesignList(nextList)
      setDesigns(nextList)
      setActiveId(meta.id)
      setInitialData(nextContent)
    }
  }, [designs.length])

  const createNewDesign = useCallback(() => {
    const index = designs.length + 1
    const { meta, content } = createEmptyDesign(`Untitled ${index}`)
    const nextContent = normalizeDesignContent(content)
    designContentCacheRef.current[meta.id] = nextContent
    saveDesignContent(meta.id, nextContent)
    const next = [meta, ...designs]
    setDesigns(next)
    saveDesignList(next)
    setActiveId(meta.id)
    setInitialData(nextContent)
  }, [designs])

  const updateDesignTitle = useCallback(
    (id: string, title: string) => {
      const trimmedTitle = title.trim()
      if (!trimmedTitle) return

      const current = designs.find((d: DesignMeta) => d.id === id)
      if (!current || current.title === trimmedTitle) return

      const updated: DesignMeta = { ...current, title: trimmedTitle, updatedAt: Date.now() }
      const next = designs.map((d: DesignMeta) => (d.id === id ? updated : d))
      setDesigns(next)
      saveDesignList(next)
    },
    [designs],
  )

  const deleteDesign = useCallback(
    (id: string) => {
      if (!confirm('Delete this design?')) return
      localStorage.removeItem(STORAGE_KEYS.content(id))
      delete designContentCacheRef.current[id]
      const next = designs.filter((d: DesignMeta) => d.id !== id)
      setDesigns(next)
      saveDesignList(next)
      if (activeId === id) {
        const nextActiveId = next[0]?.id ?? null
        setActiveId(nextActiveId)
        setInitialData(nextActiveId ? getDesignContent(nextActiveId) : null)
      }
    },
    [designs, activeId, getDesignContent],
  )

  const reorderDesigns = useCallback((draggedId: string, targetId: string, position: 'before' | 'after') => {
    if (draggedId === targetId) return

    setDesigns((prev: DesignMeta[]) => {
      const draggedIndex = prev.findIndex((design) => design.id === draggedId)
      const targetIndex = prev.findIndex((design) => design.id === targetId)

      if (draggedIndex === -1 || targetIndex === -1) {
        return prev
      }

      const next = [...prev]
      const [draggedDesign] = next.splice(draggedIndex, 1)
      let insertIndex = targetIndex

      if (draggedIndex < targetIndex) {
        insertIndex -= 1
      }

      if (position === 'after') {
        insertIndex += 1
      }

      next.splice(insertIndex, 0, draggedDesign)
      saveDesignList(next)
      return next
    })
  }, [])

  // save on every scene change (lightweight debounce via requestIdleCallback)
  const queueDesignSave = useMemo(() => {
    let handle: number | null = null
    let shouldTouchMeta = false

    return (partial: Partial<DesignContent>, options?: { touchMeta?: boolean }) => {
      if (!activeId) return
      const designId = activeId
      const currentContent = normalizeDesignContent(designContentCacheRef.current[designId])
      const nextContent = normalizeDesignContent({
        ...currentContent,
        ...partial,
        viewport: partial.viewport === undefined ? currentContent.viewport : normalizeViewport(partial.viewport),
      })

      designContentCacheRef.current[designId] = nextContent
      if (options?.touchMeta) {
        shouldTouchMeta = true
      }

      if (handle) cancelIdleCallback(handle)
      handle = requestIdleCallback(() => {
        const contentToStore = designContentCacheRef.current[designId]
        if (!contentToStore) return

        saveDesignContent(designId, contentToStore)

        if (shouldTouchMeta) {
          setDesigns((prev: DesignMeta[]) => {
            const next = prev.map((d: DesignMeta) => (d.id === designId ? { ...d, updatedAt: Date.now() } : d))
            saveDesignList(next)
            return next
          })
        }

        shouldTouchMeta = false
        handle = null
      }) as unknown as number
    }
  }, [activeId])

  const handleResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      resizeStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startWidth: collapsed ? COLLAPSED_SIDEBAR_WIDTH : sidebarWidth,
        previousWidth: sidebarWidth,
        initiallyCollapsed: collapsed,
        shouldCollapse: false,
        shouldExpand: false,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
      setIsResizing(true)
    },
    [collapsed, sidebarWidth],
  )

  const handleResizeMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const resizeState = resizeStateRef.current
      if (!resizeState || resizeState.pointerId !== event.pointerId) return

      const delta = event.clientX - resizeState.startX
      const nextWidth = resizeState.startWidth + delta

      if (resizeState.initiallyCollapsed) {
        const shouldExpand = nextWidth >= COLLAPSE_TRIGGER_WIDTH
        resizeStateRef.current = {
          ...resizeState,
          shouldExpand,
        }

        if (!shouldExpand) {
          if (!collapsed) {
            setCollapsed(true)
          }
          return
        }

        if (collapsed) {
          setCollapsed(false)
        }
        setSidebarWidth(clampSidebarWidth(nextWidth))
        return
      }

      resizeStateRef.current = {
        ...resizeState,
        shouldCollapse: nextWidth <= COLLAPSE_TRIGGER_WIDTH,
      }

      setSidebarWidth(clampSidebarWidth(nextWidth))
    },
    [collapsed],
  )

  const handleResizeEnd = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const resizeState = resizeStateRef.current
    if (resizeState?.pointerId !== event.pointerId) return

    resizeStateRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setIsResizing(false)

    if (resizeState.initiallyCollapsed) {
      if (resizeState.shouldExpand) {
        setCollapsed(false)
      } else {
        setCollapsed(true)
        setSidebarWidth(resizeState.previousWidth)
      }
      return
    }

    if (resizeState.shouldCollapse) {
      setCollapsed(true)
    }
  }, [])

  const appGridTemplateColumns = `${collapsed ? COLLAPSED_SIDEBAR_WIDTH : sidebarWidth}px 8px minmax(0, 1fr)`

  return (
    <div
      className={`app ${collapsed ? 'collapsed' : ''} ${isResizing ? 'resizing' : ''} ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}
      style={{ gridTemplateColumns: appGridTemplateColumns }}
    >
      <Sidebar
        collapsed={collapsed}
        designs={designs}
        activeId={activeId}
        onToggleCollapsed={() => setCollapsed((v: boolean) => !v)}
        onCreateNew={createNewDesign}
        onSetActive={activateDesign}
        onReorder={reorderDesigns}
        onRenameInline={updateDesignTitle}
        onDelete={deleteDesign}
      />
      <div
        className="sidebarResizeHandle"
        role="separator"
        aria-label={collapsed ? 'Expand or resize sidebar' : 'Resize sidebar'}
        aria-orientation="vertical"
        onPointerDown={handleResizeStart}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeEnd}
        onPointerCancel={handleResizeEnd}
      />
      <main className="main">
        <Canvas
          activeId={activeId}
          initialData={initialData}
          onChange={({ elements, files, viewport }) =>
            queueDesignSave(
              {
                elements,
                files,
                viewport,
              },
              { touchMeta: true },
            )
          }
          onViewportChange={(viewport) =>
            queueDesignSave({
              viewport,
            })
          }
          theme={theme}
          onThemeChange={(t) => setTheme(t)}
        />
      </main>
    </div>
  )
}

export default App
