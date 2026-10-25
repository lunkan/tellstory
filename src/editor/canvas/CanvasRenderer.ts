import { QuadNode, QuadNodeEventData } from "../../../engine/world/quad-node";
import { OverlayRenderer } from "./OverlayRenderer";
import { World } from '../../../engine/world/world';
import { GridBounds, GridPoint, TileCoordinate } from "./types";
import { drawGrid } from "./commands/drawGrid";
import { CanvasMatrix } from "./CanvasMatrix";
import { drawSelectedTile } from "./commands/drawSelectedTile";
import { drawObjects } from "./commands/drawObjects";
import { drawVectors } from "./commands/drawVectors";
import { LEAF_SIZE_METER } from "../../../engine/world/scale";
import { drawElevation } from "./commands/drawElevation";
import { drawTerrain } from "./commands/drawTerrain";
import { drawPlainTiles } from "./commands/drawPlainTiles";
import { drawShapes } from "./commands/drawShapes";

export type RenderMode = 'plain' | 'map';

/** What caused the map to be re-rendered. `data` is a quad tree change, `refresh` an explicit request. */
export type RenderTrigger = 'move' | 'zoom' | 'depth' | 'resize' | 'refresh' | 'data';

export type RenderRequest = {
    trigger: RenderTrigger;
    /** Visible tiles at `depth`, in tile units. */
    gridBounds: GridBounds;
    depth: number;
};

export type RenderSubscriber = (request: RenderRequest) => void;

type CanvasRendererOptions = {
    world: World;
    canvas: HTMLCanvasElement;
    overlay: HTMLCanvasElement;
    renderMode: RenderMode;
    initalZoom: number;
}

export class CanvasRenderer {
    public readonly canvas: HTMLCanvasElement;
    public readonly overlay: OverlayRenderer;
    public readonly world: World;

    private _activeTile?: TileCoordinate | null;
    private _invalid: boolean = false;
    private _refreshRequest: number | undefined;
    private _subscribers: RenderSubscriber[] = [];

    public get scale(): number {
        return this._matrix.scale;
    }

    public get width(): number {
        return this._matrix.width;
    }

    public get height(): number {
        return this._matrix.height;
    }

    private _renderMode: RenderMode; // = 'map';
    private _matrix: CanvasMatrix;
    private _layers: Map<string, HTMLCanvasElement> = new Map();
    private _ctx: CanvasRenderingContext2D;

    constructor(options: CanvasRendererOptions) { //world: World, canvas: HTMLCanvasElement, overlay: HTMLCanvasElement) {
        const { world, canvas, overlay, renderMode, initalZoom } = options;

        this.world = world;
        this.world.quadtree.subscribe(QuadNode.EVENT_DATA_CHANGE, this._onQuadTreeChange.bind(this));

        this._renderMode = renderMode || 'map';
        this._matrix = new CanvasMatrix(world.quadtree.maxDepth);
        this._matrix.zoom(initalZoom, 0, 0);

        this.canvas = canvas;
        this.overlay = new OverlayRenderer(overlay);

        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw Error('No CTX');
        }

        this._ctx = ctx;

