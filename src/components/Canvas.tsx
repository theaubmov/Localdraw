import '@excalidraw/excalidraw/index.css'
import { Excalidraw } from '@excalidraw/excalidraw'
import React from 'react'
import type { DesignContent, DesignViewport, ExcalidrawAPI } from '../utils/types'

export interface CanvasProps {
  activeId: string | null
  initialData: DesignContent | null
  onChange: (content: Pick<DesignContent, 'elements' | 'files' | 'viewport'>) => void
  onViewportChange: (viewport: DesignViewport) => void
  onApiReady: (api: ExcalidrawAPI) => void
  theme?: 'light' | 'dark'
  onThemeChange?: (theme: 'light' | 'dark') => void
}

function getViewportFromAppState(appState: unknown): DesignViewport {
  const nextViewport: DesignViewport = {}
  const candidate = (appState ?? {}) as {
    scrollX?: unknown
    scrollY?: unknown
    zoom?: {
      value?: unknown
    }
  }

  if (typeof candidate.scrollX === 'number') {
    nextViewport.scrollX = candidate.scrollX
  }

  if (typeof candidate.scrollY === 'number') {
    nextViewport.scrollY = candidate.scrollY
  }

  if (typeof candidate.zoom?.value === 'number') {
    nextViewport.zoom = {
      value: candidate.zoom.value,
    }
  }

  return nextViewport
}

export const Canvas: React.FC<CanvasProps> = ({ activeId, initialData, onChange, onViewportChange, onApiReady, theme, onThemeChange }) => {
  const restoredViewport = initialData?.viewport
  const hasRestoredViewport =
    typeof restoredViewport?.scrollX === 'number' &&
    typeof restoredViewport?.scrollY === 'number' &&
    typeof restoredViewport?.zoom?.value === 'number'

  const initialAppState = {
    ...(theme ? { theme } : {}),
    ...(typeof restoredViewport?.scrollX === 'number' ? { scrollX: restoredViewport.scrollX } : {}),
    ...(typeof restoredViewport?.scrollY === 'number' ? { scrollY: restoredViewport.scrollY } : {}),
    ...(typeof restoredViewport?.zoom?.value === 'number' ? { zoom: restoredViewport.zoom } : {}),
  }

  return (
    <div className="canvas">
      {initialData && (
        <Excalidraw
          key={activeId ?? 'empty-canvas'}
          initialData={(
            {
              elements: (initialData.elements as unknown as readonly never[]) || [],
              files: (initialData.files as unknown as Record<string, never>) || {},
              scrollToContent: hasRestoredViewport ? false : (initialData.scrollToContent ?? true),
              appState: Object.keys(initialAppState).length > 0 ? (initialAppState as { theme?: 'light' | 'dark' }) : undefined,
            }
          ) as unknown as Parameters<typeof Excalidraw>[0]['initialData']}
          theme={theme}
          onChange={(elements, appState, files) => {
            const maybeTheme = (appState as { theme?: 'light' | 'dark' } | null)?.theme
            if (maybeTheme === 'light' || maybeTheme === 'dark') {
              onThemeChange?.(maybeTheme)
            }
            onChange({
              elements: elements as unknown as DesignContent['elements'],
              files: files as unknown as DesignContent['files'],
              viewport: getViewportFromAppState(appState),
            })
          }}
          onScrollChange={(scrollX, scrollY, zoom) => {
            onViewportChange({
              scrollX,
              scrollY,
              zoom: {
                value: zoom.value,
              },
            })
          }}
          excalidrawAPI={(api) => onApiReady(api as unknown as ExcalidrawAPI)}
        />
      )}
    </div>
  )
}
