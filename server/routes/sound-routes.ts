import { Router } from "express";
import { narrate } from "../controllers/sound-controller.js";

const router = Router();

router.post("/narrate", narrate);

export default router;
