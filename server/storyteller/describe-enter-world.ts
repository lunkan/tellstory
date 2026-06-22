import { Character } from "../../engine/core/character";
import { DescriptionMessage } from "../../shared/src/message";
import { author } from "../../storyteller/authors/author";
import { explorer } from "../../storyteller/authors/explorer";
import { websocketService } from "../websocket/websocket-service";

export async function describeEnterWorld(eventId: string, player: Character): Promise<void> {
    const currentNode = player.getCurrentLocation();
    const currentLocation = await explorer.getLocationProfile(currentNode);

    if (!currentLocation) {
        return;
    }

    author.describeScene(currentLocation).then((sceneDescription) => {
        websocketService.sendMessage({
            eventId,
            type: 'sceneTransition',
            text: sceneDescription,
            attention: 5,
        } as DescriptionMessage);
    });
}