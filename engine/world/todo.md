No code changed — here's the design.

## The root problem: `MAX_DEPTH` is doing three unrelated jobs

Right now [quad-node-key.ts:6](engine/world/quad-node-key.ts#L6) is simultaneously:

1. **The ID wire format width** — `HASH_BIT_SIZE` ([L9](engine/world/quad-node-key.ts#L9)) sets the zero-padding for `id`, and `fromId` ([L17-19](engine/world/quad-node-key.ts#L17-L19)) slices the stored string at that offset.
2. **The root extent in world units** — `QUAD_TREE_ROOT_SIZE = 2^MAX_DEPTH` ([quad-node-bounds.ts:4](engine/world/quad-node-bounds.ts#L4)).
3. **The subdivision limit** — [quad-node.ts:154](engine/world/quad-node.ts#L154) and `World.MAX_ZOOM_DEPTH`.

Only #3 should become per-world. Splitting these three apart *is* the task.

## Job 1 — keep the hash global. Don't scale it to world size.

This is the one I'd push back on hardest, because it's the tempting mistake. Your hash is **already** size-independent: it's the root→node path at 2 bits per level, left-padded. A depth-8 node produces identical bits whether the world's cap is 8 or 12. `MAX_DEPTH` contributes *only padding width* to the id.

So keying padding to per-world size buys nothing and costs a lot:

- `QuadNodeKey.fromId` is a **static** method with no world context. Per-world widths mean threading a world (or a width) into every deserialize site — including the `World` constructor loop at [world.ts:47](engine/world/world.ts#L47).
- Changing a world's size later would invalidate every stored `nodeId`.

Keep `HASH_BIT_SIZE = MAX_DEPTH * 2` as a global constant. IDs stay fixed-width, cross-world comparable, and format-stable; a small world just has more leading zeros. Reframe `MAX_DEPTH` in your head as *"the absolute ceiling and the persistence format width"* — set once, never changed.

⚠️ Related hazard: the `12; //10` on [L6](engine/world/quad-node-key.ts#L6) means any world saved while it was `10` has `nodeId`s that `fromId` now mis-slices. If you have old data, that's already broken. Lock this number down.

## Job 2 — the actual decision: does a smaller world mean *coarser* or *smaller*?

| | **A: fixed extent, coarser tiles** | **B: scaled extent, constant leaf** |
|---|---|---|
| Root size | always `2^MAX_DEPTH` (4096) | `2^size` |
| size-8 world | 4096 units across, smallest tile 16 | 256 units across, smallest tile 1 |
| `size` means | detail / resolution cap | map area |
| Blast radius | `getQuadrants` + zoom clamps | + `QuadNodeBounds.fromKey` needs root size → `CanvasMatrix`, `drawGrid`, `transformMtx` all need per-world extent |

**I'd go with A**, because three independent things in your codebase already treat depth as an *absolute* scale, and B silently redefines all of them:

- **Marker configs are tagged by absolute depth** — `markerConfig.depth === filter.depth` in [config.ts:78](engine/config/config.ts#L78). Under B, depth 11 in a size-8 world spans a different real distance than depth 11 in a size-12 world, so the same marker config means different things per world.
- `MIN_ZOOM_DEPTH = 5` is global ([world.ts:16](engine/world/world.ts#L16)) and hardcoded again in [CanvasMatrix.ts:73](src/editor/canvas/CanvasMatrix.ts#L73). Under B a size-4 world can't reach its own minimum zoom.
- The depth→km table at the top of [quad-node.ts:1-19](engine/world/quad-node.ts#L1-L19) is anchored at depth 0 = 320km.

Under A, all of that keeps holding, and "size 8" reads as *this world is 320km across but only detailed down to 1.25km*. Under B you'd have to re-anchor marker depths and the km table to the leaf instead of the root.

The one-line test: **should depth 5 mean the same real-world span in every world?** Yes → A. If instead a short-story world genuinely needs a *small map*, that's B, and accept the re-anchoring work.

## Job 3 — mechanism: a root-inherited `maxDepth` on `QuadNode`

Give `QuadNode` a `readonly maxDepth`, supplied to the root and inherited from `parent` by every child — the constructor already branches on `parent` at [quad-node.ts:67-73](engine/world/quad-node.ts#L67-L73), so it's one line in each arm. `getQuadrants` then tests `this.depth + 1 > this.maxDepth`. `World` passes `worldData.size` when it builds the tree at [world.ts:36](engine/world/world.ts#L36). Since the current signature is `(parent?, index?)`, a `QuadNode.createRoot(maxDepth)` static keeps the child path from growing an awkward third argument.

Why not the alternatives:

- **A global setter** (mirroring `config.set()`) is the smallest edit and the worst fit: it's per-*process*, not per-world. Note that [world.ts:24](engine/world/world.ts#L24) already has this bug — loading a second world reconfigures the first one's palette out from under it. `gameService` holds a single pod today ([game-service.ts:8](server/game/game-service.ts#L8)), but `GamePod` is plainly built to be multi-instance, and the editor can hold a `World` alongside. Don't add a second instance of that bug.
- **Threading `maxDepth` as a parameter** through `getQuadrants` is viral — it infects `findByKey`, `findByPoint`, `findByRect`, every recursion and every caller.
- **Putting it on `QuadNodeKey`** pollutes a serialized value object that's created in bulk and compared by hash+depth; a third field invites `isMatch`/`isDescendant` bugs.

The inherited field makes any node self-describing — it can answer "can I subdivide?" with no ambient state.

## Ripple list

`World.MAX_ZOOM_DEPTH` becomes an instance getter (`this.quadtree.maxDepth`). Conveniently, **every server/engine call site already has a world or node in hand**: [game.ts:44](engine/core/game.ts#L44) has `this.world`, [character.ts:61](engine/core/character.ts#L61) and [:124](engine/core/character.ts#L124) have `this.world` ([declared L22](engine/core/character.ts#L22)), and `ProfileGeneratorFactory` is constructed with one ([game-pod.ts:20](server/game/game-pod.ts#L20)).

Two client spots need the value *delivered* rather than derived, since the browser has no `World` in the game view:

- [NavigationControl.tsx:81-84](src/game/control/NavigationControl.tsx#L81-L84) — add `maxDepth` to the position/state payload the websocket already sends.
- [CanvasMatrix.ts:73](src/editor/canvas/CanvasMatrix.ts#L73) — `Math.max(5, Math.min(value, 12))` is a hardcoded duplicate of both constants; it should read the editor store's world.

Under option A, [drawGrid.ts](src/editor/canvas/commands/drawGrid.ts) and `SIZE` need no changes at all.

## Two guards worth building in

- **`size = 0` is not a valid world.** The two legacy rows I defaulted to `0` last turn would produce a root-only, unsubdividable tree. Coerce `size <= 0 → MAX_DEPTH` on load, or backfill those rows to `12`.
- **Validate `size` into `[MIN_ZOOM_DEPTH, MAX_DEPTH]` at creation.** A world whose cap is below `MIN_ZOOM_DEPTH` inverts the zoom clamps at [NavigationControl.tsx:84](src/game/control/NavigationControl.tsx#L84).

## Jonas notes
- QUAD_TREE_ROOT_SIZE should also be based on world
- Yes, less depth should mean smaller physical world - B: scaled extent, constant leaf.
There is no need to have a more detail map with same physical dimensions. If it's easier,
im open to simplify something to make it more easy to handle canvas drawing,
but it should not have an impact on performance - smaller world means less to calculate 

- Yes, Give QuadNode a readonly maxDepth seems like a good idéa
- Size validation can be done when world is created. Size can never change after creation