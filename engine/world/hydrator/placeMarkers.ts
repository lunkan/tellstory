import { MarkerSetting } from '../../types';
import { getRandFromSeeds, mergeSeeds } from '../../util/number-generator';
import { QuadNode } from '../quad-node';
import { getMarkerPlacement } from '../marker-placement';

export type PlacementContext = {
    marker: MarkerSetting;
    /** Node whose tile holds the marker. */
    host: QuadNode;
    /** The marker's current cell - the node its placement points at. */
    parent: QuadNode;
    /** The four children of `parent`, all with tiles. */
    candidates: QuadNode[];
    /** Deterministic seed for this marker in this cell. */
    seed: bigint;
};

/** Chooses which child of `parent` a marker moves into. Must be deterministic and must not write. */
export type PlacementStrategy = (context: PlacementContext) => QuadNode;

export const randomPlacement: PlacementStrategy = ({ candidates, seed }) => {
    return candidates[Math.floor(candidates.length * getRandFromSeeds(seed))];
};

/** One lookup point so markers can get their own strategy (attraction, avoiding neighbours, ...) later. */
export function getPlacementStrategy(_marker: MarkerSetting): PlacementStrategy {
    return randomPlacement;
}

/**
 * Moves every marker currently placed in `parent` one level down, into one of its four children.
 * Markers live on their host node (`parent` or an ancestor); only their `placement` is narrowed.
 */
export function placeMarkers(parent: QuadNode): void {
    const candidates = parent.getQuadrants();
    if (candidates.length !== 4 || !candidates.every((candidate) => candidate.hasTile())) {
        return; // Leaf, or children not generated yet
    }

    const parentId = parent.key.id;
    const parentSeed = mergeSeeds(parent.key.hash, BigInt(parent.depth));

    // Ancestors root first, so the order never depends on when the user zoomed
    const hosts = [parent, ...parent.getAncestors()].reverse();

    for (const host of hosts) {
        const placements = new Map<number, string>();
        const hostSeed = mergeSeeds(host.key.hash, BigInt(host.depth));

        host.getOwnMarkers().forEach((marker, index) => {
            if (getMarkerPlacement(marker, host) !== parentId) {
                return;
            }

            const seed = mergeSeeds(hostSeed, BigInt(index), parentSeed);
            const target = getPlacementStrategy(marker)({ marker, host, parent, candidates, seed });
            placements.set(index, target.key.id);
        });

        host.setMarkerPlacements(placements);
    }

    // Deeper levels may already exist (zoomed in before), and nothing else will narrow into them
    candidates.forEach((candidate) => placeMarkers(candidate));
}
