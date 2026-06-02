import { World } from "../world/world.js";
import { Game } from "./game.js";

export function createGame(): Game {
    const world = new World();
    return new Game(world);
}