        this._layers.set('elevation', document.createElement("canvas"));
        this._layers.set('grid', document.createElement("canvas"));
        this._layers.set('lockedTiles', document.createElement("canvas"));
        this._layers.set('editableLeafTiles', document.createElement("canvas"));
        this._layers.set('generatedTiles', document.createElement("canvas"));
        this._layers.set('markers', document.createElement("canvas"));
        this._layers.set('vectors', document.createElement("canvas"));
        this._layers.set('sea', document.createElement("canvas"));
        this._layers.set('selectedTile', document.createElement("canvas"));
    }

    public dispose(): void {
        // Cleanup on destroy - implement later
    }

    /** Called whenever the visible area or its data changes. Returns an unsubscribe function. */
    public subscribe(subscriber: RenderSubscriber): () => void {
        this._subscribers.push(subscriber);
        return () => {
            this._subscribers = this._subscribers.filter((s) => s !== subscriber);
        };
    }

    public setRenderMode(renderMode: RenderMode): void {
        this._renderMode = renderMode;
        this._invalidatTransform();
    }

    public getDepth(): number {
        return this._matrix.depth;
    }

    // depth vs scale vs zoom
    public getScale(): number {
        return this.world.maxZoomDepth - this.getDepth();
    }

    /** Shallowest depth this world zooms out to. */
    public get minDepth(): number {
        return this._matrix.minDepth;
    }

    public setDepth(value: number): void {
        this._matrix.setDepth(value);
        this._invalidatTransform('depth');
    }

    public setLine(lineId: string, p1: DOMPoint, p2: DOMPoint, color: string, dash: number[], showLine: boolean = true, radius: number = 5): void {
        this.overlay.setLine(lineId, p1, p2, color, dash, showLine, radius);
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

    public getViewSizeFromNode(node: QuadNode): number {
        return node.bounds.size * this._matrix.transformMtx.a;
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

        this._invalidatTransform('resize');
    }

    public zoom(zoomDelta: number, x: number, y: number): void {
        this._matrix.zoom(zoomDelta, x, y);
        this._invalidatTransform('zoom');
    }

    public move(deltaX: number, deltaY: number): void {
        this._matrix.move(deltaX, deltaY);
        this._invalidatTransform('move');
    }

    public refresh(): void {
        this._invalidatTransform('refresh');
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
        // The viewport size arrives from the ResizeObserver, which reports after
        // the first animation frame. Until then there is nothing to draw, and
        // zero-sized layer canvases would make drawImage throw.
        if (this._matrix.width === 0 || this._matrix.height === 0) {
            return;
        }

        // Update layer transformMtx
        for (const layer of this._layers.values()) {
            layer.width = this._matrix.width;
            layer.height = this._matrix.height;
            layer.getContext('2d')!.setTransform(this._matrix.transformMtx);
        }

        const tileSize = this._matrix.getTileSize();
        const gridBounds = this._matrix.visibleTiles();

        const visibleNodes = this._getVisibleNodes(gridBounds);

        let elevationLayer, lockedLayer, editableLeafLayer, generatedLayer;

        if (this._renderMode === 'plain') {
            // Paint all white
            elevationLayer = this._layers.get('elevation')!;
            drawPlainTiles({
                ctx: elevationLayer.getContext('2d')!,
                tileSize,
                nodes: visibleNodes,
            });

        } /*else if (this.getScale() <= 1) {
            // Paint all white
            const ctx = this.canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#ddd';
                ctx.beginPath();
                ctx.rect(0, 0, this._matrix.width, this._matrix.height);
                ctx.fill();
            }
        }*/ else {
            //drawPlainTiles

            elevationLayer = this._layers.get('elevation')!;
            drawElevation({
                ctx: elevationLayer.getContext('2d')!,
                seaCtx: this._layers.get('sea')!.getContext('2d')!,
                gridBounds,
                tileSize,
                nodes: visibleNodes,
            });

            lockedLayer = this._layers.get('lockedTiles')!;
            drawTerrain({
                ctx: lockedLayer.getContext('2d')!,
                gridBounds,
                scale: this._matrix.scale,
                nodes: visibleNodes, //visibleNodes.filter((node) => node.state & QuadNode.STATE_LOCKED),
                tileSize
            });

            /*lockedLayer = this._layers.get('lockedTiles')!;
            drawTiles({
                ctx: lockedLayer.getContext('2d')!,
                nodes: visibleNodes.filter((node) => node.state & QuadNode.STATE_LOCKED),
                tileSize
            });

            editableLeafLayer = this._layers.get('editableLeafTiles')!;
            drawTiles({
                ctx: editableLeafLayer.getContext('2d')!,
                nodes: visibleNodes.filter((node) => (node.state & (QuadNode.STATE_LOCKED | QuadNode.STATE_DETACHED)) === QuadNode.STATE_DETACHED), //.isEditableLeaf()),
                tileSize
            });

            generatedLayer = this._layers.get('generatedTiles')!;
            drawTiles({
                ctx: generatedLayer.getContext('2d')!,
                nodes: visibleNodes.filter((node) => node.state === QuadNode.STATE_HYDRATED), //node.isGenerated()),
                tileSize
            });*/
        }

        const gridLayer = this._layers.get('grid')!;
        drawGrid({
            ctx: gridLayer.getContext('2d')!,
            gridBounds,
            scale: this._matrix.scale,
            tileSize,
            rootSize: this.world.quadtree.bounds.size,
        });

        //const test = this._matrix.getTileSize() / LEAF_SIZE_METER;

        //const gx = xMeter / LEAF_SIZE_METER;
        //const gy = yMeter / LEAF_SIZE_METER;
        //ctx.fillRect(gx, gy, widthMeter / LEAF_SIZE_METER, heightMeter / LEAF_SIZE_METER);

        const markerLayer = this._layers.get('markers')!;

        //const visibleObjects =  this._getVisibleMapObjects(gridBounds);
        const allVisibleNodes = this._getAllVisibleNodes(gridBounds);

        drawVectors({
            ctx: this._layers.get('vectors')!.getContext('2d')!,
            nodes: allVisibleNodes,
            depth: this._matrix.depth,
        });

        if (this.getScale() <= 1) {
            // The layer ctx draws in grid units (1 unit = 1 leaf), the transform handles zoom.
            drawShapes({
                ctx: markerLayer.getContext('2d')!,
                nodes: allVisibleNodes,
                scale: 1 / LEAF_SIZE_METER,
            });
        } else {
            // All markers from all layers
            /*let depth = this._matrix.depth;
            const nodes: QuadNode[] = [];
            while (depth > 0) {
                const nodesByDepth: QuadNode[] = this.world.findNodesByRect({
                    x: gridBounds.x * tileSize,
                    y: gridBounds.y * tileSize,
                    width: gridBounds.xSize * tileSize,
                    height: gridBounds.ySize * tileSize,
                    z: depth,
                });

                nodes.push(...nodesByDepth);
                depth--;
            }*/

            /*drawMarkers({
                ctx: markerLayer.getContext('2d')!,
                nodes: allVisibleNodes,
                scale: 1 / LEAF_SIZE_METER,
                //nodes,
            });*/

            drawObjects({
                ctx: markerLayer.getContext('2d')!,
                nodes: allVisibleNodes,
                depth: this._matrix.depth,
                scale: 1 / LEAF_SIZE_METER,
            });
        }

        const selectedTileLayer = this._layers.get('selectedTile')!;
        drawSelectedTile({
            ctx: selectedTileLayer.getContext('2d')!,
            selectedTile: this._activeTile,
            tileSize,
        });

        if (elevationLayer) {
            this._ctx.drawImage(elevationLayer, 0, 0);
        }

        if (editableLeafLayer) {
            this._ctx.drawImage(editableLeafLayer, 0, 0);
        }

        if (lockedLayer) {
            this._ctx.save();
            this._ctx.filter = 'grayscale(0.5)';
            this._ctx.drawImage(lockedLayer, 0, 0);
            this._ctx.restore();
        }

        if (generatedLayer) {
            this._ctx.save();
            this._ctx.globalAlpha = 0.5;
            this._ctx.drawImage(generatedLayer, 0, 0);
            this._ctx.restore();
        }

        // Vectors are under the sea, so they stop at the shore. Grid and markers stay on top.
        this._ctx.drawImage(this._layers.get('vectors')!, 0, 0);
        this._ctx.drawImage(this._layers.get('sea')!, 0, 0);
        this._ctx.drawImage(gridLayer, 0, 0);
        this._ctx.drawImage(markerLayer, 0, 0);
        this._ctx.drawImage(selectedTileLayer, 0, 0);
    }

    private _getAllVisibleNodes(gridBounds: GridBounds): QuadNode[] {
        const tileSize = this._matrix.getTileSize();
        return this.world.quadtree.findByRect({
            x: gridBounds.x * tileSize,
            y: gridBounds.y * tileSize,
            width: gridBounds.xSize * tileSize,
            height: gridBounds.ySize * tileSize,
            z: this._matrix.depth,
        }, {
            selectAllDepth: true,
        });
    }

    /*private _getVisibleMapObjects(gridBounds: GridBounds): TileMapObject[] {
        const tileSize = this._matrix.getTileSize();
        return this.world.quadtree.findMapObjectsByRect({
            x: gridBounds.x * tileSize,
            y: gridBounds.y * tileSize,
            width: gridBounds.xSize * tileSize,
            height: gridBounds.ySize * tileSize,
            z: this._matrix.depth,
        });
    }*/

    private _getVisibleNodes(gridBounds: GridBounds): QuadNode[] {
        const tileSize = this._matrix.getTileSize();
        const visibleNodes: QuadNode[] = [];

        for (let x = gridBounds.x; x < gridBounds.x + gridBounds.xSize; x++) {
            for (let y = gridBounds.y; y < gridBounds.y + gridBounds.ySize; y++) {
                const node = this.world.quadtree.findByPoint({
                    x: x * tileSize,
                    y: y * tileSize,
                    z: this._matrix.depth,
                }, true); /*, (node: QuadNode) => {
                    return node.getTile()?.isResolved ? false : true;
                });*/

                // Tiles are generated by a subscriber (see HydrationScheduler). A node without a tile draws blank until then.
                if (node) {
                    visibleNodes.push(node);
                }
            }
        }

        return visibleNodes;
    }

    /** `trigger` is omitted for changes that need a repaint but no new data (hover, render mode). */
    private _invalidatTransform(trigger?: RenderTrigger): void {
        if (trigger) {
            this._notify(trigger);
        }

        if (this._invalid) {
            return;
        }

        this._invalid = true;
        this.clear();

        if (this._refreshRequest) {
            cancelAnimationFrame(this._refreshRequest);
        }

        this._refreshRequest = requestAnimationFrame(() => {
            this._draw();
            this._refreshRequest = undefined;
            this._invalid = false;
        });
    }

    private _notify(trigger: RenderTrigger): void {
        // Before the first resize there is no viewport, so nothing is visible yet.
        if (!this._subscribers.length || this._matrix.width === 0 || this._matrix.height === 0) {
            return;
        }

        const request: RenderRequest = {
            trigger,
            gridBounds: this._matrix.visibleTiles(),
            depth: this._matrix.depth,
        };

        this._subscribers.forEach((subscriber) => subscriber(request));
    }

    private _onQuadTreeChange(_data: QuadNodeEventData): void {
        this._invalidatTransform('data');
    }
}