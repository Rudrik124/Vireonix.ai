/**
 * Express Middleware - AI Safety Checkpoint
 * Usage: Apply this middleware to protect API endpoints from unsafe prompts
 */

const Moderation = require('./moderation');
const Blacklist = require('./blacklist');

const moderation = new Moderation();
const blacklist = new Blacklist({
  expirationTime: 24 * 60 * 60 * 1000 // 24 hours
});

/**
 * Express Middleware for AI Safety Checkpoint
 * Use: app.use(aiSafetyMiddleware) or app.post('/endpoint', aiSafetyMiddleware, handler)
 */
const aiSafetyMiddleware = (req, res, next) => {
  (async () => {
  // Only check if body contains prompt
  if (!req.body || !req.body.prompt) {
    return next();
  }

  const { prompt } = req.body;
  const userId = req.user?.id || req.ip;
  const clientIp = req.ip;

  // Step 1: Check if user/IP is blacklisted
  if (blacklist.isUserBlacklisted(userId)) {
    console.log(`[SECURITY] User ${userId} is blacklisted`);
    return res.status(403).json({
      status: 'BLOCKED',
      reason: 'Account has been restricted',
      error: 'Your account cannot make API requests at this time'
    });
  }

  if (blacklist.isIpBlacklisted(clientIp)) {
    console.log(`[SECURITY] IP ${clientIp} is blacklisted`);
    return res.status(403).json({
      status: 'BLOCKED',
      reason: 'Network has been restricted',
      error: 'Your network cannot make API requests at this time'
    });
  }

  // Step 2: AI Safety Checkpoint
  const moderationResult = await moderation.moderateAsync(prompt);

  if (moderationResult.status === 'BLOCKED') {
    console.log(`[SECURITY] Prompt blocked: ${moderationResult.reason}`);
    
    // Add to blacklist for severe violations
    const isSevere = 
      moderationResult.details.deepfakeRequest?.detected ||
      moderationResult.details.unsafeContent?.categories?.includes('violence') ||
      moderationResult.details.unsafeContent?.categories?.includes('hateSpeech') ||
      moderationResult.details.unsafeContent?.categories?.includes('illegalActivities');

    if (isSevere) {
      blacklist.addUser(userId, moderationResult.reason);
      console.log(`[SECURITY] User ${userId} added to blacklist for: ${moderationResult.reason}`);
    }

    // Return rejection response
    return res.status(403).json({
      status: 'BLOCKED',
      reason: moderationResult.reason,
      details: 'Your prompt violates our safety policy. Please review our guidelines.',
      errorCode: 'UNSAFE_CONTENT'
    });
  }

  // Step 3: Approved - attach to request and continue
  req.moderationApproved = true;
  req.promptSafetyCheckPassed = true;
  next();
  })().catch((error) => {
    console.error('[SECURITY] Prompt moderation failed:', error);
    return res.status(500).json({
      status: 'BLOCKED',
      reason: 'Moderation service unavailable',
      errorCode: 'MODERATION_ERROR'
    });
  });
};

/**
 * Strict Safety Middleware - Additional protection layer
 * Use for highly sensitive endpoints
 */
const strictSafetyMiddleware = (req, res, next) => {
  (async () => {
  if (!req.body || !req.body.prompt) {
    return next();
  }

  const { prompt } = req.body;
  const userId = req.user?.id || req.ip;

  // Immediate rejection for any deepfake or extreme content attempts
  const result = await moderation.moderateAsync(prompt);

  if (result.details.deepfakeRequest?.detected) {
    console.log(`[STRICT SECURITY] Deepfake attempt by ${userId}`);
    blacklist.addUser(userId, 'Attempted deepfake generation');
    return res.status(403).json({
      status: 'BLOCKED',
      reason: 'Deepfake requests are strictly prohibited',
      errorCode: 'DEEPFAKE_ATTEMPT'
    });
  }

  if (result.details.unsafeContent?.categories?.includes('violence')) {
    console.log(`[STRICT SECURITY] Violence content by ${userId}`);
    blacklist.addUser(userId, 'Attempted violence content generation');
    return res.status(403).json({
      status: 'BLOCKED',
      reason: 'Violence content is strictly prohibited',
      errorCode: 'VIOLENCE_CONTENT'
    });
  }

  next();
  })().catch((error) => {
    console.error('[STRICT SECURITY] Prompt moderation failed:', error);
    return res.status(500).json({
      status: 'BLOCKED',
      reason: 'Moderation service unavailable',
      errorCode: 'MODERATION_ERROR'
    });
  });
};

/**
 * Example Express Application
 */
const express = require('express');
const app = express();

app.use(express.json());

// ==========================================
// PROTECTED ENDPOINTS
// ==========================================

/**
 * Video Generation Endpoint
 * POST /api/video/generate
 * Body: { prompt: string }
 */
app.post('/api/video/generate', aiSafetyMiddleware, (req, res) => {
  const { prompt } = req.body;

  console.log(`[API] Video generation request approved: "${prompt.substring(0, 50)}..."`);

  // TODO: Process with video generation API
  res.json({
    status: 'APPROVED',
    message: 'Video generation started',
    promptAccepted: prompt,
    processingId: `VID-${Date.now()}`
  });
});

/**
 * Image Generation Endpoint
 * POST /api/image/generate
 * Body: { prompt: string }
 */
