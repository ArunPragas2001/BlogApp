import express from "express";
import multer from "multer";
import path from "path";
import cloudinary from "../config/cloudinary.js";
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

function uploadToCloudinary(buffer, folder = "blogsphere_uploads") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto"
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
      const result = await uploadToCloudinary(req.file.buffer, "blogsphere_uploads");

      res.json({
        message: "Image uploaded successfully",
        url: result.secure_url,
        secure_url: result.secure_url,
        public_id: result.public_id
      });
    } catch (uploadErr) {
      console.error("Cloudinary upload error:", uploadErr.message);
      res.status(500).json({ message: "Failed to upload image to Cloudinary. " + uploadErr.message });
    }
  });
});

export default router;
