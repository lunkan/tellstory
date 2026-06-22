import { Character } from "../../engine/core/character";
import { DescriptionMessage } from "../../shared/src/message";
import { author } from "../../storyteller/authors/author";
import { explorer } from "../../storyteller/authors/explorer";
import { websocketService } from "../websocket/websocket-service";

export async function describeSceneTransition(eventId: string, player: Character): Promise<void> {
    const currentNode = player.getCurrentLocation();
    const previousNode = player.getPreviousLocation();

    // Pre-fetch LocationsProfiles - remove when sure explorer handle async request
    await explorer.getLocationProfiles(player.getAdjacent3DLocations());

    const currentLocation = await explorer.getLocationProfile(currentNode);
    const previousLocation = await explorer.getLocationProfile(previousNode);

    if (!previousLocation || !currentLocation) {
        return;
    }

    author.describeSceneTransition(player, previousLocation, currentLocation).then((sceneTransition) => {
        websocketService.sendMessage({
            eventId,
            type: 'sceneTransition',
            text: sceneTransition,
            attention: 5,
        } as DescriptionMessage);
    });
}
