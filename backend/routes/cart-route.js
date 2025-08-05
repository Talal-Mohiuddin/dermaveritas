import { Router } from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  buyCart,
} from "../controllers/cart-controller.js";
import { isUserAuthenticated } from "../middlewares/Auth.js";

const router = Router();

router.route("/addtocart").post(isUserAuthenticated, addToCart);
router.route("/removefromcart").post(isUserAuthenticated, removeFromCart);
router.route("/getcart").get(isUserAuthenticated, getCart);
router.route ("/getcart/:id").get(isUserAuthenticated, getCart);
router.route("/buycart").post(isUserAuthenticated, buyCart);


export default router;
