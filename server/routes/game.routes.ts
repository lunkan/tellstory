import { Router } from "express";
import { postNewGame } from "../controllers/game.controller.js";

const router = Router();

router.post("/", postNewGame);

export default router;
