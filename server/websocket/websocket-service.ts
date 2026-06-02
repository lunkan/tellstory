import { WebSocketServer, WebSocket } from "ws";
import { LocationMessage } from "../../storyteller/types";

//npx ts-node ./server/server.ts

const wss = new WebSocketServer({ port: 8080 });

console.log("WebSocket server running on port 8080");

let websocket: WebSocket | undefined;

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected - jonas");

  websocket = ws;

  /*ws.send(
    JSON.stringify({
      type: "welcome jonas",
      message: "Connected successfully",
    })
  );

  ws.on("message", (data) => {
    const message = data.toString();

    console.log("Received:", message);

    ws.send(
      JSON.stringify({
        type: "echo",
        message,
      })
    );
  });*/

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });
});

export function sendLocationMessage(msg: LocationMessage): void {
  console.log('sendMessade:1', msg.descriptionType);
  if (!websocket) {
    console.log('No websocket!');
    return;
  }

  console.log('sendMessade:2', msg.descriptionType);
  websocket.send(
    JSON.stringify(msg)
  );
}