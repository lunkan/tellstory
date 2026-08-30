import { QuadNodeNormVector } from "../../types";
import { QuadNode } from "../quad-node";
import { Tile } from "../tile";

const VECTORS = [
    { x: 0, y: -1, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: -1, y: 0, z: 0 },

    { x: 1, y: -1, z: 0 },
    { x: 1, y: 1, z: 0 },
    { x: -1, y: 1, z: 0 },
    { x: -1, y: -1, z: 0 },
];

export function hydrateRoads(node: QuadNode): QuadNode {
    if (!node?.parent) {
        return node;
    }

    _hydrateSubTiles(node.parent);
    return node; // Hydration complete
}

function _hydrateSubTiles(parent: QuadNode): void {
    if (!parent.tile) {
        return;
    }

    const quadrants = [parent.getQuadrantAt(0, 0, true), parent.getQuadrantAt(1, 0, true), parent.getQuadrantAt(0, 1, true), parent.getQuadrantAt(1, 1, true)];
    if (quadrants.some((quadNode) => !quadNode)) {
        return;
    }

    quadrants.forEach((quadNode) => {
        if (quadNode && !quadNode?.tile) {
            quadNode.tile = new Tile();
        }
    })

    // A | B
    // -----
    // C | D
    const quadrantMap = {
        a: quadrants[0]!,
        b: quadrants[1]!,
        c: quadrants[2]!,
        d: quadrants[3]!,
    };

    const aUrban = quadrantMap.a.tile?.getTerrain('urban');
    const bUrban = quadrantMap.b.tile?.getTerrain('urban');
    const cUrban = quadrantMap.c.tile?.getTerrain('urban');
    const dUrban = quadrantMap.d.tile?.getTerrain('urban');

    // A

    if (aUrban && bUrban) {
        const value = Math.min(aUrban.value, bUrban.value);
        _setRoadVectorsBetweenQuadNodes(quadrantMap.a, quadrantMap.b, value);
    }

    if (aUrban && cUrban) {
        const value = Math.min(aUrban.value, cUrban.value);
        _setRoadVectorsBetweenQuadNodes(quadrantMap.a, quadrantMap.c, value);
    }

    if (aUrban && dUrban) {
        const value = Math.min(aUrban.value, dUrban.value);
        _setRoadVectorsBetweenQuadNodes(quadrantMap.a, quadrantMap.d, value);
    }

    // B

    if (bUrban && cUrban) {
        const value = Math.min(bUrban.value, cUrban.value);
        _setRoadVectorsBetweenQuadNodes(quadrantMap.b, quadrantMap.c, value);
    }

    if (bUrban && dUrban) {
        const value = Math.min(bUrban.value, dUrban.value);
        _setRoadVectorsBetweenQuadNodes(quadrantMap.b, quadrantMap.d, value);
    }

    // C

    if (cUrban && dUrban) {
        const value = Math.min(cUrban.value, dUrban.value);
        _setRoadVectorsBetweenQuadNodes(quadrantMap.c, quadrantMap.d, value);
    }


    // out of square

    if (aUrban) {
        _setOuterRoadVectors(quadrantMap.a, aUrban.value);
    }

    if (bUrban) {
        _setOuterRoadVectors(quadrantMap.b, bUrban.value);
    }

    if (cUrban) {
        _setOuterRoadVectors(quadrantMap.c, cUrban.value);
    }

    if (dUrban) {
        _setOuterRoadVectors(quadrantMap.d, dUrban.value);
    }



    /*parent.tile.vectors.forEach((vector) => {
        const xQuadrants = _xQuadrantsFromVector(quadrantMap, parent, vector.direction.x);
        const yQuadrants = _yQuadrantsFromVector(quadrantMap, parent, vector.direction.y);
        const vQuadrant = xQuadrants.find((quadrant) => yQuadrants.indexOf(quadrant) !== -1);
        if (!vQuadrant) {
            console.log('FAIL');
            return;
        }

        vQuadrant.tile?.setVector({
            direction: vQuadrant.getNormalizedRelativePosition(parent)!,
            value: vector.value,
            type: vector.type,
        });

        vQuadrant.tile?.setVector({
            direction: vector.direction,
            value: vector.value,
            type: vector.type,
        });
    });*/
}

/*function _xQuadrantsFromVector(quadrants: QuadrantMap, parent: QuadNode, vx: QuadNodeDelta) {
    if (vx === -1) {
        return [quadrants.a, quadrants.c];
    } else if (vx === 1) {
        return [quadrants.b, quadrants.d];
    } else {
        return parent.bounds.x % 2 ? [quadrants.a, quadrants.c] : [quadrants.b, quadrants.d];
    }
}

function _yQuadrantsFromVector(quadrants: QuadrantMap, parent: QuadNode, vy: QuadNodeDelta) {
    if (vy === -1) {
        return [quadrants.a, quadrants.b];
    } else if (vy === 1) {
        return [quadrants.c, quadrants.d];
    } else {
        return parent.bounds.y % 2 ? [quadrants.a, quadrants.b] : [quadrants.c, quadrants.d];
    }
}*/

// connect each neighboring urban tile with a road. Bigger urban - bigger road.

function _setRoadVectorsBetweenQuadNodes(quadNode1: QuadNode, quadNode2: QuadNode, value: number): void {
    if (0.1 > value) {
        return;
    }

    const delta1 = quadNode1.getNormalizedRelativePosition(quadNode2);
    const delta2 = quadNode2.getNormalizedRelativePosition(quadNode1);

    if (!delta1 || !delta2) {
        return;
    }

    const v1 = quadNode1.tile?.getVectorsByType('road').find((vector) => vector.direction.x === delta1.x && vector.direction.y === delta1.y);
    const v2 = quadNode2.tile?.getVectorsByType('road').find((vector) => vector.direction.x === delta2.x && vector.direction.y === delta2.y);

    if (!v1) {
        quadNode1.tile?.setVector({
            direction: { x: delta1.x, y: delta1.y },
            value: value,
            type: 'road',
        });
    }

    if (!v2) {
        quadNode2.tile?.setVector({
            direction: { x: delta2.x, y: delta2.y },
            value: value,
            type: 'road',
        });
    }
}

function _setOuterRoadVectors(quadNode: QuadNode, value: number): void {
    //if (0.25 > value) {
    if (0.1 > value) {
        return;
    }

    for (const vector of VECTORS) {
        _setOuterRoadVector(quadNode, vector as any, value);
    }
}

function _setOuterRoadVector(quadNode: QuadNode, vector: QuadNodeNormVector, value: number): void {
    const vectorSetting = quadNode.tile?.getVectorsByType('road').find((vectorSetting) => vectorSetting.direction.x === vector.x && vectorSetting.direction.y === vector.y);
    if (!vectorSetting) {
        quadNode.tile?.setVector({
            direction: { x: vector.x, y: vector.y },
            value: value,
            type: 'road',
        });
    }
}