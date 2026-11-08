import { QuadNode } from '../quad-node';

/** Existing or creatable cardinal neighbours at the same depth, within the world. */
export function terrainNeighbours(node: QuadNode, createIfMissing = false): (QuadNode | undefined)[] {
    const root = node.getAncestors().at(-1) ?? node;
    const { x, y, size } = node.bounds;
    return [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dx, dy]) =>
        root.findByPoint({ x: x + dx * size, y: y + dy * size, z: node.depth }, createIfMissing));
}
