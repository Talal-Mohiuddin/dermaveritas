import { Router } from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  addComment,
} from "../controllers/blog-controller.js";
import { isadminAuthenticated } from "../middlewares/Auth.js";
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
  .put(isadminAuthenticated, upload.single("coverImage"), updateBlog);
router.route("/:id").delete(isadminAuthenticated, deleteBlog);

// Comment routes
router.route("/:id/comment").post(addComment);

export default router;
