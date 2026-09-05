import type { Request, Response } from "express";
import { paletteRepository } from "../db/repositories/palette-repository";
import { PaletteData, WorldData } from "../../engine/types";
import { PaletteDataSummary } from "../types";

type GetWorldRequest = { id: number };
type CreatePaletteRequest = { name: string };
type UpdatePaletteRequest = PaletteData;

export async function createNewPalette(
    req: Request<unknown, unknown, CreatePaletteRequest>,
    res: Response,
) {
    try {
        const { name } = req.body;
        console.log('Creating new palette');

        const paletteId = await paletteRepository.createPalette({
            id: -1,
            name,
            version: '0.0.0',
            tiles: [],
            vectors: [],
            markers: [],
        });

        res.json({
            paletteId: paletteId,
            success: true,
        });

    } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: message });
    }
}

export async function getPalettes(
    req: Request<GetWorldRequest, unknown, unknown>,
    res: Response,
) {
    try {
        const paletteSummaryList: PaletteDataSummary[] = await paletteRepository.getPalettes();

        res.json({
            palettes: paletteSummaryList,
            success: true,
        });

    } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: message });
    }
}

export async function getPalette(
    req: Request<GetWorldRequest, unknown, unknown>,
    res: Response,
) {
    try {
        const { id } = req.params;

        console.log('Get palette');

        const paletteData: PaletteData = await paletteRepository.getPalette(id);

        res.json({
            paletteData,
            success: true,
        });

    } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: message });
    }
}

export async function updatePalette(
    req: Request<GetWorldRequest, unknown, UpdatePaletteRequest>,
    res: Response,
) {
    try {
        const { id } = req.params;
        const paletteData = req.body;

        console.log('Put palette', paletteData);

        const success = await paletteRepository.updatePalette(id, paletteData);

        res.json({
            success,
        });

    } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: message });
    }
}

export async function deletePalette(
    req: Request<GetWorldRequest, unknown, unknown>,
    res: Response,
) {
    try {
        const { id } = req.params;
        const success = await paletteRepository.deletePalette(id);

        res.json({
            success,
        });

    } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: message });
    }
}
