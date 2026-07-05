import type { Request, Response } from "express";
import { worldRepository } from "../db/repositories/world-repository";
import { Marker } from "../../engine/world/markers";
import { TileDataEntry, WorldData } from "../../engine/types";
import { WorldDataSummary } from "../types";

type GetWorldRequest = { id: number };
type CreateWorldRequest = { name: string };
type UpdateWorldRequest = { id: number, name: string, tiles: TileDataEntry[], markers: Marker[], startingLocations: Marker[] };

export async function createNewWorld(
    req: Request<unknown, unknown, CreateWorldRequest>,
    res: Response,
) {
    try {
        const { name } = req.body;
        console.log('Creating new world');

        const worldId = await worldRepository.createWorld(name);

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
        const worldSummaryList: WorldDataSummary[] = await worldRepository.getWorlds();

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

        const worldData: WorldData = await worldRepository.getWorld(id);

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

        const success = await worldRepository.updateWorld(id, { id, name, tiles, markers });

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
        const success = await worldRepository.deleteWorld(id);

        res.json({
            success,
        });

    } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: message });
    }
}
