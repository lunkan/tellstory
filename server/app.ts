import express from "express";
import cors from "cors";
import gameRoutes from "./routes/game-routes.js";
import editorRoutes from "./routes/world-routes.js";
import soundRoutes from "./routes/sound-routes.js";
import adminRoutes from "./routes/admin-routes.js";
import settingsRoutes from "./routes/settings-routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/game", gameRoutes);
app.use("/sound", soundRoutes);
app.use("/world", editorRoutes);
app.use("/admin", adminRoutes);
app.use("/settings", settingsRoutes);

export default app;
