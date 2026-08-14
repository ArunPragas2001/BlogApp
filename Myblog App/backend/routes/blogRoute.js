import express from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  approveBlog,
  deleteBlog
} from "../controllers/blogControl.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(getAllBlogs)
  .post(protect, createBlog);

router.put("/:id/approve", protect, approveBlog);

router.route("/:id")
  .get(getBlogById)
  .put(protect, updateBlog)
  .delete(protect, deleteBlog);

export default router;
