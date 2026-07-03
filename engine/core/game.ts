import { QuadNode } from "../world/quad-node";
import { World } from "../world/world";
import { Character } from "./character";
import { GameEvent } from "./events/game-event.interface";
import { GameLocationChangeEvent } from "./events/game-location-change-event";
import { IGameObserver } from "../types";

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
        const playerStart = this.world.getStartingLocations()[0];
        if (!playerStart) {
            throw Error('No player start found');
        }

        const startingNode = this.world.findNodeByPoint({
            ...playerStart.point,
            z: World.MAX_ZOOM_DEPTH,
        });

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

        const immediatLocation = player.getImmediatLocation();
        const currentLocation = player.getCurrentLocation();

        player.setLocation(nextLocation);

        console.log('GAME:MOVE', nextLocation.getPoint(), ' : ', immediatLocation.getPoint(), player.getImmediatLocation().getPoint(), '---', player.getCurrentLocation().getPoint(), currentLocation.getPoint())

        if (player.getImmediatLocation() !== immediatLocation) {
            console.log('characterEnter!!!');
            this._emitt(new GameLocationChangeEvent({
                point: nextLocation.getPoint(),
                type: 'characterEnter',
                timestamp: this._time,
                playerId: player.id,
            }));

            return true;

        } else if (player.getCurrentLocation() !== currentLocation) {
            console.log('characterDepthChange!!!');
            this._emitt(new GameLocationChangeEvent({
                point: nextLocation.getPoint(),
                type: 'characterDepthChange',
                timestamp: this._time,
                playerId: player.id,
            }));

            return true;
        }

        console.log('GAME: SAME LOCATION - NO UPDATE');
        return false;
    }

    private _emitt(event: GameEvent): void {
        this._subscriber.forEach((subscriber) => subscriber.onEvent(event));
    }
}