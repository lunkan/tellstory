import { Router } from "express";
import { clearStorage } from "../controllers/admin-controller.js";

const router = Router();

router.post("/clear", clearStorage);

export default router;
