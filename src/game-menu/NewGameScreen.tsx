import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/gameStore";
import { WorldDataSummary } from "../../server/types";


export function NewGameScreenScreen() {
    const [loading, setLoading] = useState<boolean>(true);
    const [worlds, setWorlds] = useState<WorldDataSummary[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        loadWorlds();
    }, []);

    function loadWorlds(): void {
        fetch(`/world`).then((response) => {
            response.json().then((data) => {
                setLoading(false);
                setWorlds(data.worlds);
            });
        });
    }

    function handleSelectGame(worldId: number) {
        useGameStore.getState().newGame(worldId);
        navigate(`/game`);
    }

    function handleCancel() {
        navigate(`/`);
    }

    if (loading) {
        return (
            <main className="game-menu-screen">
                <div className="game-menu-screen--menu">
                    ...Loading
                </div>
            </main>
        )
    }

    return (
        <main className="game-menu-screen">
            <div className="game-menu-screen--menu">
                <div className="game-menu-screen--header">
                    <h2>Games</h2>
                </div>
                <ul className="game-menu-screen--list">
                    {worlds.map((worldData, i) => (
                        <li key={i}>
                            <button className="game-screen--menu-btn" onClick={() => handleSelectGame(worldData.id)}>{worldData.name}</button>
                        </li>
                    ))}
                </ul>
                <button className="game-screen--menu-btn" onClick={() => handleCancel()}>Cancel</button>
            </div>
        </main>
    );
}