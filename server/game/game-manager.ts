import { GamePod } from "./game-pod";

class GameManager {
    private _game: GamePod | undefined;

    public createGame(): void {
        this._game = new GamePod();
    }

    public getGamePod(): GamePod | undefined {
        return this._game;
    }
}

export const gameManager = new GameManager();