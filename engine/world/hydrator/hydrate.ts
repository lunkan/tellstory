import { QuadNode } from '../quad-node';

import { hydrateTile } from './hydrateTile';
import { hydrateMarkers } from './hydrateMarkers';

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
    hydrateMarkers(node);
}