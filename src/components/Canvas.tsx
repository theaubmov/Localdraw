import '@excalidraw/excalidraw/index.css'
import { Excalidraw } from '@excalidraw/excalidraw'
import React from 'react'
import type { DesignContent, ExcalidrawAPI } from '../utils/types'

export interface CanvasProps {
  activeId: string | null
  initialData: DesignContent | null
  onChange: (content: Pick<DesignContent, 'elements' | 'files'>) => void
  onApiReady: (api: ExcalidrawAPI) => void
  theme?: 'light' | 'dark'
  onThemeChange?: (theme: 'light' | 'dark') => void
}

export const Canvas: React.FC<CanvasProps> = ({ initialData, onChange, onApiReady, theme, onThemeChange }) => {
  return (
    <div className="canvas">
      {initialData && (
        <Excalidraw
          initialData={(
            {
              elements: (initialData.elements as unknown as readonly never[]) || [],
              files: (initialData.files as unknown as Record<string, never>) || {},
              scrollToContent: true,
              appState: theme ? ({ theme } as { theme: 'light' | 'dark' }) : undefined,
            }
          ) as unknown as Parameters<typeof Excalidraw>[0]['initialData']}
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
