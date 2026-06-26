import { NavigationControl } from "./control/NavigationControl";
import { DebugBar } from "./debug/DebugBar";
import { DescriptionFeed } from "./feed/DescriptionFeed";

export function GameScreen() {
    return (
        <main className="game-screen">
            <div className="game-screen--feed">
                <DescriptionFeed></DescriptionFeed>
            </div>
            <div className="game-screen--control">
                <NavigationControl></NavigationControl>
            </div>
            <DebugBar></DebugBar>
        </main>
    );
}