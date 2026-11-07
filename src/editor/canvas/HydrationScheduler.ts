import { hydrate } from "../../../engine/world/hydrator/hydrate";
import { findNodesToHydrate } from "../../../engine/world/hydrator/findNodesToHydrate";
import { getVectorHosts, hydrateVectorPaths } from "../../../engine/world/hydrator/hydrateVectorPaths";
import { QuadNode } from "../../../engine/world/quad-node";
import { createRoadPlanningSnapshot, getRoadPlanningBounds } from "./road-planning/roadPlanningSnapshot";
import { RoadPlannerWorker } from "./road-planning/RoadPlannerWorker";
import { applyRoadPlan } from "./road-planning/applyRoadPlan";
import { CanvasRenderer, RenderRequest } from "./CanvasRenderer";

const TIME_BUDGET_MS = 8;
const GENERATED_ROAD_TYPE = 'road';
const GENERATED_ROAD_VALUE = 1;

/**
 * Generates tiles for the viewport and road-planning margin. Work is split into slices so a pass never blocks
 * a frame for long, and a newer request replaces whatever is left of the previous pass.
 * Each hydrated node dispatches a data change, which makes the renderer repaint.
 */
export class HydrationScheduler {
    private readonly _renderer: Pick<CanvasRenderer, 'world' | 'subscribe'>;
    private readonly _unsubscribe: () => void;
    private _queue: QuadNode[] = [];
    private _timer: ReturnType<typeof setTimeout> | undefined;
    private _hydrating: boolean = false;
    private readonly _roadPlanner: Pick<RoadPlannerWorker, 'plan' | 'cancel' | 'dispose'>;
    private _generation = 0;
    private _disposed = false;

    constructor(renderer: Pick<CanvasRenderer, 'world' | 'subscribe'>, roadPlanner: Pick<RoadPlannerWorker, 'plan' | 'cancel' | 'dispose'> = new RoadPlannerWorker()) {
        this._renderer = renderer;
        this._roadPlanner = roadPlanner;
        this._unsubscribe = renderer.subscribe((request) => this._onRender(request));
    }

    public dispose(): void {
        this._disposed = true;
        this._unsubscribe();
        this._cancel();
        this._roadPlanner.dispose();
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

        const visible = findNodesToHydrate(root, rect);
        const bounds = getRoadPlanningBounds(root, request.depth, gridBounds);
        if (bounds) {
            const marginRect = {
                x: bounds.x * tileSize,
                y: bounds.y * tileSize,
                width: bounds.width * tileSize,
                height: bounds.height * tileSize,
                z: request.depth,
            };
            const visibleIds = new Set(visible.map((node) => node.key.id));
            const margin = findNodesToHydrate(root, marginRect).filter((node) => !visibleIds.has(node.key.id));
            this._queue = [...visible, ...margin];
        } else {
            this._queue = visible;
        }

        this._run(request, bounds, this._generation);
    }

    private _run(request: RenderRequest, bounds: ReturnType<typeof getRoadPlanningBounds>, generation: number): void {
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
            this._timer = setTimeout(() => this._run(request, bounds, generation), 0);
        } else {
            this._timer = undefined;
            if (bounds) {
                this._planRoads(request, bounds, generation);
            }
        }
    }

    private _planRoads(request: RenderRequest, bounds: NonNullable<ReturnType<typeof getRoadPlanningBounds>>, generation: number): void {
        const root = this._renderer.world.quadtree;
        const tileSize = root.bounds.size / 2 ** request.depth;
        this._hydrating = true;
        try {
            const nodes = root.findByRect({
                x: bounds.x * tileSize, y: bounds.y * tileSize,
                width: bounds.width * tileSize, height: bounds.height * tileSize, z: request.depth,
            }, { selectAllDepth: true });
            hydrateVectorPaths(getVectorHosts(nodes.filter((node) => node.depth < request.depth), request.depth), request.depth);
        } finally {
            this._hydrating = false;
        }
        const snapshot = createRoadPlanningSnapshot(root, request.depth, bounds, GENERATED_ROAD_TYPE).request;
        void this._roadPlanner.plan(snapshot).then((result) => {
            if (result.status !== 'completed' || this._disposed || generation !== this._generation) {
                return;
            }
            this._hydrating = true;
            try {
                const applied = applyRoadPlan(root, request.depth, snapshot, result.plan, GENERATED_ROAD_TYPE, GENERATED_ROAD_VALUE, () => {
                    const size = root.bounds.size;
                    root.findByRect({ x: 0, y: 0, width: size, height: size, z: request.depth })
                        .forEach((node) => node.clearGeneratedVectors(GENERATED_ROAD_TYPE));
                });
                if (applied === 'stale') {
                    this._cancel();
                    this._timer = setTimeout(() => this._plan(request), 0);
                }
            } finally {
                this._hydrating = false;
            }
        }).catch((error: unknown) => {
            console.error('Road generation failed:', error);
        });
    }

    private _cancel(): void {
        this._generation++;
        this._roadPlanner.cancel();
        if (this._timer !== undefined) {
            clearTimeout(this._timer);
            this._timer = undefined;
        }

        this._queue = [];
    }
}
