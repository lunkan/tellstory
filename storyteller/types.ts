import { GameEvent } from "../engine/core/events/game-event.interface";
import { DIRECTION } from "../shared/src/direction";

export type Reply = {
    player: string;
    currentPoint: QuadNodePoint;
    mentalPointOfOrigin: QuadNodePoint;
    details: {
        parent?: QuadNodeData,
        current?: QuadNodeData,
        previous?: QuadNodeData,
        adjacent: QuadNodeData[],
        quadrants: QuadNodeData[],
    },
    metrics: {
        adjacent?: MetricData[],
        quadrants?: MetricData[],
    },
    locationProfiles: {
        parent?: LocationProfile,
        current?: LocationProfile,
        previous?: LocationProfile,
        adjacent: LocationProfile[],
        quadrants: LocationProfile[],
    },
    sceneTransition?: string;
    adjacentSummary?: string;
    quadrantSummary?: string;
    premises?: LocationDirectionDescription[];
    adjacent?: LocationDirectionDescription[];
};

export type QuadNodeData = {
    key: string,
    depth: number,
    bounds: QuadNodeBoundsData,
    point: QuadNodePoint,
    tile?: TileData,
}

export type QuadNodeBoundsData = {
    x: number;
    y: number;
    size: number;
}

export type LocationProfile = {
    key: string;
    description: string;
    summary: string;
    reminiscence: string;
}

export type DirectionLocationProfile = {
    directionName: string;
    directionKey?: DIRECTION;
    profile: LocationProfile;
};

export type DirectionSummary = {
    summary: string,
    directionProfiles: DirectionLocationProfile[];
};

export type TileData = {
    vectors: VectorSetting[],
    terrain: TerrainSetting[],
}

export type TileDataEntry = TileData & {
    nodeId: string,
}

export type TerrainSetting = {
    type: string;
    value: number;
}

export type VectorSetting = {
    type: string;
    value: number;
    direction: {
        x: QuadNodeDelta,
        y: QuadNodeDelta,
    },
}

export type LocationDirectionDescription = {
    key: string;
    description: string;
}

export type QuadNodeChildIndex = 0 | 1 | 2 | 3;

export type QuadNodeDelta = 1 | -1 | 0;

export type QuadNodeNormVector = {
    x: QuadNodeDelta,
    y: QuadNodeDelta,
    z: number;
};

export type QuadNodes2DPoint = {
    x: number;
    y: number;
};

export type QuadNodePoint = QuadNodes2DPoint & {
    z: number;
};

export type QuadNodes2DRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type QuadNodesRect = QuadNodes2DRect & {
    z: number;
};

export type Metric = { [key: string]: number };

export type MetricData = {
    id: string,
    metric: Metric,
};

/*export interface LocationMessage {
  eventId: string;
  type: 'locationDescription';
  descriptionType: LocationMessageDescriptionType;
  direction?: DIRECTION;
  text?: string;
}*/

/*export type DirectionData = {
    type: 'adjacentDirection' | 'quadrantDirection';
    direction: DIRECTION;
};*/

export type WebsocketMessage = {
    type: string,
    data: unknown,
}

export type WorldData = {
    id: number;
    name: string;
    tiles: TileDataEntry[];
    markers: Marker[];
}

export type WorldDataSummary = {
    id: number;
    name: string;
}

// ------

export type Marker = {
    point: QuadNodes2DPoint;
    type: string;
    id: string;
}

export interface IGameObserver {
    onEvent(event: GameEvent): void;
}