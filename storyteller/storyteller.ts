import { Game } from "../engine/core/game.js";
import { Author } from "./authors/author.js";

export function createAuthor(game: Game): Author {
    return new Author(game);
}