import Blog from "../models/blog.js";

/**
 * @desc    Create a new blog post
 * @route   POST /api/blogs
 * @access  Private (Requires Login)
 */
export const createBlog = async (req, res) => {
  try {
    const { title, content, category, status, image } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required fields" });
    }

    const blog = await Blog.create({
      title,
      content,
      category: category || "General",
      status: status || "published",
      image: image || "",
      author: req.user._id // Attached by auth middleware
    });

    // Populate author info before returning
    await blog.populate("author", "name email");

    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: "Error creating blog post", error: error.message });
  }
};

/**
 * @desc    Get all blog posts
 * @route   GET /api/blogs
 * @access  Public
 */
export const getAllBlogs = async (req, res) => {
  try {
    // Optionally filter by category if passed as query parameter e.g. /api/blogs?category=Tech
    const query = {};
    if (req.query.category) {
      query.category = req.query.category;
    }

    const blogs = await Blog.find(query)
      .populate("author", "name email")
      .sort({ createdAt: -1 }); // Newest first

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blogs", error: error.message });
  }
};

/**
 * @desc    Get a single blog post by ID
 * @route   GET /api/blogs/:id
 * @access  Public
 */
export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("author", "name email");

    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blog post", error: error.message });
  }
};

/**
 * @desc    Update a blog post
 * @route   PUT /api/blogs/:id
 * @access  Private (Author Only)
 */
export const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    // Check if logged-in user is the author of this blog post
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this blog" });
    }

    const { title, content, category, status, image } = req.body;

    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.category = category || blog.category;
    blog.status = status || blog.status;
    blog.image = image !== undefined ? image : blog.image;

    const updatedBlog = await blog.save();
    await updatedBlog.populate("author", "name email");

    res.json(updatedBlog);
  } catch (error) {
    res.status(500).json({ message: "Error updating blog post", error: error.message });
  }
};

/**
 * @desc    Delete a blog post
 * @route   DELETE /api/blogs/:id
 * @access  Private (Author Only)
 */
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    // Check if logged-in user is the author of this blog post
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this blog" });
    }

    await blog.deleteOne();

    res.json({ message: "Blog post deleted successfully", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: "Error deleting blog post", error: error.message });
  }
};
