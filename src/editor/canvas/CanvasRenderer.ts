import { QuadNode } from "../../../engine/world/quad-node";
import { OverlayRenderer } from "./OverlayRenderer";
import { World } from '../../../engine/world/world';
import { hydrate } from "../../../engine/world/hydrator/hydrate";
import { drawTiles } from "./commands/drawTiles";
import { drawMarkers } from "./commands/drawMarkers";
import { GridBounds, GridPoint, TileCoordinate } from "./types";
import { drawGrid } from "./commands/drawGrid";
import { CanvasMatrix } from "./CanvasMatrix";

export class CanvasRenderer {
    public readonly canvas: HTMLCanvasElement;
    public readonly overlay: OverlayRenderer;
    public readonly world: World;

    private _activeTile?: TileCoordinate | null;
    private _refreshRequest: number | undefined;

    public get scale(): number {
        return this._matrix.scale;
    }

    public get width(): number {
        return this._matrix.width;
    }

    public get height(): number {
        return this._matrix.height;
    }

    private _matrix: CanvasMatrix = new CanvasMatrix();
    private _layers: Map<string, HTMLCanvasElement> = new Map();
    private _ctx: CanvasRenderingContext2D;

    constructor(world: World, canvas: HTMLCanvasElement, overlay: HTMLCanvasElement) {
        this.world = world;
        this.canvas = canvas;
        this.overlay = new OverlayRenderer(overlay);

        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw Error('No CTX');
        }

        this._ctx = ctx;

        this._layers.set('grid', document.createElement("canvas"));
        this._layers.set('lockedTiles', document.createElement("canvas"));
        this._layers.set('editableLeafTiles', document.createElement("canvas"));
        this._layers.set('generatedTiles', document.createElement("canvas"));
        this._layers.set('markers', document.createElement("canvas"));
    }

    public getDepth(): number {
        return this._matrix.depth;
    }

    public setDepth(value: number): void {
        this._matrix.setDepth(value);
        this._invalidatTransform();
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
    }

    public getViewPointFromNode(node: QuadNode): DOMPoint {
        return this._matrix.getViewPointFromNode(node);
    }

    public getGridPoint(viewportPoint: DOMPoint): GridPoint {
        return this._matrix.getGridPoint(viewportPoint);
    }

    public getNodeFromPoint(viewportPoint: DOMPoint): QuadNode | null {
        const gridPoint = this._matrix.getGridPoint(viewportPoint);
        if (!this._matrix.gridPointInBounds(gridPoint)) {
            return null;
        }

        return this.world.quadtree.findByPoint({
            x: gridPoint.x,
            y: gridPoint.y,
            z: this._matrix.depth,
        }, true) || null;
    }

    public getTileFromPoint(viewportPoint: DOMPoint): TileCoordinate | null {
        return this._matrix.getTileFromPoint(viewportPoint);
    }

    public setViewport(width: number, height: number): void {
        this._matrix.setSize(width, height);
        this.overlay.setViewport(width, height);

        this.canvas.width = width;
        this.canvas.height = height;

        this._invalidatTransform();
    }

    public zoom(zoomDelta: number, x: number, y: number): void {
        this._matrix.zoom(zoomDelta, x, y);
        this._invalidatTransform();
    }

    public move(deltaX: number, deltaY: number): void {
        this._matrix.move(deltaX, deltaY);
        this._invalidatTransform();
    }

    public refresh(): void {
        this._invalidatTransform();
    }

    public clear(): void {
        const ctx = this.canvas.getContext('2d');
        if (ctx) {
            ctx?.clearRect(0, 0, this._matrix.width, this._matrix.height);
        }

        for (const layer of this._layers.values()) {
            const ctx = layer.getContext('2d');
            ctx!.setTransform(1, 0, 0, 1, 0, 0);
            ctx!.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    private _draw(): void {
        // set canvas size from matrix?

        // Update layer transformMtx
        for (const layer of this._layers.values()) {
            layer.width = this._matrix.width;
            layer.height = this._matrix.height;
            layer.getContext('2d')!.setTransform(this._matrix.transformMtx);
        }

        const tileSize = this._matrix.getTileSize();
        const gridBounds = this._matrix.visibleTiles();

        const gridLayer = this._layers.get('grid')!;

        drawGrid({
            ctx: gridLayer.getContext('2d')!,
            gridBounds,
            scale: this._matrix.scale,
            tileSize
        });

        const visibleNodes = this._getVisibleNodes(gridBounds);
        const lockedLayer = this._layers.get('lockedTiles')!;
        drawTiles({
            ctx: lockedLayer.getContext('2d')!,
            nodes: visibleNodes.filter((node) => node.isLocked()),
            tileSize
        });

        const editableLeafLayer = this._layers.get('editableLeafTiles')!;
        drawTiles({
            ctx: editableLeafLayer.getContext('2d')!,
            nodes: visibleNodes.filter((node) => node.isEditableLeaf()),
            tileSize
        });

        const generatedLayer = this._layers.get('generatedTiles')!;
        drawTiles({
            ctx: generatedLayer.getContext('2d')!,
            nodes: visibleNodes.filter((node) => node.isGenerated()),
            tileSize
        });

        const markerLayer = this._layers.get('markers')!;
        drawMarkers({
            ctx: markerLayer.getContext('2d')!,
            markers: visibleNodes.flatMap((node) => this.world.getMarkersFromNode(node))
        });

        this._ctx.drawImage(editableLeafLayer, 0, 0);

        this._ctx.save();
        this._ctx.filter = 'grayscale(0.5)';
        this._ctx.drawImage(lockedLayer, 0, 0);
        this._ctx.restore();

        this._ctx.save();
        this._ctx.globalAlpha = 0.5;
        this._ctx.drawImage(generatedLayer, 0, 0);
        this._ctx.restore();

        this._ctx.drawImage(markerLayer, 0, 0);
        this._ctx.drawImage(gridLayer, 0, 0);
    }

    private _getVisibleNodes(gridBounds: GridBounds): QuadNode[] {
        const tileSize = this._matrix.getTileSize();
        const visibleNodes: QuadNode[] = [];

        for (let x = gridBounds.x; x < gridBounds.x + gridBounds.xSize; x++) {
            for (let y = gridBounds.y; y < gridBounds.y + gridBounds.ySize; y++) {
                const node = this.world.quadtree.findByPoint({
                    x: x * tileSize,
                    y: y * tileSize,
                    z: this._matrix.depth,
                }, true);

                if (node) {
                    hydrate(node); //Make sure it's hydrated
                    visibleNodes.push(node);
                }
            }
        }

        return visibleNodes;
    }

    private _invalidatTransform(): void {
        this.clear();

        if (this._refreshRequest) {
            cancelAnimationFrame(this._refreshRequest);
        }

        this._refreshRequest = requestAnimationFrame(() => {
            this._draw();
            this._refreshRequest = undefined;
        });
    }
}