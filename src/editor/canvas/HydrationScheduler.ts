import { hydrate } from "../../../engine/world/hydrator/hydrate";
import { findNodesToHydrate } from "../../../engine/world/hydrator/findNodesToHydrate";
import { getVectorHosts, hydrateVectorPaths } from "../../../engine/world/hydrator/hydrateVectorPaths";
import { QuadNode } from "../../../engine/world/quad-node";
import { CanvasRenderer, RenderRequest } from "./CanvasRenderer";

const TIME_BUDGET_MS = 8;

/**
 * Generates tiles for what the renderer shows. Work is split into slices so a pass never blocks
 * a frame for long, and a newer request replaces whatever is left of the previous pass.
 * Each hydrated node dispatches a data change, which makes the renderer repaint.
 */
export class HydrationScheduler {
    private readonly _renderer: CanvasRenderer;
    private readonly _unsubscribe: () => void;
    private _queue: QuadNode[] = [];
    private _timer: ReturnType<typeof setTimeout> | undefined;
    private _hydrating: boolean = false;

    constructor(renderer: CanvasRenderer) {
        this._renderer = renderer;
        this._unsubscribe = renderer.subscribe((request) => this._onRender(request));
    }

    public dispose(): void {
        this._unsubscribe();
        this._cancel();
    }

    private _onRender(request: RenderRequest): void {
        // Hydrating a node changes the tree and so notifies the renderer. That is our own output, not a new request.
        if (this._hydrating) {
            return;
        }

        this._cancel();
        this._timer = setTimeout(() => this._plan(request), 0);
    }

    private _plan(request: RenderRequest): void {
        const root = this._renderer.world.quadtree;
        const tileSize = root.bounds.size / Math.pow(2, request.depth);
        const { gridBounds } = request;

        const rect = {
            x: gridBounds.x * tileSize,
            y: gridBounds.y * tileSize,
            width: gridBounds.xSize * tileSize,
            height: gridBounds.ySize * tileSize,
            z: request.depth,
        };

        this._hydrating = true;
        try {
            // A road must stay complete when part of it lies outside the viewport
            hydrateVectorPaths(getVectorHosts(root.findByRect(rect, { selectAllDepth: true }), request.depth), request.depth);
        } finally {
            this._hydrating = false;
        }

        this._queue = findNodesToHydrate(root, rect);

        this._run();
    }

    private _run(): void {
        const start = performance.now();
        this._hydrating = true;

        try {
            while (this._queue.length && performance.now() - start < TIME_BUDGET_MS) {
                hydrate(this._queue.shift());
            }
        } finally {
            this._hydrating = false;
        }

        if (this._queue.length) {
            this._timer = setTimeout(() => this._run(), 0);
        } else {
            this._timer = undefined;
        }
    }

    private _cancel(): void {
        if (this._timer !== undefined) {
            clearTimeout(this._timer);
            this._timer = undefined;
        }

        this._queue = [];
    }
}
