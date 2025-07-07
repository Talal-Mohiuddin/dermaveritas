import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addReview,
} from "../controllers/product-controller.js";
import {
  isadminAuthenticated,
  isUserAuthenticated,
} from "../middlewares/Auth.js";
import { upload } from "../middlewares/upload.js";

const router = express.Router();

// Public routes
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Admin only routes
router.post(
  "/addproduct",
  isadminAuthenticated,
  upload.array("images", 5),
  createProduct
);
router.put("/:id", isadminAuthenticated, updateProduct);
router.delete("/:id", isadminAuthenticated, deleteProduct);

// User only routes
router.post("/:id/review", isUserAuthenticated, addReview);

export default router;
