---
description: "Palette editor: creating objects (markers), tiles/terrains and vectors."
applyTo: "src/palette-editor/**"
---

# Palette editor (`src/palette-editor/`)

The creator builds the building blocks of a world here. The map editor (`src/editor/`) then places and draws with them.

## Structure

- `markers/` – objects that can be placed in the world, with meta and tag modals and AI prompt generation.
- `tiles/` – tiles/terrains used to draw the map.
- `vectors/` – vector shapes.
- `topbar/` – import and export (JSON) of palettes.
- `tab-bar/` – switches between markers, tiles and vectors.
- State lives in `src/store/paletteEditorStore.ts`. Data is accessed through `src/repositories/paletteRepository.ts` and `server/` palette controllers and repositories.

## Rules

- Palette data is validated by the Zod schemas in `engine/schemas/` (`marker-json-schema`, `tile-json-schema`, `tile-map-json-schema`). Keep UI, schemas and server in sync when a field changes.
- Hydrators in `engine/world/hydrator/` consume palette data to generate the world. A palette change can change generated output, so keep that in mind.
