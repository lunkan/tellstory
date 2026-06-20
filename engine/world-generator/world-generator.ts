import { QuadNodeDelta, TerrainSetting } from '../../storyteller/types';
import tilesJSON from '../config/tiles.json' with { type: 'json' };
import { getRandFromSeeds } from '../util/number-generator';
import { QuadNode } from '../world/quad-node';
import { QuadNodeKey } from '../world/quad-node-key';

import { Tile } from "../world/tile";

type TileConfigSubTile = {
    name: string;
    threshold: number;
};

type TileConfig = {
    name: string;
    subTiles?: TileConfigSubTile[],
};

export function hydrate(node: QuadNode | undefined): boolean {
    if (!node) {
        return false; // Can't hydrate undefined
    } else if (node.tile) {
        return true; // Already hydrated
    } else if (!node.parent) {
        return false; // Root nodes can't hydrate
    }

    if (!node.parent.tile) {
        if(!hydrate(node.parent)) {
            return false; // No tiles for any parent
        }
    }

    hydrateSubTiles(node.parent);
    return true; // Hydration complete
}

function hydrateSubTiles(parent: QuadNode): void {
    if (!parent.tile) {
        return;
    }

    const quadrantA = parent.getQuadrantAt(0, 0, true);
    const quadrantB = parent.getQuadrantAt(1, 0, true);
    const quadrantC = parent.getQuadrantAt(0, 1, true);
    const quadrantD = parent.getQuadrantAt(1, 1, true);

    if (!quadrantA || !quadrantB || !quadrantC || !quadrantD) {
        return;
    }

    const quadrants: QuadNode[] = [quadrantA, quadrantB, quadrantC, quadrantD].map((quadrant) => {
        quadrant.tile = new Tile();
        return quadrant;
    });

    // Water - is water :)
    if (parent.tile.hasTerrain('water')) {
        quadrants.forEach((quadrant) => {
            quadrant.tile!.addTerrain({
                type: 'water',
                value: 1,
            });
        });
        
        return;
    }

    let seedIncrementor = 0;

    const elevationBalanceSerie = getBalanceSerie(++seedIncrementor, parent.key.hash);
    quadrants.forEach((quadrant, i) => {
        quadrant.tile?.addTerrain({
            type: 'elevation',
            value: parent.tile!.elevation + elevationBalanceSerie[i] * 0.25,
        });
    });

    parent.tile.terrain.filter((terrain) => {
        const config = tilesJSON.tiles.find((tile) => tile.name === terrain.type);
        return config?.category === 'biome' || config?.category === 'urban';
    }).map((terrain) => {   
        const balanceSerie = getBalanceSerie(++seedIncrementor, parent.key.hash);

        quadrants.forEach((quadrant, i) => {
            quadrant.tile?.addTerrain({
                type: terrain.type,
                value: terrain.value + balanceSerie[i] * 0.25,
            });
        });
    });        

    function xQuadrantsFromVector(vx: QuadNodeDelta) {
        if (vx === -1) {
            return [quadrantA, quadrantC];
        } else if (vx === 1) {
            return [quadrantB, quadrantD];
        } else {
            return parent.bounds.x % 2 ? [quadrantA, quadrantC] : [quadrantB, quadrantD];
        }
    }

    function yQuadrantsFromVector(vy: QuadNodeDelta) {
        if (vy === -1) {
            return [quadrantA, quadrantB];
        } else if (vy === 1) {
            return [quadrantC, quadrantD];
        } else {
            return parent.bounds.y % 2 ? [quadrantA, quadrantB] : [quadrantC, quadrantD];
        }
    }

    parent.tile.vectors.forEach((vector) => {
        const xQuadrants = xQuadrantsFromVector(vector.direction.x);
        const yQuadrants = yQuadrantsFromVector(vector.direction.y);
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
    });
}

function getBalanceSerie(type: number, seed: bigint): number[] {
    const quadValues = [
        getRandFromSeeds(BigInt(type), BigInt(0), seed),
        getRandFromSeeds(BigInt(type), BigInt(1), seed),
        getRandFromSeeds(BigInt(type), BigInt(2), seed),
        getRandFromSeeds(BigInt(type), BigInt(3), seed),
    ];

    const sum = quadValues.reduce((acc, randVal) => acc + randVal, 0);
    const average = sum / 4;
    return quadValues.map((value) => value - average);
}

export class WorldGenerator {
    public generateTile(key: QuadNodeKey): Tile | undefined {
        let path = key.getPath();
        let currentConfig: TileConfig | undefined = this._getTileConfigByName('continent');
        let currentElevation = 0;

        for (let z = 0; z <= path.length; z++) {
            if (!currentConfig || !currentConfig.subTiles) {
                return;
            }

            const currentPath = path.slice(0, z);
            const currentHash = QuadNodeKey.getHashFromPath(currentPath);

            const nextTypeRand = getRandFromSeeds(currentHash);
            const subTileConfig: TileConfigSubTile | undefined = currentConfig.subTiles.find((subTileConfig) => nextTypeRand < subTileConfig.threshold);

            if (!subTileConfig) {
                throw new Error(`No subTileConfig found for ${currentConfig.name}. At leat one subTileConfig should have threshold 1 to guarantee there is always one match`)
            }

            //const elevationRand = getRandFromSeeds(currentHash, BigInt(1)) - 0.5;
            const elevationValue = getRandFromSeeds(currentHash, BigInt(1)); //(elevationRand - 0.5) * (1 / (z + 1));

            currentElevation = Math.max(0, Math.min(1, elevationValue));
            currentConfig = this._getTileConfigByName(subTileConfig.name);
        }

        const valueHash = QuadNodeKey.getHashFromPath(path);
        const valueRand = getRandFromSeeds(valueHash, BigInt(2));

        const tile = new Tile();

        tile.addTerrain({
            type: currentConfig.name,
            value: valueRand,
        });

        tile.addTerrain({
            type: 'elevation',
            value: currentElevation,
        });

        return tile;
    }

    private _getTileConfigByName(name: string): TileConfig {
        const tileTypeConfig = tilesJSON.tiles.find((tile) => tile.name === name);
        return tileTypeConfig as TileConfig;
    }
}
