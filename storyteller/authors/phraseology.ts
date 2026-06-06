import { QuadNodePoint } from "../types";
import { DIRECTION, DIRECTION_NAME } from "../../constants";

        
export function getFrequencyPhrase(frequency: number): string {
    if (frequency > 10) {
        return 'routinely';
    } else if (frequency > 5) {
        return 'many times';
    } else if (frequency > 2) {
        return 'some times';
    } else if (frequency === 2) {
        return 'a couple of times';
    } else if (frequency === 1) {
        return 'once before';
    } else {
        return 'first time';
    }
}

export function getRecencyPhrase(elapsedTime: number): string {
    if (elapsedTime > 100) {
        return 'long time ago';
    } else if (elapsedTime > 50) {
        return 'some time ago';
    } else if (elapsedTime > 25) {
        return 'recently';
    } else if (elapsedTime > 5) {
        return 'most recently';
    } else if (elapsedTime > 0) {
        return 'a moment ago';
    } else {
        return 'never before';
    }
}

export function getDirectionKey(delta: QuadNodePoint): number {
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

export function getDirectionName(delta: QuadNodePoint): string {
    if (delta.z < 0) {
        return DIRECTION_NAME[DIRECTION.UP];
    }

    if (delta.x > 0) {
        if (delta.y > 0) {
            return DIRECTION_NAME[DIRECTION.NORTH_WEST];
        } else if (delta.y < 0) {
            return DIRECTION_NAME[DIRECTION.SOUTH_WEST];
        } else {
            return DIRECTION_NAME[DIRECTION.WEST];
        }
    } else if (delta.x < 0) {
        if (delta.y > 0) {
            return DIRECTION_NAME[DIRECTION.NORTH_EAST];
        } else if (delta.y < 0) {
            return DIRECTION_NAME[DIRECTION.SOUTH_EAST];
        } else {
            return DIRECTION_NAME[DIRECTION.EAST];
        }
    } else {
        if (delta.y > 0) {
            return DIRECTION_NAME[DIRECTION.NORTH];
        } else if (delta.y < 0) {
            return DIRECTION_NAME[DIRECTION.SOUTH];
        } else {
            return DIRECTION_NAME[DIRECTION.NONE];
        }
    }
}