import express from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog
} from "../controllers/blogControl.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Routes for /api/blogs
router.route("/")
  .get(getAllBlogs)        // Public: Get all blogs
  .post(protect, createBlog); // Protected: Create a blog

// Routes for /api/blogs/:id
router.route("/:id")
  .get(getBlogById)         // Public: Get single blog by ID
  .put(protect, updateBlog)   // Protected: Update blog (author only)
  .delete(protect, deleteBlog); // Protected: Delete blog (author only)

export default router;
