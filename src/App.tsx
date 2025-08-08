import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { Sidebar } from './components/Sidebar'
import { Canvas } from './components/Canvas'
import { createEmptyDesign } from './utils/designUtils'
import { loadDesignContent, loadDesignList, saveDesignContent, saveDesignList, STORAGE_KEYS } from './utils/localStoreUtils'
import type { DesignContent, DesignMeta, ExcalidrawAPI } from './utils/types'

function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [designs, setDesigns] = useState<DesignMeta[]>(() => loadDesignList())
  const [activeId, setActiveId] = useState<string | null>(() => designs[0]?.id ?? null)
  const [initialData, setInitialData] = useState<DesignContent | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('exclidraw:ui:theme') as 'light' | 'dark') || 'light')
  useEffect(() => {
    try {
      localStorage.setItem('exclidraw:ui:theme', theme)
    } catch {
      // ignore
    }
  }, [theme])

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
    <div className={`app ${collapsed ? 'collapsed' : ''} ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      <Sidebar
        collapsed={collapsed}
        designs={designs}
        activeId={activeId}
        onToggleCollapsed={() => setCollapsed((v: boolean) => !v)}
        onCreateNew={createNewDesign}
        onSetActive={setActiveId}
        onRename={renameDesign}
        onDelete={deleteDesign}
      />
      <main className="main">
        <Canvas
          activeId={activeId}
          initialData={initialData}
          onChange={({ elements, files }) => saveScene({ elements, files })}
          onApiReady={(api) => (excalidrawApiRef.current = api)}
          theme={theme}
          onThemeChange={(t) => setTheme(t)}
        />
      </main>
    </div>
  )
}

export default App
