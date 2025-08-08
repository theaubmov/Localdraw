import { FiPlus, FiChevronLeft, FiChevronRight, FiEdit2, FiTrash2, FiFile } from 'react-icons/fi'
import type { DesignMeta } from '../utils/types'
import { formatDateTime } from '../utils/designUtils'
import React from 'react'

export interface SidebarProps {
  collapsed: boolean
  designs: DesignMeta[]
  activeId: string | null
  onToggleCollapsed: () => void
  onCreateNew: () => void
  onSetActive: (id: string) => void
  onRename: (id: string) => void
  onDelete: (id: string) => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  designs,
  activeId,
  onToggleCollapsed,
  onCreateNew,
  onSetActive,
  onRename,
  onDelete,
}) => {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebarHeader">
        <button
          className="iconButton toggleButton"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleCollapsed}
        >
          {collapsed ? <FiChevronRight aria-hidden className="icon" /> : <FiChevronLeft aria-hidden className="icon" />}
        </button>
        {!collapsed && <h2 className="sidebarTitle">PageDraw</h2>}
        {!collapsed && (
          <button className="primaryButton newButton" onClick={onCreateNew} title="Create new design" aria-label="Create new design">
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
                onClick={() => onSetActive(d.id)}
                title={`${d.title} • ${formatDateTime(d.updatedAt)}`}
                aria-label={`Open ${d.title}`}
              >
                <FiFile className="icon" aria-hidden />
              </button>
            </div>
          ) : (
            <div key={d.id} className={`designItem ${activeId === d.id ? 'active' : ''}`}>
              <button className="designButton" onClick={() => onSetActive(d.id)}>
                <div className="designTitle">{d.title}</div>
                <div className="designMeta">{formatDateTime(d.updatedAt)}</div>
              </button>
              <div className="designActions">
                <button className="iconButton" onClick={() => onRename(d.id)} title="Rename" aria-label="Rename design">
                  <FiEdit2 className="icon" aria-hidden />
                </button>
                <button className="iconButton" onClick={() => onDelete(d.id)} title="Delete" aria-label="Delete design">
                  <FiTrash2 className="icon" aria-hidden />
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </aside>
  )
}


