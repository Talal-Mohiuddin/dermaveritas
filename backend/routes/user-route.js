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
  getAllUsers,
  banUser,
  unbanUser,
  upgradePlan,
  getDashboardStats,
  getProductStats,
  getOrderStats,
  getBlogStats,
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
router.route("/upgrade-plan").put(isUserAuthenticated, upgradePlan);
router.route("/admin-login").post(loginAdmin);
router.route("/admin-logout").get(isadminAuthenticated, logoutAdmin);
router.route("/getalluser").get(isadminAuthenticated, getAllUsers);
router.route("/ban-user/:id").put(isadminAuthenticated, banUser);
router.route("/unban-user/:id").put(isadminAuthenticated, unbanUser);

// Dashboard statistics routes
router.route("/dashboard-stats").get(isadminAuthenticated, getDashboardStats);
router.route("/product-stats").get(isadminAuthenticated, getProductStats);
router.route("/order-stats").get(isadminAuthenticated, getOrderStats);
router.route("/blog-stats").get(isadminAuthenticated, getBlogStats);

export default router;
