import express from "express";
import multer from "multer";
import os from "os";
import { getAudioMetadata } from "../controllers/audio.controller.js";
import { scanMiddleware as malwareScan } from "../Security/file_security/malwareScanner.js";

const router = express.Router();
const upload = multer({ dest: os.tmpdir() });

// Audio Metadata Route
router.post("/audio-metadata", upload.single("audioFile"), malwareScan(), getAudioMetadata);

export default router;
