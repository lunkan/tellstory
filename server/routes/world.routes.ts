import { Router } from "express";
import { createNewWorld } from "../controllers/world.controller.js";

const router = Router();

router.post("/", createNewWorld);

export default router;
