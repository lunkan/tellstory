import { config } from "../../../../engine/config/config";
import { TerrainSetting } from "../../../../engine/types";
import { GridBounds } from "../types";
import { boundsToGridPoint } from "../gridUtils";
import { QuadNode } from "../../../../engine/world/quad-node";

type DrawTerrainOptions = {
    ctx: CanvasRenderingContext2D;
    gridBounds: GridBounds;
    scale: number;
    nodes: QuadNode[];
    tileSize: number;
}

type NodeGrid = (QuadNode | undefined)[][];

type TileDrawData = {
    share: number;
    scale: number;
    base: number;
    color: string;
}

const BASE_TERRAIN_TYPES: string[] = ['ocean', 'elevation'];
const VALUE_THRESHOLD: number = 0.1;
/**
 * Dot area per terrain value. 1 = value 1 fills the whole dot. 0.5 = value 1 fills half the area
 * (like value 0.5 at scale 1) and the dot is full first at value 1 / DOT_BASE_SCALE = 2.
 */
const DOT_BASE_SCALE: number = 0.5;

export function drawTerrain(options: DrawTerrainOptions): void {
    const { ctx, gridBounds, scale, nodes, tileSize } = options;

    const nodeGrid: NodeGrid = _toNodeGrid(nodes, gridBounds, tileSize);

    const x1 = gridBounds.x;
    const x2 = gridBounds.x + gridBounds.xSize;
    const y1 = gridBounds.y;
    const y2 = gridBounds.y + gridBounds.ySize;

    // Skewed (rotated) lattice that repeats exactly once per tile.
    // Lattice steps are (n, s) / N and (-s, n) / N with N = n² + s² - their combinations
    // n·(n, s) - s·(-s, n) = (N, 0) and s·(n, s) + n·(-s, n) = (0, N) are exactly one tile in x and y.
    // Within a tile that gives N points: x = (k·n mod N) / N, y = (k·s mod N) / N.
    // n and s must not share a common factor, otherwise only part of the lattice is drawn (gaps).
    // The lattice is shifted by half a tile so k = 0 sits on the tile centre and the pattern is
    // symmetric around it (a point lattice is symmetric around any of its points).
    const n = 8; // ~circles per tile side
    const s = 3; // Skew - the lattice is rotated atan(s / n), 3 ≈ 21°
    const N = n * n + s * s;
    const spacing = Math.sqrt(N) / N; // Distance between neighbouring circles, ≈ 1 / n
    const radius = (spacing / 2) * tileSize;

    ctx.strokeStyle = '#939393';
    ctx.lineWidth = 1 / scale;

    const maxFillRadius = (spacing / 2) * tileSize;

    for (let tx = x1; tx < x2; tx++) {
        for (let ty = y1; ty < y2; ty++) {
            // Weights for dots unaffected by neighbours - computed once per tile
            const node = _getGridNode(nodeGrid, tx - x1, ty - y1);
            const tileWeights = node ? _getTerrainWeightsFromNode(node) : [];
            const tileOffset = _hash(tx, ty);

            for (let k = 0; k < N; k++) {
                const fx = (((k * n) % N) / N + 0.5) % 1;
                const fy = (((k * s) % N) / N + 0.5) % 1;
                const cx = tx + fx;
                const cy = ty + fy;

                ctx.beginPath();
                ctx.arc(cx * tileSize, cy * tileSize, radius, 0, Math.PI * 2);
                ctx.stroke();

                // Only dots within SMOOTH_RADIUS of an edge are influenced by neighbours.
                // nodeGrid is relative to gridBounds, so sample in grid-local coordinates
                const isInterior = Math.min(fx, 1 - fx, fy, 1 - fy) >= SMOOTH_RADIUS;
                const weights = isInterior
                    ? tileWeights
                    : _getTerrainWeights(_getBlendedTerrain(nodeGrid, cx - x1, cy - y1));

                // Spread every terrain's share evenly over the dots: golden ratio steps through
                // [0, 1) evenly, the per tile offset keeps tiles from repeating the same pattern
                const rank = (k * GOLDEN_RATIO + tileOffset) % 1;
                const terrain = _pickTerrain(weights, rank);
                if (!terrain) continue;

                const fillRadius = maxFillRadius * Math.min(1, Math.sqrt(terrain.base * DOT_BASE_SCALE) * terrain.scale);
                ctx.fillStyle = terrain.color;
                ctx.beginPath();
                ctx.arc(cx * tileSize, cy * tileSize, fillRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

/**
 * Arrange nodes (same depth, any order) into a grid matching gridBounds: nodeGrid[y][x],
 * where [0][0] is the tile at (gridBounds.x, gridBounds.y). Cells without a node are undefined.
 */
function _toNodeGrid(nodes: QuadNode[], gridBounds: GridBounds, tileSize: number): (QuadNode | undefined)[][] {
    const nodeGrid: (QuadNode | undefined)[][] = Array.from(
        { length: gridBounds.ySize },
        () => new Array<QuadNode | undefined>(gridBounds.xSize).fill(undefined),
    );

    for (const node of nodes) {
        const gridPoint = boundsToGridPoint(node.bounds, tileSize);
        const x = gridPoint.x - gridBounds.x;
        const y = gridPoint.y - gridBounds.y;
        if (x < 0 || y < 0 || x >= gridBounds.xSize || y >= gridBounds.ySize) {
            continue;
        }

        nodeGrid[y][x] = node;
    }

    return nodeGrid;
}

function _getGridNode(nodeGrid: NodeGrid, x: number, y: number): QuadNode | undefined {
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);
    return nodeGrid[tileY]?.[tileX];
}

function _getTerrainWeightsFromNode(node: QuadNode): TileDrawData[] {
    const tile = node.getTile();
    if (!tile) return [];

    return _getTerrainWeights(tile.terrain);
}

/**
 * Split the dots between the terrain types that are drawn as dots.
 * share - fraction of the dots drawn with this terrain (all shares sum to 1)
 * scale - radius multiplier compensating for the dots it doesn't get: area grows with radius²,
 *         so drawing on `share` of the dots needs 1 / share the area = √(1 / share) the radius.
 *         Total area then stays proportional to the terrain value.
 */
function _getTerrainWeights(terrains: TerrainSetting[]): TileDrawData[] {
    const selectedTerrain = terrains.filter((terrain) => !BASE_TERRAIN_TYPES.includes(terrain.type) && terrain.value > VALUE_THRESHOLD);
    const terrainSum = selectedTerrain.reduce((acc, terrain) => acc + terrain.value, 0);
    if (terrainSum <= 0) return [];

    return selectedTerrain.map((terrain) => {
        const share = terrain.value / terrainSum;

        return {
            share,
            scale: Math.sqrt(1 / share),
            base: terrain.value,
            color: config.getTile(terrain.type)?.meta?.color || '#000000',
        };
    });
}

/** Pick the terrain whose share range contains rank (0 <= rank < 1). */
function _pickTerrain(weights: TileDrawData[], rank: number): TileDrawData | undefined {
    let acc = 0;
    for (const weight of weights) {
        acc += weight.share;
        if (rank < acc) return weight;
    }

    return weights[weights.length - 1]; // Floating point - shares may sum to just below 1
}

const GOLDEN_RATIO = (Math.sqrt(5) - 1) / 2;

/** Stable pseudo random value in [0, 1) for a tile. */
function _hash(x: number, y: number): number {
    const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return h - Math.floor(h);
}

/**
 * How far (in tiles) a tile's terrain bleeds into its neighbours. Max 0.5 - beyond that
 * a neighbour would reach past the centre of the tile.
 */
const SMOOTH_RADIUS = 0.25; //0.5;

/**
 * Terrain values at a point, blended from the surrounding tiles (see SMOOTH_RADIUS).
 * Empty cells count as value 0 for every terrain type.
 */
function _getBlendedTerrain(nodeGrid: NodeGrid, x: number, y: number): TerrainSetting[] {
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);

    const fx = x - tileX;
    const fy = y - tileY;

    const weightedSums = new Map<string, number>();
    let weightSum = 0;

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            // Outside the grid (beyond the visible area) - unknown, so leave it out
            const row = nodeGrid[tileY + dy];
            if (!row || tileX + dx < 0 || tileX + dx >= row.length) continue;

            // Distance from the dot to the edge of this neighbour tile (0 for the dot's own tile)
            const distanceX = Math.max(dx - fx, 0, fx - (dx + 1));
            const distanceY = Math.max(dy - fy, 0, fy - (dy + 1));
            const distance = Math.hypot(distanceX, distanceY);

            // Full influence at the tile edge, fading linearly to none at SMOOTH_RADIUS
            const weight = Math.max(0, 1 - distance / SMOOTH_RADIUS);
            if (weight === 0) continue;

            // Empty cells (no node or no tile) add weight but no value, so terrain fades out towards them
            const terrains = row[tileX + dx]?.getTile()?.terrain ?? [];
            for (const terrain of terrains) {
                weightedSums.set(terrain.type, (weightedSums.get(terrain.type) ?? 0) + terrain.value * weight);
            }
            weightSum += weight;
        }
    }

    if (weightSum <= 0) return [];

    return [...weightedSums].map(([type, sum]) => ({ type, value: sum / weightSum }));
}




function _isWater(terrainSetting: TerrainSetting): boolean {
    return !!config.getTile(terrainSetting.type)?.tags.includes('water');
}

