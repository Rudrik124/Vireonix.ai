import express from "express";
import { 
  generateSceneImages, 
  generateVideoFromImages, 
  generateCinematicVideo 
} from "../controllers/video.controller.js";
import { validateBody } from "../Security/input_validation/validateZod.js";
import { 
  SceneImagesSchema, 
  ImagesArraySchema, 
  CinematicSchema 
} from "../Security/input_validation/schemas.js";

const router = express.Router();

// Generate scene images
router.post("/scene-images", validateBody(SceneImagesSchema), generateSceneImages);

// Generate video from images
router.post("/video-from-images", validateBody(ImagesArraySchema), generateVideoFromImages);

// Generate cinematic video
router.post("/cinematic-video", validateBody(CinematicSchema), generateCinematicVideo);

export default router;
