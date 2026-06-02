export enum DIRECTION {
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

export const DIRECTION_NAME = {
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

export const PARENT_KEY: string = 's';

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
};