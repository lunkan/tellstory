//import markersJSON from '../../config/markers.json' with { type: 'json' };
import { config } from '../../config/config';
import { getRandFromSeeds } from '../../util/number-generator';
import { QuadNode } from '../quad-node';

export function hydrateMarkers(node: QuadNode): void {
    if (!node?.parent) {
        return;
    }

    _hydrateSubTiles(node.parent);
}

function _hydrateSubTiles(parent: QuadNode): void {

    const quadrantA = parent.getQuadrantAt(0, 0, true);
    const quadrantB = parent.getQuadrantAt(1, 0, true);
    const quadrantC = parent.getQuadrantAt(0, 1, true);
    const quadrantD = parent.getQuadrantAt(1, 1, true);

    [quadrantA, quadrantB, quadrantC, quadrantD]
        .filter((quadrant) => quadrant?.canHydrate())
        .forEach((quadrant) => _hydrateSubTile(quadrant!));
}

function _hydrateSubTile(node: QuadNode): void {
    const tile = node.getTile();
    if (!tile) {
        return; // Can't generate markers without terrain
    }

    tile.terrain
        .filter((terrainConfig) => terrainConfig.type !== 'elevation')
        .forEach((terrainConfig) => {
            const markers = config.getMarkersByFilter({ scale: node.scale, tags: [terrainConfig.type] });
            let numMarkers = Math.ceil(terrainConfig.value * 3);

            while (numMarkers > 0 && markers.length > 0) {
                const rand = getRandFromSeeds(BigInt(numMarkers), node.key.hash);
                const randIndex = Math.floor(markers.length * rand);
                const marker = markers.splice(randIndex, 1)[0];

                node.updateTileData({
                    markers: [{
                        placement: node.key.id,
                        attention: node.scale,
                        type: marker.name,
                        id: 'hydrated',
                    }],
                });

                /*node.tile!.addMarker({
                    point: _findMarkerPoint(marker, node),
                    attention: node.scale,
                    type: marker.name,
                    id: 'hydrated',
                });*/

                numMarkers--;
            }
        });


    /*const terrainTypes = node.tile?.terrain.map((terrainConfig) => terrainConfig.type);
    const markers = config.getMarkersByFilter({ scale: node.scale, tags: terrainTypes });
    if (!markers.length) {
        return node;
    }*/

    // What terrain is it most of 

    /*const rand = getRandFromSeeds(BigInt(100), node.key.hash);
    const randIndex = Math.floor(markers.length * rand);
    const marker = markers[randIndex];

    node.tile.addMarker({
        point: _findMarkerPoint(marker, node),
        attention: node.scale,
        type: marker.name,
        id: 'hydrated',
    });*/

    //return node;
}

/*function _getNodeMarkerWeight(marker: MarkerConfigEntry, node: QuadNode): number {
    if (!node.tile) {
        return 0;
    }

    return node.tile!.terrain.reduce((acc, terrain) => {
        if (marker.tags.includes(terrain.type)) {
            acc += terrain.value;
        }

        return acc;
    }, 0);
}*/
