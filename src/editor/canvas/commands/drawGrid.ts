import { QUAD_TREE_ROOT_SIZE } from "../../../../engine/world/quad-node-bounds";
import { GridBounds } from "../types";

const LINE_COLOR: string = '#333333'; //#000000';

type DrawGridOptions = {
    ctx: CanvasRenderingContext2D;
    gridBounds: GridBounds;
    scale: number;
    tileSize: number;
}

export function drawGrid(options: DrawGridOptions) {
    const { ctx, gridBounds, scale, tileSize } = options;

    // Set line configuration
    ctx.strokeStyle = LINE_COLOR;

    const x1 = gridBounds.x;
    const x2 = gridBounds.x + gridBounds.xSize;
    const y1 = gridBounds.y;
    const y2 = gridBounds.y + gridBounds.ySize;

    // Draw vertical lines
    for (let x = x1; x <= x2; x++) {
        ctx.lineWidth = (2 - x % 2) / scale;
        ctx.beginPath();
        ctx.moveTo(x * tileSize, 0); //0);
        ctx.lineTo(x * tileSize, QUAD_TREE_ROOT_SIZE); //SIZE);
        ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = y1; y <= y2; y++) {
        ctx.lineWidth = (2 - y % 2) / scale;
        ctx.beginPath();
        ctx.moveTo(0, y * tileSize);
        ctx.lineTo(QUAD_TREE_ROOT_SIZE, y * tileSize);
        ctx.stroke();
    }
}
