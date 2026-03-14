### PageDraw

A small Vibe Coding project built with Cursor and GPT‑5 that wraps Excalidraw in a minimal multi‑page experience. Designs are stored in the browser (localStorage), so you can create, rename, switch, and delete multiple canvases instantly without any backend.

<img width="2133" height="1209" alt="image" src="https://raw.githubusercontent.com/theaubmov/PageDraw/refs/heads/main/public/pagedraw.png" />


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

### Notes
- This is a local‑first demo and does not sync to a server.
- Clearing browser storage will remove your saved designs.

### License
This project is licensed under the MIT License. See `LICENSE`.

This distribution includes Excalidraw, which is licensed under the MIT License. See `THIRD_PARTY_NOTICES.md` for the Excalidraw copyright and license notice.
