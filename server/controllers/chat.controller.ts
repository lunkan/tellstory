/*import type { Request, Response } from "express";
import { createGame } from "../../engine/core/engine.js";
import { Explorer } from "../../storyteller/authors/explorer.js";
import { ChronicleEventType } from "../../engine/chronicle/chronicle.js";
import { Reply } from "../../storyteller/types.js";
import { createAuthor } from "../../storyteller/storyteller.js";
import { sendLocationMessage } from "../websocket/websocket-service.js";

type ChatRequest = { message: string };

const currentGame = createGame();
currentGame.newPlayer('Fantomen', { x: 0, y: 0, z: 2});

const explorer = new Explorer();
const author = createAuthor(currentGame);

export async function postChat(
  req: Request<unknown, unknown, ChatRequest>,
  res: Response,
) {
  try {
    const { message } = req.body;
    const player = currentGame.getPlayer('Fantomen');
    if (!player) {
      throw Error('No player!');
    }

    currentGame.newTurn();

    let directionMessage: string = '';
    switch (message.trim().toLocaleLowerCase()) {
      case 'q':
        player.moveToAdjacent(-1, 1); // North East
        directionMessage = 'Du går mot nordöst.'
        break;
      case 'w':
        player.moveToAdjacent(0, 1); // North
        directionMessage = 'Du går norrut.'
        break;
      case 'e':
        player.moveToAdjacent(1, 1); // North west
        directionMessage = 'Du går mot nordväst.'
        break;
      case 'd':
        player.moveToAdjacent(1, 0); // West
        directionMessage = 'Du går västerut.'
        break;
      case 'c':
        player.moveToAdjacent(1, -1); // South west
        directionMessage = 'Du går mot sydväst.'
        break;
      case 'x':
        player.moveToAdjacent(0, -1); // South
        directionMessage = 'Du söderut.'
        break;
      case 'z':
        player.moveToAdjacent(-1, -1); // South east
        directionMessage = 'Du går mot sydöst.'
        break;
      case 'a':
        player.moveToAdjacent(-1, 0); // East
        directionMessage = 'Du går österut.'
        break;

        // Parent
      case 's':
        player.moveToParent();
        break;

      // Quadrants
      case 'i':
        player.moveToQuadrant(0, 0); // Nort east
        directionMessage = 'Du beger dig mot den nordöstliga delen av området.'
        break;
      case 'o':
        player.moveToQuadrant(1, 0); // Nort west
        directionMessage = 'Du beger dig mot den nordvästliga delen av området.'
        break;
      case 'k':
        player.moveToQuadrant(0, 1); // South east
        directionMessage = 'Du beger dig mot den sydöstliga delen av området.'
        break;
      case 'l':
        player.moveToQuadrant(1, 1); // South west
        directionMessage = 'Du beger dig mot den sydvästliga delen av området.'
        break;

      default:
        const message = 'No valid direction';
        res.json({ reply: message });
        return;
    }

    player.addMemory({
      type: ChronicleEventType.Enter,
      timestamp: currentGame.getTime(),
    });

    //const sceneTransition = 'You have entered a new world'; // await author.describeSceneTransition(player);

    const currentNode = player.getCurrentLocation();
    const previousNode = player.getPreviousLocation();

    const eventId = `event@${currentGame.getTime()}`;
    console.log('***** enter ******');
    sendLocationMessage({
        eventId,
        type: 'locationDescription',
        descriptionType: 'enter',
        text: directionMessage,
    });

    const parentNode = currentGame.world.findParentNode(currentNode.key);
    const adjacentNodes = currentGame.world.findAdjacentNodes(currentNode.key);
    const quadrantNodes = currentGame.world.findQuadrantNodes(currentNode.key);



    // METRICS
    /*const currentTerrainMetric = currentNode.tile?.getTerrainMetrics() || {};

    const adjacentMetricsData = adjacentNodes.map((node) => {
      return {
        id: node.key.id,
        metric: node.tile?.getTerrainMetrics() || {},
       } as MetricData;
    });

    const adjacentMetrics = adjacentMetricsData.map((adjacentMetric) => adjacentMetric.metric);
    const adjacentSumMetrics = getSquashedMetric(adjacentMetrics);
    adjacentMetricsData.forEach((metricData) => {
      const neighbourDistinctnessMetric = compareMetric(metricData.metric, adjacentSumMetrics);
      const relativeDistinctnessMetric = compareMetric(metricData.metric, currentTerrainMetric);

      metricData.metric.neighbourDistinctness = sumMetric(neighbourDistinctnessMetric); // Weights ? Sigmoid ?
      metricData.metric.relativeDistinctness = sumMetric(relativeDistinctnessMetric); // Weights ? Sigmoid ?
      metricData.metric = {
        ...player.getMetricsByLocation(metricData.id, currentGame.getTime()),
        ...metricData.metric,
      }

      Object.keys(relativeDistinctnessMetric).forEach((key) => {
        metricData.metric[key] = relativeDistinctnessMetric[key];
      });
    });

    const quadrantMetricsData = quadrantNodes.map((node) => {
      return {
        id: node.key.id,
        metric: node.tile?.getTerrainMetrics() || {},
       } as MetricData;
    });

    const quadrantMetrics = quadrantMetricsData.map((quadrantMetric) => quadrantMetric.metric);
    const quadrantSumMetrics = getSquashedMetric(quadrantMetrics);
    quadrantMetricsData.forEach((metricData) => {
      const neighbourDistinctnessMetric = compareMetric(metricData.metric, quadrantSumMetrics);
      metricData.metric.neighbourDistinctness = sumMetric(neighbourDistinctnessMetric); // Weights ? Sigmoid ?
      metricData.metric = {
        ...player.getMetricsByLocation(metricData.id, currentGame.getTime()),
        ...metricData.metric,
      }
    });/

    console.log('GET LOCATIONS');

    // Pre-fetch LocationsProfiles?
    await explorer.getLocationProfiles(player.getAdjacent3DLocations());

    // Should be stored and fast to
    const parentLocation = await explorer.getLocationProfile(parentNode);
    const currentLocation = await explorer.getLocationProfile(currentNode);
    const previousLocation = await explorer.getLocationProfile(previousNode);
    const adjacentLocations = await explorer.getLocationProfiles(adjacentNodes);
    const quadrantLocations = await explorer.getLocationProfiles(quadrantNodes);

    console.log('FINISH LOCATIONS');

    /*const sceneTransition = previousLocation && currentLocation ? await author.describeSceneTransition(player, previousLocation, currentLocation) : 'You have entered a new world';

    sendLocationMessage({
        eventId,
        type: 'locationDescription',
        descriptionType: 'sceneTransition',
        text: sceneTransition,
    });/

    if (!previousLocation || !currentLocation) {
      res.json({});
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

    //const quadrantDirectionsSummary = await explorer.getQuadrantSummary(currentNode, quadrantNodes);
    //const quadrantSummary = currentLocation ? await author.summarizeQuadranDirections(player, quadrantDirectionsSummary) : '';

    //const adjacentDirectionsSummary = await explorer.getAdjacentSummary(currentNode, adjacentNodes);
    //const adjacentSummary = currentLocation ? await author.summarizeAdjacentDirections(player, adjacentDirectionsSummary) : '';

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

    /*sendLocationMessage({
        eventId,
        type: 'locationDescription',
        descriptionType: 'adjacentSummary',
        text: adjacentSummary,
    });/

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

    //const premises: LocationDirectionDescription[] = currentLocation ? await author.describeDirections(player, currentLocation, quadrantLocations) : [];
    //const adjacent: LocationDirectionDescription[] = currentLocation ? await author.describeDirections(player, currentLocation, adjacentLocations) : [];

    const reply: Reply = {
      player: player.name,
      currentPoint: currentNode.getPoint(),
      mentalPointOfOrigin: currentNode.getPoint(),
      details: {
        parent: parentNode?.getJSON(),
        current: currentNode?.getJSON(),
        previous: previousNode?.getJSON(),
        adjacent: adjacentNodes.map((node) => node?.getJSON()),
        quadrants: quadrantNodes.map((node) => node?.getJSON()),
      },
      metrics: {
        adjacent: [], //adjacentMetricsData,
        quadrants: [], //quadrantMetricsData,
      },
      locationProfiles: {
        parent: parentLocation,
        current: currentLocation,
        previous: previousLocation,
        adjacent: adjacentLocations,
        quadrants: quadrantLocations
      },
      /*sceneTransition,
      adjacentSummary,
      quadrantSummary,/
      //premises,
      //adjacent,
    };

    res.json({ reply });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}*/
