Locking in **B**. Here's the finalized design, including the simplification you left the door open for — it turns out to be a net win on both simplicity *and* performance.

## Definitions

- `MAX_DEPTH = 12` stays global: the ceiling, and the ID width. Unchanged.
- `world.size` → the tree's `maxDepth`.
- Root bounds size = `2^maxDepth`; leaf tile = 1 unit, in every world.

## The simplification: compute bounds from the parent, not from the root

`QuadNodeBounds.fromKey` has **exactly one caller** — [quad-node.ts:75](engine/world/quad-node.ts#L75), inside the `QuadNode` constructor, which already holds `parent`. So instead of threading a root size into `fromKey`, derive bounds incrementally:

- root → `new QuadNodeBounds(0, 0, 2 ** maxDepth)`
- child → `size = parent.bounds.size / 2`, `x = parent.bounds.x + qx * size`, `y = ... + qy * size`

This deletes the whole path-walking loop at [quad-node-bounds.ts:12-21](engine/world/quad-node-bounds.ts#L12-L21) and the `QUAD_TREE_ROOT_SIZE` export with it. Bounds construction goes from O(depth) to O(1) per node, and no global constant has to become per-world because the root size is simply the seed value. `fromKey` becomes dead code — drop it, or keep it as a debug helper taking an explicit root size.

That directly answers your performance concern: this is strictly *fewer* operations than today, independent of the size feature.

## Root size lives on the tree

`world.quadtree.bounds.size` is the per-world extent. Your commented-out `new Markers(this.quadtree.bounds.size)` at [world.ts:37](engine/world/world.ts#L37) already treats it that way — that instinct was right.

## Canvas

`SIZE` is used in five places, all instance methods: `transformMtx` ([L52-53](src/editor/canvas/CanvasMatrix.ts#L52-L53)), `getTileSize` ([L97](src/editor/canvas/CanvasMatrix.ts#L97)), `gridPointInBounds` ([L151-153](src/editor/canvas/CanvasMatrix.ts#L151-L153)), `_visibleGridRect` ([L166-167](src/editor/canvas/CanvasMatrix.ts#L166-L167)). So: one constructor-injected `_rootSize` field replaces the module constant, and `drawGrid` takes it as an option alongside the `tileSize` it already receives.

No formula changes. `getTileSize()` = `rootSize / 2^level` still yields exactly the node size at that depth, and still bottoms out at 1 unit at max zoom — the canvas math is identical, just over a smaller extent. This is the easy part.

## The bill for B: depth stops being a physical scale

This is the part you have to accept, and it's the only real work. Under B, depth counted *from the root* varies in meaning per world, while depth counted *from the leaf* is constant. So add to `QuadNode`:

```
get scale(): number   // maxDepth - depth; 0 at the leaf
```

Then every comparison that means *"how physically zoomed in am I"* switches from `depth` to `scale`:

| Site | Now | Becomes |
|---|---|---|
| [quad-node.ts:154](engine/world/quad-node.ts#L154) | `depth + 1 > MAX_DEPTH` | `this.scale === 0` |
| [character.ts:61](engine/core/character.ts#L61) | `z < MAX_ZOOM_DEPTH` | `scale > 0` |
| [character.ts:124](engine/core/character.ts#L124) | `depth < MAX_ZOOM_DEPTH` | `scale > 0` |
| [profile-generator.ts:29](server/game/profile-generator.ts#L29) | `depth < MAX_ZOOM_DEPTH` | `scale > 0` |
| [character.ts:69](engine/core/character.ts#L69) | `z > MIN_ZOOM_DEPTH` | `scale < MAX_ZOOM_OUT` |
| [config.ts:78](engine/config/config.ts#L78) | marker `depth` filter | marker `scale` filter |

**The last row is a data migration.** Marker configs are root-anchored today — [markers.json](engine/config/markers.json) tags them 0–10, and that data now also lives in the `palettes` table. Under B, an untranslated `depth: 10` marker would land at a completely different physical scale in a size-8 world than in a size-12 one. Since everything authored so far was implicitly size 12, the conversion is mechanical: **`scale = 12 - depth`**. Your `"depth": 10` city-scale markers become `scale: 2`; `"depth": 5` becomes `scale: 7`. Rename the field to `scale` so an unmigrated row fails loudly instead of silently placing markers wrong.

The depth→km table at [quad-node.ts:1-19](engine/world/quad-node.ts#L1-L19) should be relabelled by scale at the same time: scale 0 = 89m, scale 1 = 177m, … scale 7 = 11km.

## Zoom range, restated

`MIN_ZOOM_DEPTH = 5` was root-anchored, so it can't survive B. Replace it with a leaf-anchored `MAX_ZOOM_OUT = 7` and derive per world:

- `world.maxZoomDepth = maxDepth` (the leaf)
- `world.minZoomDepth = Math.max(0, maxDepth - MAX_ZOOM_OUT)`

`7` is chosen because `12 - 5 = 7` — a size-12 world keeps today's exact zoom span, so nothing regresses. And it dissolves the problem I flagged for A: in a world of size ≤ 7 the player can simply zoom out to the root, which is correct now that the root genuinely *is* a small map. [CanvasMatrix.ts:73](src/editor/canvas/CanvasMatrix.ts#L73)'s hardcoded `Math.max(5, Math.min(value, 12))` clamps to this pair instead.

## Performance

Smaller really does mean less work, for free: recursion in `findByPoint`/`findByRect`/`findByKey` bottoms out at `maxDepth`, `getQuadrants(true)` materializes nothing below it, so the node ceiling is `(4^(size+1) - 1) / 3` — a size-8 world can allocate at most ~87k nodes against ~22M for size 12. Canvas drawing is already viewport-bounded, so it's unaffected either way.

## Validation at creation

`1 <= size <= MAX_DEPTH`, enforced in `createNewWorld` ([world-controller.ts:23](server/controllers/world-controller.ts#L23)) — immutable afterwards, as you say, which is exactly what keeps stored `nodeId`s valid forever. Still outstanding: the two legacy rows sitting at `size = 0` would build a root-only tree, so backfill them to `12` or coerce `size <= 0 → MAX_DEPTH` on load.

---

Two asides while I was in there: [CanvasMatrix.ts:153](src/editor/canvas/CanvasMatrix.ts#L153) tests `point.x > SIZE` where it means `point.y`, and `QuadNodeKey`'s `HASH_BIT_SIZE` padding needs no change under B — per-world depths are all ≤ `MAX_DEPTH`, so the 24+4 bit ID format still holds.

Want me to implement this, or record it in [todo.md](engine/world/todo.md) for you to review first?