import type { Request, Response } from "express";
import { gameManager } from "../game/game-manager.js";
import { spawnPlayer } from "./player.controller.js";

type NewGameRequest = { message: string };

console.log('postNewGame!!!');

export async function postNewGame(
  req: Request<unknown, unknown, NewGameRequest>,
  res: Response,
) {
  try {
    const { message } = req.body;
    gameManager.createGame();
    spawnPlayer();
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}
