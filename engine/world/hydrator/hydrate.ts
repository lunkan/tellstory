import { QuadNode } from '../quad-node';

import { hydrateTile } from './hydrateTile';
import { hydrateMarkers } from './hydrateMarkers';
import { placeMarkers } from './placeMarkers';
import { placeVectors } from './placeVectors';
import { terrainNeighbours } from './terrain-neighbours';

export function hydrate(node: QuadNode | undefined): QuadNode | undefined {
    if (!node || node.isLocked()) {
        return node; // Can't hydrate undefined or locked
    } else if (node.hasTile()) {
        return node; // Already hydrated
    } else if (!node.parent || node.parent.isLocked()) {
        return node; // Root nodes can't hydrate
    }

    // Hydrate ancestors
    if (!hydrate(node.parent)) {
        return node; // No tiles for any parent
    }

    // Neighbours at the parent's depth are resolved before its children, never from their peers.
    terrainNeighbours(node.parent, true).forEach((neighbour) => hydrate(neighbour));
    const newTiles = new Set(node.parent.getQuadrants().filter((child) => child.canHydrate() && !child.hasTile()));

    hydrateTile(node);

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
    hydrateMarkers(node, newTiles);
    placeMarkers(node.parent);
    placeVectors(node.parent);
    /*}

    if (quadrantA?.tile?.terrain?.some((terrainConfig) => terrainConfig.type === 'urban')) {
        console.log('Node', quadrantA);
    }*/

    return node; // Hydration complete
}

export type DehydrateOptions = {
    /** Clear generated vectors only; terrain and markers remain. */
    vectors: true;
};

export function dehydrate(node: QuadNode | undefined, options?: DehydrateOptions): QuadNode | undefined {
    if (!node) {
        return node; // Can't hydrate undefined
    }

    if (options?.vectors) {
        if (node.canHydrate()) {
            for (const type of new Set(node.getOwnVectors().map((vector) => vector.type))) {
                node.clearGeneratedVectors(type);
            }
        }
        node.getQuadrants().forEach((child) => dehydrate(child, options));
        return node;
    }

    if (node.state !== QuadNode.STATE_HYDRATED) { //(!node.isGenerated()) {
        return node; // Not hydrated
    }

    //node.tile = undefined;
    node.setTileData(undefined);
    node.getQuadrants().forEach((quadNode) => dehydrate(quadNode));

    return node;
}