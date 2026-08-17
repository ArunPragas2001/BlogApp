import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { protect } from "../middleware/authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const extFromName = path.extname(cleanName).toLowerCase();
    const mimeToExt = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
      "image/svg+xml": ".svg",
      "image/avif": ".avif",
      "image/bmp": ".bmp"
    };
    const ext = extFromName || mimeToExt[file.mimetype] || "";
    const baseName = extFromName
      ? cleanName.slice(0, -extFromName.length)
      : cleanName.replace(/\.+$/, "");
    cb(null, `${Date.now()}-${baseName}${ext}`);
  }
});

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
    const protocol = req.get("x-forwarded-proto") || req.protocol || "https";
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.json({
      message: "Image uploaded successfully",
      url: fileUrl,
      filename: req.file.filename
    });
  });
});

export default router;
