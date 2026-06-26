import { ChronicleEventType } from "../../engine/chronicle/chronicle";
import { Character } from "../../engine/core/character";
import { isLocationChangeEvent } from "../../engine/core/events/game-event.config";
import { GameEvent } from "../../engine/core/events/game-event.interface";
import { GameLocationChangeEvent } from "../../engine/core/events/game-location-change-event";
import { getDirectionFromAdjacentVector, getDirectionFromQuadrantVector } from "../../shared/src/direction";
import { DescriptionMessage, PlayerLocationChangeMessage } from "../../shared/src/message";
import { IGameObserver } from "../../storyteller/types";
import { storyteller } from "../storyteller/storyteller";
import { websocketService } from "../websocket/websocket-service";
import tilesJSON from '../../engine/config/tiles.json' with { type: 'json' };

export class PlayerObserver implements IGameObserver {
    private _player: Character;

    constructor(player: Character) {
        this._player = player;
    }

    public onEvent(event: GameEvent): void {
        console.log('PlayerObserver:onEvent', event);

        if (isLocationChangeEvent(event)) {
            if (event.playerId === this._player.id) {

                this._playerLocationChange(event);
                //this._player.getQuadrantNodes
                //websocketService.sendMessage(event);

                switch (event.type) {
                    case 'characterSpawn':
                        this._onSpawn(event);
                        break;
                    case 'characterEnter':
                        this._onEnterLocation(event);
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
            directions: [...quadrantDirections, ...adjacentDirections],
            timestamp,
            playerId,
            point,
        } as PlayerLocationChangeMessage);
    }

    private _onSpawn(event: GameLocationChangeEvent): void {
        websocketService.sendMessage({
            eventId: event.id,
            type: 'intro',
            text: `Först finns bara ljus. Oändligt, vitt och stilla. Sedan framträder konturer ur skenet, och avlägsna ljud letar sig fram till dig som genom vatten. Tyngden återvänder till dina lemmar. Du känner din kropp igen. Men du minns inte varifrån du kom - eller vad denna värld är`,
            attention: 5,
        } as DescriptionMessage);

        storyteller.describeEnterWorld(event.id, this._player);
        storyteller.describeProximity(event.id, this._player);
    }

    private _onEnterLocation(event: GameLocationChangeEvent): void {
        storyteller.describeSceneTransition(event.id, this._player);
        storyteller.describeProximity(event.id, this._player);
    }
}