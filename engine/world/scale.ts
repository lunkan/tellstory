import { QuadNodeKey } from "./quad-node-key";

// Physical scale is anchored at the leaf, not the root: a leaf tile covers the
// same number of metres in every world, so a world with a lower max depth is
// physically smaller rather than more coarsely detailed.
//
// A node's scale is how many levels it sits above the leaf (QuadNode.scale),
// which makes it comparable across worlds of different size - unlike depth,
// which counts down from a root whose extent varies per world.
//
// scale 0  - 78m     # Immediate surroundings (leaf)
// scale 1  - 156m    # Nearby area
// scale 2  - 313m    # Local area
// scale 3  - 625m    # Neighborhood
// scale 4  - 1.25km  # District
// scale 5  - 2.5km   # Region
// scale 6  - 5km
// scale 7  - 10km    # Horizon (max zoom out)
// ...
// scale 12 - 320km   # root of a full depth world

/** Metres across the root tile of a world built to the full QuadNodeKey.MAX_DEPTH. */
const FULL_DEPTH_ROOT_SIZE_METER: number = 320000;

/** Metres across a leaf tile. The same in every world, whatever its size. */
export const LEAF_SIZE_METER: number = FULL_DEPTH_ROOT_SIZE_METER / Math.pow(2, QuadNodeKey.MAX_DEPTH);

/** How many levels above the leaf a character may zoom out. */
export const MAX_ZOOM_OUT: number = 7;

/** Metres across a tile sitting `scale` levels above the leaf. */
export function getTileSizeMeter(scale: number): number {
    return LEAF_SIZE_METER * Math.pow(2, scale);
}

/**
 * The depth this scale would sit at in a full depth world. Naming that is keyed
 * to depth (getDepthName) is anchored that way, so translate before looking up:
 * in a small world depth 5 is not the horizon, but the same physical scale is.
 */
export function getReferenceDepth(scale: number): number {
    return QuadNodeKey.MAX_DEPTH - scale;
}
