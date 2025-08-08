import '@excalidraw/excalidraw/index.css'
import { Excalidraw } from '@excalidraw/excalidraw'
import React from 'react'
import type { DesignContent, ExcalidrawAPI } from '../utils/types'

export interface CanvasProps {
  activeId: string | null
  initialData: DesignContent | null
  onChange: (content: Pick<DesignContent, 'elements' | 'files'>) => void
  onApiReady: (api: ExcalidrawAPI) => void
}

export const Canvas: React.FC<CanvasProps> = ({ activeId, initialData, onChange, onApiReady }) => {
  return (
    <div className="canvas">
      {initialData && (
        <Excalidraw
          key={activeId || 'excalidraw'}
          initialData={{
            elements: (initialData.elements as unknown as readonly never[]) || [],
            files: (initialData.files as unknown as Record<string, never>) || {},
            scrollToContent: true,
          }}
          onChange={(elements, _appState, files) => {
            void _appState
            onChange({ elements: elements as unknown as DesignContent['elements'], files: files as unknown as DesignContent['files'] })
          }}
          excalidrawAPI={(api) => onApiReady(api as unknown as ExcalidrawAPI)}
        />
      )}
    </div>
  )
}


