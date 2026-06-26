import { Router } from "express";
import { movePlayer, zoomPlayer, newGame } from "../controllers/game.controller.js";

const router = Router();

router.post("/", newGame);
router.post("/move", movePlayer);
router.post("/zoom", zoomPlayer);

export default router;
