import Blog from "../models/blog.js";
import SiteConfig from "../models/siteConfig.js";
import { sendNewBlogNotification } from "../config/emailService.js";

export const createBlog = async (req, res) => {
  try {
    const { title, content, category, status, image } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required fields" });
    }

    const isAdminOrOwner = req.user.role === "admin" || req.user.role === "owner";

    const blog = await Blog.create({
      title,
      content,
      category: category || "General",
      status: status || "published",
      image: image || "",
      author: req.user._id,
      isApproved: isAdminOrOwner,
      approvalStatus: isAdminOrOwner ? "approved" : "pending"
    });

    await blog.populate("author", "name email profilePic");
    if (blog.isApproved) {
      const preview = (blog.content || "").substring(0, 150) + ((blog.content || "").length > 150 ? "..." : "");
      sendNewBlogNotification(blog.title, req.user.name, req.user.email, blog.category, preview);
    }

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
      
      let config = await SiteConfig.findOne();
      if (config && config.blogExpiryDays > 0) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() - config.blogExpiryDays);
        query.createdAt = { $gte: expiryDate };
      }
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
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid blog id" });
    }

    const blog = await Blog.findById(id).populate("author", "name email profilePic");

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
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid blog id" });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    const isAuthor = blog.author.toString() === req.user._id.toString();
    const isAdminOrOwner = req.user.role === "admin" || req.user.role === "owner";

    if (!isAuthor && !isAdminOrOwner) {
      return res.status(403).json({ message: "Not authorized to update this blog" });
    }

    const { title, content, category, status, image } = req.body;

    blog.title = title ?? blog.title;
    blog.content = content ?? blog.content;
    blog.category = category ?? blog.category;
    blog.status = status ?? blog.status;
    if (image !== undefined) {
      blog.image = image;
    }

    if (isAdminOrOwner) {
      blog.isApproved = true;
      blog.approvalStatus = "approved";
      if (!isAuthor) {
        blog.lastEditedBy = req.user._id;
      }
    } else {
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
    const isAdminOrOwner = req.user.role === "admin" || req.user.role === "owner";
    if (!isAdminOrOwner) {
      return res.status(403).json({ message: "Only admin or owner can approve or reject blogs" });
    }

    const { isApproved, approvalStatus } = req.body;
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    const wasApprovedBefore = blog.isApproved;
    blog.isApproved = isApproved !== undefined ? isApproved : true;
    blog.approvalStatus = approvalStatus || (blog.isApproved ? "approved" : "rejected");

    const updatedBlog = await blog.save();
    await updatedBlog.populate("author", "name email profilePic");

    if (!wasApprovedBefore && updatedBlog.isApproved) {
      const authorName = updatedBlog.author ? updatedBlog.author.name : "Author";
      const authorEmail = updatedBlog.author ? updatedBlog.author.email : "";
      const preview = (updatedBlog.content || "").substring(0, 150) + ((updatedBlog.content || "").length > 150 ? "..." : "");
      sendNewBlogNotification(updatedBlog.title, authorName, authorEmail, updatedBlog.category, preview);
    }

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
    const isAdminOrOwner = req.user.role === "admin" || req.user.role === "owner";

    if (!isAuthor && !isAdminOrOwner) {
      return res.status(403).json({ message: "Not authorized to delete this blog" });
    }

    await blog.deleteOne();

    res.json({ message: "Blog post deleted successfully", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: "Error deleting blog post", error: error.message });
  }
};
