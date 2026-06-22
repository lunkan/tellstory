import type { Request, Response } from "express";
import { WorldData } from "../../storyteller/types.js";
import { WorldRepository } from "../../world-repository.js";
import { gameManager } from "../game/game-manager.js";
import { PlayerObserver } from "../game/player-observer.js";
import { ADJACENT_DIRECTION_DELATA_VALUES, DIRECTION, isAdjacentDirection, isQuadrantDirection, QUADRANT_DIRECTION_DELTA_VALUES } from "../../shared/src/direction.js";
import { QuadNode } from "../../engine/world/quad-node.js";
import { Character } from "../../engine/core/character.js";

type NewGameRequest = { worldId: number };
type MovePlayerRequest = { direction: DIRECTION };

export async function newGame(
    req: Request<unknown, unknown, NewGameRequest>,
    res: Response,
) {

    console.log('NEW GAME');
    try {
        const { worldId } = req.body;
        const worldData: WorldData = await WorldRepository.getWorld(worldId);
        const gamePod = gameManager.newGame(worldData);

        const player = new Character('Fantomen', gamePod.game.world); //, startingNode.getPoint());
        const playerObserver = new PlayerObserver(player);
        gameManager.getGame()?.game.subscribe(playerObserver);
        gamePod.game.spawnPlayer(player);

        //const player = 



        res.json({ success: true });
    } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: message });
    }
}

export async function movePlayer(
    req: Request<unknown, unknown, MovePlayerRequest>,
    res: Response,
) {
    try {
        const { direction } = req.body;

        const game = gameManager.getGame()?.game;
        const player = game?.getPlayer('Fantomen');
        if (!game || !player) {
            throw Error('NO PLAYER OR GAME');
        }

        let node: QuadNode | undefined;
        if (isQuadrantDirection(direction)) {
            const [x, y] = QUADRANT_DIRECTION_DELTA_VALUES[direction]!;
            node = player.getQuadrantByDelta(x, y);
        } else if (isAdjacentDirection(direction)) {
            const [x, y] = ADJACENT_DIRECTION_DELATA_VALUES[direction]!;
            node = player.getAdjacentByDelta(x, y);
        }

        if (node) {
            game.movePlayer('Fantomen', node);
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: message });
    }
}
