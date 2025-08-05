import express from "express";
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/order-controller.js";
import { isadminAuthenticated } from "../middlewares/Auth.js";

const router = express.Router();

// Admin routes
router.route("/all").get(isadminAuthenticated, getAllOrders);
router.route("/:id").get(isadminAuthenticated, getOrderById);
router.route("/:id/status").put(isadminAuthenticated, updateOrderStatus);
router.route("/:id").delete(isadminAuthenticated, deleteOrder);

export default router;
