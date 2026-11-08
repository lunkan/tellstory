import { CellEdge, CellEdges } from './cell-edges';
import { QuadNode } from './quad-node';

/** Resolve the directions of drawn edges and links through one existing cell. */
export function getCellDirections(cell: QuadNode, drawn: CellEdges): CellEdge[] {
    const result: CellEdge[] = [];
    const add = (edge: CellEdge) => {
        if (!result.some((item) => item.type === edge.type && item.value === edge.value && item.scale === edge.scale
            && item.direction.x === edge.direction.x && item.direction.y === edge.direction.y)) {
            result.push(edge);
        }
    };
    drawn.edges.filter((edge) => edge.cell.key.id === cell.key.id).forEach(add);

    const centre = cell.getCenterPoint();
    const size = cell.bounds.size;
    for (const { points, type, value, scale } of drawn.links) {
        for (let i = 1; i < points.length; i++) {
            const from = points[i - 1];
            const to = points[i];
            const dx = Math.sign(to.x - from.x);
            const dy = Math.sign(to.y - from.y);
            const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y)) / size;
            const step = dx ? (centre.x - from.x) / (dx * size) : dy ? (centre.y - from.y) / (dy * size) : 0;
            if (!steps || !Number.isInteger(step) || step < 0 || step > steps
                || centre.x !== from.x + step * dx * size || centre.y !== from.y + step * dy * size) {
                continue;
            }
            if (step > 0) {
                add({ cell, direction: { x: dx ? -dx : 0, y: dy ? -dy : 0 }, type, value, scale });
            }
            if (step < steps) {
                add({ cell, direction: { x: dx, y: dy }, type, value, scale });
            }
        }
    }
    return result;
}
