import express from "express";
import multer from "multer";
import path from "path";
import cloudinary from "../config/cloudinary.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ─── File Validation ──────────────────────────────────────────────────────
const blockedImageMimes = ["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"];
const blockedImageExts = ["heic", "heif"];
const allowedImageExts = /jpg|jpeg|png|webp|gif|svg|avif|bmp/;
const allowedVideoExts = /mp4|webm|mov|avi|mkv|m4v|ogv/;
const allowedVideoMimes = [
  "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
  "video/x-matroska", "video/x-m4v", "video/ogg"
];

function checkMediaFileType(file, cb) {
  const extName = path.extname(file.originalname).toLowerCase().replace(".", "");

  if (blockedImageMimes.includes(file.mimetype) || blockedImageExts.includes(extName)) {
    return cb(new Error("HEIC/HEIF photos are not supported. Please use JPG or PNG."));
  }

  const isImage = allowedImageExts.test(extName) || file.mimetype.startsWith("image/");
  const isVideo = allowedVideoExts.test(extName) || allowedVideoMimes.includes(file.mimetype) || file.mimetype.startsWith("video/");

  if (isImage || isVideo) {
    return cb(null, true);
  }

  cb(new Error("Unsupported file format. Supported: JPG, PNG, WEBP, GIF, MP4, WEBM, MOV, AVI, MKV."));
}

// ─── Unified Multer Config ────────────────────────────────────────────────
const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max for videos, checked in handler
  fileFilter(req, file, cb) {
    checkMediaFileType(file, cb);
  }
});

// ─── Cloudinary Upload Stream ─────────────────────────────────────────────
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

// ─── Handler for Image/Video Upload ───────────────────────────────────────
async function handleMediaUpload(req, res, forceVideo = false) {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "No media file provided." });
  }

  const extName = path.extname(file.originalname).toLowerCase().replace(".", "");
  const isVideo = forceVideo || allowedVideoExts.test(extName) || allowedVideoMimes.includes(file.mimetype) || file.mimetype.startsWith("video/");

  // File size checks
  if (!isVideo && file.size > 10 * 1024 * 1024) {
    return res.status(400).json({ message: "Image must be under 10 MB." });
  }
  if (isVideo && file.size > 100 * 1024 * 1024) {
    return res.status(400).json({ message: "Video must be under 100 MB." });
  }

  try {
    const result = await uploadToCloudinary(file.buffer, {
      folder: isVideo ? "blogsphere_videos" : "blogsphere_uploads",
      resource_type: isVideo ? "video" : "image"
    });

    res.json({
      message: `${isVideo ? "Video" : "Image"} uploaded successfully`,
      url: result.secure_url,
      secure_url: result.secure_url,
      public_id: result.public_id,
      resource_type: isVideo ? "video" : "image",
      duration: result.duration || null,
      format: result.format || null
    });
  } catch (uploadErr) {
    console.error("Cloudinary upload error:", uploadErr.message);
    res.status(500).json({ message: `Failed to upload to Cloudinary: ${uploadErr.message}` });
  }
}

// ─── POST /api/upload (Universal - accepts image, video, file, media) ─────
router.post("/", protect, (req, res) => {
  mediaUpload.any()(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File size exceeds limit (Max: 100 MB)." });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    req.file = req.files && req.files.length > 0 ? req.files[0] : null;
    return handleMediaUpload(req, res, false);
  });
});

// ─── POST /api/upload/video (Explicit video route) ────────────────────────
router.post("/video", protect, (req, res) => {
  mediaUpload.any()(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Video must be under 100 MB." });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    req.file = req.files && req.files.length > 0 ? req.files[0] : null;
    return handleMediaUpload(req, res, true);
  });
});

export default router;
