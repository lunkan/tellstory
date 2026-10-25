---
description: "Engine world model: quad tree, scale, node states, deterministic generation."
applyTo: "engine/**"
---

# Engine

Shared by the editor and the game. Keep it UI-agnostic and free of React/DOM imports.

## World as a quad tree

- One root [QuadNode](../../engine/world/quad-node.ts) splits into 4 children per level. Children are addressed by a [QuadNodeKey](../../engine/world/quad-node-key.ts) (bit-packed hash + depth). `QuadNodeKey.MAX_DEPTH` (12) is fixed and defines the maximum world size.
- The creator chooses the world size, so a world's root may be shallower than `MAX_DEPTH`. `maxDepth` is set at the root and inherited by every child.
- Scale is anchored at the leaf, not the root (see [scale.ts](../../engine/world/scale.ts)). `node.scale = maxDepth - depth`: 0 at the leaf, higher means zoomed further out. A leaf is `LEAF_SIZE_METER` (about 78 m) in every world. Use `scale` and `getTileSizeMeter(scale)` rather than `depth` when comparing across worlds.

## Lazy detail

Detail levels do not exist until the user zooms in. A child level is generated from its parent when first needed (`createIfMissing`). Never assume deeper levels exist, and never eagerly generate the whole tree.

## Node states

| State | Editable | Meaning | Stored in DB |
|---|---|---|---|
| `detached` | yes | Creator-drawn; values come from the node's own tiles. | **yes** |
| `locked` | no | Has at least one detached child; values are calculated from own tiles plus children. | own tiles only |
| `hydrated` | yes | Has a detached parent; values are generated from its parents. Editing makes it detached and locks its parents. | no |
| `empty` | yes | No detached parent; generated without one. Editing makes it detached and locks its parents. | no |

## Hydration

- Tile generation is never triggered by reading (`World` getters do not hydrate). The editor's `HydrationScheduler` calls `hydrate` for the viewport; the renderer only emits render events.
- `hydrate` fills all four children of a parent together. It skips locked nodes, nodes that already have a tile, and nodes under a locked parent.

## Markers and placement

- A marker is stored on the node at the depth given by its `attention` (prominent = shallow, insignificant = deep). Its exact position is only its `shape`, which exists after generation.
- `MarkerSetting.placement` is a coarse position: a `QuadNodeKey` id string (not an object, because bigint is not JSON serializable). If undefined it defaults to the host node's key (`getMarkerPlacement`).
- Hydration narrows `placement` one level per step (`placeMarkers`), so a marker stays visible when zooming deeper. Placement must never be shallower than the host.
- Choosing the child is a `PlacementStrategy` (currently seeded random). Strategies may later depend on the marker type, terrain and neighbours, and must stay deterministic.
- `placement` is a cache: it is stripped when saving (`getDetachedTiles`) and is recomputed after load. Only `setMarkerPlacements` may write it on generated tiles.
- Tiles are immutable. Use `getOwnMarkers()` to read a node's markers (`getTile()` on a locked node returns a calculated tile without markers).

## Vectors (roads, rivers) and placement

- A vector is stored on the node where the creator drew it, as an edge to one of the 8 neighbours. `connectNodes` writes the edge on both nodes (one each, opposite directions) and ignores connections that already exist.
- `VectorSetting.placement` is a list of child indexes (0-3). Entry 0 is the child of the host the vector passes through, entry 1 its child, and so on. Hydration appends one entry per depth (`placeVectors`), so the vector stays visible when zooming deeper. The cell at the other end is mirrored across the shared border, so it is not stored (`getVectorTarget`). `getVectorCell` resolves the cell at a depth.
- Choosing the child is a `VectorPlacementStrategy`, seeded from both ends so a vector and its mirror agree. It keeps the direction. Later strategies may use elevation and urban targets, and must stay deterministic.
- `getCellEdges` derives what to draw at a depth: half edges per cell, and links from each meeting's vectors to its junction. A meeting is a cell where roads of the same vector type that were not yet connected share a cell; each type is its own network, so a river never joins a road's junction. already connected vectors sharing a cell are not a new meeting, so there are no loops. The junction is derived, never stored: at each depth it is the child of the previous junction that holds most of the network's vectors (ties go to the lowest key), so it is always a child of the previous junction and lies on a road that passes there. `routeCells` finds the route from each vector's cell to the junction, using `getCellCost` (`cell-cost.ts`). Links are derived, never stored.
- `placement` is a cache: stripped when saving, recomputed after load. Only `setVectorPlacements` may write it.
- Viewport hydration only narrows the cells it covers, so a road could be incomplete near the viewport edge. `hydrateVectorPaths` narrows the vectors of visible hosts down to the rendered depth along their own path (one cell per depth). `HydrationScheduler` runs it before the viewport pass.
- Generated vectors are never written to child tiles. Draw from placements.

## Persistence

Only creator-drawn data (detached nodes) is saved to the database. Generated data (`hydrated`, `empty`, calculated tiles) lives locally only and must never be persisted. Creator-drawn data always overrides generated data.

## Determinism (critical)

Generation of non-creator data must be deterministic: loading the same world must reproduce the exact same result.

- Derive randomness only from seeds, using [number-generator.ts](../../engine/util/number-generator.ts) (`getRandFromSeeds`, `mergeSeeds`, `mulberry32`), seeded with the world seed plus the node key.
- Never use `Math.random()`, `Date.now()`, iteration order of unordered collections, or any other non-reproducible input in generation code.
- Results must not depend on the order in which the user zooms or visits nodes.
- Changing generation logic changes every existing world's generated output. Flag this when it happens.
