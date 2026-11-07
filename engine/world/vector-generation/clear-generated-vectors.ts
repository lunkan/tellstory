import { QuadNode } from '../quad-node';

/**
 * Invalidate one vector type on the supplied existing nodes. Nodes may be at any depth;
 * protected nodes and nodes without that vector type are left unchanged.
 */
export function clearGeneratedVectors(nodes: Iterable<QuadNode>, type: string): number {
    let cleared = 0;
    for (const node of nodes) {
        if (node.clearGeneratedVectors(type)) {
            cleared++;
        }
    }
    return cleared;
}
