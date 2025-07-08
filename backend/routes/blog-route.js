import { Router } from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
} from "../controllers/blog-controller.js";
import {
  isadminAuthenticated,
  isUserAuthenticated,
} from "../middlewares/Auth.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

// Blog CRUD operations
router
  .route("/create")
  .post(isadminAuthenticated, upload.single("coverImage"), createBlog);
router.route("/all").get(getAllBlogs);
router.route("/:id").get(getBlogById);
router
  .route("/:id")
  .put(isUserAuthenticated, upload.single("coverImage"), updateBlog);
router.route("/:id").delete(isadminAuthenticated, deleteBlog);

export default router;
