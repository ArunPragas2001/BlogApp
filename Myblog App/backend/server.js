import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import blogRoutes from "./routes/blogRoute.js";
import configRoutes from "./routes/configRoute.js";
import uploadRoutes from "./routes/uploadRoute.js";
import userRoutes from "./routes/userRoute.js";
import { checkMaintenanceMode } from "./middleware/maintenanceMiddleware.js";

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(checkMaintenanceMode);

app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/settings", configRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);

app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to BlogApp REST API",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        me: "GET /api/auth/me",
        profile: "PUT /api/auth/profile"
      },
      blogs: {
        getAll: "GET /api/blogs",
        getOne: "GET /api/blogs/:id",
        create: "POST /api/blogs",
        update: "PUT /api/blogs/:id",
        approve: "PUT /api/blogs/:id/approve",
        delete: "DELETE /api/blogs/:id"
      },
      settings: {
        get: "GET /api/settings",
        update: "PUT /api/settings"
      }
    }
  });
});

app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error"
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
