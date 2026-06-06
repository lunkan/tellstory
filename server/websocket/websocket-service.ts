import { WebSocketServer, WebSocket } from "ws";
import { LocationMessage, WebsocketMessage } from "../../storyteller/types";

type MessageSubscriber = {
  type: string,
  callback: (data: unknown) => void
};

const wss = new WebSocketServer({ port: 8080 });
console.log("WebSocket server running on port 8080");

let websocket: WebSocket | undefined;

const subscribers: MessageSubscriber[] = [];

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");
  websocket = ws;

  ws.on("message", (data) => {
    const message = JSON.parse(data.toString()) as WebsocketMessage;
    subscribers.forEach((subscriber) => {
      if (subscriber.type === message.type) {
        subscriber.callback(message.data);
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });
});

export function subscribe(type: string, callback: (data: unknown) => void): void {
  subscribers.push({ type, callback });
}

export function sendLocationMessage(msg: LocationMessage): void {
  if (!websocket) {
    console.log('No websocket!');
    return;
  }

  websocket.send(
    JSON.stringify(msg)
  );
}