import { ChronicleEventType } from "../../engine/chronicle/chronicle";
import { Character } from "../../engine/core/character";
import { isLocationChangeEvent } from "../../engine/core/events/game-event.config";
import { GameEvent } from "../../engine/core/events/game-event.interface";
import { GameLocationChangeEvent } from "../../engine/core/events/game-location-change-event";
import { DescriptionMessage } from "../../shared/src/message";
import { IGameObserver } from "../../storyteller/types";
import { storyteller } from "../storyteller/storyteller";
import { websocketService } from "../websocket/websocket-service";

export class PlayerObserver implements IGameObserver {
    private _player: Character;

    constructor(player: Character) {
        this._player = player;
        console.log('PlayerObserver:init');
    }

    public onEvent(event: GameEvent): void {
        console.log('PlayerObserver:onEvent', event);

        if (isLocationChangeEvent(event)) {
            if (event.playerId === this._player.id) {
                websocketService.sendMessage(event);

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

    private _onSpawn(event: GameLocationChangeEvent): void {
        websocketService.sendMessage({
            eventId: event.id,
            type: 'intro',
            text: `Först finns bara ljus. Oändligt, vitt och stilla. Sedan framträder konturer ur skenet, och avlägsna ljud letar sig fram till dig som genom vatten. Tyngden återvänder till dina lemmar. Du känner din kropp igen. Men du minns inte varifrån du kom - eller vad denna värld är`,
            attention: 10,
        } as DescriptionMessage);

        storyteller.describeEnterWorld(event.id, this._player);
        storyteller.describeProximity(event.id, this._player);
    }

    private _onEnterLocation(event: GameLocationChangeEvent): void {
        storyteller.describeSceneTransition(event.id, this._player);
        storyteller.describeProximity(event.id, this._player);
    }
}