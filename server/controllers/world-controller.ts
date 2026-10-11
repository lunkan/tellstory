import type { Request, Response } from "express";
import { worldRepository } from "../db/repositories/world-repository";
//import { Marker } from "../../engine/world/markers";
import { MarkerSetting, TileData, TileDataEntry, WorldData } from "../../engine/types";
import { QuadNodeKey } from "../../engine/world/quad-node-key";
import { WorldDataSummary } from "../types";
import { generateTileMap } from "../map-generator/map-generator";
import { isCircleShape, isLineShape, isRectangleShape } from "../../engine/schemas/tile-map-json-schema";

type GetWorldRequest = { id: number };
type CreateWorldRequest = { name: string; size: number; palette: number; };
type UpdateWorldRequest = {
    id: number,
    name: string,
    tiles: TileDataEntry[],
    //markers: Marker[],
    //startingLocations: Marker[]
    startingLocations: MarkerSetting[]
};

type GenerateMapRequest = { tile: TileData };

export async function createNewWorld(
    req: Request<unknown, unknown, CreateWorldRequest>,
    res: Response,
) {
    try {
        const { name, size, palette } = req.body;
        console.log('Creating new world', name, size, palette);

        // Size is the world's max depth and can never change after creation -
        // stored node ids depend on it, so it has to be right the first time.
        if (!Number.isInteger(size) || size < 1 || size > QuadNodeKey.MAX_DEPTH) {
            res.status(400).json({ error: `size must be a whole number between 1 and ${QuadNodeKey.MAX_DEPTH}` });
            return;
        }

        const worldId = await worldRepository.createWorld(name, size, palette);

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
        //const { name, tiles, markers } = req.body;
        const { name, tiles } = req.body;

        console.log('Put world');

        //const success = await worldRepository.updateWorld(id, { id, name, tiles, markers });
        const success = await worldRepository.updateWorld(id, { id, name, tiles });

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

export async function generateMapByNode(
    req: Request<unknown, unknown, GenerateMapRequest>,
    res: Response,
) {
    try {
        const { tile } = req.body;
        console.log('generateMapByNode', tile);
        //const success = await worldRepository.deleteWorld(id);


        // Very shitty result from layout.
        const result = await generateTileMap({
            bounds: tile.bounds,
            terrain: tile.terrain,
            markers: tile.markers.map((marker) => {
                return {
                    type: marker.type,
                    attention: marker.attention || 0,
                };
            }),
        });

        if (result) {
            res.json({
                tileMap: {
                    ...result,
                    bounds: tile.bounds,
                    objects: result?.objects.map((object) => {
                        if (isRectangleShape(object.shape)) {
                            return {
                                ...object,
                                shape: {
                                    ...object.shape,
                                    x: object.shape.x + tile.bounds.x,
                                    y: object.shape.y + tile.bounds.y,
                                },
                            }
                        } else if (isLineShape(object.shape)) {
                            return {
                                ...object,
                                shape: {
                                    ...object.shape,
                                    point1: {
                                        x: object.shape.point1.x + tile.bounds.x,
                                        y: object.shape.point1.y + tile.bounds.y,
                                    },
                                    point2: {
                                        x: object.shape.point2.x + tile.bounds.x,
                                        y: object.shape.point2.y + tile.bounds.y,
                                    },
                                },
                            }
                        } else if (isCircleShape(object.shape)) {
                            return {
                                ...object,
                                shape: {
                                    ...object.shape,
                                    x: object.shape.x + tile.bounds.x,
                                    y: object.shape.y + tile.bounds.y,
                                },
                            }
                        }

                        return object;
                    }),
                },
                success: true,
            });
        } else {
            res.json({
                success: false,
            });
        }

    } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: message });
    }
}
