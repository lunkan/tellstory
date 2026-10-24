import { QuadNodesRect } from '../../types';
import { QuadNode } from '../quad-node';

/**
 * Nodes at `rect.z` inside `rect` that have no tile yet and may be generated.
 * Missing nodes are created (a node may be wanted at a depth nothing else asked for),
 * but no tile data is generated - pass each result to `hydrate` for that.
 */
export function findNodesToHydrate(root: QuadNode, rect: QuadNodesRect): QuadNode[] {
    return root
        .findByRect(rect, { createIfMissing: true })
        .filter((node) => !node.isLocked() && !node.hasTile());
}
