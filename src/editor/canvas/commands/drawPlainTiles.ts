import { config } from "../../../../engine/config/config";
import { TerrainSetting } from "../../../../engine/types";
import { QuadNode } from "../../../../engine/world/quad-node";
import { Tile } from "../../../../engine/world/tile";

type DrawPlainTilesOptions = {
    ctx: CanvasRenderingContext2D;
    nodes: QuadNode[];
    tileSize: number;
}

const BASE_TERRAIN_TYPES: string[] = ['ocean', 'elevation'];
const WEIGHT_ROOF: number = 1; //0.8;

export function drawPlainTiles(options: DrawPlainTilesOptions): void {
    const { ctx, nodes } = options;

    for (const node of nodes) {
        if (node && node.state !== QuadNode.STATE_EMPTY) {
            const tile = node.getTile();
            if (!tile) continue;

            // IF elevation - base or ocean
            // Blend terrain types weight by value

            const baseTerrain = _getBaseTerrain(tile);
            const baseColor = config.getTile(baseTerrain.type)?.meta?.color || '#000000'

            let terrainColorSum = 0;
            const terrainColorArgs = tile.terrain
                .filter((terrain) => !BASE_TERRAIN_TYPES.includes(terrain.type))
                .map((terrain) => {
                    const terrainHexColor = config.getTile(terrain.type)?.meta?.color || '#000000'
                    terrainColorSum += terrain.value;

                    return {
                        color: _hexToRgb(terrainHexColor),
                        weight: terrain.value,
                    };
                });

            // Normalize values
            if (terrainColorSum > WEIGHT_ROOF) {
                const mod = WEIGHT_ROOF / terrainColorSum;
                terrainColorArgs.forEach((terrainColorArg) => {
                    terrainColorArg.weight = terrainColorArg.weight * mod;
                });
            }

            const blendedColor = _blendColors(_hexToRgb(baseColor), terrainColorArgs);

            // Bounds are already in world units, the same space the canvas draws in
            ctx.fillStyle = blendedColor;
            ctx.beginPath();
            ctx.rect(node.bounds.x, node.bounds.y, node.bounds.size, node.bounds.size);
            ctx.fill();

            /*const forrestConfig = tile.getTerrain('forrest');
            if (forrestConfig && forrestConfig.value > 0) {
                _drawTile(forrestConfig, node.bounds, options);
                continue;
            }

            const elevationConfig = tile.getTerrain('elevation');
            if (elevationConfig && elevationConfig.value > 0) {
                _drawTile(elevationConfig, node.bounds, options);
                continue;
            }

            //_blendColors


            _drawTile({ type: 'ocean', value: 1 }, node.bounds, options);*/
        }
    }
}

function _getBaseTerrain(tile: Tile): TerrainSetting {
    const elevationConfig = tile.getTerrain('elevation');
    if (elevationConfig && elevationConfig.value > 0) {
        return elevationConfig;
    }

    return { type: 'ocean', value: 1 };
}

/*function _drawTile(terrain: TerrainSetting, bounds: QuadNodeBounds, options: DrawPlainTilesOptions): void {
    const { ctx } = options;

    // Bounds are already in world units, the same space the canvas draws in
    ctx.fillStyle = _getColorByTerrainType(terrain.type);
    ctx.beginPath();
    ctx.rect(bounds.x, bounds.y, bounds.size, bounds.size);
    ctx.fill();
}*/

/*function _getColorByTerrainType(name: string): string {
    return config.getTile(name)?.meta?.color || '#000000';
}*/

function _blendColors(baseColor: number[], colors: { color: number[], weight: number }[]): string {
    // Colors are { color: [r, g, b], weight: number }
    const result = [...baseColor];
    let totalWeight = 0;

    for (const { color, weight } of colors) {
        if (weight < 0) {
            throw new Error("Weights cannot be negative");
        }

        totalWeight += weight;

        for (let i = 0; i < 3; i++) {
            result[i] += (color[i] - baseColor[i]) * weight;
        }
    }

    if (totalWeight > 1) {
        throw new Error("Color weights must sum to 1 or less");
    }

    return `rgb(${result.map(Math.round).join(", ")})`;
}

function _hexToRgb(hex: string): number[] {
    hex = hex.replace(/^#/, "");

    // Support shorthand, e.g. #2F8 -> #22FF88
    if (hex.length === 3) {
        hex = [...hex].map(c => c + c).join("");
    }

    return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16)
    ];
}
