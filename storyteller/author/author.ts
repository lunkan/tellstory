import { generateReply } from "../services/anthropic.service";
import { LocationProfileContext } from "../types";
import { getFrequencyPhrase, getRecencyPhrase } from "./phraseology";
import { SHARED_ADJACENT_DIRECTION_PROMT } from "./promts/adjacent-direction";
import { SHARED_ENTER_WORLD_DESCRIPTION_PROMT } from "./promts/enter-world";
import { SHARED_IMMEDIANCY_DESCRIPTION_PROMT } from "./promts/immediacy";
import { SHARED_OVERVIEW_DESCRIPTION_PROMT } from "./promts/overview";
import { PROXIMITY_SHARED_PROMT } from "./promts/proximity";
import { SHARED_QUADRANT_DIRECTION_PROMT } from "./promts/quadrant-direction";
import { SHARED_SCENE_TRANSITION_PROMT } from "./promts/scene-transition";

export class Author {
    public describeEnterWorld(current: string): Promise<string> {
        const instructions = `
            Description of location:
            ${current}
        `;

        return generateReply(instructions, { sharedPromt: SHARED_ENTER_WORLD_DESCRIPTION_PROMT });
    }

    public describeImmediacy(immediacy: string, context: LocationProfileContext): Promise<string> {
        const instructions = `
            Description of current location:
            ${immediacy}
        `;

        return generateReply(instructions, { sharedPromt: SHARED_IMMEDIANCY_DESCRIPTION_PROMT });
    }

    public describeOverview(overview: string, context: LocationProfileContext): Promise<string> {
        const instructions = `
            Description of current location:
            ${overview}

            Visibility:
            The player can currently see up to approximately ${Math.round(context.size / 2)} km.
        `;

        return generateReply(instructions, { sharedPromt: SHARED_OVERVIEW_DESCRIPTION_PROMT });
    }

    public describeSceneTransition(from: string, to: string, toContext: LocationProfileContext): Promise<string> {
        const instructions = `
            Description of previous location:
            ${from}

            Description of current location:
            ${to}

            Details about our character:
            - He has just arrived to the new location.
            - He has been here ${getFrequencyPhrase(toContext.frequency)}.
            - He has been here ${getRecencyPhrase(toContext.recency)}.
        `;

        return generateReply(instructions, { sharedPromt: SHARED_SCENE_TRANSITION_PROMT });
    }

    public describeProximity(proximity: string, contexts: LocationProfileContext[]): Promise<string> {
        const personalInstructions = contexts.map((context) => {
            return [context.directionName, this._getPersonalInstructions(context)].join('\n\n');
        });

        const instructions = `
            Surrounding summary:
            ${proximity}

            Personal memories:
            ${personalInstructions}
        `;

        return generateReply(instructions, { sharedPromt: PROXIMITY_SHARED_PROMT });
    }

    public describeAdjacentDirection(current: string, adjacent: string, context: LocationProfileContext): Promise<string> {
        const instruction = `
            Description of location of interest:
            ${adjacent}

            Description of current location:
            ${current}

            Details about our character:
            - He has just arrived to the new location.
            - He has been here ${context.frequency}.
            - He has been here ${context.recency}.
        `;

        return generateReply(instruction, { sharedPromt: SHARED_ADJACENT_DIRECTION_PROMT });
    }

    public describeQuadrantDirection(current: string, quadrant: string, context: LocationProfileContext): Promise<string> {
        const instruction = `
            Description of location of interest:
            ${quadrant}

            Description of current location:
            ${current}

            Details about our character:
            - He has just arrived to the new location.
            - He has been here ${context.frequency}.
            - He has been here ${context.recency}.
        `;

        return generateReply(instruction, { sharedPromt: SHARED_QUADRANT_DIRECTION_PROMT });
    }

    private _getPersonalInstructions(context: LocationProfileContext): string {
        return [
            `- He has been here ${getFrequencyPhrase(context.frequency)}`,
            `- He has been here ${getRecencyPhrase(context.recency)}`,
        ].join('\n');
    }
}

export const author = new Author();
