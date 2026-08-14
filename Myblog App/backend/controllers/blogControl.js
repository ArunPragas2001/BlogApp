import Blog from "../models/blog.js";
import { sendNewBlogNotification } from "../config/emailService.js";

export const createBlog = async (req, res) => {
  try {
    const { title, content, category, status, image } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required fields" });
    }

    const isAdmin = req.user.role === "admin";

    const blog = await Blog.create({
      title,
      content,
      category: category || "General",
      status: status || "published",
      image: image || "",
      author: req.user._id,
      isApproved: isAdmin,
      approvalStatus: isAdmin ? "approved" : "pending"
    });

    await blog.populate("author", "name email profilePic");

    sendNewBlogNotification(blog.title, req.user.name, req.user.email);

    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: "Error creating blog post", error: error.message });
  }
};

export const getAllBlogs = async (req, res) => {
  try {
    const query = {};

    if (req.query.category && req.query.category.toLowerCase() !== "all") {
      query.category = new RegExp(`^${req.query.category}$`, "i");
    }

    if (req.query.userOnly === "true" && req.user) {
      query.author = req.user._id;
    } else if (req.query.all !== "true") {
      query.isApproved = true;
    }

    const blogs = await Blog.find(query)
      .populate("author", "name email profilePic")
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blogs", error: error.message });
  }
};

export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("author", "name email profilePic");

    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blog post", error: error.message });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    const isAuthor = blog.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to update this blog" });
    }

    const { title, content, category, status, image } = req.body;

    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.category = category || blog.category;
    blog.status = status || blog.status;
    blog.image = image !== undefined ? image : blog.image;

    if (!isAdmin) {
      blog.isApproved = false;
      blog.approvalStatus = "pending";
    }

    const updatedBlog = await blog.save();
    await updatedBlog.populate("author", "name email profilePic");

    res.json(updatedBlog);
  } catch (error) {
    res.status(500).json({ message: "Error updating blog post", error: error.message });
  }
};

export const approveBlog = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can approve or reject blogs" });
    }

    const { isApproved, approvalStatus } = req.body;
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    blog.isApproved = isApproved !== undefined ? isApproved : true;
    blog.approvalStatus = approvalStatus || (blog.isApproved ? "approved" : "rejected");

    const updatedBlog = await blog.save();
    await updatedBlog.populate("author", "name email profilePic");

    res.json(updatedBlog);
  } catch (error) {
    res.status(500).json({ message: "Error updating blog approval status", error: error.message });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    const isAuthor = blog.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this blog" });
    }

    await blog.deleteOne();

    res.json({ message: "Blog post deleted successfully", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: "Error deleting blog post", error: error.message });
  }
};
