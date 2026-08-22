import { GameEvent } from "./core/events/game-event.interface";
//import { Marker } from "./world/markers";

export interface IGameObserver {
    onEvent(event: GameEvent): void;
}

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

export type QuadNodeDelta = 1 | -1 | 0;

export type QuadNodeNormVector = {
    x: QuadNodeDelta,
    y: QuadNodeDelta,
    z: number;
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

/* TILES */

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

export type MarkerSetting = {
    point: QuadNodes2DPoint;
    type: string;
    id: string;
};

export type TileData = {
    vectors: VectorSetting[];
    terrain: TerrainSetting[];
    markers: MarkerSetting[];
}

export type TileDataEntry = TileData & {
    nodeId: string;
    detached?: boolean;
}

/* WORLD */

export type WorldData = {
    id: number;
    name: string;
    tiles: TileDataEntry[];
    //markers: Marker[];
}

