import type { Request, Response } from "express";
import { WorldRepository } from "../../world-repository";
import { Marker, TileDataEntry, WorldData, WorldDataSummary } from "../../storyteller/types";

type GetWorldRequest = { id: number };
type CreateWorldRequest = { name: string };
type UpdateWorldRequest = { id: number, name: string, tiles: TileDataEntry[], markers: Marker[] };

console.log('createNewWorld!!!');

export async function createNewWorld(
  req: Request<unknown, unknown, CreateWorldRequest>,
  res: Response,
) {
  try {
    const { name } = req.body;

    console.log('Creating new world');

    const worldId = await WorldRepository.createWorld(name);

    res.json({
      worldId: worldId,
      success: true,
    });

  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}

export async function getWorlds(
  req: Request<GetWorldRequest, unknown, unknown>,
  res: Response,
) {
  try {
    console.log('Get worlds');

    const worldSummaryList: WorldDataSummary[] = await WorldRepository.getWorlds();

    res.json({
      worlds: worldSummaryList,
      success: true,
    });

  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}

export async function getWorld(
  req: Request<GetWorldRequest, unknown, unknown>,
  res: Response,
) {
  try {
    const { id } = req.params;

    console.log('Get world');

    const worldData: WorldData = await WorldRepository.getWorld(id);

    res.json({
      worldData,
      success: true,
    });

  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}

export async function updateWorld(
  req: Request<GetWorldRequest, unknown, UpdateWorldRequest>,
  res: Response,
) {
  try {
    const { id } = req.params;
    const { name, tiles, markers } = req.body;

    console.log('Put world');

    const success = await WorldRepository.updateWorld(id, { id, name, tiles, markers });

    res.json({
      success,
    });

  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}

export async function deleteWorld(
  req: Request<GetWorldRequest, unknown, unknown>,
  res: Response,
) {
  try {
    const { id } = req.params;

    console.log('deleteWorld world');
    const success = await WorldRepository.deleteWorld(id);

    res.json({
      success,
    });

  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}
