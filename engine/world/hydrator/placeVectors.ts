import { VectorSetting } from '../../types';
import { getRandFromSeeds, mergeSeeds, seedFromString } from '../../util/number-generator';
import { QuadNode } from '../quad-node';
import { getChildIndex, getVectorCell, getVectorTarget } from '../vector-placement';

export type VectorPlacementContext = {
    vector: VectorSetting;
    /** The cell the vector is in now. All four children have tiles. */
    from: QuadNode;
    /** The cell at the other end of the connection, at the same depth. */
    to: QuadNode;
    /** Seed shared by both ends, so a vector and its mirror on the other node always agree. */
    seed: bigint;
};

/**
 * Chooses which child of `from` the vector moves into (index 0-3). Must be deterministic and must not write.
 * The child must touch the border the vector crosses, so the mirrored child in `to` meets it.
 */
export type VectorPlacementStrategy = (context: VectorPlacementContext) => number;

/** Keeps the direction. On an axis the vector does not cross there are two possible rows/columns, and the seed picks one. */
export const seededEdgePlacement: VectorPlacementStrategy = ({ vector, seed }) => {
    const x = _pickSide(vector.direction.x, getRandFromSeeds(seed, 1n));
    const y = _pickSide(vector.direction.y, getRandFromSeeds(seed, 2n));
    return getChildIndex(x, y);
};

/** One lookup point so vector types can get their own strategy (cheapest path, urban targets, ...) later. */
export function getVectorPlacementStrategy(_vector: VectorSetting): VectorPlacementStrategy {
    return seededEdgePlacement;
}

/**
 * Moves every vector currently in `parent` one level down. Vectors live on their host node
 * (`parent` or an ancestor); only their `placement` grows by one entry.
 */
export function placeVectors(parent: QuadNode): void {
    const candidates = parent.getQuadrants();
    if (candidates.length !== 4 || !candidates.every((candidate) => candidate.hasTile())) {
        return; // Leaf, or children not generated yet
    }

    // Ancestors root first, so the order never depends on when the user zoomed
    const hosts = [parent, ...parent.getAncestors()].reverse();

    for (const host of hosts) {
        const placements = new Map<number, number[]>();

        host.getOwnVectors().forEach((vector, index) => {
            const narrowedDepth = vector.placement?.length ?? 0;
            if (narrowedDepth !== parent.depth - host.depth || getVectorCell(vector, host, parent.depth) !== parent) {
                return; // Not in this cell, or already narrowed past it
            }

            const to = getVectorTarget(vector, host);
            if (!to) {
                return; // Connects out of the world
            }

            const seed = mergeSeeds(..._orderedHashes(parent, to), BigInt(parent.depth) ^ seedFromString(vector.type));
            const child = getVectorPlacementStrategy(vector)({ vector, from: parent, to, seed });
            placements.set(index, [...(vector.placement ?? []), child]);
        });

        host.setVectorPlacements(placements);
    }

    // Deeper levels may already exist (zoomed in before), and nothing else will narrow into them
    candidates.forEach((candidate) => placeVectors(candidate));
}

/** Direction on one axis -> column/row of the child on the `from` side. */
function _pickSide(direction: number, random: number): 0 | 1 {
    if (direction === 1) {
        return 1;
    } else if (direction === -1) {
        return 0;
    }

    return random < 0.5 ? 0 : 1;
}

// Same pair in either order, so a vector and its mirror produce the same seed
function _orderedHashes(a: QuadNode, b: QuadNode): [bigint, bigint] {
    return a.key.hash <= b.key.hash ? [a.key.hash, b.key.hash] : [b.key.hash, a.key.hash];
}