app.post('/api/image/generate', aiSafetyMiddleware, (req, res) => {
  const { prompt } = req.body;

  console.log(`[API] Image generation request approved: "${prompt.substring(0, 50)}..."`);

  // TODO: Process with image generation API
  res.json({
    status: 'APPROVED',
    message: 'Image generation started',
    promptAccepted: prompt,
    processingId: `IMG-${Date.now()}`
  });
});

/**
 * Sensitive Content Endpoint - Uses Strict Safety
 * POST /api/content/generate
 * Body: { prompt: string }
 */
app.post('/api/content/generate', strictSafetyMiddleware, aiSafetyMiddleware, (req, res) => {
  const { prompt } = req.body;

  console.log(`[API] Content generation request approved with strict checks`);

  res.json({
    status: 'APPROVED',
    message: 'Content generation started with strict safety protocols',
    promptAccepted: prompt,
    processingId: `CONTENT-${Date.now()}`
  });
});

/**
 * Batch Processing Endpoint - Multiple prompts
 * POST /api/batch/process
 * Body: { prompts: string[] }
 */
app.post('/api/batch/process', (req, res) => {
  (async () => {
  const { prompts } = req.body;
  const userId = req.user?.id || req.ip;

  if (!Array.isArray(prompts)) {
    return res.status(400).json({ error: 'Prompts must be an array' });
  }

  // Check blacklist
  if (blacklist.isUserBlacklisted(userId)) {
    return res.status(403).json({
      status: 'BLOCKED',
      reason: 'User is blacklisted'
    });
  }

  // Moderate each prompt
  const results = [];
  for (const [idx, prompt] of prompts.entries()) {
    const modResult = await moderation.moderateAsync(prompt);
    results.push({
      index: idx,
      prompt: prompt.substring(0, 50) + '...',
      status: modResult.status,
      reason: modResult.reason
    });
  }

  // Check if any were blocked
  const blockedCount = results.filter(r => r.status === 'BLOCKED').length;
  const approvedCount = results.filter(r => r.status === 'APPROVED').length;

  console.log(`[API] Batch processing: ${approvedCount} approved, ${blockedCount} blocked`);

  res.json({
    totalPrompts: prompts.length,
    approvedCount,
    blockedCount,
    results
  });
  })().catch((error) => {
    console.error('[API] Batch moderation failed:', error);
    return res.status(500).json({ error: 'Moderation service unavailable' });
  });
});

/**
 * Safety Check Endpoint - Check prompt without processing
 * POST /api/safety/check
 * Body: { prompt: string }
 */
app.post('/api/safety/check', (req, res) => {
  (async () => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const result = await moderation.moderateAsync(prompt);

  res.json({
    prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
    status: result.status,
    reason: result.reason,
    details: result.details,
    safeToProcess: result.status === 'APPROVED'
  });
  })().catch((error) => {
    console.error('[API] Safety check failed:', error);
    return res.status(500).json({ error: 'Moderation service unavailable' });
  });
});

/**
 * Blacklist Management Endpoints
 */

// Check if user is blacklisted
app.get('/api/admin/blacklist/user/:userId', (req, res) => {
  const { userId } = req.params;
  const isBlacklisted = blacklist.isUserBlacklisted(userId);
  const entry = blacklist.getUserBlacklist().find(u => u.id === userId);

  res.json({
    userId,
    isBlacklisted,
    entry: entry || null
  });
});

// Remove user from blacklist
app.delete('/api/admin/blacklist/user/:userId', (req, res) => {
  const { userId } = req.params;
  const removed = blacklist.removeUser(userId);

  res.json({
    userId,
    removed,
    message: removed ? 'User removed from blacklist' : 'User not found in blacklist'
  });
});

// Get all blacklist entries
app.get('/api/admin/blacklist', (req, res) => {
  res.json({
    users: blacklist.getUserBlacklist(),
    ips: blacklist.getIpBlacklist(),
    prompts: blacklist.getPromptBlacklist().slice(0, 100) // Limit to 100
  });
});

// Clean expired entries
app.post('/api/admin/blacklist/clean', (req, res) => {
  const removed = blacklist.cleanExpired();
  res.json({
    cleaned: removed,
    message: `Cleaned ${removed} expired blacklist entries`
  });
});

// ==========================================
// ERROR HANDLING
// ==========================================

app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    status: 'ERROR',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==========================================
// SERVER START
// ==========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 AI Safety Checkpoint Server running on port ${PORT}`);
  console.log(`📋 Endpoints:`);
  console.log(`   POST /api/video/generate - Generate video (with safety check)`);
  console.log(`   POST /api/image/generate - Generate image (with safety check)`);
  console.log(`   POST /api/content/generate - Generate content (strict safety)`);
  console.log(`   POST /api/batch/process - Process multiple prompts`);
  console.log(`   POST /api/safety/check - Check prompt safety`);
  console.log(`   GET  /api/admin/blacklist - View all blacklist entries`);
  console.log(`   GET  /api/admin/blacklist/user/:userId - Check user status`);
  console.log(`   DELETE /api/admin/blacklist/user/:userId - Remove user`);
  console.log(`   POST /api/admin/blacklist/clean - Clean expired entries`);
});

module.exports = { app, aiSafetyMiddleware, strictSafetyMiddleware, moderation, blacklist };