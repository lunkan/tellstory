import { QuadNode } from '../quad-node';
import { terrainNeighbours } from './terrain-neighbours';

/** Invalidate existing generated descendants affected by an authored terrain edit. */
export function invalidateTerrainNeighbours(edited: QuadNode): QuadNode[] {
    const changed = new Map<number, Set<QuadNode>>();
    const invalidated: QuadNode[] = [];
    for (const node of [edited, ...edited.getAncestors()]) {
        const nodes = changed.get(node.depth) ?? new Set<QuadNode>();
        nodes.add(node);
        changed.set(node.depth, nodes);
    }

    for (let depth = 0; depth < edited.maxDepth; depth++) {
        const parents = new Set<QuadNode>();
        for (const node of changed.get(depth) ?? []) {
            parents.add(node);
            terrainNeighbours(node).forEach((neighbour) => {
                if (neighbour) parents.add(neighbour);
            });
        }
        const next = changed.get(depth + 1) ?? new Set<QuadNode>();
        for (const parent of parents) {
            if (parent.isLocked()) continue;
            for (const child of parent.getQuadrants()) {
                if (child.canHydrate() && child.hasTile()) {
                    child.setTileData(undefined);
                    next.add(child);
                    invalidated.push(child);
                }
            }
        }
        if (next.size) changed.set(depth + 1, next);
    }
    return invalidated;
}
