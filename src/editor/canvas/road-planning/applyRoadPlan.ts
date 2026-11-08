import { connectGeneratedNodes } from '../../../../engine/world/connect-nodes';
import { QuadNode } from '../../../../engine/world/quad-node';
import { RoadPlan } from '../../../../engine/world/vector-generation/road-plan';
import { RoadCell } from '../../../../engine/world/vector-generation/road-path';
import { createRoadPlanningSnapshot } from './roadPlanningSnapshot';
import { RoadPlanningRequest } from './roadPlannerProtocol';

/**
 * Apply only to the same terrain and protected-edge snapshot used by the worker.
 * The caller must also reject results belonging to a replaced viewport request.
 */
export function applyRoadPlan(
    root: QuadNode,
    depth: number,
    request: RoadPlanningRequest,
    plan: RoadPlan,
    roadType: string,
    value: number,
    beforeApply?: () => void,
): 'applied' | 'stale' {
    const current = createRoadPlanningSnapshot(root, depth, request.bounds, roadType).request;
    if (JSON.stringify([request.terrain, request.blocked ?? [], request.protectedCells ?? [], request.generatedCells ?? [], request.inheritedCells ?? []])
        !== JSON.stringify([current.terrain, current.blocked ?? [], current.protectedCells ?? [], current.generatedCells ?? [], current.inheritedCells ?? []])) {
        return 'stale';
    }

    const tileSize = root.bounds.size / 2 ** depth;
    const bounds = request.bounds;
    const inherited = new Map((request.inheritedCells ?? []).map(({ index, directions }) => [
        index, new Set(directions.map(({ x, y }) => `${x},${y}`)),
    ]));
    const hasInherited = (node: QuadNode, dx: number, dy: number): boolean => {
        const x = node.bounds.x / tileSize;
        const y = node.bounds.y / tileSize;
        const index = (y - bounds.y) * bounds.width + x - bounds.x;
        return inherited.get(index)?.has(`${dx},${dy}`) ?? false;
    };
    const nodeAt = ({ x, y }: RoadCell): QuadNode => {
        if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)
            || x < bounds.x || x >= bounds.x + bounds.width || y < bounds.y || y >= bounds.y + bounds.height) {
            throw new Error('Road plan contains a cell outside its snapshot');
        }
        const node = root.findByPoint({ x: x * tileSize, y: y * tileSize, z: depth });
        if (!node || !node.getTile() || (node.isDetached() && !node.isLocked())) {
            throw new Error('Road plan contains a cell without terrain');
        }
        return node;
    };
    const pairs: { from: QuadNode; to: QuadNode; protectedOnly: boolean }[] = [];
    for (const connection of plan.connections) {
        if (connection.cells.length < 2) {
            throw new Error('Road plan contains an empty connection');
        }
        const nodes = connection.cells.map(nodeAt);
        for (let i = 1; i < nodes.length; i++) {
            const from = nodes[i - 1];
            const to = nodes[i];
            const a = connection.cells[i - 1];
            const b = connection.cells[i];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1 || (dx === 0 && dy === 0)) {
                throw new Error('Road plan contains non-adjacent cells');
            }
            const boundary = connection.kind === 'boundary' && i === nodes.length - 1;
            if (boundary && (!from.canHydrate() || to.canHydrate())) {
                throw new Error('Road boundary must end at a protected tile from an editable tile');
            }
            const hasRoad = (node: QuadNode, x: number, y: number): boolean =>
                hasInherited(node, x, y) || node.getOwnVectors().some((vector) => vector.type === roadType
                    && vector.direction.x === x && vector.direction.y === y);
            if ((!from.canHydrate() && !hasRoad(from, dx, dy))
                || (!boundary && !to.canHydrate() && !hasRoad(to, -dx, -dy))) {
                throw new Error('Road plan cannot cross a protected tile without a matching road');
            }
            pairs.push({ from, to, protectedOnly: !from.canHydrate() && !to.canHydrate() });
        }
    }

    beforeApply?.();
    for (const { from, to, protectedOnly } of pairs) {
        const result = connectGeneratedNodes(from, to, roadType, value,
            (node, vector) => hasInherited(node, vector.direction.x, vector.direction.y));
        if (result === 'missing-tile' || (result === 'protected' && !protectedOnly)) {
            throw new Error('Road plan tile state changed while applying the plan');
        }
    }
    return 'applied';
}
