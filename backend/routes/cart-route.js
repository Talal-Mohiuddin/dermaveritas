import { Router } from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
} from "../controllers/cart-controller.js";
import { isUserAuthenticated } from "../middlewares/Auth.js";

const router = Router();

router.route("/addtocart").post(isUserAuthenticated, addToCart);
router.route("/removefromcart").post(isUserAuthenticated, removeFromCart);
router.route("/getcart").get(isUserAuthenticated, getCart);

export default router;
