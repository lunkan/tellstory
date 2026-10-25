import { QuadNode } from '../quad-node';
import { getVectorCell } from '../vector-placement';
import { hydrate } from './hydrate';
import { placeVectors } from './placeVectors';

/**
 * Narrows the vectors of `hosts` down to `depth`, hydrating only the cells they pass through. A
 * vector passes through one cell per depth, so this is cheap, and it keeps a road complete when part
 * of it lies outside the viewport (viewport hydration alone only narrows the cells it covers).
 */
export function hydrateVectorPaths(hosts: readonly QuadNode[], depth: number): void {
    for (const host of hosts) {
        host.getOwnVectors().forEach((_, index) => {
            // The vector is immutable, so re-read it after every step
            while (true) {
                const vector = host.getOwnVectors()[index];
                const narrowed = vector?.placement?.length ?? 0;
                if (!vector || host.depth + narrowed >= depth) {
                    return;
                }

                const cell = getVectorCell(vector, host, host.depth + narrowed);
                const child = cell?.getQuadrants(true)[0];
                if (!cell || !child) {
                    return; // Leaf, or the path is not resolvable
                }

                if (child.hasTile()) {
                    placeVectors(cell); // Children exist already, so hydrate would skip them
                } else {
                    hydrate(child);
                }

                if ((host.getOwnVectors()[index]?.placement?.length ?? 0) === narrowed) {
                    return; // No progress (locked node, ...) - don't spin
                }
            }
        });
    }
}

/** Nodes at or above `depth` that hold vectors, from a list of visible nodes. */
export function getVectorHosts(nodes: readonly QuadNode[], depth: number): QuadNode[] {
    return nodes.filter((node) => node.depth <= depth && node.getOwnVectors().length > 0);
}
