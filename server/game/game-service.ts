import { Game } from "../../engine/core/game";
import { WorldData } from "../../engine/types";
import { World } from "../../engine/world/world";
import { Storyteller } from "../../storyteller/storyteller";
import { GamePod } from "./game-pod";


let gamePod: GamePod | undefined;

function newGame(worldData: WorldData): GamePod {
    const world = new World(worldData);
    const storyteller = new Storyteller(worldData.id);
    const game = new Game(world);
    gamePod = new GamePod(game, storyteller);
    return gamePod;
}

function getGame(): GamePod | undefined {
    return gamePod;
}

export const gameService = {
    newGame,
    getGame,
};