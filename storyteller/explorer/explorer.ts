import { getLocationProfiles } from "../../location-profile-repository";
import { generateJSONReply, generateReply } from "../services/anthropic.service";
import { LocationProfile, LocationProfileContext } from "../types";
import { PROXIMITY_DESCRIPTION_SHARED_PROMT } from "./promts/proximity-description";
import { EXPLORER_TILE_DESCRIPTION_PROMT } from "./promts/tile-description";

export type ExplorerLocationProfile = {
    key: string;
    description: string;
    summary: string;
    reminiscence: string;
}

type LocationProfileResponse = {
    locations: ExplorerLocationProfile[];
};

export class Explorer {
    private _explorationAtlas: Map<string, Promise<ExplorerLocationProfile>> = new Map();

    public load(worldId: number): void {
        console.log('load', worldId);

        getLocationProfiles().then((result) => {
            result.forEach((profile) => {
                this._explorationAtlas.set(profile.key, profile);
            });

            console.log('Location profiles loaded', this._explorationAtlas.size);
        });
    }

    public getLocationDescription(locationProfile: LocationProfile): Promise<ExplorerLocationProfile> {
        if (this._explorationAtlas.has(locationProfile.key)) {
            return this._explorationAtlas.get(locationProfile.key)!;
        }

        const promt = this._createInstruction(locationProfile);
        const descriptionRequest = generateJSONReply(promt, { sharedPromt: EXPLORER_TILE_DESCRIPTION_PROMT }).then((response) => {
            try {
                return (response as LocationProfileResponse).locations[0];
            } catch (e) {
                throw Error('Could not generate description',);
            }
        });

        this._explorationAtlas.set(locationProfile.key, descriptionRequest);
        return descriptionRequest;
    }

    public async getProximityDescription(currentProfile: LocationProfile, proximityProfiles: LocationProfile[], contexts: LocationProfileContext[]): Promise<ExplorerLocationProfile> {
        const currentDescription = this.getLocationDescription(currentProfile).then((description) => description.description);
        const proximityRequests = proximityProfiles.map((profile) => this.getLocationDescription(profile));
        const proximityDescriptions = Promise.all(proximityRequests).then((descriptions) => {
            return descriptions.map((description, i) => {
                return [
                    `## ${contexts[i].directionName}`,
                    description.description,
                ].join('\n');
            }).join('\n\n');
        });

        const description = await Promise.all([currentDescription, proximityDescriptions]).then(([current, proximity]) => {
            const instructions = `
                # Proximity location descriptions
                ${proximityDescriptions}

                # Current location description
                ${currentDescription}
            `;

            return generateReply(instructions, { sharedPromt: PROXIMITY_DESCRIPTION_SHARED_PROMT });
        });

        // CACHE !!!

        return {
            key: currentProfile.key,
            description: description,
            summary: description,
            reminiscence: description,
        };
    }

    private _createInstruction(locationProfile: LocationProfile): string {
        const shema = {
            locations: [{
                key: locationProfile.key,
                description: '__GENERATE_DESCRIPTION__',
                summary: '__GENERATE_SUMMARY__',
                reminiscence: '__GENERATE_REMINISCENCE__',
                _hint_location_spatial_markers: locationProfile.spatialMarkers,
                _hint_location_landmarks: locationProfile.landmarks,
            }]
        };

        const instructionText = [
            'Schema:',
            JSON.stringify(shema, null, 4),
        ].join('\n');

        return instructionText;
    }
}

export const explorer = new Explorer();