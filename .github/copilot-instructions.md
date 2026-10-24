# Tellstory

Tellstory is a game set in an imaginable world, plus the tools to create that world.

## Project layout

| Path | Purpose |
|---|---|
| `engine/` | Shared engine used by both the editor and the game (world model, quad tree, hydration, deterministic number generation, game core). |
| `shared/` | Types and helpers shared between client and server. |
| `server/` | Express + SQLite backend (controllers, routes, repositories, game service, map generator). |
| `src/editor/` | **Map editor** – the creator draws terrain and places objects on the world map. |
| `src/palette-editor/` | **Palette editor** – the creator builds the objects (markers), tiles/terrains and vectors that the map editor uses. |
| `src/editor-menu/` | Menu screens for creating/loading worlds and palettes. |
| `src/game/`, `src/game-menu/` | The game itself. **Out of scope for now – do not modify unless asked.** |
| `src/components/`, `src/styles/` | Shared UI components and styles. |
| `src/store/` | Zustand stores. |
| `src/repositories/` | Client-side API repositories. |

## Rules

- Dependencies point one way: `src/*` and `server/*` may import from `engine/` and `shared/`. `engine/` must not import from `src/` or `server/`, and must stay free of React/DOM code.
- Current focus is the editor (map editor first). Leave the game alone.
- Stack: TypeScript, React 19, Vite, Zustand, Express, SQLite, Zod. Run with `npm run dev`; build with `npm run build`.

## Scoped instructions

More detail is in `.github/instructions/`:
- `engine.instructions.md` – world model, determinism.
- `map-editor.instructions.md` – map editor and canvas rendering.
- `palette-editor.instructions.md` – palette editor.
