import { dehydrate } from '../hydrator/hydrate';
import { QuadNode } from '../quad-node';
import { MAX_ROAD_CONNECTION_DISTANCE } from './road-plan';

/** Clear generated vectors in the edited tile's neighbourhood and existing descendants. */
export function invalidateNearbyVectors(node: QuadNode): void {
    const root = node.getAncestors().at(-1) ?? node;
    const margin = MAX_ROAD_CONNECTION_DISTANCE * node.bounds.size;
    root.findByRect({
        x: node.bounds.x - margin,
        y: node.bounds.y - margin,
        width: node.bounds.size + margin * 2,
        height: node.bounds.size + margin * 2,
        z: node.depth,
    }).forEach((nearby) => dehydrate(nearby, { vectors: true }));
}
