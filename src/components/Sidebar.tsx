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
  onReorder: (draggedId: string, targetId: string, position: 'before' | 'after') => void
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
  onReorder,
  onRenameInline,
  onDelete,
}) => {
  const designCountLabel = `${designs.length} ${designs.length === 1 ? 'canvas' : 'canvases'}`
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ id: string; position: 'before' | 'after' } | null>(null)
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

  const clearDragState = () => {
    setDraggedId(null)
    setDropTarget(null)
  }

  const handleDragStart = (id: string) => (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
    setDraggedId(id)
    setDropTarget(null)
  }

  const handleDragOver = (id: string) => (event: React.DragEvent<HTMLDivElement>) => {
    if (!draggedId || draggedId === id) return

    event.preventDefault()
    const bounds = event.currentTarget.getBoundingClientRect()
    const position = event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after'
    setDropTarget((current) => {
      if (current?.id === id && current.position === position) {
        return current
      }

      return { id, position }
    })
  }

  const handleDrop = (id: string) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!draggedId || draggedId === id || !dropTarget || dropTarget.id !== id) {
      clearDragState()
      return
    }

    onReorder(draggedId, id, dropTarget.position)
    clearDragState()
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
                <div
                  key={d.id}
                  className={`designIconItem ${activeId === d.id ? 'active' : ''} ${draggedId === d.id ? 'is-dragging' : ''} ${
                    dropTarget?.id === d.id ? `drop-${dropTarget.position}` : ''
                  }`}
                  draggable
                  onDragStart={handleDragStart(d.id)}
                  onDragOver={handleDragOver(d.id)}
                  onDrop={handleDrop(d.id)}
                  onDragEnd={clearDragState}
                >
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
                <div
                  key={d.id}
                  className={`designItem ${activeId === d.id ? 'active' : ''} ${draggedId === d.id ? 'is-dragging' : ''} ${
                    dropTarget?.id === d.id ? `drop-${dropTarget.position}` : ''
                  }`}
                  draggable={editingId !== d.id}
                  onDragStart={handleDragStart(d.id)}
                  onDragOver={handleDragOver(d.id)}
                  onDrop={handleDrop(d.id)}
                  onDragEnd={clearDragState}
                >
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
          {!collapsed && <p className="sidebarFooterText">Changes stay in your browser. Double-click to edit, drag to reorder.</p>}
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
