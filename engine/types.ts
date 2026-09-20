// 0 -  320km   -
// 1 -  160km   -
// 2 -  80km    -
// 3 -  40km    -
// 4 -  20km    -
// 5* - 10km    # Horizon
// 6 -  5km     # Region
// 7 -  2.5km   # District
// 8 -  1.25km  # Neighborhood
// 9 -  675m    # Local area
// 10 - 336m    # Nearby area
// 11 - 177m    # Immediate surroundings
// 12 - 89m     -

import { MarkerConfigData, TileConfigData, VectorConfigData } from "./config/type";
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
    size: number;
    palette: number;
    tiles: TileDataEntry[];
}

/* PALETTE */

export type PaletteData = {
    id: number;
    name: string;
    version: string;
    tiles: TileConfigData[];
    vectors: VectorConfigData[];
    markers: MarkerConfigData[];
}

