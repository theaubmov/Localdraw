import '@excalidraw/excalidraw/index.css'
import { CaptureUpdateAction, Excalidraw } from '@excalidraw/excalidraw'
import React, { useLayoutEffect, useMemo, useRef } from 'react'
import type { DesignContent, DesignViewport, ExcalidrawAPI, ExcalidrawSceneAppState } from '../utils/types'

export interface CanvasProps {
  activeId: string | null
  initialData: DesignContent | null
  onChange: (content: Pick<DesignContent, 'elements' | 'files' | 'viewport'>) => void
  onViewportChange: (viewport: DesignViewport) => void
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

function getSceneAppState(theme: 'light' | 'dark' | undefined, viewport?: DesignViewport): ExcalidrawSceneAppState {
  return {
    ...(theme ? { theme } : {}),
    scrollX: viewport?.scrollX ?? 0,
    scrollY: viewport?.scrollY ?? 0,
    zoom: viewport?.zoom ?? { value: 1 },
    selectedElementIds: {},
    previousSelectedElementIds: {},
    selectedGroupIds: {},
    editingGroupId: null,
  }
}

export const Canvas: React.FC<CanvasProps> = ({ activeId, initialData, onChange, onViewportChange, theme, onThemeChange }) => {
  const apiRef = useRef<ExcalidrawAPI | null>(null)
  const previousActiveIdRef = useRef<string | null>(null)
  const restoredViewport = initialData?.viewport
  const hasRestoredViewport =
    typeof restoredViewport?.scrollX === 'number' &&
    typeof restoredViewport?.scrollY === 'number' &&
    typeof restoredViewport?.zoom?.value === 'number'

  const sceneAppState = useMemo(() => getSceneAppState(theme, restoredViewport), [restoredViewport, theme])

  useLayoutEffect(() => {
    if (!activeId || !initialData || !apiRef.current) return

    const didSwitchScene = previousActiveIdRef.current !== null && previousActiveIdRef.current !== activeId

    apiRef.current.updateScene({
      elements: (initialData.elements as unknown as readonly never[]) || [],
      files: (initialData.files as unknown as Record<string, never>) || {},
      appState: sceneAppState,
      captureUpdate: CaptureUpdateAction.NEVER,
    })

    if (didSwitchScene) {
      apiRef.current.history.clear()
    }

    previousActiveIdRef.current = activeId
  }, [activeId, initialData, sceneAppState])

  return (
    <div className="canvas">
      {initialData && (
        <Excalidraw
          UIOptions={{
            canvasActions: {
              toggleTheme: true,
            },
          }}
          initialData={(
            {
              elements: (initialData.elements as unknown as readonly never[]) || [],
              files: (initialData.files as unknown as Record<string, never>) || {},
              scrollToContent: hasRestoredViewport ? false : (initialData.scrollToContent ?? true),
              appState: sceneAppState,
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
          excalidrawAPI={(api) => {
            apiRef.current = api as unknown as ExcalidrawAPI
            previousActiveIdRef.current ??= activeId
          }}
        />
      )}
    </div>
  )
}
