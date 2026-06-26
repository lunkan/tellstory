import { QuadNode } from "../../engine/world/quad-node";
import { createLocationProfile, getLocationProfiles } from "../../location-profile-repository";
import { DIRECTION_NAME, getDirectionFromAdjacentVector } from "../../shared/src/direction";
import { generateJSONReply, generateReply } from "../services/anthropic.service";
import { DirectionLocationProfile, DirectionSummary, LocationProfile, TerrainSetting } from "../types";
import { getDirectionKey, getDirectionName } from "./phraseology";
import { EXPLORER_TILE_DESCRIPTION_PROMT } from "./promts/explorer-tile-description";
import tilesJSON from '../../engine/config/tiles.json' with { type: 'json' };

type LocationProfileInstructions = {
    key: string,
    _hint_location_spatial_markers: TerrainSetting[],
};

type LocationProfileResponse = {
    locations: LocationProfile[];
};

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

    constructor() {
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
            return relativePosition ? getDirectionName(relativePosition) : '-';
        });

        const directionNodeKeys = directionNodes.map((node) => {
            const relativePosition = currentNode.getNormalizedRelativePosition(node);
            return relativePosition ? getDirectionKey(relativePosition) : undefined
        });

        return profiles.map((profile, i) => {
            return {
                directionName: directionNodeNames[i],
                directionKey: directionNodeKeys[i], // !
                profile,
            };
        });
    }

    private async _fetchProfile(node: QuadNode): Promise<LocationProfile> {
        if (!node.tile) {
            console.log('fail:node', node?.getPoint());
            throw Error(`!Missing tile. Node not hybernated: ${node.key.id} `);
        }

        const profile = this._explorationAtlas.get(node.key.id);
        if (profile) {
            return Promise.resolve(profile); // returned cached profile
        }


        const terrainMarkers = node.tile.terrain.map((spacialMarker) => ({ type: spacialMarker.type, value: spacialMarker.value }));
        const vectorMarkers = node.tile.vectors.map((spacialVector) => {
            const direction = getDirectionFromAdjacentVector(spacialVector.direction.x, spacialVector.direction.y);
            const tileConfig = tilesJSON.tiles.find((tileConfig) => tileConfig.name === spacialVector.type);

            return {
                type: spacialVector.type,
                value: spacialVector.value,
                direction: DIRECTION_NAME[direction],
                attention: tileConfig?.attentionValue || 0,
            };
        });

        const instructions = {
            key: node.key.id,
            _hint_location_spatial_markers: [...terrainMarkers, ...vectorMarkers],
        };

        const promt = this._createInstruction([instructions]);
        const reply = await generateJSONReply(promt, { sharedPromt: EXPLORER_TILE_DESCRIPTION_PROMT }) as LocationProfileResponse;
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

export const explorer = new Explorer();