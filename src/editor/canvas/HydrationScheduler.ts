import { hydrate } from "../../../engine/world/hydrator/hydrate";
import { findNodesToHydrate } from "../../../engine/world/hydrator/findNodesToHydrate";
import { getVectorHosts, hydrateVectorPaths } from "../../../engine/world/hydrator/hydrateVectorPaths";
import { QuadNode } from "../../../engine/world/quad-node";
import { RoadSearchBounds } from "../../../engine/world/vector-generation/road-path";
import { createRoadPlanningSnapshot, getRoadPlanningBounds } from "./road-planning/roadPlanningSnapshot";
import { RoadPlannerWorker } from "./road-planning/RoadPlannerWorker";
import { applyRoadPlan } from "./road-planning/applyRoadPlan";
import { CanvasRenderer, RenderRequest } from "./CanvasRenderer";

const TIME_BUDGET_MS = 8;
const GENERATED_ROAD_TYPE = 'road';
const GENERATED_ROAD_VALUE = 1;

type RoadStage = { depth: number; bounds: RoadSearchBounds; commitBounds: RoadSearchBounds };

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

        const bounds = getRoadPlanningBounds(root, request.depth, gridBounds);
        if (!bounds) {
            return;
        }
        const worldSize = 2 ** request.depth;
        const x = Math.max(0, gridBounds.x);
        const y = Math.max(0, gridBounds.y);
        const right = Math.min(worldSize, gridBounds.x + gridBounds.xSize);
        const bottom = Math.min(worldSize, gridBounds.y + gridBounds.ySize);
        const stages: RoadStage[] = [{
            depth: request.depth, bounds,
            commitBounds: { x, y, width: right - x, height: bottom - y },
        }];
        for (let depth = request.depth - 1; depth >= 1; depth--) {
            const child = stages[0].bounds;
            const left = Math.floor(child.x / 2);
            const top = Math.floor(child.y / 2);
            const parentRight = Math.ceil((child.x + child.width) / 2);
            const parentBottom = Math.ceil((child.y + child.height) / 2);
            const commitBounds = { x: left, y: top, width: parentRight - left, height: parentBottom - top };
            const parentBounds = getRoadPlanningBounds(root, depth, {
                x: left, y: top, xSize: commitBounds.width, ySize: commitBounds.height,
            });
            if (!parentBounds) {
                throw new Error('Parent road planning bounds are unavailable');
            }
            stages.unshift({ depth, bounds: parentBounds, commitBounds });
        }
        const marginRect = {
            x: bounds.x * tileSize, y: bounds.y * tileSize,
            width: bounds.width * tileSize, height: bounds.height * tileSize, z: request.depth,
        };
        const visible = findNodesToHydrate(root, rect);
        const visibleIds = new Set(visible.map((node) => node.key.id));
        this._queue = [...visible, ...findNodesToHydrate(root, marginRect).filter((node) => !visibleIds.has(node.key.id))];
        this._hydrateViewport(request, stages, this._generation);
    }

    private _hydrateViewport(request: RenderRequest, stages: RoadStage[], generation: number): void {
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
            this._timer = setTimeout(() => this._hydrateViewport(request, stages, generation), 0);
        } else {
            this._timer = undefined;
            this._startStage(request, stages, 0, generation);
        }
    }

    private _startStage(request: RenderRequest, stages: RoadStage[], index: number, generation: number): void {
        const stage = stages[index];
        const root = this._renderer.world.quadtree;
        const tileSize = root.bounds.size / 2 ** stage.depth;
        const { bounds } = stage;
        this._queue = findNodesToHydrate(root, {
            x: bounds.x * tileSize, y: bounds.y * tileSize,
            width: bounds.width * tileSize, height: bounds.height * tileSize, z: stage.depth,
        });
        this._run(request, stages, index, generation);
    }

    private _run(request: RenderRequest, stages: RoadStage[], index: number, generation: number): void {
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
            this._timer = setTimeout(() => this._run(request, stages, index, generation), 0);
        } else {
            this._timer = undefined;
            this._planRoads(request, stages, index, generation);
        }
    }

    private _planRoads(request: RenderRequest, stages: RoadStage[], index: number, generation: number): void {
        const { depth, bounds, commitBounds } = stages[index];
        const root = this._renderer.world.quadtree;
        const tileSize = root.bounds.size / 2 ** depth;
        this._hydrating = true;
        try {
            const nodes = root.findByRect({
                x: bounds.x * tileSize, y: bounds.y * tileSize,
                width: bounds.width * tileSize, height: bounds.height * tileSize, z: depth,
            }, { selectAllDepth: true });
            hydrateVectorPaths(getVectorHosts(nodes.filter((node) => node.depth < depth), depth), depth);
        } finally {
            this._hydrating = false;
        }
        const snapshot = { ...createRoadPlanningSnapshot(root, depth, bounds, GENERATED_ROAD_TYPE).request, commitBounds };
        void this._roadPlanner.plan(snapshot).then((result) => {
            if (result.status !== 'completed' || this._disposed || generation !== this._generation) {
                return;
            }
            this._hydrating = true;
            try {
                const applied = applyRoadPlan(root, depth, snapshot, result.plan, GENERATED_ROAD_TYPE, GENERATED_ROAD_VALUE);
                if (applied === 'stale') {
                    this._cancel();
                    this._timer = setTimeout(() => this._plan(request), 0);
                } else if (index + 1 < stages.length) {
                    this._timer = setTimeout(() => this._startStage(request, stages, index + 1, generation), 0);
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
