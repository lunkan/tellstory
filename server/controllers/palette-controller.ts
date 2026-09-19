import { z } from "zod";
import type { Request, Response } from "express";
import { paletteRepository } from "../db/repositories/palette-repository";
import { PaletteData } from "../../engine/types";
import { PaletteDataSummary } from "../types";
import { generateResponse } from "../llm-gateway/open-ai-gateway";
import { zodTextFormat } from "openai/helpers/zod.mjs";
import type OpenAI from "openai";
import { createMarkerSchema } from "../../engine/schemas/marker-json-schema";

type GetWorldRequest = { id: number };
type CreatePaletteRequest = { name: string };
type UpdatePaletteRequest = PaletteData;
type GenerateMarkerRequest = { id: number, prompt: string };

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

export async function generateMarkersByPrompt(
    req: Request<unknown, unknown, GenerateMarkerRequest>,
    res: Response,
) {
    console.log('Generate generateMarkersByPrompt!!!', req.body);

    try {
        const { id, prompt } = req.body;
        if (!prompt) {
            res.status(400).json({ error: `Missing 'prompt'` });
            return;
        } else if (!id) {
            res.status(400).json({ error: `Missing 'id'` });
            return;
        }

        const paletteData: PaletteData = await paletteRepository.getPalette(id);
        const tags = paletteData.tiles.map((tile) => tile.name);
        const existingMarkers = paletteData.markers.map((marker) => marker.name);

        const instructions = `
            Generate markers that satisfy the user's request.

            A marker represents an abstract type of real-world thing, place, or
            feature, rather than a specific instance or location.

            Generate concrete, meaningful concepts relevant to the request.
            Do not generate markers that already exist in the provided context.
            Also avoid semantic duplicates, including synonyms and different
            terminology for the same concept.

            Only use categories and tags permitted by the provided schema.
            Return only the requested markers.
        `;

        const input: OpenAI.Responses.ResponseInput = [{
            role: "user",
            content: `
                Here are the markers that already exist. Do not generate these
                or semantically equivalent markers:
                
                ${existingMarkers.join("\n")}
            `,
        }, {
            role: "user",
            content: prompt,
        }];

        // Structured outputs requires an object at the root, so the array of
        // markers has to be nested under a property rather than returned bare.
        const MarkersSchema = z.object({
            markers: z.array(createMarkerSchema(tags)),
        });
        const text = await generateResponse(instructions, input, {
            format: zodTextFormat(MarkersSchema, "markers"),
        });

        // Check for duplicates? Not simple string checks

        res.json({
            markers: JSON.parse(text).markers,
            success: true,
        });

    } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: message });
    }
}
