import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { authenticate, authorize } from "../middleware/auth";
import {
  addStockMovement,
  createProduct,
  getProduct,
  listProducts,
  listStockMovements,
  updateProduct,
} from "../controllers/product.controller";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(listProducts));
router.get("/:id", asyncHandler(getProduct));
router.post("/", authorize("ADMIN", "WAREHOUSE"), asyncHandler(createProduct));
router.put("/:id", authorize("ADMIN", "WAREHOUSE"), asyncHandler(updateProduct));
router.get("/:id/stock-movements", asyncHandler(listStockMovements));
router.post("/:id/stock-movement", authorize("ADMIN", "WAREHOUSE"), asyncHandler(addStockMovement));

export default router;
