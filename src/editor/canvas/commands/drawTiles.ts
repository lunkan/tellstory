import { Tile } from "../../../../engine/world/tile";
import { config } from "../../../../engine/config/config";
import { TerrainSetting, VectorSetting } from "../../../../engine/types";
import { GridRect } from "../types";
import { QuadNode } from "../../../../engine/world/quad-node";

const NUM_TERRAIN_SLOTS = 16;
const TOPOGRAPHY_COLORS = [
    '#138265',
    '#00C82E',
    '#1ED368',
    '#5FE074',
    '#A0EB82',
    '#DFF892',
    '#F5E595',
    '#C9B377',
    '#A27E5E',
    '#906255',
    '#A27D74',
    '#B2958B',
    '#C7B0AA',
    '#DBCDCB',
    '#EDE5E3',
];

type DrawTilesOptions = {
    ctx: CanvasRenderingContext2D;
    nodes: QuadNode[];
    tileSize: number;
}

export function drawTiles(options: DrawTilesOptions): void {
    const { ctx, nodes, tileSize } = options;

    for (const node of nodes) {
        if (node && node.tile) {
            _drawTile(node.tile, {
                x: node.bounds.x,
                y: node.bounds.y,
                width: tileSize,
                height: tileSize,
            }, ctx);
        }
    }
}

function _drawTile(tile: Tile, gridRect: GridRect, ctx: CanvasRenderingContext2D): void {
    if (!tile) {
        return;
    }

    const elevationConfig = tile.getTerrain('elevation');

    //if (waterConfig) {
    if (tile.hasTag('water')) {
        _drawWater(gridRect, ctx);
    } else if (elevationConfig) {
        _drawTypography(elevationConfig.value || 0, gridRect, ctx);
    }

    const vectorTypes = tile.vectors.filter((vectorConfig) => config.getTile(vectorConfig.type)?.category === 'vector');
    _drawVectors(vectorTypes, gridRect, ctx);

    const basicTerrainTypes = tile.terrain.filter((terrainConfig) => terrainConfig.type !== 'water' && terrainConfig.type !== 'elevation');
    _drawTerrain(basicTerrainTypes, gridRect, ctx);
}

function _drawWater(gridRect: GridRect, ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#1A91FC';
    ctx.beginPath();
    ctx.rect(gridRect.x, gridRect.y, gridRect.width, gridRect.height);
    ctx.fill();
}

function _drawTypography(elevation: number, gridRect: GridRect, ctx: CanvasRenderingContext2D): void {
    const colorIndex = Math.round(elevation * 14);
    ctx.fillStyle = TOPOGRAPHY_COLORS[colorIndex];
    ctx.beginPath();
    ctx.rect(gridRect.x, gridRect.y, gridRect.width, gridRect.height);
    ctx.fill();
}

function _drawTerrain(terrainSettings: TerrainSetting[], gridRect: GridRect, ctx: CanvasRenderingContext2D): void {
    const slotSize = gridRect.width / 8;

    const slots = _distributeTerrains(terrainSettings);
    slots.forEach((terrainType, i) => {
        const x = i % 4;
        const y = Math.floor(i / 4);

        const offsetX = y % 2 === 0 ? slotSize / 2 : 0;
        const offsetY = slotSize / 2;

        const posX = offsetX + gridRect.x + x * slotSize * 2;
        const posY = offsetY + gridRect.y + y * slotSize * 2;

        const value = terrainSettings.find((setting) => setting.type === terrainType)?.value || 0;

        ctx.fillStyle = _getColorByTerrainType(terrainType);
        ctx.beginPath();
        ctx.rect(posX, posY, slotSize * value * 1.5, slotSize * value * 1.5);
        ctx.fill();
    });
}

function _drawVectors(vectorSettings: VectorSetting[], gridRect: GridRect, ctx: CanvasRenderingContext2D): void {
    const lineLength = gridRect.width / 2;
    const x1 = gridRect.x + lineLength;
    const y1 = gridRect.y + lineLength;

    const scale = ctx.getTransform().a;
    const baseSize = 10 / scale;

    vectorSettings.forEach((vectorSetting) => {
        const x2 = x1 + vectorSetting.direction.x * lineLength;
        const y2 = y1 + vectorSetting.direction.y * lineLength;

        ctx.strokeStyle = config.getTile(vectorSetting.type)?.meta.color || '#000000';
        ctx.lineWidth = vectorSetting.value * baseSize;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    });
}

function _getColorByTerrainType(name: string): string {
    return config.getTile(name)?.meta?.color || '#000000';
}

function _distributeTerrains(terrainSettings: TerrainSetting[]): string[] {
    const allocation = _allocateTerrainSlots(terrainSettings);
    const entries = Object.entries(allocation).map(([terrain, count]) => ({
        terrain,
        remaining: count,
        placed: 0
    }));

    const result = [];

    for (let slot = 0; slot < NUM_TERRAIN_SLOTS; slot++) {
        let best = null;
        let bestScore = -Infinity;

        for (const entry of entries) {
            if (entry.remaining === 0) continue;

            // Expected placements by this point
            const expected =
                (allocation[entry.terrain] * (slot + 1)) / NUM_TERRAIN_SLOTS;

            const score = expected - entry.placed;

            if (score > bestScore) {
                bestScore = score;
                best = entry;
            }
        }

        if (best) {
            result.push(best.terrain);
            best.remaining--;
            best.placed++;
        }
    }

    return result;
}

function _allocateTerrainSlots(terrainSettings: TerrainSetting[]): { [k: string]: number; } {
    const totalWeight = Object.values(terrainSettings)
        .reduce((sum, terrainSetting) => sum + terrainSetting.value, 0);

    const allocations = terrainSettings.map(({ type, value }) => {
        const exact = value / totalWeight * NUM_TERRAIN_SLOTS;

        return {
            type,
            exact,
            count: Math.floor(exact),
            remainder: exact % 1
        };
    });

    const assigned = allocations.reduce((sum, a) => sum + a.count, 0);
    const remaining = NUM_TERRAIN_SLOTS - assigned;

    allocations
        .sort((a, b) => b.remainder - a.remainder)
        .slice(0, remaining)
        .forEach(a => a.count++);

    return Object.fromEntries(
        allocations.map(a => [a.type, a.count])
    );
}
