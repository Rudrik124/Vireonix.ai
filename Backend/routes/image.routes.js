import express from "express";
import { searchImage } from "../controllers/image.controller.js";

const router = express.Router();

// Search Unsplash for images
router.post("/search-image", searchImage);

export default router;
