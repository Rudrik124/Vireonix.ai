import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HISTORY_DIR = path.join(__dirname, "../history");
const HISTORY_FILE = path.join(HISTORY_DIR, "data.json");

// Ensure directory and file exist
if (!fs.existsSync(HISTORY_DIR)) {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

// Folders as requested
const FOLDERS = [
  "Ai_generated_video",
  "Reference_video",
  "Direct_pic_to_video",
  "Ai_manual_edit"
];

FOLDERS.forEach(folder => {
  const folderPath = path.join(HISTORY_DIR, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
});

if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([]));
}

// Get all history
router.get("/", (req, res) => {
  try {
    const data = fs.readFileSync(HISTORY_FILE, "utf-8");
    const history = JSON.parse(data);
    res.json({ success: true, history });
  } catch (error) {
    console.error("Error reading history:", error);
    res.status(500).json({ success: false, error: "Failed to read history" });
  }
});

// Add new history item
router.post("/", (req, res) => {
  try {
    const { type, title, desc, videoUrl } = req.body;
    
    const data = fs.readFileSync(HISTORY_FILE, "utf-8");
    const history = JSON.parse(data);

    const newItem = {
      id: Date.now(),
      type, // "AI Video Generation", "Reference Video", "Direct Pic to Video", "AI Manual Edit"
      title: title || "Generated Video",
      desc: desc || "Video generated successfully",
      date: new Date().toISOString(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      videoUrl: videoUrl || "",
    };

    history.push(newItem);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

    res.json({ success: true, item: newItem });
  } catch (error) {
    console.error("Error adding history:", error);
    res.status(500).json({ success: false, error: "Failed to save history" });
  }
});

// Clear history
router.delete("/", (req, res) => {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([]));
    res.json({ success: true });
  } catch (error) {
    console.error("Error clearing history:", error);
    res.status(500).json({ success: false, error: "Failed to clear history" });
  }
});

export default router;
