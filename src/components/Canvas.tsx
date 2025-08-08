import '@excalidraw/excalidraw/index.css'
import { Excalidraw } from '@excalidraw/excalidraw'
import React from 'react'
import type { DesignContent, ExcalidrawAPI } from '../utils/types'

export interface CanvasProps {
  activeId: string | null
  initialData: DesignContent | null
  onChange: (content: Pick<DesignContent, 'elements' | 'files'>) => void
  onApiReady: (api: ExcalidrawAPI) => void
  onThemeChange?: (theme: 'light' | 'dark') => void
}

export const Canvas: React.FC<CanvasProps> = ({ initialData, onChange, onApiReady, onThemeChange }) => {
  return (
    <div className="canvas">
      {initialData && (
        <Excalidraw
          /* avoid remounting to preserve internal theme state */
          initialData={{
            elements: (initialData.elements as unknown as readonly never[]) || [],
            files: (initialData.files as unknown as Record<string, never>) || {},
            scrollToContent: true,
          }}
          onChange={(elements, _appState, files) => {
            void _appState
            const maybeTheme = (_appState as unknown as { theme?: 'light' | 'dark' } | null)?.theme
            if (maybeTheme === 'light' || maybeTheme === 'dark') {
              onThemeChange?.(maybeTheme)
            }
            onChange({ elements: elements as unknown as DesignContent['elements'], files: files as unknown as DesignContent['files'] })
          }}
          excalidrawAPI={(api) => onApiReady(api as unknown as ExcalidrawAPI)}
        />
      )}
    </div>
  )
}


