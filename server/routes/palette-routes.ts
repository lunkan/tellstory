import { Router } from "express";
import { createNewPalette, deletePalette, generateMarkersByPrompt, getPalette, getPalettes, updatePalette } from "../controllers/palette-controller.js";

const router = Router();

router.post("/", createNewPalette);
router.get("/", getPalettes);
router.get("/:id", getPalette);
router.put("/:id", updatePalette);
router.delete("/:id", deletePalette);
router.post("/generate-markers", generateMarkersByPrompt);


export default router;
