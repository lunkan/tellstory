import { config } from "../../../../engine/config/config";
import { TerrainSetting } from "../../../../engine/types";
import { QuadNode } from "../../../../engine/world/quad-node";
import { QuadNodeBounds } from "../../../../engine/world/quad-node-bounds";

type DrawPlainTilesOptions = {
    ctx: CanvasRenderingContext2D;
    nodes: QuadNode[];
    tileSize: number;
}

export function drawPlainTiles(options: DrawPlainTilesOptions): void {
    const { nodes } = options;

    for (const node of nodes) {
        if (node && node.state !== QuadNode.STATE_EMPTY) {
            const tile = node.getTile();
            if (!tile) continue;

            const forrestConfig = tile.getTerrain('forrest');
            if (forrestConfig && forrestConfig.value > 0) {
                _drawTile(forrestConfig, node.bounds, options);
                continue;
            }

            const elevationConfig = tile.getTerrain('elevation');
            if (elevationConfig && elevationConfig.value > 0) {
                _drawTile(elevationConfig, node.bounds, options);
                continue;
            }

            _drawTile({ type: 'ocean', value: 1 }, node.bounds, options);
        }
    }
}

function _drawTile(terrain: TerrainSetting, bounds: QuadNodeBounds, options: DrawPlainTilesOptions): void {
    const { ctx } = options;

    // Bounds are already in world units, the same space the canvas draws in
    ctx.fillStyle = _getColorByTerrainType(terrain.type);
    ctx.beginPath();
    ctx.rect(bounds.x, bounds.y, bounds.size, bounds.size);
    ctx.fill();
}

function _getColorByTerrainType(name: string): string {
    return config.getTile(name)?.meta?.color || '#000000';
}
