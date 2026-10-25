import { VectorSetting } from '../types';
import { QuadNode } from './quad-node';

/** Child index (0-3) of the child at column `x`, row `y`. Same order as QuadNode.getQuadrants(). */
export function getChildIndex(x: number, y: number): number {
    return x * 2 + y;
}

export function getChildPosition(index: number): { x: 0 | 1, y: 0 | 1 } {
    return { x: ((index >> 1) & 1) as 0 | 1, y: (index & 1) as 0 | 1 };
}

/**
 * The cell a vector passes through at `depth`. `vector.placement` holds one child index per depth
 * below the host (entry 0 = child of the host), so the cell is the host walked down that path.
 * Undefined above the host or where the vector is not narrowed this deep yet.
 */
export function getVectorCell(vector: VectorSetting, host: QuadNode, depth: number): QuadNode | undefined {
    const steps = depth - host.depth;
    const path = vector.placement ?? [];
    if (steps < 0 || steps > path.length) {
        return;
    }

    let cell: QuadNode | undefined = host;
    for (let i = 0; i < steps && cell; i++) {
        cell = cell.getQuadrants()[path[i]];
    }

    return cell;
}

/**
 * The cell at the other end of the connection, at the depth the vector is currently narrowed to.
 * Not stored: the host's neighbour, narrowed by mirroring each step across the shared border.
 */
export function getVectorTarget(vector: VectorSetting, host: QuadNode): QuadNode | undefined {
    const { x, y, size } = host.bounds;
    const { x: dx, y: dy } = vector.direction;
    const root = host.getAncestors().at(-1) ?? host;

    let target = root.findByPoint({ x: x + dx * size, y: y + dy * size, z: host.depth }, true);
    for (const index of vector.placement ?? []) {
        const { x: cx, y: cy } = getChildPosition(index);
        target = target?.getQuadrantAt(dx !== 0 ? (1 - cx) as 0 | 1 : cx, dy !== 0 ? (1 - cy) as 0 | 1 : cy, true);
    }

    return target;
}
