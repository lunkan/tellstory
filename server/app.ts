import express from "express";
import cors from "cors";
import "./controllers/player.controller.js";
import chatRoutes from "./routes/chat.routes.js";
import gameRoutes from "./routes/game.routes.js";
import editorRoutes from "./routes/world.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/game", gameRoutes);
app.use("/world", editorRoutes);
app.use("/chat", chatRoutes);

export default app;
