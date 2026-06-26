export enum DIRECTION {
    NORTH_EAST = 1,
    NORTH = 2,
    NORTH_WEST = 3,
    EAST = 4,
    WEST = 5,
    SOUTH_EAST = 6,
    SOUTH = 7,
    SOUTH_WEST = 8,
    CLOSE_NORTH_WEST = 9,
    CLOSE_SOUTH_WEST = 10,
    CLOSE_SOUTH_EAST = 11,
    CLOSE_NORTH_EAST = 12,
    UP = 13,
    NONE = 14,
}

export const DIRECTION_NAME = {
    [DIRECTION.NORTH_EAST]: 'north east',
    [DIRECTION.NORTH]: 'north',
    [DIRECTION.NORTH_WEST]: 'north west',
    [DIRECTION.EAST]: 'east',
    [DIRECTION.WEST]: 'west',
    [DIRECTION.SOUTH_EAST]: 'south east',
    [DIRECTION.SOUTH]: 'south',
    [DIRECTION.SOUTH_WEST]: 'south west',
    [DIRECTION.CLOSE_NORTH_WEST]: 'close north west',
    [DIRECTION.CLOSE_SOUTH_WEST]: 'close south west',
    [DIRECTION.CLOSE_SOUTH_EAST]: 'close south east',
    [DIRECTION.CLOSE_NORTH_EAST]: 'close north east',
    [DIRECTION.UP]: 'zoom out (to parent)',
    [DIRECTION.NONE]: 'stand still',
};

export const QUADRANT_DIRECTION_DELTA_VALUES: Partial<Record<DIRECTION, (1 | 0)[]>> = {
    [DIRECTION.CLOSE_NORTH_WEST]: [1, 0],
    [DIRECTION.CLOSE_SOUTH_WEST]: [1, 1],
    [DIRECTION.CLOSE_SOUTH_EAST]: [0, 1],
    [DIRECTION.CLOSE_NORTH_EAST]: [0, 0],
}

export const ADJACENT_DIRECTION_DELATA_VALUES: Partial<Record<DIRECTION, (1 | 0 | -1)[]>> = {
    [DIRECTION.NORTH_WEST]: [1, 1],
    [DIRECTION.WEST]: [1, 0],
    [DIRECTION.SOUTH_WEST]: [1, -1],
    [DIRECTION.SOUTH]: [0, -1],
    [DIRECTION.SOUTH_EAST]: [-1, -1],
    [DIRECTION.EAST]: [-1, 0],
    [DIRECTION.NORTH_EAST]: [-1, 1],
    [DIRECTION.NORTH]: [0, 1],
}

export function isQuadrantDirection(direction: DIRECTION): boolean {
    switch (direction) {
        case DIRECTION.CLOSE_NORTH_WEST:
        case DIRECTION.CLOSE_SOUTH_WEST:
        case DIRECTION.CLOSE_SOUTH_EAST:
        case DIRECTION.CLOSE_NORTH_EAST:
            return true;
        default:
            return false;
    }
}

export function isAdjacentDirection(direction: DIRECTION): boolean {
    switch (direction) {
        case DIRECTION.NORTH_WEST:
        case DIRECTION.WEST:
        case DIRECTION.SOUTH_WEST:
        case DIRECTION.SOUTH:
        case DIRECTION.SOUTH_EAST:
        case DIRECTION.EAST:
        case DIRECTION.NORTH_EAST:
        case DIRECTION.NORTH:
            return true;
        default:
            return false;
    }
}

export function getDirectionFromQuadrantVector(x: number, y: number): DIRECTION {
    if (x === 1 && y === -1) {
        return DIRECTION.CLOSE_NORTH_WEST;
    } else if (x === 1 && y === 1) {
        return DIRECTION.CLOSE_SOUTH_WEST;
    } else if (x === -1 && y === 1) {
        return DIRECTION.CLOSE_SOUTH_EAST;
    } else if (x === -1 && y === -1) {
        return DIRECTION.CLOSE_NORTH_EAST;
    }

    throw Error(`Unknown quadrant direction from vector [${x}, ${y}]`);
}

export function getDirectionFromAdjacentVector(x: number, y: number): DIRECTION {
    if (x === 1 && y === 1) {
        return DIRECTION.NORTH_WEST;
    } else if (x === 1 && y === 0) {
        return DIRECTION.WEST;
    } else if (x === 1 && y === -1) {
        return DIRECTION.SOUTH_WEST;
    } else if (x === 0 && y === -1) {
        return DIRECTION.SOUTH;
    } else if (x === -1 && y === -1) {
        return DIRECTION.SOUTH_EAST;
    } else if (x === -1 && y === 0) {
        return DIRECTION.EAST;
    } else if (x === -1 && y === 1) {
        return DIRECTION.NORTH_EAST;
    } else if (x === 0 && y === 1) {
        return DIRECTION.NORTH;
    }

    throw Error(`Unknown adjacent direction from vector [${x}, ${y}]`);
}
