import { QuadNodePoint } from "../../storyteller/types";
import { World } from "../world/world";
import { Character } from "./character";

export class Game {
    public readonly world: World;

    private _players: Map<string, Character> = new Map();

    private _time: number = 0;

    constructor(world: World) {
        this.world = world;
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

    public newPlayer(name: string, point: QuadNodePoint): Character {
        /*const newPlayer = new Character(name, this, point);
            this.game.newPlayer('Fantomen', { x: 0, y: 0, z: 2});
        }*/

        const startingNode = this.world.findNodeByPoint(point);
        if (!startingNode) {
            throw Error('No starting node for player');
        }

        const newPlayer = new Character(name, this.world, startingNode.getPoint());
        this._players.set(newPlayer.id, newPlayer);
        return newPlayer;
    }
}