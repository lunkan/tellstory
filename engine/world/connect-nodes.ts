import { VectorSetting } from "../types";
import { dehydrate } from "./hydrator/hydrate";
import { QuadNode } from "./quad-node";

/**
 * Connects two adjacent nodes of the same depth with a vector of `type`. Each node stores the edge
 * pointing at the other, so a tile is self-contained. Both nodes are detached (creator-drawn).
 * Returns false when the nodes can't be connected or the connection already exists.
 */
export function connectNodes(from: QuadNode, to: QuadNode, type: string, value: number): boolean {
    if (from.isLocked() || to.isLocked()) {
        return false;
    }

    const edges = _connectionEdges(from, to, type, value);
    if (!edges) {
        return false;
    }

    const [forwardVector, backwardVector] = edges;

    if (from.isDetached() && to.isDetached() && _hasVector(from, forwardVector) && _hasVector(to, backwardVector)) {
        return false;
    }

    _addAuthoredVector(from, forwardVector);
    _addAuthoredVector(to, backwardVector);
    return true;
}

export type GeneratedConnectionResult = 'connected' | 'already-connected' | 'protected' | 'missing-tile';

/**
 * Adds transient edges only to hydrated, editable nodes. A protected endpoint is left unchanged;
 * the other endpoint may still hold its half of the connection. Missing editable tiles are not
 * created, so terrain hydration stays separate from vector generation.
 */
export function connectGeneratedNodes(
    from: QuadNode, to: QuadNode, type: string, value: number,
    hasExistingVector?: (node: QuadNode, vector: VectorSetting) => boolean,
): GeneratedConnectionResult {
    const edges = _connectionEdges(from, to, type, value);
    if (!edges) {
        throw new Error('Generated vector endpoints must be adjacent nodes in the same world');
    }

    const endpoints = [{ node: from, vector: edges[0] }, { node: to, vector: edges[1] }]
        .filter(({ node }) => node.canHydrate());
    if (!endpoints.length) {
        return 'protected';
    }
    if (endpoints.some(({ node }) => !node.hasTile())) {
        return 'missing-tile';
    }

    const missing = endpoints.filter(({ node, vector }) => !_hasVector(node, vector) && !hasExistingVector?.(node, vector));
    if (!missing.length) {
        return 'already-connected';
    }
    missing.forEach(({ node, vector }) => node.setTileData({ vectors: [vector] }));
    return 'connected';
}

function _connectionEdges(from: QuadNode, to: QuadNode, type: string, value: number): [VectorSetting, VectorSetting] | undefined {
    const fromRoot = from.getAncestors().at(-1) ?? from;
    const toRoot = to.getAncestors().at(-1) ?? to;
    if (from === to || fromRoot !== toRoot || !from.isAdjacent(to)) {
        return;
    }
    const forward = from.getNormalizedRelativePosition(to);
    const backward = to.getNormalizedRelativePosition(from);
    if (!forward || !backward) {
        return;
    }
    return [
        { type, value, direction: { x: forward.x, y: forward.y } },
        { type, value, direction: { x: backward.x, y: backward.y } },
    ];
}

function _hasVector(node: QuadNode, vector: VectorSetting): boolean {
    return node.getOwnVectors().some((v) => _isSameEdge(v, vector));
}

function _addAuthoredVector(node: QuadNode, vector: VectorSetting): void {
    if (node.isDetached() && _hasVector(node, vector)) {
        return;
    }

    node.detach();
    node.getQuadrants().forEach((quadNode) => dehydrate(quadNode));
    if (!_hasVector(node, vector)) {
        node.setTileData({ vectors: [vector] });
    } else {
        node.dispatch({ type: QuadNode.EVENT_DATA_CHANGE, target: node });
    }
}

function _isSameEdge(a: VectorSetting, b: VectorSetting): boolean {
    return a.type === b.type && a.direction.x === b.direction.x && a.direction.y === b.direction.y;
}
