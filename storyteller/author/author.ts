import { ExplorerLocationProfile } from "../explorer/explorer";
import { generateReply } from "../services/anthropic.service";
import { LocationProfileContext } from "../types";
import { getFrequencyPhrase, getRecencyPhrase } from "./phraseology";
import { SHARED_ADJACENT_DIRECTION_PROMT } from "./promts/adjacent-direction";
import { SHARED_ENTER_WORLD_DESCRIPTION_PROMT } from "./promts/enter-world";
import { PROXIMITY_SHARED_PROMT } from "./promts/proximity";
import { SHARED_QUADRANT_DIRECTION_PROMT } from "./promts/quadrant-direction";
import { SHARED_SCENE_TRANSITION_PROMT } from "./promts/scene-transition";

export class Author {
    public describeEnterWorld(current: ExplorerLocationProfile): Promise<string> {
        const instructions = `
            Description of location:
            - ${current.description}
        `;

        return generateReply(instructions, { sharedPromt: SHARED_ENTER_WORLD_DESCRIPTION_PROMT });
    }

    public describeSceneTransition(from: ExplorerLocationProfile, to: ExplorerLocationProfile, toContext: LocationProfileContext): Promise<string> {
        const instructions = `
            Description of previous location:
            - ${from.description}

            Description of current location:
            - ${to.description}

            Details about our character:
            - He has just arrived to the new location.
            - He has been here ${getFrequencyPhrase(toContext.frequency)}.
            - He has been here ${getRecencyPhrase(toContext.recency)}.
        `;

        return generateReply(instructions, { sharedPromt: SHARED_SCENE_TRANSITION_PROMT });
    }

    public describeProximity(proximityProfile: ExplorerLocationProfile, contexts: LocationProfileContext[]): Promise<string> {
        const personalInstructions = contexts.map((context) => {
            return [context.directionName, this._getPersonalInstructions(context)].join('\n\n');
        });

        const instructions = `
            Surrounding summary:
            - ${proximityProfile.description
            }

            Personal memories:
            ${personalInstructions}
        `;

        return generateReply(instructions, { sharedPromt: PROXIMITY_SHARED_PROMT });
    }

    public describeAdjacentDirection(current: ExplorerLocationProfile, adjacent: ExplorerLocationProfile, context: LocationProfileContext): Promise<string> {
        const instruction = `
            Description of location of interest:
            - ${adjacent.description}

            Description of current location:
            - ${current.description}

            Details about our character:
            - He has just arrived to the new location.
            - He has been here ${context.frequency}.
            - He has been here ${context.recency}.
        `;

        return generateReply(instruction, { sharedPromt: SHARED_ADJACENT_DIRECTION_PROMT });
    }

    public describeQuadrantDirection(current: ExplorerLocationProfile, quadrant: ExplorerLocationProfile, context: LocationProfileContext): Promise<string> {
        const instruction = `
            Description of location of interest:
            - ${quadrant.description}

            Description of current location:
            - ${current.description}

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
