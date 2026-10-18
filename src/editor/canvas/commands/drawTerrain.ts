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

    const fillColor: string = config.getTile('forrest')?.meta?.color || '#000000';
    const maxFillRadius = (spacing / 2) * tileSize;

    for (let tx = x1; tx < x2; tx++) {
        for (let ty = y1; ty < y2; ty++) {
            for (let k = 0; k < N; k++) {

                const cx = tx + (((k * n) % N) / N + 0.5) % 1;
                const cy = ty + (((k * s) % N) / N + 0.5) % 1;

                // nodeGrid is relative to gridBounds, so sample in grid-local coordinates
                const fillRadius = _getTerrainValue(nodeGrid, cx - x1, cy - y1) * maxFillRadius;

                ctx.beginPath();
                ctx.arc(cx * tileSize, cy * tileSize, radius, 0, Math.PI * 2);
                ctx.stroke();

                if (fillRadius) {
                    ctx.fillStyle = fillColor;
                    ctx.beginPath();
                    ctx.arc(cx * tileSize, cy * tileSize, fillRadius, 0, Math.PI * 2);
                    ctx.fill();
                }
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

/**
 * How far (in tiles) a tile's terrain bleeds into its neighbours. Max 0.5 - beyond that
 * a neighbour would reach past the centre of the tile.
 */
const SMOOTH_RADIUS = 0.25; //0.5;

function _getTerrainValue(nodeGrid: NodeGrid, x: number, y: number, terrain = "forrest") {
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);

    const fx = x - tileX;
    const fy = y - tileY;

    let weightedSum = 0;
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

            // Empty cells (no node or no tile) count as value 0, so terrain fades out towards them
            const value = row[tileX + dx]?.getTile()?.getTerrain(terrain)?.value ?? 0;

            weightedSum += value * weight;
            weightSum += weight;
        }
    }

    return weightSum > 0 ? weightedSum / weightSum : 0;
}




function _isWater(terrainSetting: TerrainSetting): boolean {
    return !!config.getTile(terrainSetting.type)?.tags.includes('water');
}

