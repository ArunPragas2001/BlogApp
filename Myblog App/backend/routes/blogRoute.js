import express from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  approveBlog,
  deleteBlog,
  toggleLikeBlog,
  addCommentToBlog
} from "../controllers/blogControl.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(getAllBlogs)
  .post(protect, createBlog);

router.put("/:id/approve", protect, approveBlog);
router.put("/:id/like", protect, toggleLikeBlog);
router.post("/:id/comments", addCommentToBlog);

router.route("/:id")
  .get(getBlogById)
  .put(protect, updateBlog)
  .delete(protect, deleteBlog);

export default router;
