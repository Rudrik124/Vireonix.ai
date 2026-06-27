import { z } from 'zod';

// Reusable Zod schemas for common payloads
export const PromptSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(8000),
  duration: z.number().int().min(3).max(180).optional(),
  frame: z.string().optional(),
  effects: z.record(z.any()).optional(),
});

export const SceneImagesSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(4000),
});

export const ImagesArraySchema = z.object({
  images: z.array(z.string().url()).min(2, 'At least two image URLs required'),
  options: z.record(z.any()).optional(),
  userId: z.string().uuid().optional(),
});

export const CinematicSchema = z.object({
  images: z.array(z.string().url()).min(2),
  options: z.record(z.any()).optional(),
  userId: z.string().uuid().optional(),
});

export const GenericIdSchema = z.object({
  projectId: z.string().min(1).optional(),
  userId: z.string().uuid().optional(),
});
