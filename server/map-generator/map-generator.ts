import { z } from "zod";
import type OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod.mjs";
import { generateResponse } from "../llm-gateway/open-ai-gateway";
import { TileMap, TileMapSchema } from "../../engine/schemas/tile-map-json-schema";
import { TileData } from "../../engine/schemas/tile-json-schema";

import exampleTileMapJson from '../../engine/schemas/tile-map-json-example.json' with { type: 'json' };

/*
optional objects

- resident house
- trees
- roads or streets
- walls and hedges
*/


/*const instructions = `
Transform the supplied tile data into a geometric tile-map representation.

The input describes a rectangular tile containing terrain properties and important markers.
The output should represent the information using geometric objects.

GENERAL RULES

- Preserve the tile dimensions from the input.
- The output coordinate system starts at (0,0) in the bottom-left corner of the tile.
- X coordinates increase from left to right.
- Y coordinates increase from top to bottom.
- All coordinates and dimensions are expressed in meters.
- Keep all generated geometry within the tile boundaries.
- Do not invent objects or information that is not supported by the input. !!!!
- Prefer simple geometric representations.
- When several geometric representations are possible, choose the simplest one that adequately represents the input.

TERRAIN

-- only use terrain to fillout houses etc.

For each terrain entry, create a geometric representation of the terrain type.

- Use the terrain type to determine what the geometry represents.
- Use the terrain value to determine the extent, density, size, or other appropriate geometric representation of that terrain.
- A normalized value of 0 means that the terrain property is absent.
- A normalized value of 1 means that the terrain property is fully present or has maximum density.
- Represent areas such as forest, grassland, urban areas, or water as polygons or other appropriate area-based shapes.
- Represent linear terrain features as vectors when appropriate.
- Represent approximately circular features as circles when appropriate.
- Represent rectangular or regularly shaped features as rectangles when appropriate.

MARKERS

For each marker, create a geometric object representing the location or extent of the marker.

- Use the marker type to determine the appropriate geometric representation.
- Preserve the attention value from the input.
- Do not create geometry solely because of a high attention value; attention describes importance, not physical size.

SHAPE SELECTION

Choose shapes according to the following guidelines:

- circle: approximately circular objects or locations.
- rectangle: rectangular or approximately rectangular objects.
- polygon: irregular areas or shapes with multiple vertices.
- line: linear features such as walls, roads, paths, boundaries, or other elongated features.

OUTPUT

Return one output object for each marker represented in the input.

-- Each output object should contain should be objvious by schema??

Each output object should contain:
- a semantic type
- an attention value
- a concise description
- its position
- a geometric shape

The output must conform exactly to the supplied JSON schema.
`;*/


// - Prefer simple geometric representations.

const instructions = `
The input describes a rectangular tile containing terrain properties and important markers.
The output should represent the information using geometric objects.
Transform the input into a geometric tile-map representation.

TRANSFORMATION RULES

- Preserve the tile dimensions from the input.
- The output coordinate system starts at (0,0) in the bottom-left corner of the tile.
- X coordinates increase from left to right.
- Y coordinates increase from top to bottom.
- All coordinates and dimensions are expressed in meters.
- Keep all generated geometry within the tile boundaries.
- Choose the shape that most adequately represents the input.

MARKERS

- Every marker in the input MUST be represented by an object in the output.
- Do not omit, merge, or discard markers.
- Preserve the marker's semantic type.
- Preserve the marker's attention value.
- Create an appropriate geometric shape for each marker based on its type
  and the information available in the input.
- The marker's description should briefly explain what the object represents.

TERRAIN

- Terrain entries MUST NOT be directly represented as objects in the output.
- Do not create an output object simply because a terrain entry exists.
- Terrain information should instead be used as contextual information when
  deciding how to represent markers and when deciding whether additional
  objects should reasonably exist.

INFERRED OBJECTS

In addition to objects representing the input markers, you MAY generate
additional objects that are not explicitly represented by a marker.

Only generate inferred objects from the following allowed categories:

- resident house
- trees
- roads or streets
- walls and hedges

Do not generate inferred objects belonging to any other category.

Inferred objects should only be added when there is reasonable evidence
that they would exist based on the terrain, markers, or their spatial
relationship.

Do not add objects merely to make the map more detailed.

When generating inferred objects:
- Use the terrain information as contextual evidence.
- Consider the location and type of existing markers.
- Consider realistic spatial relationships between objects.
- Prefer plausible and coherent arrangements over arbitrary placement.
- Keep generated objects within the tile boundaries.
- Do not contradict information represented by the markers.

TERRAIN-BASED REASONING

Use terrain information to influence the placement and characteristics of
inferred objects, but do not expose the terrain itself as an output object.

For example:
- Forest terrain may reasonably result in trees.
- Suitable non-forested terrain near residential markers may reasonably
  result in resident houses.
- Roads or streets may reasonably connect or provide access to houses
  or other relevant markers.
- Walls or hedges may reasonably appear around residential areas or
  along property boundaries.

These are examples of possible relationships, not requirements. Only
generate an inferred object when it is reasonably supported by the input.

INFERENCE LIMITS

Inference must be conservative.

Do not assume that every possible object exists.
Do not generate objects simply because they are common in the real world.
Only generate an inferred object when the available terrain or marker
information provides a reasonable basis for its presence.

When there is insufficient evidence, omit the inferred object.

OUTPUT COMPLETENESS

The output must contain every input marker and may additionally contain
reasonable inferred objects from the allowed list.

Do not generate any other objects.

The output must conform exactly to the supplied output schema.
`;

export async function generateTileMap(tile: TileData): Promise<TileMap | null> {
    const input: OpenAI.Responses.ResponseInput = [{
        role: "user",
        content: `
INPUT TILE:
${JSON.stringify(tile)}
        `,
    }];

    return Promise.resolve(exampleTileMapJson) as Promise<TileMap | null>;

    /*const text = await generateResponse(instructions, input, {
        format: zodTextFormat(TileMapSchema, 'tileMap'),
    });

    try {
        return JSON.parse(text);
    } catch (e) {
        console.log('GENERAT MAP FAIL', e);
        return null;
    }*/
}