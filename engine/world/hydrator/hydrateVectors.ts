import { QuadNodeDelta } from "../../types";
import { QuadNode } from "../quad-node";
import { Tile } from "../tile";

type QuadrantMap = {
    a: QuadNode;
    b: QuadNode;
    c: QuadNode;
    d: QuadNode;
}

export function hydrateVectors(node: QuadNode): QuadNode {
    if (!node?.parent) {
        return node;
    }

    _hydrateSubTiles(node.parent);
    return node; // Hydration complete
}

function _hydrateSubTiles(parent: QuadNode): void {
    const parentTile = parent.getTile();
    if (!parentTile) {
        return;
    }

    const quadrants = [parent.getQuadrantAt(0, 0, true), parent.getQuadrantAt(1, 0, true), parent.getQuadrantAt(0, 1, true), parent.getQuadrantAt(1, 1, true)];
    if (quadrants.some((quadNode) => !quadNode)) {
        return;
    }

    /*quadrants.forEach((quadNode) => {
        if (quadNode && !quadNode?.tile) {
            quadNode.tile = new Tile();
        }
    })*/

    quadrants.forEach((quadNode) => {
        if (quadNode && !quadNode.hasTile() && quadNode.canHydrate()) {
            quadNode.setTileData({});
            //quadNode.tile = new Tile();
        }
    });

    const quadrantMap = {
        a: quadrants[0]!,
        b: quadrants[1]!,
        c: quadrants[2]!,
        d: quadrants[3]!,
    };

    parentTile.vectors.forEach((vector) => {
        const xQuadrants = _xQuadrantsFromVector(quadrantMap, parent, vector.direction.x);
        const yQuadrants = _yQuadrantsFromVector(quadrantMap, parent, vector.direction.y);
        const vQuadrant = xQuadrants.find((quadrant) => yQuadrants.indexOf(quadrant) !== -1);
        if (!vQuadrant) {
            console.log('FAIL');
            return;
        } else if (!vQuadrant.canHydrate()) {
            return;
        }

        /*vQuadrant.tile?.setVector({
            direction: vQuadrant.getNormalizedRelativePosition(parent)!,
            value: vector.value,
            type: vector.type,
        });

        vQuadrant.tile?.setVector({
            direction: vector.direction,
            value: vector.value,
            type: vector.type,
        });*/

        vQuadrant.setTileData({
            vectors: [{
                direction: vQuadrant.getNormalizedRelativePosition(parent)!,
                value: vector.value,
                type: vector.type,
            }, {
                direction: vector.direction,
                value: vector.value,
                type: vector.type,
            }],
        });
    });
}

function _xQuadrantsFromVector(quadrants: QuadrantMap, parent: QuadNode, vx: QuadNodeDelta) {
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
}

// connect each neighboring urban tile with a road. Bigger urban - bigger road.