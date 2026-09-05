import express from "express";
import cors from "cors";
import gameRoutes from "./routes/game-routes.js";
import editorRoutes from "./routes/world-routes.js";
import soundRoutes from "./routes/sound-routes.js";
import adminRoutes from "./routes/admin-routes.js";
import settingsRoutes from "./routes/settings-routes.js";
import paletteRoutes from "./routes/palette-routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/game", gameRoutes);
app.use("/api/sound", soundRoutes);
app.use("/api/world", editorRoutes);
app.use("/api/palette", paletteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/settings", settingsRoutes);

export default app;
