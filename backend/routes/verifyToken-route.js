import { Router } from "express";
import {
  verifyToken,
  getSession,
} from "../controllers/verifyToken-controller.js";

const router = Router();

router.post("/verify-token", verifyToken);
router.get("/get-session", getSession);

export default router;
