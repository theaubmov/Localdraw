import { FiPlus, FiSidebar, FiTrash2 } from 'react-icons/fi'
import type { DesignMeta } from '../utils/types'
import React, { useEffect, useRef, useState } from 'react'

export interface SidebarProps {
  collapsed: boolean
  designs: DesignMeta[]
  activeId: string | null
  onToggleCollapsed: () => void
  onCreateNew: () => void
  onSetActive: (id: string) => void
  onRenameInline: (id: string, title: string) => void
  onDelete: (id: string) => void
}

function getMonogram(title: string) {
  const letters = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join('')

  return letters || 'PD'
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  designs,
  activeId,
  onToggleCollapsed,
  onCreateNew,
  onSetActive,
  onRenameInline,
  onDelete,
}) => {
  const designCountLabel = `${designs.length} ${designs.length === 1 ? 'canvas' : 'canvases'}`
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!collapsed || editingId === null) return
    setEditingId(null)
    setDraftTitle('')
  }, [collapsed, editingId])

  useEffect(() => {
    if (!editingId) return
    if (!designs.some((design) => design.id === editingId)) {
      setEditingId(null)
      setDraftTitle('')
    }
  }, [designs, editingId])

  useEffect(() => {
    if (!editingId) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [editingId])

  const startInlineRename = (design: DesignMeta) => {
    setEditingId(design.id)
    setDraftTitle(design.title)
  }

  const cancelInlineRename = () => {
    setEditingId(null)
    setDraftTitle('')
  }

  const submitInlineRename = () => {
    if (!editingId) return

    const trimmedTitle = draftTitle.trim()
    if (trimmedTitle) {
      onRenameInline(editingId, trimmedTitle)
    }
    cancelInlineRename()
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebarInner">
        <div className="sidebarHeader">
          {!collapsed && <h2 className="sidebarTitle">PageDraw</h2>}
          <button
            className="iconButton toggleButton"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={onToggleCollapsed}
          >
            <FiSidebar aria-hidden className={`icon toggleIcon ${collapsed ? 'is-collapsed' : ''}`} />
          </button>
        </div>
        <div className={`sidebarDivider ${collapsed ? 'collapsedDivider' : ''}`} aria-hidden />

        {!collapsed && (
          <>
            <div className="sidebarSectionHeader">
              <span className="sidebarSectionLabel">Canvases</span>
              <span className="sidebarSectionHint">{designCountLabel}</span>
            </div>
          </>
        )}

        <div className="designList">
          {collapsed
            ? designs.map((d: DesignMeta) => (
                <div key={d.id} className={`designIconItem ${activeId === d.id ? 'active' : ''}`}>
                  <button
                    className="designIconButton"
                    onClick={() => onSetActive(d.id)}
                    title={d.title}
                    aria-label={`Open ${d.title}`}
                  >
                    <span className="designIconMonogram" aria-hidden>
                      {getMonogram(d.title)}
                    </span>
                  </button>
                </div>
              ))
            : designs.map((d: DesignMeta) => (
                <div key={d.id} className={`designItem ${activeId === d.id ? 'active' : ''}`}>
                  {editingId === d.id ? (
                    <div className="designButton editing" role="group" aria-label={`Renaming ${d.title}`}>
                      <div className="designBadge" aria-hidden>
                        {getMonogram(d.title)}
                      </div>
                      <div className="designCopy">
                        <input
                          ref={inputRef}
                          className="designTitleInput"
                          value={draftTitle}
                          onChange={(event) => setDraftTitle(event.target.value)}
                          onBlur={submitInlineRename}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              submitInlineRename()
                            }
                            if (event.key === 'Escape') {
                              event.preventDefault()
                              cancelInlineRename()
                            }
                          }}
                          aria-label="Canvas title"
                        />
                      </div>
                    </div>
                  ) : (
                    <button className="designButton" onClick={() => onSetActive(d.id)} onDoubleClick={() => startInlineRename(d)}>
                      <div className="designBadge" aria-hidden>
                        {getMonogram(d.title)}
                      </div>
                      <div className="designCopy">
                        <div className="designTitle">{d.title}</div>
                      </div>
                    </button>
                  )}
                  <div className="designActions">
                    <button className="iconButton" onClick={() => onDelete(d.id)} title="Delete" aria-label="Delete design">
                      <FiTrash2 className="icon" aria-hidden />
                    </button>
                  </div>
                </div>
              ))}
        </div>

        <div className="sidebarFooter">
          {!collapsed && <p className="sidebarFooterText">Changes stay in your browser.</p>}
          <div className="sidebarToolbar">
            <button className={`primaryButton ${collapsed ? 'collapsedNewButton' : 'newButton'}`} onClick={onCreateNew} title="Create new design" aria-label="Create new design">
              <FiPlus className="icon" aria-hidden />
              {!collapsed && <span>New canvas</span>}
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
