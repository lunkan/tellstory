import { Router } from "express";
import { clearStorage, configSettings } from "../controllers/admin-controller.js";

const router = Router();

router.post("/clear", clearStorage);
router.post("/config", configSettings);

export default router;
