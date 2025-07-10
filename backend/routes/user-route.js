import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  loginAdmin,
  logoutAdmin,
  changeUserName,
  changeUserPassword,
  getUser,
} from "../controllers/user-controller.js";
import {
  isUserAuthenticated,
  isadminAuthenticated,
} from "../middlewares/Auth.js";
const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(isUserAuthenticated, logoutUser);
router.route("/change-name").put(isUserAuthenticated, changeUserName);
router.route("/change-password").put(isUserAuthenticated, changeUserPassword);
router.route("/getuser").get(isUserAuthenticated, getUser);
router.route("/admin-login").post(loginAdmin);
router.route("/admin-logout").get(isadminAuthenticated, logoutAdmin);

export default router;
