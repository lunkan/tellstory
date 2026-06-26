import { IGameObserver, QuadNodePoint, QuadNodes2DPoint } from "../../storyteller/types";
import { QuadNode } from "../world/quad-node";
import { World } from "../world/world";
import { Character } from "./character";
import { GameEvent } from "./events/game-event.interface";
import { GameLocationChangeEvent } from "./events/game-location-change-event";

export class Game {
    public readonly world: World;

    private _players: Map<string, Character> = new Map();
    private _time: number = 0;

    private _subscriber: IGameObserver[] = [];

    constructor(world: World) {
        this.world = world;
    }

    public subscribe(observer: IGameObserver): void {
        this._subscriber.push(observer);
    }

    public newTurn(): void {
        this._time++;
    }

    public getTime(): number {
        return this._time;
    }

    public getPlayer(name: string): Character | undefined {
        return this._players.get(name);
    }

    public spawnPlayer(player: Character): boolean {
        const playerStart = this.world.findMarkerByType('player-start');
        if (!playerStart) {
            throw Error('No player start found');
        }

        const stratingPoint: QuadNodePoint = {
            ...playerStart.point,
            z: 5,
        };

        const startingNode = this.world.findNodeByPoint(stratingPoint);
        if (!startingNode) {
            throw Error('No starting node for player');
        }

        player.setLocation(startingNode);
        this._players.set(player.id, player);

        this._emitt(new GameLocationChangeEvent({
            point: startingNode.getPoint(),
            type: 'characterSpawn',
            timestamp: this._time,
            playerId: player.id,
        }));

        return true;
    }

    public movePlayer(playerName: string, nextLocation: QuadNode): boolean {
        const player = this.getPlayer(playerName);
        if (!player) {
            return false;
        }

        player.setLocation(nextLocation);

        this._emitt(new GameLocationChangeEvent({
            point: nextLocation.getPoint(),
            type: 'characterEnter',
            timestamp: this._time,
            playerId: player.id,
        }));

        return true;
    }

    private _emitt(event: GameEvent): void {
        this._subscriber.forEach((subscriber) => subscriber.onEvent(event));
    }
}