import { generateReply } from "../services/anthropic.service.js";
import { ChronicleEventType } from "../../engine/chronicle/chronicle.js";
import { getFrequencyPhrase, getRecencyPhrase } from "./phraseology.js";
import { Game } from "../../engine/core/game.js";
import { Character } from "../../engine/core/character.js";
import { DirectionSummary, LocationDirectionDescription, LocationProfile } from "../types.js";

const SHARED_SCENE_DESCRIPTION_PROMT: string =
`You are a game writer.
Describe from a second-person point of view what our main character transition
see at his current location.

Rule:
- Answer directly

Description should:
- Focus on what he see in this location.
- Describe the lansdcape surrounding him.
- Only contain details mentioned by  "Description of current location"
- Contain max 40 words
- Only contain description text, no prefix, suffix or headings
- Translate respons into Swedish.
`;

const SHARED_SCENE_TRANSITION_PROMT: string =
`You are a game writer.
Describe from a second-person point of view how the landscape change when our
main character transition form his previous location to his current location.

Rule:
- Answer directly

Description should:
- Focus on what he see on the new location.
- Describe how the lansdcape changed compares to previous location.
- Only contain details mentioned by "Description of previous location" and "Description of current location"
- Emphasizes details he see in the new location.
- Emphasizes details he left behind.
- Contain max 40 words
- Only contain description text, no prefix, suffix or headings
- Translate respons into Swedish.
`;

const SHARED_LOCATION_DIRECTION_PROMT: string =
`You are a game writer. Our main character is standing in a location and looking at a different location.
He is considering going there. Describe from a second-person point of view what he see at the "location of interest",
and how it compares to his "current location".

Description should:
- Focus on what he see in the "location of interest".
- Describe how the lansdcape compares to where he is now.
- Only contain details mentioned by "Description of location of interest" and "Description of current location"
- Emphasizes details he see in the "location of interest".
- Contain max 30 words
- Only contain description text, no prefix, suffix or headings
- Translate respons into Swedish.
`;

const ADJACENT_SUMMARY_SHARED_PROMT: string =
`You are a game writer. Our main character is standing in a location and is trying to get a picture of the surrounding regions.
Describe from a second-person point of view what impression he gets from the surroundings based on provided "Surrounding summary",
and how familiar he is with different directions provided as "Personal memories".

Rule:
- Answer directly

Respons should:
- Not contain more than 40 words.
- Mention that it's the distant surrounding regions.
- Be straight forward.
- Only contain description text, no prefix, suffix or headings
- Only include details from provided "Surrounding summary" and "Personal memories".
- Translate respons into Swedish.
`;

const QUADRANT_SUMMARY_SHARED_PROMT: string =
`You are a game writer. Our main character is standing in a location and is trying to get a picture of his close locality.
Describe from a second-person point of view what impression he gets from the surroundings based on provided "Surrounding summary",
and how familiar he is with different places provided as "Personal memories".

Rule:
- Answer directly

Respons should:
- Not contain more than 40 words.
- Mention that it's the his close locality.
- Be straight forward.
- Only contain description text, no prefix, suffix or headings
- Only include details from provided "Surrounding summary" and "Personal memories".
- Translate respons into Swedish.
`;

export class Author {
    private _game: Game;

    constructor(game: Game) {
        this._game = game;
    }

    public async describeScene(location: LocationProfile): Promise<string> {
        const instructions = `
            Description of location:
            - ${location.description}
        `;

        return await generateReply(instructions, { sharedPromt: SHARED_SCENE_DESCRIPTION_PROMT });
    }

    public describeDirection(character: Character, currentLocation: LocationProfile, premisesLocation: LocationProfile): Promise<LocationDirectionDescription> {
        const memories = character.findMemories({
            types: [ChronicleEventType.Enter],
            locationId: premisesLocation.key,
        });

        const frequency = memories.length;
        const recency = frequency > 0 ? this._game.getTime() - memories[0].timestamp : -1;

        const instruction = `
            Description of location of interest:
            - ${premisesLocation.description}

            Description of current location:
            - ${currentLocation.description}

            Details about our character:
            - He has just arrived to the new location.
            - He has been here ${getFrequencyPhrase(frequency)}.
            - He has been here ${getRecencyPhrase(recency)}.
        `;

        //const response = await 
        return generateReply(instruction, { sharedPromt: SHARED_LOCATION_DIRECTION_PROMT }).then((response) => {
            console.log(`Finish direction profile request ${premisesLocation.key}`);

            return {
                key: premisesLocation.key,
                description: response,
            };
        });

        //return requests;
    }

