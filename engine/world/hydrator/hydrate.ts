import { QuadNode } from '../quad-node';

import { hydrateTile } from './hydrateTile';
import { hydrateMarkers } from './hydrateMarkers';
import { hydrateVectors } from './hydrateVectors';
import { hydrateRoads } from './hydrateRoads';

export function hydrate(node: QuadNode | undefined): QuadNode | undefined {
    if (!node) {
        return node; // Can't hydrate undefined
    } else if (node.tile) {
        return node; // Already hydrated
    } else if (!node.parent) {
        return node; // Root nodes can't hydrate
    }

    // Hydrate ancestors
    if (!hydrate(node.parent)) {
        return node; // No tiles for any parent
    }

    hydrateTile(node);
    hydrateVectors(node);
    hydrateRoads(node);
    hydrateMarkers(node);
}

export function dehydrate(node: QuadNode | undefined): QuadNode | undefined {
    if (!node) {
        return node; // Can't hydrate undefined
    } else if (!node.isGenerated()) {
        return node; // Not hydrated
    }

    node.tile = undefined;
    node.getQuadrants().forEach((quadNode) => dehydrate(quadNode));
}