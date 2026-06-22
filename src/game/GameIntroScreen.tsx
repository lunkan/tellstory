/*import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/gameStore";
import { Typewriter } from "./feed/Typewriter";
import { useState } from "react";

const introText = `
    Först finns bara ljus. Oändligt, vitt och stilla. Sedan framträder konturer ur skenet, och avlägsna ljud letar sig fram till dig som genom vatten. Tyngden återvänder till dina lemmar. Du känner din kropp igen. Men du minns inte varifrån du kom - eller vad denna värld är.
`;

export function GameIntroScreen() {
    const loading = useGameStore((state) => state.loading);
    const [animationComplete, setAnimationComplete] = useState(false);
    const navigate = useNavigate();

    function handleAnimationComplete(): void {
        setAnimationComplete(true);
    }

    function handleClick() {
        if (!loading) {
            navigate(`/game`);
        }
    }

    return (
        <main className="game-screen" onClick={() => handleClick()}>
            <div className="game-screen--feed">
                <Typewriter type="intro" text={introText} onAnimationComplete={handleAnimationComplete}></Typewriter>
                {animationComplete ? (<p>Click to continue</p>) : ''}
            </div>

        </main>
    );
}*/
