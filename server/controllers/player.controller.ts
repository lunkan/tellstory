import { subscribe } from "../websocket/websocket-service";
import { DirectionData } from "../../storyteller/types";
import { DIRECTION } from "../../constants";
import { gameManager } from "../game/game-manager";
import { ChronicleEventType } from "../../engine/chronicle/chronicle";
import { enterScene, spawn } from "./storyteller.controller";

console.log('Imported', 'player');

export function spawnPlayer(): void {
    const gamePod = gameManager.getGamePod();
    if (!gamePod) {
        throw Error('No availible game');
    }

    const player = gamePod.game.newPlayer('Fantomen', { x: 0, y: 0, z: 2});
    spawn(player);
}

subscribe('move', (data: unknown) => {
    const { type, direction } = data as DirectionData;
    const gamePod = gameManager.getGamePod();

    if (!gamePod) {
        throw Error('No availible game');
    }

    const { game, player } = gamePod;
    game.newTurn();
    
    if (!player) {
        throw Error('No availible player');
    }

    if (type === 'quadrantDirection') {
        switch (direction) {
            case DIRECTION.NORTH_WEST:
                player.moveToQuadrant(1, 0);
                break;
            case DIRECTION.SOUTH_WEST:
                player.moveToQuadrant(1, 1);
                break;
            case DIRECTION.SOUTH_EAST:
                player.moveToQuadrant(0, 1);
                break;
            case DIRECTION.NORTH_EAST:
                player.moveToQuadrant(0, 0);
                break;
            default:
                throw Error('No valid quadrantDirection');
        }
    } else if (type === 'adjacentDirection') {
        switch (direction) {
            case DIRECTION.NORTH_WEST:
                player.moveToAdjacent(1, 1);
                break;
            case DIRECTION.WEST:
                player.moveToAdjacent(1, 0);
                break;
            case DIRECTION.SOUTH_WEST:
                player.moveToAdjacent(1, -1);
                break;
            case DIRECTION.SOUTH:
                player.moveToAdjacent(0, -1);
                break;
            case DIRECTION.SOUTH_EAST:
                player.moveToAdjacent(-1, -1);
                break;
            case DIRECTION.EAST:
                player.moveToAdjacent(-1, 0);
                break;
            case DIRECTION.NORTH_EAST:
                player.moveToAdjacent(-1, 1);
                break;
            case DIRECTION.NORTH:
                player.moveToAdjacent(0, 1);
                break;
            default:
                throw Error('No valid adjacentDirection');
        }
    } else {
        throw Error(`No direction type: ${type}`);
    }

    player.addMemory({
        type: ChronicleEventType.Enter,
        timestamp: game.getTime(),
    });

    enterScene(player);
});