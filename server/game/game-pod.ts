import { Character } from "../../engine/core/character";
import { Game } from "../../engine/core/game";
import { Storyteller } from "../../storyteller/storyteller";
import { ProfileGeneratorFactory } from "./profile-generator";
import { PlayerObserver } from "./player-observer";

export class GamePod {
    public readonly game: Game;

    public readonly storyteller: Storyteller;

    constructor(game: Game, storyteller: Storyteller) {
        this.game = game;
        this.storyteller = storyteller;
    }

    public addPlayer(name: string): void {
        const player = new Character(name, this.game.world);

        const profileGeneratorFactory = new ProfileGeneratorFactory(this.game.world, player);
        const playerObserver = new PlayerObserver(player, this.storyteller, profileGeneratorFactory);
        this.game.subscribe(playerObserver);
        this.game.spawnPlayer(player);
    }

    public getPlayer(): Character | undefined {
        return this.game.getPlayer('Fantomen');
    }
}