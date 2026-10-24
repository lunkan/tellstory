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

## Persistence

Only creator-drawn data (detached nodes) is saved to the database. Generated data (`hydrated`, `empty`, calculated tiles) lives locally only and must never be persisted. Creator-drawn data always overrides generated data.

## Determinism (critical)

Generation of non-creator data must be deterministic: loading the same world must reproduce the exact same result.

- Derive randomness only from seeds, using [number-generator.ts](../../engine/util/number-generator.ts) (`getRandFromSeeds`, `mergeSeeds`, `mulberry32`), seeded with the world seed plus the node key.
- Never use `Math.random()`, `Date.now()`, iteration order of unordered collections, or any other non-reproducible input in generation code.
- Results must not depend on the order in which the user zooms or visits nodes.
- Changing generation logic changes every existing world's generated output. Flag this when it happens.
