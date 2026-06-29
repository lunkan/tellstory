import { ChronicleEventType } from "../../engine/chronicle/chronicle";
import { Character } from "../../engine/core/character";
import { isLocationChangeEvent } from "../../engine/core/events/game-event.config";
import { GameEvent } from "../../engine/core/events/game-event.interface";
import { GameLocationChangeEvent } from "../../engine/core/events/game-location-change-event";
import { DIRECTION, getDirectionFromAdjacentVector, getDirectionFromQuadrantVector } from "../../shared/src/direction";
import { DescriptionMessage, PlayerLocationChangeMessage, PlayerLocationDirection } from "../../shared/src/message";
import { EnvironmentalContext, ProfileGeneratorFactory } from "./profile-generator";
import { websocketService } from "../websocket/websocket-service";
import tilesJSON from '../../engine/config/tiles.json' with { type: 'json' };
import { Storyteller } from "../../storyteller/storyteller";
import { IGameObserver } from "../../engine/types";

export class PlayerObserver implements IGameObserver {
    private _player: Character;
    private _storyteller: Storyteller;
    private _profileGenerator: ProfileGeneratorFactory;

    constructor(player: Character, storyteller: Storyteller, profileGenerator: ProfileGeneratorFactory) {
        this._player = player;
        this._storyteller = storyteller;
        this._profileGenerator = profileGenerator;
    }

    public onEvent(event: GameEvent): void {
        console.log('PlayerObserver:onEvent', event);

        if (isLocationChangeEvent(event)) {
            if (event.playerId === this._player.id) {

                // spacialSnapshot
                const environment = this._profileGenerator.create(event.id);

                this._playerLocationChange(event);

                switch (event.type) {
                    case 'characterSpawn':
                        this._describeIntro(event.id);
                        this._describeEnterWorld(environment);
                        this._describeProxmity(environment);
                        this._describeAdjacentNodes(environment);
                        this._describeQuadrantNodes(environment);
                        break;
                    case 'characterEnter':
                        this._describeSceneTransition(environment);
                        this._describeProxmity(environment);
                        this._describeAdjacentNodes(environment);
                        this._describeQuadrantNodes(environment);
                        break;
                }

                this._player.addMemory({
                    type: ChronicleEventType.Enter,
                    timestamp: event.timestamp,
                });
            }
        }
    }

    private _playerLocationChange(event: GameLocationChangeEvent): void {
        const currentNode = this._player.getCurrentLocation();

        const directions: PlayerLocationDirection[] = [];
        const parentNode = this._player.getParentNode();
        if (parentNode) {
            directions.push({
                direction: DIRECTION.UP,
                movementCost: 0,
                impassible: false,
            });
        }

        const quadrantDirections = this._player.getQuadrantNodes().map((node) => {
            const directionVector = currentNode.getNormalizedRelativePosition(node);
            if (directionVector) {
                const direction = getDirectionFromQuadrantVector(directionVector.x, directionVector.y);

                return {
                    direction,
                    movementCost: 0,
                };
            }
        });

        const adjacentDirections = this._player.getAdjacentNodes().map((node) => {
            const directionVector = currentNode.getNormalizedRelativePosition(node);

            if (directionVector) {
                const direction = getDirectionFromAdjacentVector(directionVector.x, directionVector.y);
                const movementCost = node.tile?.terrain.reduce((acc, terrain) => {
                    const tileMoveCost = tilesJSON.tiles.find((tileConfig) => tileConfig.name === terrain.type)?.movementCost || 0;
                    return Math.max(acc, tileMoveCost);
                }, 0);

                const impassible = movementCost === 1;

                return {
                    direction,
                    movementCost,
                    impassible,
                };
            }
        });

        const { playerId, point, timestamp } = event
        websocketService.sendMessage({
            eventId: event.id,
            type: 'playerLocationChange',
            directions: [...directions, ...quadrantDirections, ...adjacentDirections],
            timestamp,
            playerId,
            point,
        } as PlayerLocationChangeMessage);
    }

    private _describeIntro(eventId: string): void {
        websocketService.sendMessage({
            eventId,
            type: 'intro',
            text: `Först finns bara ljus. Oändligt, vitt och stilla. Sedan framträder konturer ur skenet, och avlägsna ljud letar sig fram till dig som genom vatten. Tyngden återvänder till dina lemmar. Du känner din kropp igen. Men du minns inte varifrån du kom - eller vad denna värld är`,
            attention: 5,
        } as DescriptionMessage);
    }

    private _describeSceneTransition(environment: EnvironmentalContext): void {
        const from = environment.previous;
        const to = environment.current;
        const toContext = environment.getContext(to);

        this._storyteller.describeSceneTransition(from, to, toContext).then((description) => {
            websocketService.sendMessage({
                eventId: environment.eventId,
                type: 'sceneTransition',
                text: description,
                attention: 5,
            } as DescriptionMessage);
        });
    }

    private _describeEnterWorld(environment: EnvironmentalContext): void {
        const current = environment.current;
        this._storyteller.describeEnterWorld(current).then((description) => {
            websocketService.sendMessage({
                eventId: environment.eventId,
                type: 'sceneTransition',
                text: description,
                attention: 5,
            } as DescriptionMessage);
        });
    }

    private _describeProxmity(environment: EnvironmentalContext): void {
        const current = environment.current;
        const proximity = [...environment.adjacents, ...environment.quadrants];
        const contexts = proximity.map((profile) => environment.getContext(profile));

        this._storyteller.describeProximity(current, proximity, contexts).then((description) => {
            websocketService.sendMessage({
                eventId: environment.eventId,
                type: 'adjacentSummary', //proximitySummary
                text: description,
                attention: 5,
            } as DescriptionMessage);
        });
    }

    private _describeAdjacentNodes(environment: EnvironmentalContext): void {
        environment.adjacents.forEach((adjacent) => {
            const context = environment.getContext(adjacent);
            this._storyteller.describeAdjacentDirection(environment.current, adjacent, context).then((description) => {
                websocketService.sendMessage({
                    eventId: environment.eventId,
                    type: 'adjacentDirection',
                    direction: context.direction,
                    text: description,
                    attention: 0,
                } as DescriptionMessage);
            });
        });
    }


    private _describeQuadrantNodes(environment: EnvironmentalContext): void {
        environment.quadrants.forEach((quadrant) => {
            const context = environment.getContext(quadrant);
            this._storyteller.describQuadrantDirection(environment.current, quadrant, context).then((description) => {
                websocketService.sendMessage({
                    eventId: environment.eventId,
                    type: 'quadrantDirection',
                    direction: context.direction,
                    text: description,
                    attention: 0,
                } as DescriptionMessage);
            });
        });
    }
}