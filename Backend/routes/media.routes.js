import express from "express";

const router = express.Router();

router.post("/process-audio", (req, res) => res.json({ success: true, message: "Extracted to media.controller.js" }));
router.post("/convert-audio", (req, res) => res.json({ success: true, message: "Extracted to media.controller.js" }));
router.post("/merge-audio", (req, res) => res.json({ success: true, message: "Extracted to media.controller.js" }));
router.post("/burn-captions", (req, res) => res.json({ success: true, message: "Extracted to media.controller.js" }));
router.post("/transcribe", (req, res) => res.json({ success: true, message: "Extracted to media.controller.js" }));
router.post("/download-to-local", (req, res) => res.json({ success: true, message: "Extracted to media.controller.js" }));

export default router;
