import { Router } from "express";
import { createNewWorld, getWorld, updateWorld, deleteWorld, getWorlds } from "../controllers/world.controller.js";

const router = Router();

router.post("/", createNewWorld);
router.get("/", getWorlds);
router.get("/:id", getWorld);
router.put("/:id", updateWorld);
router.delete("/:id", deleteWorld);

export default router;
