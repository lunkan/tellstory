import { QUAD_TREE_ROOT_SIZE } from "../../../engine/world/quad-node-bounds";
import { DrawCommand, GridBounds } from "./types";

const LINE_COLOR: string = '#000000';

export class DrawGridCommand implements DrawCommand {
    private _bounds: GridBounds;
    private _scale: number;
    private _tileSize: number;

    constructor(bounds: GridBounds, scale: number, tileSize: number) {
        this._bounds = bounds;
        this._scale = scale;
        this._tileSize = tileSize;
    }

    public execute(ctx: CanvasRenderingContext2D): void {
        // Set line configuration
        ctx.strokeStyle = LINE_COLOR;
        //ctx.lineWidth = 1 / this._scale;

        const x1 = this._bounds.x;
        const x2 = this._bounds.x + this._bounds.xSize;
        const y1 = this._bounds.y;
        const y2 = this._bounds.y + this._bounds.ySize;

        // Draw vertical lines
        for (let x = x1; x <= x2; x++) { //this.numTiles; x++) {
            ctx.lineWidth = (2 - x % 2) / this._scale;
            ctx.beginPath();
            ctx.moveTo(x * this._tileSize, 0); //0);
            ctx.lineTo(x * this._tileSize, QUAD_TREE_ROOT_SIZE); //SIZE);
            ctx.stroke();
        }

        // Draw horizontal lines
        //for (let y = 0; y <= this.numTiles; y++) {
        for (let y = y1; y <= y2; y++) {
            ctx.lineWidth = (2 - y % 2) / this._scale;
            ctx.beginPath();
            //ctx.moveTo(0, y * this._tileSize);
            //ctx.lineTo(SIZE, y * this._tileSize);
            ctx.moveTo(0, y * this._tileSize);
            ctx.lineTo(QUAD_TREE_ROOT_SIZE, y * this._tileSize);
            ctx.stroke();
        }
    }
}