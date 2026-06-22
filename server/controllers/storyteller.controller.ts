/*import { Character } from "../../engine/core/character";
import { QuadNode } from "../../engine/world/quad-node";
import { gameManager } from "../game/game-manager";
import { GamePod } from "../game/game-pod";
import { sendLocationMessage } from "../websocket/websocket-service";

export async function spawn(player: Character): Promise<void> {
    const gamePod = gameManager.getGamePod();
    if (!gamePod) {
        throw Error('No availible game');
    }

    const { game, author, explorer } = gamePod;
    const currentNode = player.getCurrentLocation();

    console.log('***** spawn ******');
    const eventId = `event@${game.getTime()}`;
    sendLocationMessage({
        eventId,
        type: 'locationDescription',
        descriptionType: 'spawn',
        text: 'Welcome',
    });

    const currentLocation = await explorer.getLocationProfile(currentNode);
    if (!currentLocation) {
        return;
    }

    author.describeScene(currentLocation).then((sceneDescription) => {
        sendLocationMessage({
            eventId,
            type: 'locationDescription',
            descriptionType: 'sceneTransition',
            text: sceneDescription,
        });
    });

    _sendProximityDescriptions(eventId, player);
}

export async function enterScene(player: Character): Promise<void> {
    const gamePod = gameManager.getGamePod();
    if (!gamePod) {
        throw Error('No availible game');
    }

    const { game, author, explorer } = gamePod;
    const currentNode = player.getCurrentLocation();
    const previousNode = player.getPreviousLocation();

    const point = currentNode.getPoint(); //${currentNode.getPoint().x, }
    console.log(`***** enter (x: ${point.x}, y: ${point.y}, z: ${point.z}) ******`);
    const eventId = `event@${game.getTime()}`;
    sendLocationMessage({
        eventId,
        type: 'locationDescription',
        descriptionType: 'enter',
        text: 'TODO', //directionMessage,
    });
    
    //const parentNode = game.world.findParentNode(currentNode.key);
    const adjacentNodes = game.world.findAdjacentNodes(currentNode.key);
    const quadrantNodes = game.world.findQuadrantNodes(currentNode.key);

    console.log('GET LOCATIONS');
    // Pre-fetch LocationsProfiles - remove when sure explorer handle async request
    await explorer.getLocationProfiles(player.getAdjacent3DLocations());

    //const parentLocation = await explorer.getLocationProfile(parentNode);
    const currentLocation = await explorer.getLocationProfile(currentNode);
    const previousLocation = await explorer.getLocationProfile(previousNode);
    console.log('FINISH LOCATIONS');

    if (!previousLocation || !currentLocation) {
        return;
    }

    author.describeSceneTransition(player, previousLocation, currentLocation).then((sceneTransition) => {
        sendLocationMessage({
            eventId,
            type: 'locationDescription',
            descriptionType: 'sceneTransition',
            text: sceneTransition,
        });
    });

    explorer.getQuadrantSummary(currentNode, quadrantNodes).then((quadrantDirectionsSummary) => {
        author.summarizeQuadranDirections(player, quadrantDirectionsSummary).then((quadrantSummary) => {
            sendLocationMessage({
                eventId,
                type: 'locationDescription',
                descriptionType: 'quadrantSummary',
                text: quadrantSummary,
            });
        });
    });

    explorer.getAdjacentSummary(currentNode, adjacentNodes).then((adjacentDirectionsSummary) => {
        author.summarizeAdjacentDirections(player, adjacentDirectionsSummary).then((adjacentSummary) => {
            sendLocationMessage({
                eventId,
                type: 'locationDescription',
                descriptionType: 'adjacentSummary',
                text: adjacentSummary,
            });
        });
    });

    explorer.getDirectionLocationProfiles(currentNode, quadrantNodes).then((quadrantDirectionProfiles) => {
        quadrantDirectionProfiles.forEach((quadrantDirectionProfile) => {
            author.describeDirection(player, currentLocation, quadrantDirectionProfile.profile).then((description) => {
                sendLocationMessage({
                eventId,
                type: 'locationDescription',
                descriptionType: 'quadrantDirection',
                direction: quadrantDirectionProfile.directionKey,
                text: description.description,
                });
            });
        });
    });

    explorer.getDirectionLocationProfiles(currentNode, adjacentNodes).then((adjacentDirectionProfiles) => {
        adjacentDirectionProfiles.forEach((adjacentDirectionProfile) => {
            author.describeDirection(player, currentLocation, adjacentDirectionProfile.profile).then((description) => {
                sendLocationMessage({
                eventId,
                type: 'locationDescription',
                descriptionType: 'adjacentDirection',
                direction: adjacentDirectionProfile.directionKey,
                text: description.description,
                });
            });
        });
    });

    // TODO: describe parent
}

async function _sendProximityDescriptions(eventId: string, player: Character): Promise<void> {
    const gamePod = gameManager.getGamePod();
    if (!gamePod) {
        throw Error('No availible game');
    }

    const { game, author, explorer } = gamePod;
    const currentNode = player.getCurrentLocation();
    //const parentNode = game.world.findParentNode(currentNode.key);
    const adjacentNodes = game.world.findAdjacentNodes(currentNode.key);
    const quadrantNodes = game.world.findQuadrantNodes(currentNode.key);

    const currentLocation = await explorer.getLocationProfile(currentNode);
    if (!currentLocation) {
        return;
    }
    
    explorer.getQuadrantSummary(currentNode, quadrantNodes).then((quadrantDirectionsSummary) => {
        author.summarizeQuadranDirections(player, quadrantDirectionsSummary).then((quadrantSummary) => {
            sendLocationMessage({
                eventId,
                type: 'locationDescription',
                descriptionType: 'quadrantSummary',
                text: quadrantSummary,
            });
        });
    });

    explorer.getAdjacentSummary(currentNode, adjacentNodes).then((adjacentDirectionsSummary) => {
        author.summarizeAdjacentDirections(player, adjacentDirectionsSummary).then((adjacentSummary) => {
            sendLocationMessage({
                eventId,
                type: 'locationDescription',
                descriptionType: 'adjacentSummary',
                text: adjacentSummary,
            });
        });
    });

    explorer.getDirectionLocationProfiles(currentNode, quadrantNodes).then((quadrantDirectionProfiles) => {
        quadrantDirectionProfiles.forEach((quadrantDirectionProfile) => {
            author.describeDirection(player, currentLocation, quadrantDirectionProfile.profile).then((description) => {
                sendLocationMessage({
                eventId,
                type: 'locationDescription',
                descriptionType: 'quadrantDirection',
                direction: quadrantDirectionProfile.directionKey,
                text: description.description,
                });
            });
        });
    });

    explorer.getDirectionLocationProfiles(currentNode, adjacentNodes).then((adjacentDirectionProfiles) => {
        adjacentDirectionProfiles.forEach((adjacentDirectionProfile) => {
            author.describeDirection(player, currentLocation, adjacentDirectionProfile.profile).then((description) => {
                sendLocationMessage({
                eventId,
                type: 'locationDescription',
                descriptionType: 'adjacentDirection',
                direction: adjacentDirectionProfile.directionKey,
                text: description.description,
                });
            });
        });
    });
}*/