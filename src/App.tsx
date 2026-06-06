/*import { useState, type FormEvent } from "react";
import { Reply } from "../storyteller/types";
import { NewFeed } from "./NewFeed";
import { DebugPanel } from "./DebugPanel";
import { NavigationControl } from "./NavigationControl";*/
import { useEffect } from "react";
import { wsService } from "./websocket/websocketService";
import { useGameStore } from "./store/gameStore";
import { TitleScreen } from "./TitleScreen";
import { GameScreen } from "./GameScreen";

/*type ChatResponse = {
  reply?: Reply;
  error?: string;
};*/

export default function App() {
  const activeGameId = useGameStore((state) => state.activeGameId);

  /*const [input, setInput] = useState("");
  const [reply, setReply] = useState<Reply | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);*/

  useEffect(() => {
    wsService.connect();
  }, []);

  /*async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setError(null);
    setReply(null);

    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data: ChatResponse = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");

      setReply(data.reply ?? null);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }*/

  if (!activeGameId) {
      return (<TitleScreen></TitleScreen>);
  }

  return (<GameScreen></GameScreen>);


  /*return (
    <main>
      <h1>Tellstory Chat</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
      {error && <p className="error">Error: {error}</p>}

      <DebugPanel reply={reply}></DebugPanel>
      <NewFeed></NewFeed>
      <NavigationControl></NavigationControl>
    </main>
  );*/
}
