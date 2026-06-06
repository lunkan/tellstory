import { NavigationControl } from "./NavigationControl";
import { NewFeed } from "./NewFeed";

export function GameScreen() {
    return (
        <main className="game-screen">
            <div className="game-screen--feed">
                <NewFeed></NewFeed>
            </div>
            <div className="game-screen--control">
                <NavigationControl></NavigationControl>
            </div>
        </main>
    );
}