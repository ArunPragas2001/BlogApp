import express from "express";
import multer from "multer";
import path from "path";
import cloudinary from "../config/cloudinary.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ─── File Validation ──────────────────────────────────────────────────────────
const BLOCKED_MIMES = ["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"];
const BLOCKED_EXTS  = ["heic", "heif"];
const IMAGE_EXTS    = /^(jpg|jpeg|png|webp|gif|svg|avif|bmp)$/;
const VIDEO_EXTS    = /^(mp4|webm|mov|avi|mkv|m4v|ogv)$/;
const VIDEO_MIMES   = new Set([
  "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
  "video/x-matroska", "video/x-m4v", "video/ogg"
]);

function isVideoFile(file) {
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  return VIDEO_EXTS.test(ext) || VIDEO_MIMES.has(file.mimetype) || file.mimetype.startsWith("video/");
}

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");

  if (BLOCKED_MIMES.includes(file.mimetype) || BLOCKED_EXTS.includes(ext)) {
    return cb(new Error("HEIC/HEIF photos are not supported. Please convert to JPG or PNG first."));
  }

  const isImg = IMAGE_EXTS.test(ext) || file.mimetype.startsWith("image/");
  const isVid = VIDEO_EXTS.test(ext) || VIDEO_MIMES.has(file.mimetype) || file.mimetype.startsWith("video/");

  if (isImg || isVid) return cb(null, true);

  cb(new Error("Unsupported file type. Supported: JPG, PNG, WEBP, GIF, MP4, WEBM, MOV, AVI, MKV."));
}

// Accept any field name so frontend can use "image", "video", "file", "media" etc.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB hard limit
  fileFilter
});

// ─── Cloudinary Upload Helper ─────────────────────────────────────────────────
function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "blogsphere_uploads",
        resource_type: options.resource_type || "auto",
        ...(options.resource_type === "video" ? { chunk_size: 6_000_000 } : {})
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// ─── Shared upload handler ────────────────────────────────────────────────────
async function handleUpload(req, res, forceVideo = false) {
  // Pick the file from any field name the frontend used
  const file = req.file || (req.files && req.files[0]);
  if (!file) {
    return res.status(400).json({ message: "No media file attached. Please select a file to upload." });
  }

  const isVideo = forceVideo || isVideoFile(file);

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

    return res.json({
      message: `${isVideo ? "Video" : "Image"} uploaded successfully`,
      url: result.secure_url,
      secure_url: result.secure_url,
      public_id: result.public_id,
      resource_type: isVideo ? "video" : "image",
      duration: result.duration || null,
      format: result.format || null
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err.message);
    return res.status(500).json({ message: `Upload to Cloudinary failed: ${err.message}` });
  }
}

// ─── POST /api/upload  (images + videos, any field name) ─────────────────────
router.post("/", protect, upload.any(), async (req, res) => {
  return handleUpload(req, res, false);
});

// ─── POST /api/upload/video  (explicit video endpoint) ───────────────────────
router.post("/video", protect, upload.any(), async (req, res) => {
  return handleUpload(req, res, true);
});

// ─── Multer error handler for this router ────────────────────────────────────
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File is too large. Max: 10 MB for images, 100 MB for videos." });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

export default router;
