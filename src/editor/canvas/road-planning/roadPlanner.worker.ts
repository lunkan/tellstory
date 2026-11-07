import { planRoadSnapshot, RoadPlanningRequest, RoadPlanningResponse } from './roadPlannerProtocol';

self.onmessage = (event: MessageEvent<RoadPlanningRequest>): void => {
    let response: RoadPlanningResponse;
    try {
        response = { status: 'completed', plan: planRoadSnapshot(event.data) };
    } catch (error) {
        response = {
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
        };
    }
    self.postMessage(response);
};
