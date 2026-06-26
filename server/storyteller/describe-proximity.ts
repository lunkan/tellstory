import { Character } from "../../engine/core/character";
import { DescriptionMessage } from "../../shared/src/message";
import { author } from "../../storyteller/authors/author";
import { explorer } from "../../storyteller/authors/explorer";
import { websocketService } from "../websocket/websocket-service";

export async function describeProximity(eventId: string, player: Character): Promise<void> {
    const currentNode = player.getCurrentLocation();
    const adjacentNodes = player.getAdjacentNodes();
    const quadrantNodes = player.getQuadrantNodes();

    const currentLocation = await explorer.getLocationProfile(currentNode);
    if (!currentLocation) {
        return;
    }

    console.log('describeProximity', currentNode.getPoint(), adjacentNodes.map((node) => node.getPoint()));

    /*explorer.getQuadrantSummary(currentNode, quadrantNodes).then((quadrantDirectionsSummary) => {
        author.summarizeQuadranDirections(player, quadrantDirectionsSummary).then((quadrantSummary) => {
            websocketService.sendMessage({
                eventId,
                type: 'quadrantSummary',
                text: quadrantSummary,
                attention: 1,
            } as DescriptionMessage);
        });
    });*/

    explorer.getAdjacentSummary(currentNode, adjacentNodes).then((adjacentDirectionsSummary) => {
        author.summarizeAdjacentDirections(player, adjacentDirectionsSummary).then((adjacentSummary) => {
            websocketService.sendMessage({
                eventId,
                type: 'adjacentSummary',
                text: adjacentSummary,
                attention: 1,
            } as DescriptionMessage);
        });
    });

    explorer.getDirectionLocationProfiles(currentNode, quadrantNodes).then((quadrantDirectionProfiles) => {
        quadrantDirectionProfiles.forEach((quadrantDirectionProfile) => {
            websocketService.sendMessage({
                eventId,
                type: 'quadrantDirection',
                direction: quadrantDirectionProfile.directionKey,
                text: quadrantDirectionProfile.profile.summary,
                attention: 0,
            } as DescriptionMessage);

            /*author.describeDirection(player, currentLocation, quadrantDirectionProfile.profile).then((description) => {
                websocketService.sendMessage({
                    eventId,
                    type: 'quadrantDirection',
                    direction: quadrantDirectionProfile.directionKey,
                    text: description.description,
                    attention: 0,
                } as DescriptionMessage);
            });*/
        });
    });

    explorer.getDirectionLocationProfiles(currentNode, adjacentNodes).then((adjacentDirectionProfiles) => {
        adjacentDirectionProfiles.forEach((adjacentDirectionProfile) => {
            websocketService.sendMessage({
                eventId,
                type: 'adjacentDirection',
                direction: adjacentDirectionProfile.directionKey,
                text: adjacentDirectionProfile.profile.description,
                attention: 0,
            } as DescriptionMessage);

            /*author.describeDirection(player, currentLocation, adjacentDirectionProfile.profile).then((description) => {
                websocketService.sendMessage({
                    eventId,
                    type: 'adjacentDirection',
                    direction: adjacentDirectionProfile.directionKey,
                    text: description.description,
                    attention: 0,
                } as DescriptionMessage);
            });*/
        });
    });
}