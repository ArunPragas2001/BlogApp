import express from "express";
import multer from "multer";
import path from "path";
import cloudinary from "../config/cloudinary.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ─── Image file validation ────────────────────────────────────────────────
function checkImageFileType(file, cb) {
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

// ─── Video file validation ────────────────────────────────────────────────
function checkVideoFileType(file, cb) {
  const allowedExts = /mp4|webm|mov|avi|mkv|m4v|ogv/;
  const allowedMimes = [
    "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
    "video/x-matroska", "video/x-m4v", "video/ogg"
  ];

  const extName = path.extname(file.originalname).toLowerCase().replace(".", "");
  const extValid = allowedExts.test(extName);
  const mimeValid = allowedMimes.includes(file.mimetype) || file.mimetype.startsWith("video/");

  if (extValid || mimeValid) {
    return cb(null, true);
  }
  cb(new Error("Unsupported video format. Please use MP4, WebM, MOV, AVI, or MKV."));
}

// ─── Multer configs ───────────────────────────────────────────────────────
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter(req, file, cb) {
    checkImageFileType(file, cb);
  }
});

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter(req, file, cb) {
    checkVideoFileType(file, cb);
  }
});

// ─── Cloudinary upload helper ─────────────────────────────────────────────
function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "blogsphere_uploads",
        resource_type: options.resource_type || "auto",
        ...(options.resource_type === "video" ? { chunk_size: 6000000 } : {})
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

// ─── POST /api/upload  — Image Upload ─────────────────────────────────────
router.post("/", protect, (req, res) => {
  imageUpload.single("image")(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Image must be under 10 MB." });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided." });
    }

    try {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: "blogsphere_uploads",
        resource_type: "image"
      });

      res.json({
        message: "Image uploaded successfully",
        url: result.secure_url,
        secure_url: result.secure_url,
        public_id: result.public_id
      });
    } catch (uploadErr) {
      console.error("Cloudinary image upload error:", uploadErr.message);
      res.status(500).json({ message: "Failed to upload image to Cloudinary. " + uploadErr.message });
    }
  });
});

// ─── POST /api/upload/video  — Video Upload ───────────────────────────────
router.post("/video", protect, (req, res) => {
  videoUpload.single("video")(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Video must be under 100 MB." });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No video file provided." });
    }

    try {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: "blogsphere_videos",
        resource_type: "video"
      });

      res.json({
        message: "Video uploaded successfully",
        url: result.secure_url,
        secure_url: result.secure_url,
        public_id: result.public_id,
        duration: result.duration || null,
        format: result.format || null
      });
    } catch (uploadErr) {
      console.error("Cloudinary video upload error:", uploadErr.message);
      res.status(500).json({ message: "Failed to upload video to Cloudinary. " + uploadErr.message });
    }
  });
});

export default router;
