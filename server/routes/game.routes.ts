import { Router } from "express";
import { movePlayer, newGame } from "../controllers/game.controller.js";

const router = Router();

router.post("/", newGame);
router.post("/move", movePlayer);

export default router;
