import type { Request, Response } from "express";
import { settingsRepository } from "../db/repositories/settings-repository";
import { SettingsConfig } from "../../shared/src/types";

export async function updateSettings(
    req: Request<unknown, unknown, SettingsConfig>,
    res: Response,
) {
    try {
        const settings = req.body;
        console.log('configSettings', settings);

        const success = await settingsRepository.updateSettings(settings);
        if (!success) {
            throw Error('Setting updaes could not be stored');
        }

        const updatedSettings = await settingsRepository.getSettings();
        res.json({
            settings: updatedSettings,
            success: true,
        });

    } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: message });
    }
}

export async function getSettings(
    req: Request<unknown, unknown, unknown>,
    res: Response,
) {
    try {
        const settings = await settingsRepository.getSettings();

        res.json({
            settings: settings,
            success: true,
        });

    } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: message });
    }
}
