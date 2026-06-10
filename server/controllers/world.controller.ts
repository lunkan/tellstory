import type { Request, Response } from "express";

type NewGameRequest = { message: string };

console.log('createNewWorld!!!');

export async function createNewWorld(
  req: Request<unknown, unknown, NewGameRequest>,
  res: Response,
) {
  try {
    const { message } = req.body;
    //gameManager.createGame();
    //spawnPlayer();
    console.log('Creating new world');
    res.json({
      id: 'newWorldID',
      success: true,
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}
