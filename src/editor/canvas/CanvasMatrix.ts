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
import { GridBounds, GridPoint, GridRect, TileCoordinate } from "./types";

const SIZE: number = QUAD_TREE_ROOT_SIZE;

export class CanvasMatrix {
    private _level: number = 5; // Based on scale
    private _scale: number = 0.5; // 100 x 10 = 1000px
    private _width: number = 0;
    private _height: number = 0;
    private _x: number = 0;
    private _y: number = 0;

    public get scale(): number {
        return this._scale;
    }

    public get width(): number {
        return this._width;
    }

    public get height(): number {
        return this._height;
    }

    public get depth(): number {
        return this._level;
    }

    public get transformMtx(): DOMMatrix {
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

    public setSize(width: number, height: number): void {
        this._width = width;
        this._height = height;
    }

    public setDepth(value: number): void {
        this._level = Math.max(5, Math.min(value, 12));
    }

    public zoom(zoomDelta: number, x: number, y: number): void {
        // x, y are the cursor position relative to the viewport center.
        // Keep the grid point under the cursor fixed while scaling: solving
        // the transform for the anchor point gives
        //   _x' - _x = -delta * (x - _x) / scale
        // Compute delta from the clamped scale so it matches the real change.
        const newScale = Math.max(0.1, this._scale + zoomDelta);
        const delta = newScale - this._scale;

        this._x += -delta * (x - this._x) / this._scale;
        this._y += -delta * (y - this._y) / this._scale;
        this._scale = newScale;
    }

    public move(deltaX: number, deltaY: number): void {
        this._x += deltaX;
        this._y += deltaY;
    }

    public getTileSize(): number {
        const numTiles = this._level === 0 ? 1 : Math.pow(2, this._level);
        return (SIZE / numTiles);
    }

    public getViewPointFromNode(node: QuadNode): DOMPoint {
        const gridPoint = node.getCenterPoint();
        const transform = this.transformMtx;
        return new DOMPoint(gridPoint.x, gridPoint.y).matrixTransform(transform);
    }

    public getGridPoint(viewportPoint: DOMPoint): GridPoint {
        const transform = this.transformMtx;
        const inverse = transform.inverse();
        const gridPoint = viewportPoint.matrixTransform(inverse);
        return { x: gridPoint.x, y: gridPoint.y };
    }

    public getTileFromPoint(viewportPoint: DOMPoint): TileCoordinate | null {
        const gridPoint = this.getGridPoint(viewportPoint);
        if (!this.gridPointInBounds(gridPoint)) {
            return null;
        }

        const tileSize = this.getTileSize();
        const tileX = Math.floor(gridPoint.x / tileSize);
        const tileY = Math.floor(gridPoint.y / tileSize);

        return {
            z: this._level,
            x: tileX,
            y: tileY
        };
    }

    public visibleTiles(): GridBounds {
        const tileSize = this.getTileSize();
        const visibleGridRect = this._visibleGridRect();
        const x = Math.floor(visibleGridRect.x / tileSize);
        const y = Math.floor(visibleGridRect.y / tileSize);
        // Derive the count from the floored start and ceiled end so the
        // fractional tile lost to Math.floor(x/y) is still covered.
        const xEnd = Math.ceil((visibleGridRect.x + visibleGridRect.width) / tileSize);
        const yEnd = Math.ceil((visibleGridRect.y + visibleGridRect.height) / tileSize);
        const xSize = xEnd - x;
        const ySize = yEnd - y;

        return {
            x,
            y,
            xSize,
            ySize,
        };
    }

    public gridPointInBounds(point: GridPoint): boolean {
        if (point.x < 0 || point.x > SIZE) {
            return false;
        } else if (point.y < 0 || point.x > SIZE) {
            return false;
        }

        return true;
    }

    private _visibleGridRect(): GridRect {
        const topLeft = this.getGridPoint(new DOMPoint(0, 0));
        const bottomRight = this.getGridPoint(new DOMPoint(this.width, this.height));

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
}