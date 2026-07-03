import { getLocationProfiles } from "../../location-profile-repository";
import { generateReply } from "../services/anthropic.service";
import { LocationProfile, LocationProfileContext } from "../types";
import { PROXIMITY_DESCRIPTION_SHARED_PROMT } from "./promts/proximity-description";
import { EXPLORER_TILE_DESCRIPTION_PROMT } from "./promts/tile-description";

export class Explorer {
    private _explorationAtlas: Map<string, Promise<string>> = new Map();

    public load(worldId: number): void {
        console.log('load', worldId);

        getLocationProfiles().then((result) => {
            result.forEach((profile) => {
                this._explorationAtlas.set(profile.key, profile);
            });

            console.log('Location profiles loaded', this._explorationAtlas.size);
        });
    }

    public getLocationDescription(locationProfile: LocationProfile): Promise<string> {
        if (this._explorationAtlas.has(locationProfile.key)) {
            return this._explorationAtlas.get(locationProfile.key)!;
        }

        const promt = this._createInstruction(locationProfile);
        const descriptionRequest = generateReply(promt, { sharedPromt: EXPLORER_TILE_DESCRIPTION_PROMT });
        this._explorationAtlas.set(locationProfile.key, descriptionRequest);
        return descriptionRequest;
    }

    public async getProximityDescription(currentProfile: LocationProfile, proximityProfiles: LocationProfile[], contexts: LocationProfileContext[]): Promise<string> {
        const currentDescription = this.getLocationDescription(currentProfile);
        const proximityRequests = proximityProfiles.map((profile) => this.getLocationDescription(profile));
        const proximityDescriptions = Promise.all(proximityRequests).then((descriptions) => {
            return descriptions.map((description, i) => {
                return [
                    `## ${contexts[i].directionName}`,
                    description,
                ].join('\n');
            }).join('\n\n');
        });

        return await Promise.all([currentDescription, proximityDescriptions]).then(([current, proximity]) => {
            const instructions = `
                # Proximity location descriptions
                ${proximity}

                # Current location description
                ${current}
            `;

            return generateReply(instructions, { sharedPromt: PROXIMITY_DESCRIPTION_SHARED_PROMT });
        });

        // CACHE !!!
    }

    private _createInstruction(locationProfile: LocationProfile): string {
        const shema = {
            locations: [{
                spatialMarkers: locationProfile.spatialMarkers,
                landmarks: locationProfile.landmarks,
                size: locationProfile.size,
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