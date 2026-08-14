import jwt from "jsonwebtoken";
import User from "../models/user.js";
import SiteConfig from "../models/siteConfig.js";

export const checkMaintenanceMode = async (req, res, next) => {
  try {
    let config = await SiteConfig.findOne();
    if (!config || !config.maintenanceMode) {
      return next(); // Not in maintenance
    }

    // Allow login so owner can authenticate
    if (req.originalUrl === "/api/auth/login") {
      return next();
    }

    // If there's a token, check if owner
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "my_blog_app_secret_key_12345");
        const user = await User.findById(decoded.id);
        if (user && user.role === "owner") {
          return next(); // Allow owner
        }
      } catch (err) {
        // invalid token, just fall through to blocking
      }
    }

    return res.status(503).json({ message: "Site is currently in maintenance mode. Please try again later." });
  } catch (error) {
    next();
  }
};
