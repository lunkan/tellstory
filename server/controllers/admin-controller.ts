import type { Request, Response } from "express";
import { locationProfileRepository } from "../db/repositories/location-profile-repository";

type ConfigSettingsRequest = { [key: string]: unknown };
type ClearStorageRequest = { type: string };

export async function configSettings(
    req: Request<unknown, unknown, ConfigSettingsRequest>,
    res: Response,
) {
    try {
        const settings = req.body;
        console.log('Config settings', settings);

        res.json({
            success: true,
        });

    } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: message });
    }
}

export async function clearStorage(
    req: Request<unknown, unknown, ClearStorageRequest>,
    res: Response,
) {
    try {
        const { type } = req.body;

        console.log('clearStorage', type);
        const success = await locationProfileRepository.clearAll();
        res.json({
            success,
        });

    } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: message });
    }
}