import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Ensure uploads directory exists in process.cwd() or process.cwd()/backend
let uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  const backendUploadDir = path.join(process.cwd(), "backend", "uploads");
  if (fs.existsSync(backendUploadDir)) {
    uploadDir = backendUploadDir;
  } else {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}-${cleanName}`);
  }
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp|gif|svg|avif|bmp/;
  const extName = path.extname(file.originalname).toLowerCase().replace(".", "");
  const extValid = filetypes.test(extName);
  const mimeValid = file.mimetype.startsWith("image/");

  if (extValid || mimeValid) {
    return cb(null, true);
  } else {
    cb(new Error("Images only! (jpg, jpeg, png, webp, gif, svg, avif, bmp)"));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});

router.post("/", protect, (req, res) => {
  upload.single("image")(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Multer Error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided." });
    }

    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol || "http";
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.json({
      message: "Image uploaded successfully",
      url: fileUrl,
      filename: req.file.filename
    });
  });
});

export default router;
