import { useGameStore } from "./store/gameStore";

export function TitleScreen() {
    const setActiveGameId = useGameStore((state) => state.setActiveGameId);

    async function handleNewGame() {
        try {
            console.log('handleStart');
            const res = await fetch("/game", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: 'Hello' }),
            });
            
            const data: any = await res.json();
            if (!res.ok) {
                throw new Error(data.error ?? 'New game Request failed');
            }

            setActiveGameId('New');

        } catch (err) {
            //setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            //setLoading(false);
        }
    }

    return (
        <div className="title-screen">
            <button className="title-screen--btn" onClick={() => handleNewGame()}>Start</button>
        </div>
    );
}