import { DIRECTION } from "../shared/src/direction";

export type SpacialMarker = {
    type: string,
    value: number,
    direction?: string,
    attention?: number,
}

export type Landmark = {
    type: string,
}

export type LocationProfile = {
    key: string;
    size: number;
    spatialMarkers: SpacialMarker[];
    landmarks: Landmark[];
}

export type LocationProfileContext = {
    key: string;
    size: number;
    frequency: number;
    recency: number;
    direction?: DIRECTION;
    directionName: string;
}

export type LocationDescription = {
    key: string;
    description: string;
    summary: string;
    reminiscence: string;
}
