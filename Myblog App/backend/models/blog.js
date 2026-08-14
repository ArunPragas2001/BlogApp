import mongoose from "mongoose";

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
    isApproved: {
      type: Boolean,
      default: false
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
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
    timestamps: true
  }
);

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;
