import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { authenticate } from "../middleware/auth";
import { login, me } from "../controllers/auth.controller";

const router = Router();

router.post("/login", asyncHandler(login));
router.get("/me", authenticate, asyncHandler(me));

export default router;