    public describeDirections(character: Character, currentLocation: LocationProfile, premisesLocations: LocationProfile[]): Promise<LocationDirectionDescription>[] {
        return premisesLocations.map((premisesLocationProfile, i) => {
            const memories = character.findMemories({
                types: [ChronicleEventType.Enter],
                locationId: premisesLocationProfile.key,
            });

            currentLocation

            const frequency = memories.length;
            const recency = frequency > 0 ? this._game.getTime() - memories[0].timestamp : -1;

            const instruction = `
                Description of location of interest:
                - ${premisesLocationProfile.description}

                Description of current location:
                - ${currentLocation.description}

                Details about our character:
                - He has just arrived to the new location.
                - He has been here ${getFrequencyPhrase(frequency)}.
                - He has been here ${getRecencyPhrase(recency)}.
            `;

            //const response = await 
            return generateReply(instruction, { sharedPromt: SHARED_LOCATION_DIRECTION_PROMT }).then((response) => {
                console.log(`Finish direction profile request ${i}`);

                return {
                    key: premisesLocationProfile.key,
                    description: response,
                };
            });
        });

        //return requests;
    }

    public async describeSceneTransition(character: Character, fromLocation: LocationProfile, toLocation: LocationProfile): Promise<string> {
        const memories = character.findMemories({
            types: [ChronicleEventType.Enter],
            locationId: toLocation.key,
        });

        const frequency = memories.length;
        const recency = frequency > 0 ? this._game.getTime() - memories[0].timestamp : -1;

        const instructions = `
            Description of previous location:
            - ${fromLocation.description}

            Description of current location:
            - ${toLocation.description}

            Details about our character:
            - He has just arrived to the new location.
            - He has been here ${getFrequencyPhrase(frequency)}.
            - He has been here ${getRecencyPhrase(recency)}.
        `;

        return await generateReply(instructions, { sharedPromt: SHARED_SCENE_TRANSITION_PROMT });
    }

    public async summarizeAdjacentDirections(character: Character, adjacentDirectionsSummary: DirectionSummary): Promise<string> {
        const personalInstructions = adjacentDirectionsSummary.directionProfiles.map((directionProfile) => {
            return [directionProfile.directionName, this._getPersonalInstructions(character, directionProfile.profile.key)].join('\n\n');
        });

        const instructions = `
            Surrounding summary:
            - ${adjacentDirectionsSummary.summary}

            Personal memories:
            ${personalInstructions}
        `;

        return await generateReply(instructions, { sharedPromt: ADJACENT_SUMMARY_SHARED_PROMT });
    }

    public async summarizeQuadranDirections(character: Character, quadranDirectionsSummary: DirectionSummary): Promise<string> {
        const personalInstructions = quadranDirectionsSummary.directionProfiles.map((directionProfile) => {
            return [directionProfile.directionName, this._getPersonalInstructions(character, directionProfile.profile.key)].join('\n\n');
        });

        const instructions = `
            Surrounding summary:
            - ${quadranDirectionsSummary.summary}

            Personal memories:
            ${personalInstructions.join('\n\n')}
        `;

        return await generateReply(instructions, { sharedPromt: QUADRANT_SUMMARY_SHARED_PROMT });
    }

    private _getPersonalInstructions(character: Character, nodeId: string): string {
        const locationMetric = character.getMetricsByLocation(nodeId, this._game.getTime());
        return [
            `- He has been here ${getFrequencyPhrase(locationMetric.frequency)}`,
            `- He has been here ${getRecencyPhrase(locationMetric.recency)}`,
        ].join('\n');
    }
}
