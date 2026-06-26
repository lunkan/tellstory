/*import { LocationProfile, Metric, MetricData, QuadNodeData, QuadNodePoint } from "../storyteller/types";

enum DIRECTION {
    NORTH_EAST = 0,
    NORTH = 1,
    NORTH_WEST = 2,
    EAST = 3,
    WEST = 4,
    SOUTH_EAST = 5,
    SOUTH = 6,
    SOUTH_WEST = 7,
    UP = 8,
    NONE = 9,
}

const DIRECTION_NAME = {
    [DIRECTION.NORTH_EAST]: 'north east',
    [DIRECTION.NORTH]: 'north',
    [DIRECTION.NORTH_WEST]: 'nort west',
    [DIRECTION.EAST]: 'east',
    [DIRECTION.WEST]: 'west',
    [DIRECTION.SOUTH_EAST]: 'south east',
    [DIRECTION.SOUTH]: 'south',
    [DIRECTION.SOUTH_WEST]: 'south west',
    [DIRECTION.UP]: 'zoom out (to parent)',
    [DIRECTION.NONE]: 'stand still',
};

const PARENT_KEY: string = 's';

const ADJACENT_KEY_MAP: Partial<Record<DIRECTION, string>> = {
    [DIRECTION.NORTH_EAST]: 'q',
    [DIRECTION.NORTH]: 'w',
    [DIRECTION.NORTH_WEST]: 'e',
    [DIRECTION.EAST]: 'a',
    [DIRECTION.WEST]: 'd',
    [DIRECTION.SOUTH_EAST]: 'z',
    [DIRECTION.SOUTH]: 'x',
    [DIRECTION.SOUTH_WEST]: 'c',
};

const QUADRANT_KEY_MAP: Partial<Record<DIRECTION, string>> = {
    [DIRECTION.NORTH_EAST]: 'i',
    [DIRECTION.NORTH_WEST]: 'o',
    [DIRECTION.SOUTH_EAST]: 'k',
    [DIRECTION.SOUTH_WEST]: 'l',
};

export class LocationManager {
    private _locations: QuadNodeData[];
    private _metricsData: MetricData[];
    private _locationProfiles: LocationProfile[];
    private _currentLocation: QuadNodeData;

    constructor(currentLocationId: string | undefined, locations: QuadNodeData[], metricsData: MetricData[], locationProfiles: LocationProfile[]) {
        this._locations = locations;
        this._metricsData = metricsData;
        this._locationProfiles = locationProfiles;

        const currentLocation = this.getLocationById(currentLocationId);
        if (!currentLocation) {
            throw Error('LocationManager required current location');
        }
        
        this._currentLocation = currentLocation;
    }

    public getLocationById(nodeId: string | undefined): QuadNodeData | undefined {
        return this._locations.find((nodeData: QuadNodeData) => nodeData.key === nodeId);
    }

    public getLocationMetricById(nodeId: string | undefined): Metric | undefined {
        return this._metricsData.find((metricData) => metricData.id === nodeId)?.metric
    }

    public getLocationProfileById(nodeId: string | undefined): LocationProfile | undefined {
        return this._locationProfiles.find((nodeData: LocationProfile) => nodeData.key === nodeId);
    }

    public getDirectionName(nodeId: string | undefined): string {
        if (!nodeId) {
            throw Error(`Navigation key can't be resolved - no id for relative node`);
        }

        const delta = this.getVector(nodeId);
        if (!delta) {
            throw Error(`Navigation key can't be resolved - no relative location found for ${nodeId}`);
        }

        const direction = this._getDirection(delta);
        return DIRECTION_NAME[direction];

    }

    public getDirectionKey(nodeId: string | undefined): string {
        if (!nodeId) {
            throw Error(`Navigation key can't be resolved - no id for relative node`);
        }

        const delta = this.getVector(nodeId);
        if (!delta) {
            throw Error(`Navigation key can't be resolved - no relative location found for ${nodeId}`);
        }

        const direction = this._getDirection(delta);

        if (delta.z < 0) {
            return PARENT_KEY;
        } else if (delta.z > 0) {
            return QUADRANT_KEY_MAP[direction] || ' - ';
        }

        return ADJACENT_KEY_MAP[direction] || ' - ';
    }

    private _getDirection(delta: QuadNodePoint): DIRECTION {
        if (delta.z < 0) {
            return DIRECTION.UP;
        }

        if (delta.x > 0) {
            if (delta.y > 0) {
                return DIRECTION.NORTH_WEST;
            } else if (delta.y < 0) {
                return DIRECTION.SOUTH_WEST;
            } else {
                return DIRECTION.WEST;
            }
        } else if (delta.x < 0) {
            if (delta.y > 0) {
                return DIRECTION.NORTH_EAST;
            } else if (delta.y < 0) {
                return DIRECTION.SOUTH_EAST;
            } else {
                return DIRECTION.EAST;
            }
        } else {
            if (delta.y > 0) {
                return DIRECTION.NORTH;
            } else if (delta.y < 0) {
                return DIRECTION.SOUTH;
            } else {
                return DIRECTION.NONE;
            }
        }
    }

    public getVector(nodeId: string): QuadNodePoint | undefined {
        const relativeLocation = this.getLocationById(nodeId);
        if (!relativeLocation) {
            return;
        }

        const z = this._compare(relativeLocation.point.z, this._currentLocation.point.z);
        if (z < 0) {
            return { x: 0, y: 0, z };
        }

        const relCenter = this._getCenter(relativeLocation);
        const currCenter = this._getCenter(this._currentLocation);

        return {
            x: this._compare(relCenter.x, currCenter.x),
            y: this._compare(relCenter.y, currCenter.y),
            z,
        };
    }

    private _compare(a: number, b: number) {
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
    }

    private _getCenter(point: QuadNodeData): QuadNodePoint {
        return {
            x: point.bounds.x + point.bounds.size / 2,
            y: point.bounds.y + point.bounds.size / 2,
            z: point.point.z,
        }
    }
}*/