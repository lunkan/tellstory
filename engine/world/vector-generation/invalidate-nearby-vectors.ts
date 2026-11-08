import { dehydrate } from '../hydrator/hydrate';
import { QuadNode } from '../quad-node';
import { MAX_ROAD_CONNECTION_DISTANCE } from './road-plan';

/** Clear generated vectors in the edited tile's neighbourhood and existing descendants. */
export function invalidateNearbyVectors(node: QuadNode): void {
    invalidateVectorsAround([node]);
}

/** Clear each affected subtree once when several terrain cells change together. */
export function invalidateVectorsAround(nodes: Iterable<QuadNode>): void {
    const affected = new Set<QuadNode>();
    for (const node of nodes) {
        const root = node.getAncestors().at(-1) ?? node;
        const margin = MAX_ROAD_CONNECTION_DISTANCE * node.bounds.size;
        root.findByRect({
            x: node.bounds.x - margin,
            y: node.bounds.y - margin,
            width: node.bounds.size + margin * 2,
            height: node.bounds.size + margin * 2,
            z: node.depth,
        }).forEach((nearby) => affected.add(nearby));
    }
    // A selected ancestor already covers its descendants.
    for (const node of affected) {
        if (!node.getAncestors().some((ancestor) => affected.has(ancestor))) {
            dehydrate(node, { vectors: true });
        }
    }
}
