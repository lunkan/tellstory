import { Game } from "../../engine/core/game";
import { World } from "../../engine/world/world";
import { WorldData } from "../../storyteller/types";
import { GamePod } from "./game-pod";


let gamePod: GamePod | undefined;

function newGame(worldData: WorldData): GamePod {
    const world = new World(worldData);
    const game = new Game(world);
    gamePod = new GamePod(game);
    return gamePod;
}

function getGame(): GamePod | undefined {
    return gamePod;
}

export const gameManager = {
  newGame,
  getGame,
};