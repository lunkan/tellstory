import { z } from "zod";

const TerrainSchema = z.object({
    type: z.string().describe("The semantic category of the terrain or environmental property, such as forest, grassland, urban, water, elevation, or other terrain-related characteristics."),
    value: z.number().min(0).max(1).describe("The normalized value associated with the terrain type, ranging from 0.0 to 1.0. For land-cover types such as forest, grassland, or urban, this represents coverage or density, where 0.0 means absent and 1.0 means fully present or maximally dense. For topographic types such as elevation, this represents relative height, where 0.0 corresponds to flat terrain and 1.0 corresponds to the highest or most mountainous terrain in the scene."),
});

const MarkerSchema = z.object({
    type: z.string().describe("The semantic category of the marker, identifying what the marker represents or highlights."),
    attention: z.number().int().min(0).max(10).describe(
        "The relative importance of the marker on a scale from 0 to 10. 0 means the marker has no particular importance, while 10 means it is extremely important and should receive the highest attention."
    ),
});

export const TileSchema = z.object({
    dimensions: z.object({
        width: z.number().int().describe("The physical width of the tile in meters."),
        height: z.number().int().describe("The physical height of the tile in meters."),
    }).describe("The physical dimensions of the rectangular tile. The tile coordinate system starts at (0,0) and extends to (width,height)."),
    terrain: z.array(TerrainSchema).describe(
        "Terrain and environmental properties detected or inferred for this tile. Each entry represents one semantic terrain type and its associated value."
    ),
    markers: z.array(MarkerSchema).describe(
        "Important objects, locations, or features within the tile that should receive attention. Each marker has a semantic type and an importance level."
    ),
});

export type TileData = z.infer<typeof TileSchema>;