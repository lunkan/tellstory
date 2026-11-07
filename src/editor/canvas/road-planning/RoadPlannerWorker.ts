import { RoadPlan } from '../../../../engine/world/vector-generation/road-plan';
import { RoadPlanningRequest, RoadPlanningResponse } from './roadPlannerProtocol';

export type RoadPlanningResult =
    | { status: 'completed'; plan: RoadPlan }
    | { status: 'cancelled' };

export type WorkerPort = Pick<Worker, 'onmessage' | 'onerror' | 'onmessageerror' | 'postMessage' | 'terminate'>;
type WorkerFactory = () => WorkerPort;

/** Owns one worker per request so even a synchronous search can be interrupted. */
export class RoadPlannerWorker {
    private readonly createWorker: WorkerFactory;
    private active?: { worker: WorkerPort; cancel: () => void };
    private disposed = false;

    constructor(createWorker: WorkerFactory = () => new Worker(new URL('./roadPlanner.worker.ts', import.meta.url), { type: 'module' })) {
        this.createWorker = createWorker;
    }

    public plan(request: RoadPlanningRequest): Promise<RoadPlanningResult> {
        if (this.disposed) {
            return Promise.reject(new Error('Road planner has been disposed'));
        }
        this.cancel();

        return new Promise((resolve, reject) => {
            const worker = this.createWorker();
            const finish = (): void => {
                if (this.active?.worker === worker) {
                    this.active = undefined;
                }
                worker.terminate();
            };
            const cancel = (): void => {
                finish();
                resolve({ status: 'cancelled' });
            };
            this.active = { worker, cancel };
            worker.onmessage = (event: MessageEvent<RoadPlanningResponse>) => {
                if (this.active?.worker !== worker) {
                    return;
                }
                finish();
                if (event.data.status === 'completed') {
                    resolve(event.data);
                } else {
                    reject(new Error(`Road planning failed: ${event.data.message}`));
                }
            };
            worker.onerror = (event: ErrorEvent) => {
                if (this.active?.worker !== worker) {
                    return;
                }
                event.preventDefault();
                finish();
                reject(new Error(`Road planning worker failed: ${event.message}`));
            };
            worker.onmessageerror = () => {
                if (this.active?.worker !== worker) {
                    return;
                }
                finish();
                reject(new Error('Road planning worker sent an unreadable message'));
            };
            try {
                worker.postMessage(request);
            } catch (error) {
                finish();
                reject(error);
            }
        });
    }

    public cancel(): void {
        this.active?.cancel();
    }

    public dispose(): void {
        this.cancel();
        this.disposed = true;
    }
}
