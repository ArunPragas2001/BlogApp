import express from "express";
import multer from "multer";
import path from "path";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

function checkFileType(file, cb) {
  const blockedMimes = ["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"];
  const blockedExts = ["heic", "heif"];

  const extName = path.extname(file.originalname).toLowerCase().replace(".", "");
  if (blockedMimes.includes(file.mimetype) || blockedExts.includes(extName)) {
    return cb(new Error("HEIC/HEIF photos are not supported. Please use JPG or PNG."));
  }

  const filetypes = /jpg|jpeg|png|webp|gif|svg|avif|bmp/;
  const extValid = filetypes.test(extName);
  const mimeValid = file.mimetype.startsWith("image/") && !blockedMimes.includes(file.mimetype);

  if (extValid || mimeValid) {
    return cb(null, true);
  }
  cb(new Error("Images only! (jpg, jpeg, png, webp, gif, svg, avif, bmp)"));
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  }
});

function getBucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");
  return new GridFSBucket(db, { bucketName: "uploads" });
}

function uploadToGridFS(buffer, filename, contentType, userId) {
  return new Promise((resolve, reject) => {
    const bucket = getBucket();
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: contentType || "image/jpeg",
      metadata: { uploadedBy: userId ? String(userId) : "" }
    });

    uploadStream.on("error", reject);
    uploadStream.on("finish", () => resolve(uploadStream.id));
    uploadStream.end(buffer);
  });
}

router.post("/", protect, (req, res) => {
  upload.single("image")(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided." });
    }

    try {
      const fileId = await uploadToGridFS(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.user._id
      );

      const imagePath = `/api/images/${fileId}`;
      const host = req.get("host") || "localhost:5000";
      const protocol = req.get("x-forwarded-proto") || req.protocol || "https";
      const fullUrl = `${protocol}://${host}${imagePath}`;

      res.json({
        message: "Image uploaded successfully",
        url: fullUrl,
        path: imagePath,
        id: String(fileId)
      });
    } catch (uploadErr) {
      console.error("GridFS upload error:", uploadErr.message);
      res.status(500).json({ message: "Failed to save image. Please try again." });
    }
  });
});

export default router;
