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
import { TileMap, TileMapObject } from "./schemas/tile-map-json-schema";
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
    /**
     * Child index (0-3) the vector passes through at each depth below its host: entry 0 is the child of
     * the host, entry 1 its child, and so on. Hydration appends one entry per depth. The cell at the
     * other end is mirrored across the border, so it is not stored. Hydration cache - never saved.
     */
    placement?: number[];
}

export type MarkerSetting = Partial<TileMapObject> & {
    point?: QuadNodes2DPoint; // Not used
    /**
     * Coarse position: the id (QuadNodeKey.id) of the node the marker currently sits in.
     * Starts as the host node and is narrowed to a descendant during hydration. Never an exact
     * position - that is `shape`, which only exists once the map has been generated. Not saved.
     * A string, not a QuadNodeKey, so marker data stays JSON serializable.
     */
    placement?: string;
    type: string;
    attention?: number; // Not to be used
    id: string;
};

export type TileBounds = {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type TileData = {
    bounds: TileBounds;
    vectors: VectorSetting[];
    terrain: TerrainSetting[];
    markers: MarkerSetting[];
    // mapData?: TileMap; // No map data ????
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

