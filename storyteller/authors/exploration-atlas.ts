/*import { Tile } from "../../engine/world/tile";
import { World } from "../../engine/world/world";
import { generateJSONReply } from "../services/anthropic.service";
import { LocationProfile } from "../types";

export class ExplorationAtlas {
    private _explorationAtlas: Map<string, LocationProfile> = new Map();
    private _world: World;

    constructor(world: World) {
        this._world = world;
    }

    public async getLocationProfiles(locationKeys: string[]): Promise<LocationProfile[]> {
        const locationProfiles: LocationProfile[] = [];
        const missingProfileKeys: string[] = locationKeys.filter((key) => {
            const locationProfile = this._explorationAtlas.get(key);
            if (locationProfile) {
                locationProfiles.push(locationProfile);
                return false;
            }

            return true;
        });

        const instruction = this._generateLocationProfilesInstruction(missingProfileKeys);
        const generatedLocationProfiles: LocationProfile[] = await this._generateLocationProfiles(instruction);
        const profileLocations = [...locationProfiles, ...generatedLocationProfiles];

        // Return profiles in same order as provided tiles
        return locationKeys.map((key) => profileLocations.find((profile) => profile.key === key)) as LocationProfile[];
    }

    private async _generateLocationProfiles(instructions: string): Promise<LocationProfile[]> {
        const locationProfilesResult: any = await generateJSONReply(instructions);
        const locationProfiles: LocationProfile[] = locationProfilesResult.locations as LocationProfile[];
        locationProfiles.forEach((location) => this._explorationAtlas.set(location.key, location));
        return locationProfiles;
    }

    private _generateLocationProfilesInstruction(locationKeys: string[]): string {
        const locationInstructions = locationKeys
            .map((key) => this._world.findLocation(key))
            .filter((tile) => tile !== undefined)
            .map((tile) => {
                return {
                    key: tile.key,
                    _hint_location_spatial_markers: tile.terrain,
                }
            });
        
        return `
            You are a naturalist.
            Describe location attributes based on provided spatial_markers.

            Schema:
            {
                "locations": [
                ${locationInstructions.map((instruction) => `
                    {
                        "key": "${instruction.key}",
                        "description": "__GENERATE_DESCRIPTION__",
                        "summary": "__GENERATE_SUMMARY__",
                        "reminiscence": "__GENERATE_REMINISCENCE__",
                        "_hint_location_spatial_markers": [
                            ${instruction._hint_location_spatial_markers.map((terrainConfig) => JSON.stringify(terrainConfig, null, 4)).join(',\n')}
                        ],
                    }
                `).join(',\n')}
                ]
            }

            Rules:
            - Preserve exact JSON structure
            - Do not add/remove array items
            - Do not modify types
            - Do not modify options
            - Fields beginning with "_hint_" are contextual guidance
            - Use hint fields to generate placeholder values
            - Replace ONLY "__GENERATE_DESCRIPTION__", "__GENERATE_SUMMARY__", "__GENERATE_REMINISCENCE__" & "__GENERATE_NAME__" values.
            - Return valid JSON only
            - No markdown

            Property "description" should:
            - Use "_hint_location_spatial_markers" to replace "__GENERATE_DESCRIPTION__" with a generated description of the location.
            - Not contain more than 80 words.
            - Be straight forward.
            - Only include details from spatial markers.
            - Contain 1-3 distinctive natural landmarks.
            - Translate respons into Swedish.

            Property "summary" should:
            - Use generated "description" to generated a summary replacing "__GENERATE_SUMMARY__". 
            - Not contain more than 15 words.
            - Be straight forward.
            - Only include details from "description".
            - Translate respons into Swedish.

            Property "reminiscence" should:
            - Use generated "description" to generated a short text to replace "__GENERATE_REMINISCENCE__".
            - Contain the most prominent attributes of the descrition.
            - Start with "The place where" or "The place with"
            - Not contain more than 8 words.
            - Be straight forward.
            - Only include details from "description".
            - Translate respons into Swedish.

            _hint_location_spatial_markers rules:
            - property "type" describes a terrain type present in the location.
            - property "value" describes how prominent the terrain type is.
            - property "value" is a number between 0 and 1.
            - If the value of property "value" is high - the terrain is very prominent. If low - not so prominent.
                Example A: "elevation" = 1 - the location is mountains. "elevation" = 0 - the location is flatland.
                Example B: "forrest" = 1 - the location contains dense forrest. "forrest" = 0.2 - the location contains sparse trees.
        `;
    }
}*/