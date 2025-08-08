import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '@excalidraw/excalidraw/index.css'
import { Excalidraw } from '@excalidraw/excalidraw'
import { FiPlus, FiChevronLeft, FiChevronRight, FiEdit2, FiTrash2, FiFile } from 'react-icons/fi'
// Local minimal types to avoid deep Excalidraw type imports
type BinaryFiles = Record<string, unknown>
type ExcalidrawAPI = {
  updateScene: (opts: { elements?: readonly unknown[]; files?: BinaryFiles }) => void
}
import './App.css'

type DesignMeta = {
  id: string
  title: string
  updatedAt: number
}

type DesignContent = {
  elements?: readonly unknown[]
  files?: BinaryFiles
  scrollToContent?: boolean
}

const STORAGE_KEYS = {
  list: 'exclidraw:designs:list',
  content: (id: string) => `exclidraw:designs:content:${id}`,
}

function loadDesignList(): DesignMeta[] {
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

function saveDesignList(list: DesignMeta[]) {
  localStorage.setItem(STORAGE_KEYS.list, JSON.stringify(list))
}

function loadDesignContent(id: string): DesignContent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.content(id))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveDesignContent(id: string, content: DesignContent) {
  localStorage.setItem(STORAGE_KEYS.content(id), JSON.stringify(content))
}

function createEmptyDesign(title: string): { meta: DesignMeta; content: DesignContent } {
  const id = crypto.randomUUID()
  const now = Date.now()
  return {
    meta: { id, title, updatedAt: now },
    content: { elements: [], scrollToContent: true, files: {} },
  }
}

function formatDateTime(ts: number) {
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ''
  }
}

function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [designs, setDesigns] = useState<DesignMeta[]>(() => loadDesignList())
  const [activeId, setActiveId] = useState<string | null>(() => designs[0]?.id ?? null)
  const [initialData, setInitialData] = useState<DesignContent | null>(null)

  const excalidrawApiRef = useRef<ExcalidrawAPI | null>(null)

  // ensure at least one design exists
  useEffect(() => {
    if (designs.length === 0) {
      const { meta, content } = createEmptyDesign('Untitled 1')
      saveDesignContent(meta.id, content)
      const nextList = [meta]
      saveDesignList(nextList)
      setDesigns(nextList)
      setActiveId(meta.id)
      setInitialData(content)
    }
  }, [designs.length])

  // load content when activeId changes
  useEffect(() => {
    if (!activeId) return
    const content = (loadDesignContent(activeId) || {
      elements: [],
      files: {},
      scrollToContent: true,
    }) as DesignContent
    setInitialData(content)
    // also update the live scene if Excalidraw is already mounted
    if (excalidrawApiRef.current) {
      try {
        // Avoid passing appState to prevent overriding internal required defaults
        excalidrawApiRef.current.updateScene({
          elements: content.elements || [],
          files: content.files || {},
        })
      } catch {
        // noop
      }
    }
  }, [activeId])

  const createNewDesign = useCallback(() => {
    const index = designs.length + 1
    const { meta, content } = createEmptyDesign(`Untitled ${index}`)
    saveDesignContent(meta.id, content)
    const next = [meta, ...designs]
    setDesigns(next)
    saveDesignList(next)
    setActiveId(meta.id)
    setInitialData(content)
  }, [designs])

  const renameDesign = useCallback(
    (id: string) => {
      const current = designs.find((d: DesignMeta) => d.id === id)
      if (!current) return
      const title = prompt('Rename design', current.title)?.trim()
      if (!title) return
      const updated: DesignMeta = { ...current, title, updatedAt: Date.now() }
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
      const next = designs.filter((d: DesignMeta) => d.id !== id)
      setDesigns(next)
      saveDesignList(next)
      if (activeId === id) {
        setActiveId(next[0]?.id ?? null)
      }
    },
    [designs, activeId],
  )

  // save on every scene change (lightweight debounce via requestIdleCallback)
  const saveScene = useMemo(() => {
    let handle: number | null = null
    return (content: DesignContent) => {
      if (!activeId) return
      if (handle) cancelIdleCallback(handle as unknown as number)
      handle = requestIdleCallback(() => {
        // persist only serializable subset
        const toStore: DesignContent = {
          elements: content.elements || [],
          files: content.files || {},
        }
        saveDesignContent(activeId, toStore)
        setDesigns((prev: DesignMeta[]) => {
          const next = prev.map((d: DesignMeta) => (d.id === activeId ? { ...d, updatedAt: Date.now() } : d))
          saveDesignList(next)
          return next
        })
      }) as unknown as number
    }
  }, [activeId])

  return (
    <div className={`app ${collapsed ? 'collapsed' : ''}`}>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebarHeader">
          <button
            className="iconButton toggleButton"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((v: boolean) => !v)}
          >
            {collapsed ? <FiChevronRight aria-hidden className="icon" /> : <FiChevronLeft aria-hidden className="icon" />}
          </button>
          {!collapsed && <h2 className="sidebarTitle">Excalidraw</h2>}
          {!collapsed && (
            <button className="primaryButton newButton" onClick={createNewDesign} title="Create new design" aria-label="Create new design">
              <FiPlus className="icon" aria-hidden />
              <span>New</span>
            </button>
          )}
        </div>
        <div className="designList">
          {designs.map((d: DesignMeta) =>
            collapsed ? (
              <div key={d.id} className={`designIconItem ${activeId === d.id ? 'active' : ''}`}>
                <button
                  className="designIconButton"
                  onClick={() => setActiveId(d.id)}
                  title={`${d.title} • ${formatDateTime(d.updatedAt)}`}
                  aria-label={`Open ${d.title}`}
                >
                  <FiFile className="icon" aria-hidden />
                </button>
              </div>
            ) : (
              <div key={d.id} className={`designItem ${activeId === d.id ? 'active' : ''}`}>
                <button className="designButton" onClick={() => setActiveId(d.id)}>
                  <div className="designTitle">{d.title}</div>
                  <div className="designMeta">{formatDateTime(d.updatedAt)}</div>
                </button>
                <div className="designActions">
                  <button className="iconButton" onClick={() => renameDesign(d.id)} title="Rename" aria-label="Rename design">
                    <FiEdit2 className="icon" aria-hidden />
                  </button>
                  <button className="iconButton" onClick={() => deleteDesign(d.id)} title="Delete" aria-label="Delete design">
                    <FiTrash2 className="icon" aria-hidden />
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      </aside>
      <main className="main">
        <div className="canvas">
          {initialData && (
            <Excalidraw
              key={activeId || 'excalidraw'}
              initialData={{
                elements: initialData.elements || [],
                files: initialData.files || {},
                scrollToContent: true,
              }}
              onChange={(elements, _appState, files) => {
                // mark unused param as used to satisfy noUnusedParameters
                void _appState
                saveScene({ elements, files })
              }}
              excalidrawAPI={(api) => (excalidrawApiRef.current = api)}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
