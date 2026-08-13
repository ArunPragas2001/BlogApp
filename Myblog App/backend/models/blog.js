import mongoose from "mongoose";

// Blog Schema definition
const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true
    },
    content: {
      type: String,
      required: [true, "Content is required"]
    },
    category: {
      type: String,
      default: "General",
      trim: true
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published"
    },
    image: {
      type: String,
      default: ""
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt fields
  }
);

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;
