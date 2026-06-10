/*
0: 320km    1
1: 160km    2
2: 80km     4
3: 40km     8
4: 20km     16
5: 10km     32 *
6: 5km      64
7: 2,5km    128
8: 1,25km   256
9: 625m    512
10: 312m    1024
11: 156m    2048
12: 78m     4096

2^12 = 4096x4096
*/

import { QuadNode } from "../../../engine/world/quad-node";
import { QUAD_TREE_ROOT_SIZE } from "../../../engine/world/quad-node-bounds";
import { OverlayRenderer } from "./OverlayRenderer";
import { TileRenderer } from './TileRenderer';

const SIZE: number = QUAD_TREE_ROOT_SIZE;

const LINE_COLOR: string = '#000000';

export type GridPoint = {
    x: number;
    y: number;
}

export type GridRect = {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type TileCoordinate = {
    x: number;
    y: number;
    z: number;
}

export type TileRect = {
    x: number;
    y: number;
    xSize: number;
    ySize: number;
}

export class CanvasRenderer {
    public readonly canvas: HTMLCanvasElement;
    public readonly overlay: OverlayRenderer;

    private _level: number = 5; // Based on scale
    private _scale: number = 0.5; // 100 x 10 = 1000px
    private _x: number = 0;
    private _y: number = 0;

    private _activeTile?: TileCoordinate | null;
    private _refreshRequest: number | undefined;
    private _quadTreeRoot: QuadNode;

    private get numTiles(): number {
        return this._level === 0 ? 1 : Math.pow(2, this._level);
    }

    private get tileSize(): number {
        return (SIZE / this.numTiles);
    }

    private get _transformMtx(): DOMMatrix {
        const viewportOffsetX = this.width / 2;
        const viewportOffsetY = this.height / 2;
        const gridOffsetX = (SIZE * this._scale) / 2;
        const gridOffsetY = (SIZE * this._scale) / 2;
        const tx = this._x + viewportOffsetX - gridOffsetX;
        const ty = this._y + viewportOffsetY - gridOffsetY;

        return new DOMMatrix([
            this._scale,
            0,
            0,
            this._scale,
            tx,
            ty,
        ]);
    }

    private get _ctx(): CanvasRenderingContext2D {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw Error('No CTX');
        }

        /*const viewportOffsetX = this.width / 2;
        const viewportOffsetY = this.height / 2;
        const gridOffsetX = (SIZE * this._scale) / 2;
        const gridOffsetY = (SIZE * this._scale) / 2;
        const tx = this._x + viewportOffsetX - gridOffsetX;
        const ty = this._y + viewportOffsetY - gridOffsetY;*/

        //ctx.setTransform(this._scale, 0, 0, this._scale, tx, ty);
        ctx.setTransform(this._transformMtx);
        return ctx;
    }

    public get width(): number {
        return this.canvas.width;
    }

    public get height(): number {
        return this.canvas.height;
    }

    constructor(quadTreeRoot: QuadNode, canvas: HTMLCanvasElement, overlay: HTMLCanvasElement) {
        this._quadTreeRoot = quadTreeRoot;
        this.canvas = canvas;
        this.overlay = new OverlayRenderer(overlay);
    }

    public setLine(lineId: string, p1: DOMPoint, p2: DOMPoint, color: string, dash: number[]): void {
        this.overlay.setLine(lineId, p1, p2, color, dash);
    }

    public clearLine(lineId: string): void {
        this.overlay.clearLine(lineId);
    }

    public setActiveTile(viewportPoint: DOMPoint | null): void {
        if (!viewportPoint) {
            this._activeTile = null;
        } else {
            const tile = this.getTileFromPoint(viewportPoint);
            if (tile !== this._activeTile) {
                 this._activeTile = tile;
            } else {
                return;
            }
        }
        
        this._invalidatTransform();
        //this.refresh();
    }

    public getViewPointFromNode(node: QuadNode): DOMPoint {
        const gridPoint = node.getCenterPoint();
        const transform = this._ctx.getTransform();
        return new DOMPoint(gridPoint.x, gridPoint.y).matrixTransform(transform);
    }

    public getNodeFromPoint(viewportPoint: DOMPoint): QuadNode | null {
        const gridPoint = this._getGridPoint(viewportPoint);
        if (!this._gridPointInBounds(gridPoint)) {
            return null;
        }
        
        return this._quadTreeRoot.findByPoint({
            x: gridPoint.x,
            y: gridPoint.y,
            z: this._level,
        }, true) || null;
    }

    public getTileFromPoint(viewportPoint: DOMPoint): TileCoordinate | null {
        const gridPoint = this._getGridPoint(viewportPoint);
        if (!this._gridPointInBounds(gridPoint)) {
            return null;
        }

        const tileX = Math.floor(gridPoint.x / this.tileSize);
        const tileY = Math.floor(gridPoint.y / this.tileSize);
        
        return {
            z: this._level,
            x: tileX,
            y: tileY
        };
    }

    public setViewport(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;
        this.overlay.setViewport(width, height);
        this._invalidatTransform();
    }

    public zoom(zoomDelta: number, x: number, y: number): void {
        // Needs love
        const x1 = x / this._scale;
        const x2 = x / (this._scale + zoomDelta);
        const x3 = x2 - x1;

        const y1 = y / this._scale;
        const y2 = y / (this._scale + zoomDelta);
        const y3 = y2 - y1;

        //const scaleDelta = ((this._scale + zoomDelta) / this._scale) - 1;
        const tx = x3; //x * scaleDelta;
        const ty = y3; //y * scaleDelta;

        this._scale = Math.max(0.1, this._scale + zoomDelta);
        this._x += tx;
        this._y += ty;

        this._invalidatTransform();
    }

    public move(deltaX: number, deltaY: number): void {
        this._x += deltaX;
        this._y += deltaY;
        this._invalidatTransform();
    }

    public refresh(): void {
        //this.clear();
        //this.overlay.clear();
        this._invalidatTransform();
    }

    public clear(): void {
        const ctx = this.canvas.getContext('2d');
        if (ctx) {
            ctx?.setTransform(1, 0, 0, 1, 0, 0);
            ctx?.clearRect(0, 0, this.width, this.height);
            this._drawGrid();
            this._drawActiveTile();
        }
    }

    private _draw(): void {
        this._drawTiles();
        this._drawGrid();
        this._drawActiveTile();
    }

    private _drawGrid(): void {
        // Set line configuration
        this._ctx.strokeStyle = LINE_COLOR;
        this._ctx.lineWidth = 1 / this._scale;

        // Draw vertical lines
        for (let x = 0; x <= this.numTiles; x++) {
            this._ctx.beginPath();
            this._ctx.moveTo(x * this.tileSize, 0);
            this._ctx.lineTo(x * this.tileSize, SIZE);
            this._ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y <= this.numTiles; y++) {
            this._ctx.beginPath();
            this._ctx.moveTo(0, y * this.tileSize);
            this._ctx.lineTo(SIZE, y * this.tileSize);
            this._ctx.stroke();
        }
    }

    private _drawActiveTile(): void {
        if (!this._activeTile) {
            return;
        }

        const gridRect = this._gridRectfromTile(this._activeTile);
        this._ctx.strokeStyle = LINE_COLOR;
        this._ctx.lineWidth = 3 / this._scale;

        this._ctx.beginPath(); // Start a new path
        this._ctx.rect(gridRect.x, gridRect.y, gridRect.width, gridRect.height); // Add a rectangle to the current path
        this._ctx.stroke(); // Render the path
    }

    private _drawTiles(): void {
        const tileRenderer = new TileRenderer(this._ctx);
        const visibleTiles = this._visibleTiles();

        for (let x = visibleTiles.x; x < visibleTiles.x + visibleTiles.xSize; x++) {
            for (let y = visibleTiles.y; y < visibleTiles.y + visibleTiles.ySize; y++) {
                const node = this._quadTreeRoot.findByPoint({
                    x: x * this.tileSize,
                    y: y * this.tileSize,
                    z: this._level,
                }, true);
                
                if (node && node.tile) {
                    const gridRect = this._getGridRectFromNode(node);
                    tileRenderer.draw(node.tile, gridRect);
                }
            }
        }
    }

    private _getGridRectFromNode(node: QuadNode) {
        const tileMod = SIZE / this.numTiles;
        const tileX = node.bounds.x / tileMod;
        const tileY = node.bounds.y / tileMod;
        return this._gridRectfromTile({ x: tileX, y: tileY, z: this._level });
    }

    private _getGridPoint(viewportPoint: DOMPoint): GridPoint {
        const transform = this._ctx.getTransform();
        const inverse = transform.inverse();
        const gridPoint = viewportPoint.matrixTransform(inverse);
        return { x: gridPoint.x, y: gridPoint.y };
    }

    private _gridPointInBounds(point: GridPoint): boolean {
        if (point.x < 0 || point.x > SIZE) {
            return false;
        } else if (point.y < 0 || point.x > SIZE) {
            return false;
        }

        return true;
    }

    private _gridRectfromTile(tile: TileCoordinate): GridRect {
        return {
            x: tile.x * this.tileSize,
            y: tile.y * this.tileSize,
            width: this.tileSize,
            height: this.tileSize,
        };
    }

    private _visibleGridRect(): GridRect {
        const topLeft = this._getGridPoint(new DOMPoint(0, 0));
        const bottomRight = this._getGridPoint(new DOMPoint(this.width, this.height));

        const x = Math.max(0, topLeft.x);
        const y = Math.max(0, topLeft.y);
        const width = Math.min(SIZE, bottomRight.x) - x;
        const height = Math.min(SIZE, bottomRight.y) - y;

        return {
            x,
            y,
            width,
            height,
        };
    }

    private _visibleTiles(): TileRect {
        const visibleGridRect = this._visibleGridRect();
        const x = Math.floor(visibleGridRect.x / this.tileSize);
        const y = Math.floor(visibleGridRect.y / this.tileSize);
        const xSize = Math.ceil(visibleGridRect.width / this.tileSize);
        const ySize = Math.ceil(visibleGridRect.height / this.tileSize);

        return {
            x,
            y,
            xSize,
            ySize,
        };
    }

    private _invalidatTransform(): void {
        this.clear();
        //this.overlay.setTransformMtx(this._transformMtx);

        if (this._refreshRequest) {
            cancelAnimationFrame(this._refreshRequest);
        }

        this._refreshRequest = requestAnimationFrame(() => {
            this._draw();
            this._refreshRequest = undefined;
        });
    }
}