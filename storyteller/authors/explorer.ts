import { QuadNode } from "../../engine/world/quad-node";
import { createLocationProfile, getLocationProfiles } from "../../location-profile-repository";
import { generateJSONReply, generateReply } from "../services/anthropic.service";
import { DirectionLocationProfile, DirectionSummary, LocationProfile, TerrainSetting } from "../types";
import { getDirectionKey, getDirectionName } from "./phraseology";

type LocationProfileInstructions = {
    key: string,
    _hint_location_spatial_markers: TerrainSetting[], 
};

type LocationProfileResponse = {
    locations: LocationProfile[];
};

const SHARED_PROMT: string =
`You are an scientific explorer.
Describe location attributes based on provided spatial_markers.
Use provided "Schema" below. Replace placeholders and return JSON with preserved structure.

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

const ADJACENT_SUMMARY_SHARED_PROMT: string =
`You are an scientific explorer. Summarize the surrounding regions of a location,
based on provided "Adjacent location descriptions", and how they differ from provided "Current location description".

Rules:
- Describe similare locations in same direction in general terms.
Example: If north east, north and north west directions are covered in forrest - summarize them as northen regions are covered in forrest. 
- Emphasize locations that are unique compared to other locations.
- Ignore describing features of a location that are similar to provided "Current location description".

Respons should:
- Not contain more than 50 words.
- Be straight forward.
- Only include details from provided "Adjacent location descriptions".
- Translate respons into Swedish.
`;

const QUADRANT_SUMMARY_SHARED_PROMT: string =
`You are an scientific explorer. Summarize the subregions of a region,
based on provided "Subregion descriptions".

Rules:
- Describe similare regions in same direction in general terms.
Example: If north east and north west directions are covered in forrest - summarize them as northen parts are covered in forrest. 
- Emphasize regions that are unique compared to other regions.

Respons should:
- Not contain more than 50 words.
- Be straight forward.
- Only include details from provided "Subregion descriptions".
- Translate respons into Swedish.
`;

export class Explorer {
    private _explorationAtlas: Map<string, LocationProfile> = new Map();

    constructor () {
        getLocationProfiles().then((result) => {
            result.forEach((profile) => {
                this._explorationAtlas.set(profile.key, profile);
            });


            console.log('Location profiles loaded', this._explorationAtlas.size);
        });
    }

    public async getAdjacentSummary(currentNode: QuadNode, adjacentNodes: QuadNode[]): Promise<DirectionSummary> {
        const currentProfile = await this.getLocationProfile(currentNode);
        const directionProfiles = await this.getDirectionLocationProfiles(currentNode, adjacentNodes);

        const promt = `
            Adjacent location descriptions:
            ${directionProfiles.map((directionProfile) => {
                return [directionProfile.directionName, directionProfile.profile.reminiscence].join('\n- ');
            }).join('\n\n')}

            Current location description:
            ${currentProfile?.reminiscence}
        `;

        const reply = await generateReply(promt, { sharedPromt: ADJACENT_SUMMARY_SHARED_PROMT });
        return {
            summary: reply,
            directionProfiles,
        };
    }

    public async getQuadrantSummary(currentNode: QuadNode, quadrantNodes: QuadNode[]): Promise<DirectionSummary> {
        const directionProfiles = await this.getDirectionLocationProfiles(currentNode, quadrantNodes);
        const promt = `
            Subregion descriptions:
            ${directionProfiles.map((directionProfile) => {
                return [directionProfile.directionName, directionProfile.profile.reminiscence].join('\n- ');
            }).join('\n\n')}
        `;

        const reply = await generateReply(promt, { sharedPromt: QUADRANT_SUMMARY_SHARED_PROMT });
        return {
            summary: reply,
            directionProfiles,
        };
    }

    public async getLocationProfile(node?: QuadNode): Promise<LocationProfile | undefined> {
        if (!node) {
            return Promise.resolve(undefined);
        }

        return this._fetchProfile(node);
    }

    public async getLocationProfiles(nodes: QuadNode[]): Promise<LocationProfile[]> {
        const profileRequests = nodes.map((node) => this._fetchProfile(node));
        return Promise.all(profileRequests);
    }

    public async getDirectionLocationProfiles(currentNode: QuadNode, directionNodes: QuadNode[]): Promise<DirectionLocationProfile[]> {
        const profileRequests = directionNodes.map((node) => this._fetchProfile(node));
        const profiles = await Promise.all(profileRequests);

        const directionNodeNames = directionNodes.map((node) => {
            const relativePosition = currentNode.getNormalizedRelativePosition(node);
            return relativePosition ? getDirectionName(relativePosition): '-';
        });

        const directionNodeKeys = directionNodes.map((node) => {
            const relativePosition = currentNode.getNormalizedRelativePosition(node);
            return relativePosition ? getDirectionKey(relativePosition) : undefined
        });

        return profiles.map((profile, i) => {
            return {
                directionName: directionNodeNames[i],
                directionKey: directionNodeKeys[i],
                profile,
            };
        });
    }

    private async _fetchProfile(node: QuadNode): Promise<LocationProfile> {
        if (!node.tile) {
            throw Error(`!Missing tile. Node not hybernated: ${node.key.id} `);
        }

        const profile = this._explorationAtlas.get(node.key.id);
        if (profile) {
            return Promise.resolve(profile); // returned cached profile
        }

        const instructions = {
            key: node.key.id,
            _hint_location_spatial_markers: [{
                type: node.tile.type,
                value: node.tile.value,
            }, {
                type: 'elevation',
                value: node.tile.elevation,
            }],  
        };

        const promt = this._createInstruction([instructions]);
        const reply = await generateJSONReply(promt, { sharedPromt: SHARED_PROMT }) as LocationProfileResponse;
        const locationProfile = reply.locations[0];
        this._explorationAtlas.set(locationProfile.key, locationProfile);

        const id = await createLocationProfile(locationProfile);
        console.log('Stored in database', id);

        console.log(`Finish location profile request ${node.key.id}`);
        return locationProfile;
    }

    private _createInstruction(locationInstructions: LocationProfileInstructions[]): string {
        const shema = {
            locations: locationInstructions.map((instruction) => {
                return {
                    key: instruction.key,
                    description: '__GENERATE_DESCRIPTION__',
                    summary: '__GENERATE_SUMMARY__',
                    reminiscence: '__GENERATE_REMINISCENCE__',
                    _hint_location_spatial_markers: instruction._hint_location_spatial_markers,
                }
            }),
        };

        const instructionText = [
            'Schema:',
            JSON.stringify(shema, null, 4),
        ].join('\n');

        return instructionText;
    }
}