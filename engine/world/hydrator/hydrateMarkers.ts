//import markersJSON from '../../config/markers.json' with { type: 'json' };
import { config } from '../../config/config';
import { QuadNodes2DPoint } from '../../types';
import { getRandFromSeeds } from '../../util/number-generator';
import { QuadNode } from '../quad-node';

type MarkerConfigEntry = {
    name: string;
    tags: string[];
    depth: number;
};

export function hydrateMarkers(node: QuadNode): QuadNode {
    if (!node.tile) {
        return node; // Can't generate markers without terrain
    }

    // Check how many already - don't generate if provided.

    const terrainTypes = node.tile?.terrain.map((terrainConfig) => terrainConfig.type);
    //const markers = markersJSON.markers.filter((marker) => node.depth === marker.depth && marker.tags.some((tag) => terrainTypes?.includes(tag)));
    const markers = config.getMarkersByFilter({ depth: node.depth, tags: terrainTypes });

    if (!markers.length) {
        return node;
    }

    const rand = getRandFromSeeds(BigInt(100), node.key.hash);
    const randIndex = Math.floor(markers.length * rand);
    const marker = markers[randIndex];

    // More markers - filtered by level

    node.tile.addMarker({
        point: _findMarkerPoint(marker, node),
        type: marker.name,
        id: 'hydrated',
    });

    return node;
}

function _findMarkerPoint(marker: MarkerConfigEntry, node: QuadNode): QuadNodes2DPoint {
    const markerNode = [...node.getQuadrants()].sort((a, b) => {
        const valueA = _getNodeMarkerWeight(marker, a);
        const valueB = _getNodeMarkerWeight(marker, b);
        return valueB - valueA;
    })[0] || node; // Self if no quadrant nodes

    const randX = getRandFromSeeds(BigInt(101), markerNode.key.hash);
    const randY = getRandFromSeeds(BigInt(102), markerNode.key.hash);

    return {
        x: markerNode.bounds.size * randX + markerNode.bounds.x,
        y: markerNode.bounds.size * randY + markerNode.bounds.y,
    };
}

function _getNodeMarkerWeight(marker: MarkerConfigEntry, node: QuadNode): number {
    if (!node.tile) {
        return 0;
    }

    return node.tile!.terrain.reduce((acc, terrain) => {
        if (marker.tags.includes(terrain.type)) {
            acc += terrain.value;
        }

        return acc;
    }, 0);
}
