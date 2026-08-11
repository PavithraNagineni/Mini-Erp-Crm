import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { authenticate, authorize } from "../middleware/auth";
import {
  addCustomerNote,
  createCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from "../controllers/customer.controller";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(listCustomers));
router.get("/:id", asyncHandler(getCustomer));
router.post("/", authorize("ADMIN", "SALES"), asyncHandler(createCustomer));
router.put("/:id", authorize("ADMIN", "SALES"), asyncHandler(updateCustomer));
router.post("/:id/notes", authorize("ADMIN", "SALES"), asyncHandler(addCustomerNote));

export default router;
