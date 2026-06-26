import { Character } from "../../engine/core/character";
//import { createGame } from "../../engine/core/engine";
import { Game } from "../../engine/core/game";
import { Author } from "../../storyteller/authors/author";
import { Explorer } from "../../storyteller/authors/explorer";
import { createAuthor } from "../../storyteller/storyteller";

export class GamePod {
    public readonly game: Game;
    public readonly explorer: Explorer;
    public readonly author: Author;

    public get player(): Character | undefined {
        return this.game.getPlayer('Fantomen');
    }

    constructor(game: Game) {
        this.game = game;
        this.explorer = new Explorer();
        this.author = createAuthor(this.game);
    }
}