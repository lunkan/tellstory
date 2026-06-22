export enum DIRECTION {
    NORTH_EAST = 0,
    NORTH = 1,
    NORTH_WEST = 2,
    EAST = 3,
    WEST = 4,
    SOUTH_EAST = 5,
    SOUTH = 6,
    SOUTH_WEST = 7,
    CLOSE_NORTH_WEST = 8,
    CLOSE_SOUTH_WEST = 9,
    CLOSE_SOUTH_EAST = 10,
    CLOSE_NORTH_EAST = 11,
    UP = 12,
    NONE = 13,
}

export const DIRECTION_NAME = {
    [DIRECTION.NORTH_EAST]: 'north east',
    [DIRECTION.NORTH]: 'north',
    [DIRECTION.NORTH_WEST]: 'nort west',
    [DIRECTION.EAST]: 'east',
    [DIRECTION.WEST]: 'west',
    [DIRECTION.SOUTH_EAST]: 'south east',
    [DIRECTION.SOUTH]: 'south',
    [DIRECTION.SOUTH_WEST]: 'south west',
    [DIRECTION.CLOSE_NORTH_WEST]: 'close nort west',
    [DIRECTION.CLOSE_SOUTH_WEST]: 'close south west',
    [DIRECTION.CLOSE_SOUTH_EAST]: 'close south east',
    [DIRECTION.CLOSE_NORTH_EAST]: 'close nort east',
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

/*export const PARENT_KEY: string = 's';

export const ADJACENT_KEY_MAP: Partial<Record<DIRECTION, string>> = {
    [DIRECTION.NORTH_EAST]: 'q',
    [DIRECTION.NORTH]: 'w',
    [DIRECTION.NORTH_WEST]: 'e',
    [DIRECTION.EAST]: 'a',
    [DIRECTION.WEST]: 'd',
    [DIRECTION.SOUTH_EAST]: 'z',
    [DIRECTION.SOUTH]: 'x',
    [DIRECTION.SOUTH_WEST]: 'c',
};

export const QUADRANT_KEY_MAP: Partial<Record<DIRECTION, string>> = {
    [DIRECTION.NORTH_EAST]: 'i',
    [DIRECTION.NORTH_WEST]: 'o',
    [DIRECTION.SOUTH_EAST]: 'k',
    [DIRECTION.SOUTH_WEST]: 'l',
};*/