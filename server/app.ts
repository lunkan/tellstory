import express from "express";
import cors from "cors";
import "./controllers/player.controller.js";
import chatRoutes from "./routes/chat.routes.js";
import gameRoutes from "./routes/game.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

console.log('Hello');
app.use("/game", gameRoutes);
app.use("/chat", chatRoutes);

export default app;
