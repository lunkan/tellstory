import tilesJSON from '../config/tiles.json' with { type: 'json' };
import { getRandFromSeeds } from '../util/number-generator';
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
