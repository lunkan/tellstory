Done. `npm run build` still fails, but only on the 5 errors that were already failing before I started (unused `ConfigData`, two unused `EditorTopbar` state vars, and two `Timeout`-vs-`number` typings in `NavigationControl`) — I left those alone. Everything from the refactor type-checks.

## What changed

**New:** [scale.ts](engine/world/scale.ts) — `LEAF_SIZE_METER` (78.125m), `MAX_ZOOM_OUT` (7), `getTileSizeMeter(scale)`, `getReferenceDepth(scale)`.

**The three jobs, split:**
- Hash/ID format stayed global — IDs are still 28 chars and round-trip across every world size.
- Root extent: [quad-node-bounds.ts](engine/world/quad-node-bounds.ts) now has `createRoot(maxDepth)` / `createChild(parent, quadrant)`; `QUAD_TREE_ROOT_SIZE` and the path-walking loop are gone.
- Subdivision limit: [quad-node.ts](engine/world/quad-node.ts) has `readonly maxDepth` + a `scale` getter, a private constructor, and `QuadNode.createRoot()`.

**Depth→scale conversions** in [character.ts](engine/core/character.ts) (3), [game.ts](engine/core/game.ts), [profile-generator.ts](server/game/profile-generator.ts), [config.ts](engine/config/config.ts), [hydrateMarkers.ts](engine/world/hydrator/hydrateMarkers.ts), and `World.MAX_ZOOM_DEPTH`/`MIN_ZOOM_DEPTH` → `world.maxZoomDepth`/`minZoomDepth`.

**Canvas:** `CanvasMatrix` takes `maxDepth` at construction and derives extent, initial level and clamp from it; `drawGrid` takes `rootSize`.

**Client:** added `zoomRange` to `PlayerLocationChangeMessage`, sent by [player-observer.ts](server/game/player-observer.ts), held in [sceneStore.ts](src/store/sceneStore.ts), consumed by `NavigationControl` and `DescriptionFeed`. `phraseology.ts` is untouched — I translate into its depth-anchored vocabulary via `getReferenceDepth`, so a size-12 world shows identical labels.

**Data** (backup at `database.sqlite.bak`): 4 worlds `size 0 → 12`; palette 30's 48 markers `depth → scale`; [markers.json](engine/config/markers.json) seed likewise. [migrate-marker-scale.ts](server/db/migrate-marker-scale.ts) is idempotent and safe to delete once you're happy.

## Verified

Leaf is 1 unit / 78m at sizes 4, 8 and 12; roots are 1.25km / 20km / 320km; subdivision stops exactly at each world's depth; mid-tree bounds match the old maths exactly. Through the running server: a size-8 world creates and loads, sizes 0 and 20 are rejected with 400.

## Three things to know

- **Four bugs fixed en route**, since they'd have bitten under the new semantics: the marker filter used `filter.depth ? …`, which is falsy at 0 — and scale 0 is now the *leaf*, the commonest query, so every leaf would have matched the whole marker table. Also `gridPointInBounds` tested `point.x` in its `y` branch; `EditorNewWorldScreen` defaulted size to **15** with `max="20"` (both unloadable now); and its size hint assumed a 100m leaf.
- **`player-start` converted to `scale: 12`**, which is unreachable in any smaller world. Harmless today — `hydrateMarkers` requires matching terrain tags and it has none, and the editor places it by category — but the value is meaningless. It's arguably root-anchored rather than physically scaled, so worth rethinking if you ever hydrate it.
- **Worlds 1 and 2 reference `palette 0`, which doesn't exist**, so `getPalette` rejects for them. Pre-existing, untouched.

I verified the engine, the API and the server boot, but I did not click through the editor or game UI in a browser — the canvas rendering at a non-12 size is the part I'd want you to eyeball.