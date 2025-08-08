### Excalidraw-client

A small Vibe Coding project built with Cursor and GPT‑5 that wraps Excalidraw in a minimal multi‑page experience. Designs are stored in the browser (localStorage), so you can create, rename, switch, and delete multiple canvases instantly without any backend.

<img width="2133" height="1209" alt="image" src="https://github.com/user-attachments/assets/a3a2e74a-0f02-4b87-807e-3701aa5903df" />


### Highlights
- **Multiple designs (pages)**: create, switch, rename, delete; each design is saved to localStorage.
- **Autosave**: every change is saved (debounced via requestIdleCallback) so nothing is lost.
- **Dark mode sync**: when Excalidraw switches themes, the sidebar/app theme follows automatically.
- **Lightweight UI**: a collapsible sidebar with a clean Notion‑like look.

### Tech stack
- React + TypeScript + Vite
- Excalidraw (`@excalidraw/excalidraw`)
- Local storage for persistence

### Getting started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open the app at the URL printed in your terminal (typically `http://localhost:5173`).

### How it works
- The sidebar lists your designs (stored in localStorage). Selecting a design loads its scene.
- The canvas is powered by Excalidraw. Changes are persisted to localStorage per design.
- Theme is detected from Excalidraw and mirrored in the app so the sidebar matches light/dark mode.

### Directory structure
```
src/
  components/
    Canvas.tsx        # Excalidraw wrapper
    Sidebar.tsx       # Collapsible design list & actions
  utils/
    types.ts          # Shared local types
    designUtils.ts    # createEmptyDesign, formatDateTime
    localStoreUtils.ts# localStorage helpers
  App.tsx             # App state + composition
  App.css             # App layout & sidebar styles
  index.css           # Theme variables (light/dark)
  main.tsx            # Entry
```

### Notes
- This is a local‑first demo and does not sync to a server.
- Clearing browser storage will remove your saved designs.

### License
MIT
