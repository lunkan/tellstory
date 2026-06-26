import { JSON_INSTRUCTION_RULES } from "./json-instruction-rules";

/**
 * SCHEMA
 {
    key: string,
    description: '__GENERATE_DESCRIPTION__',
    summary: '__GENERATE_SUMMARY__',
    reminiscence: '__GENERATE_REMINISCENCE__',
    _hint_location_spatial_markers: [{
        type: string, // Terrain type
        value: number, // Amount value  0 - 1 
    }}
}
*/

export const EXPLORER_TILE_DESCRIPTION_PROMT: string =
    `You are an scientific explorer.
Describe location attributes based on provided spatial_markers.
Use provided "Schema" below. Replace placeholders and return JSON with preserved structure.

Rules:
${JSON_INSTRUCTION_RULES}
- Replace ONLY "__GENERATE_DESCRIPTION__", "__GENERATE_SUMMARY__" & "__GENERATE_REMINISCENCE__" values.

Property "description" should:
- Use "_hint_location_spatial_markers" to replace "__GENERATE_DESCRIPTION__" with a generated description of the location.
- Not contain more than 80 words.
- Only include details from spatial markers.
- Contain 1-3 prominent natural features inferred from the spatial markers.
- Translate respons into Swedish.

Property "summary" should:
- Use generated "description" to generated a summary replacing "__GENERATE_SUMMARY__". 
- Not contain more than 15 words.
- Only include details from "description".
- Translate respons into Swedish.

Property "reminiscence" should:
- Use generated "description" to generated a short text to replace "__GENERATE_REMINISCENCE__".
- Contain the most prominent attributes of the descrition.
- Not contain more than 8 words.
- Only include details from "description".
- Translate respons into Swedish.

_hint_location_spatial_markers rules:
- property "type" describes a terrain or infrastructure type present in the location.
- property "value" describes how prominent the terrain type is.
- property "value" is a number between 0 and 1.
- If the value of property "value" is high - the terrain is very prominent. If low - not so prominent.
    Example A: "elevation" = 1 - the location is mountains. "elevation" = 0 - the location is flatland.
    Example B: "forrest" = 1 - the location contains dense forrest. "forrest" = 0.2 - the location contains sparse trees.
- property "direction" if present - describes the direction of the terrain or infrastructure
    If a spatial marker contains a direction, include the direction when describing that feature.
    Spatial markers with the same type should be interpreted as one coherent features and not as separate.
- property "attention" describes how much attention the description should pay to the terrain or infrustructure.
    Features with higher attention values should receive proportionally more detail and prominence in the description.
    Features with attention below 0.2 may be mentioned briefly or omitted if more important features exist.
`;
