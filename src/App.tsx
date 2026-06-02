import { useState, type FormEvent } from "react";
import { Reply } from "../storyteller/types";
import { NewFeed } from "./NewFeed";
import { DebugPanel } from "./DebugPanel";
import { useEffect } from "react";
import { wsService } from "./websocket/websocketService";

type ChatResponse = {
  reply?: Reply;
  error?: string;
};

export default function App() {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState<Reply | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    wsService.connect();
  }, []);

  async function handleSubmit(e: FormEvent) {
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
  }

  return (
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
    </main>
  );
}
