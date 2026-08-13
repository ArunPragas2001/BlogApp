import mongoose from "mongoose";

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/blogapp"
    );
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.log("⚠️ Running server without MongoDB connection (DB operations will fail until MongoDB is connected).");
  }
};

export default connectDB;
