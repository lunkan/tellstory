import { QuadNode } from '../quad-node';

import { hydrateTile } from './hydrateTile';
import { hydrateMarkers } from './hydrateMarkers';
import { hydrateVectors } from './hydrateVectors';
import { hydrateRoads } from './hydrateRoads';

export function hydrate(node: QuadNode | undefined): QuadNode | undefined {
    if (!node || node.isLocked()) {
        return node; // Can't hydrate undefined or locked
    } else if (node.hasTile()) {
        return node; // Already hydrated
    } else if (!node.parent) {
        return node; // Root nodes can't hydrate
    }

    // Hydrate ancestors
    if (!hydrate(node.parent)) {
        return node; // No tiles for any parent
    }

    // Subtiles

    hydrateTile(node);
    hydrateVectors(node);
    hydrateRoads(node);

    /*const quadrantA = node.getQuadrantAt(0, 0, true);
    const quadrantB = node.getQuadrantAt(1, 0, true);
    const quadrantC = node.getQuadrantAt(0, 1, true);
    const quadrantD = node.getQuadrantAt(1, 1, true);*/

    /*const quadNodes = [quadrantA, quadrantB, quadrantC, quadrantD];
    if (!quadNodes.every(Boolean)) {
        return;
    }*/

    /*console.log('**', quadNodes.length);
    for (const quadNode of quadNodes) {
        console.log('*', quadNode?.tile?.terrain);*/
    hydrateMarkers(node);
    /*}

    if (quadrantA?.tile?.terrain?.some((terrainConfig) => terrainConfig.type === 'urban')) {
        console.log('Node', quadrantA);
    }*/

    return node; // Hydration complete
}

export function dehydrate(node: QuadNode | undefined): QuadNode | undefined {
    if (!node) {
        return node; // Can't hydrate undefined
    } else if (!node.isGenerated()) {
        return node; // Not hydrated
    }

    //node.tile = undefined;
    node.setTileData(undefined);
    node.getQuadrants().forEach((quadNode) => dehydrate(quadNode));

    return node;
}