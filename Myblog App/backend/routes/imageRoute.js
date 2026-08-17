import express from "express";
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";

const router = express.Router();

function getBucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");
  return new GridFSBucket(db, { bucketName: "uploads" });
}

router.get("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid image id" });
    }

    const bucket = getBucket();
    const fileId = new ObjectId(req.params.id);
    const files = await bucket.find({ _id: fileId }).toArray();

    if (!files.length) {
      return res.status(404).json({ message: "Image not found" });
    }

    const file = files[0];
    res.set("Content-Type", file.contentType || "image/jpeg");
    res.set("Cache-Control", "public, max-age=31536000, immutable");

    bucket.openDownloadStream(fileId).pipe(res);
  } catch (error) {
    console.error("Image serve error:", error.message);
    res.status(500).json({ message: "Error serving image" });
  }
});

export default router;
