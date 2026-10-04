import { TileData } from "../../engine/types";

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

export function generateTileMap(tile: TileData): any {



}