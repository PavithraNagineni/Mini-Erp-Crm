import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { authenticate, authorize } from "../middleware/auth";
import {
  cancelChallan,
  confirmChallan,
  createChallan,
  getChallan,
  listChallans,
  updateChallan,
} from "../controllers/challan.controller";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(listChallans));
router.get("/:id", asyncHandler(getChallan));
router.post("/", authorize("ADMIN", "SALES"), asyncHandler(createChallan));
router.put("/:id", authorize("ADMIN", "SALES"), asyncHandler(updateChallan));
router.post("/:id/confirm", authorize("ADMIN", "SALES"), asyncHandler(confirmChallan));
router.post("/:id/cancel", authorize("ADMIN", "SALES", "ACCOUNTS"), asyncHandler(cancelChallan));

export default router;
