import { VectorSetting } from "../types";
import { dehydrate } from "./hydrator/hydrate";
import { QuadNode } from "./quad-node";

/**
 * Connects two adjacent nodes of the same depth with a vector of `type`. Each node stores the edge
 * pointing at the other, so a tile is self-contained. Both nodes are detached (creator-drawn).
 * Returns false when the nodes can't be connected or the connection already exists.
 */
export function connectNodes(from: QuadNode, to: QuadNode, type: string, value: number): boolean {
    if (from === to || from.isLocked() || to.isLocked() || !from.isAdjacent(to)) {
        return false;
    }

    const forward = from.getNormalizedRelativePosition(to);
    const backward = to.getNormalizedRelativePosition(from);
    if (!forward || !backward) {
        return false;
    }

    const forwardVector: VectorSetting = { type, value, direction: { x: forward.x, y: forward.y } };
    const backwardVector: VectorSetting = { type, value, direction: { x: backward.x, y: backward.y } };

    if (_hasVector(from, forwardVector) && _hasVector(to, backwardVector)) {
        return false;
    }

    _addVector(from, forwardVector);
    _addVector(to, backwardVector);
    return true;
}

function _hasVector(node: QuadNode, vector: VectorSetting): boolean {
    return !!node.getTile()?.vectors.some((v) => _isSameEdge(v, vector));
}

function _addVector(node: QuadNode, vector: VectorSetting): void {
    if (_hasVector(node, vector)) {
        return;
    }

    node.detach();
    node.getQuadrants().forEach((quadNode) => dehydrate(quadNode));
    node.setTileData({ vectors: [vector] });
}

function _isSameEdge(a: VectorSetting, b: VectorSetting): boolean {
    return a.type === b.type && a.direction.x === b.direction.x && a.direction.y === b.direction.y;
}
