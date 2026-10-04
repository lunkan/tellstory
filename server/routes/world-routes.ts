import { Router } from "express";
import { createNewWorld, getWorld, updateWorld, deleteWorld, getWorlds, generateMapByNode } from "../controllers/world-controller.js";

const router = Router();

router.post("/", createNewWorld);
router.get("/", getWorlds);
router.get("/:id", getWorld);
router.put("/:id", updateWorld);
router.delete("/:id", deleteWorld);
router.post("/generate-map", generateMapByNode);

export default router;
