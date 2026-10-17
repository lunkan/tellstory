import { Tile } from "../../../../engine/world/tile";
import { config } from "../../../../engine/config/config";
import { TerrainSetting } from "../../../../engine/types";
import { GridBounds, GridRect } from "../types";
import { QuadNode } from "../../../../engine/world/quad-node";

type DrawTerrainOptions = {
    ctx: CanvasRenderingContext2D;
    gridBounds: GridBounds;
    scale: number;
    nodes: QuadNode[];
    tileSize: number;
}

export function drawTerrain(options: DrawTerrainOptions): void {
    const { ctx, gridBounds, scale, nodes, tileSize } = options;

    const nodeGrid = _toNodeGrid(nodes, gridBounds, tileSize);

    const x1 = gridBounds.x;
    const x2 = gridBounds.x + gridBounds.xSize;
    const y1 = gridBounds.y;
    const y2 = gridBounds.y + gridBounds.ySize;

    // Skewed (rotated) lattice that repeats exactly once per tile.
    // Lattice steps are (n, s) / N and (-s, n) / N with N = n² + s² - their combinations
    // n·(n, s) - s·(-s, n) = (N, 0) and s·(n, s) + n·(-s, n) = (0, N) are exactly one tile in x and y.
    // Within a tile that gives N points: x = (k·n mod N) / N, y = (k·s mod N) / N.
    // n and s must not share a common factor, otherwise only part of the lattice is drawn (gaps).
    const n = 8; // ~circles per tile side
    const s = 3; // Skew - the lattice is rotated atan(s / n), 3 ≈ 21°
    const N = n * n + s * s;
    const spacing = Math.sqrt(N) / N; // Distance between neighbouring circles, ≈ 1 / n
    const radius = (spacing / 2) * tileSize;

    ctx.strokeStyle = '#939393';
    ctx.lineWidth = 1 / scale;

    let currentNode: QuadNode | undefined;
    let currentTile: Tile | undefined;
    let fillRadius: number = 0;
    let fillColor: string = '#000';

    for (let tx = x1; tx < x2; tx++) {
        for (let ty = y1; ty < y2; ty++) {
            for (let k = 0; k < N; k++) {

                const cx = tx + ((k * n) % N) / N;
                const cy = ty + ((k * s) % N) / N;

                const node = nodeGrid[ty - y1]?.[tx - x1]; // Grid is relative to gridBounds, [0][0] = (x1, y1)
                if (node !== currentNode) {
                    currentNode = node;
                    currentTile = node?.getTile();
                    const forrest = currentTile?.getTerrain('forrest');
                    if (forrest) {
                        fillRadius = (forrest?.value || 0) * (spacing / 2) * tileSize;
                        fillColor = config.getTile('forrest')?.meta?.color || '#000000';
                    } else {
                        fillRadius = 0;
                        fillColor = '#000';
                    }
                }


                //node?.getTile()?.getTerrain('forrest')
                //console.log('node', !!node);

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


    // Draw vertical lines
    /*for (let x = x1; x <= x2; x++) {
        ctx.lineWidth = (2 - x % 2) / scale;
        ctx.beginPath();
        ctx.moveTo(x * tileSize, 0); //0);
        ctx.lineTo(x * tileSize, rootSize);
        ctx.stroke();
    }*/




    /*for (const node of nodes) {
        if (node && node.state !== QuadNode.STATE_EMPTY) {
            _drawTile(node.getTile(), {
                x: node.bounds.x,
                y: node.bounds.y,
                width: tileSize,
                height: tileSize,
            }, ctx);
        }
    }*/
}

function _drawTile(tile?: Tile, gridRect: GridRect, ctx: CanvasRenderingContext2D): void {
    if (!tile) {
        return;
    }

    tile.terrain.forEach((terrain) => {
        if (_isWater(terrain) || terrain.value < 0.1) {
            return;
        }
    });

    /*if (tile.isResolved) {
        ctx.fillStyle = '#ddd';
        ctx.beginPath();
        ctx.rect(gridRect.x, gridRect.y, gridRect.width, gridRect.height);
        ctx.fill();
        return;
    }*/

}

function _drawTerrain(): void {

}

/**
 * Arrange nodes (same depth, any order) into a grid matching gridBounds: nodeGrid[y][x],
 * where [0][0] is the tile at (gridBounds.x, gridBounds.y). Cells without a node are undefined.
 */
function _toNodeGrid(nodes: QuadNode[], gridBounds: GridBounds, tileSize: number): (QuadNode | undefined)[][] {
    const originX = gridBounds.x * tileSize;
    const originY = gridBounds.y * tileSize;

    const nodeGrid: (QuadNode | undefined)[][] = Array.from(
        { length: gridBounds.ySize },
        () => new Array<QuadNode | undefined>(gridBounds.xSize).fill(undefined),
    );

    for (const node of nodes) {
        const x = Math.round((node.bounds.x - originX) / tileSize);
        const y = Math.round((node.bounds.y - originY) / tileSize);
        if (x < 0 || y < 0 || x >= gridBounds.xSize || y >= gridBounds.ySize) {
            continue;
        }

        nodeGrid[y][x] = node;
    }

    return nodeGrid;
}

function _isWater(terrainSetting: TerrainSetting): boolean {
    return !!config.getTile(terrainSetting.type)?.tags.includes('water');
}

